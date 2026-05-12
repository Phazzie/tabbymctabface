/**
 * FILE: TabManager.ts
 *
 * WHAT: Real tab management orchestrator coordinating tab operations with humor delivery
 *
 * WHY: Implements ITabManager contract for TabbyMcTabface's core functionality.
 *
 * CONTRACT: ITabManager v1.0.0
 * GENERATED: 2025-10-13
 */

import {
  ITabManager,
  GroupCreationSuccess,
  TabClosureResult,
  RandomTabOptions,
  GroupData,
  GroupUpdateData,
  BrowserContext,
  TabManagerError
} from '../contracts/ITabManager';
import { IChromeTabsAPI, ChromeTab } from '../contracts/IChromeTabsAPI';
import { IHumorSystem, HumorTrigger } from '../contracts/IHumorSystem';
import { Result } from '../utils/Result';

export class TabManager implements ITabManager {
  private recentEvents: string[] = [];
  private readonly maxRecentEvents = 10;
  private contextCache: { data: BrowserContext | null; timestamp: number } = { data: null, timestamp: 0 };
  private readonly CONTEXT_CACHE_TTL = 500;

  constructor(
    private readonly chromeTabsAPI: IChromeTabsAPI,
    private readonly humorSystem: IHumorSystem
  ) { }

  async createGroup(groupName: string, tabIds: number[]): Promise<Result<GroupCreationSuccess, TabManagerError>> {
    if (!groupName || groupName.trim().length === 0) {
      return Result.error({ type: 'InvalidGroupName', details: 'Group name cannot be empty' });
    }
    if (groupName.length > 50) {
      return Result.error({ type: 'InvalidGroupName', details: 'Group name must be 50 characters or less' });
    }
    if (!tabIds || tabIds.length === 0) {
      return Result.error({ type: 'NoTabsSelected', details: 'At least one tab must be selected' });
    }
    try {
      const createResult = await this.chromeTabsAPI.createGroup(tabIds);
      if (!createResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to create tab group', originalError: createResult.error });
      }
      const groupId = createResult.value;
      const updateResult = await this.chromeTabsAPI.updateGroup(groupId, { title: groupName });
      if (!updateResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to set group name', originalError: updateResult.error });
      }
      const timestamp = Date.now();
      const humorTrigger: HumorTrigger = { type: 'TabGroupCreated', data: { type: 'TabGroupCreated', groupName, tabCount: tabIds.length }, timestamp };
      this.humorSystem.deliverQuip(humorTrigger).catch(error => { console.warn('Humor delivery failed:', error); });
      this.addRecentEvent('TabGroupCreated');
      return Result.ok({ groupId, groupName, tabCount: tabIds.length, timestamp });
    } catch (error) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Unexpected error during group creation', originalError: error });
    }
  }

  async closeRandomTab(options?: RandomTabOptions): Promise<Result<TabClosureResult, TabManagerError>> {
    try {
      const queryResult = await this.chromeTabsAPI.queryTabs({});
      if (!queryResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to query tabs', originalError: queryResult.error });
      }
      const allTabs = queryResult.value;
      const tabResult = this.selectRandomTab(allTabs, options);
      if (!tabResult.ok) return tabResult;
      return await this.closeTabAndNotify(tabResult.value, allTabs.length);
    } catch (error) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Unexpected error during random tab closure', originalError: error });
    }
  }

  async getAllGroups(): Promise<Result<GroupData[], TabManagerError>> {
    try {
      const groupsResult = await this.chromeTabsAPI.getAllGroups();
      if (!groupsResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to query tab groups', originalError: groupsResult.error });
      }
      const tabsResult = await this.chromeTabsAPI.queryTabs({});
      if (!tabsResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to query tabs', originalError: tabsResult.error });
      }
      const allTabs = tabsResult.value;
      const groupData: GroupData[] = groupsResult.value.map(group => {
        const groupTabs = allTabs.filter(tab => tab.groupId === group.id);
        return { groupId: group.id, groupName: group.title || 'Untitled Group', tabCount: groupTabs.length, tabs: groupTabs, color: group.color || 'grey', collapsed: group.collapsed || false };
      });
      return Result.ok(groupData);
    } catch (error) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Unexpected error querying groups', originalError: error });
    }
  }

  async updateGroup(groupId: number, updates: GroupUpdateData): Promise<Result<void, TabManagerError>> {
    if (updates.name !== undefined) {
      const nameValidation = this.validateGroupName(updates.name);
      if (!nameValidation.ok) return nameValidation;
    }
    try {
      const chromeUpdates = this.buildChromeUpdates(updates);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateResult = await this.chromeTabsAPI.updateGroup(groupId, chromeUpdates as any);
      if (!updateResult.ok) {
        return this.handleUpdateError(updateResult.error, groupId);
      }
      return Result.ok(undefined);
    } catch (error) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Unexpected error updating group', originalError: error });
    }
  }

  /**
   * Delete a tab group (ungroups tabs, doesn't close them)
   *
   * DATA IN: groupId (number)
   * DATA OUT: Result<void, TabManagerError>
   *
   * FLOW:
   *   1. Query tabs in group
   *   2. Call ungroupTabs to remove them from the group
   *   3. Return success
   *
   * PERFORMANCE: <30ms (95th percentile)
   */
  async deleteGroup(groupId: number): Promise<Result<void, TabManagerError>> {
    try {
      const tabsResult = await this.chromeTabsAPI.queryTabs({ groupId });
      if (!tabsResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to query group tabs', originalError: tabsResult.error });
      }
      const groupTabs = tabsResult.value;
      if (groupTabs.length === 0) {
        return Result.error({ type: 'InvalidGroupId', details: 'Group does not exist or has no tabs', groupId });
      }
      const tabIds = groupTabs.map(tab => tab.id);

      // Fix: call ungroupTabs to actually ungroup - NOT createGroup
      const ungroupResult = await this.chromeTabsAPI.ungroupTabs(tabIds);

      if (!ungroupResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to ungroup tabs', originalError: ungroupResult.error });
      }
      return Result.ok(undefined);
    } catch (error) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Unexpected error deleting group', originalError: error });
    }
  }

  async getBrowserContext(): Promise<Result<BrowserContext, TabManagerError>> {
    const now = Date.now();
    if (this.contextCache.data && (now - this.contextCache.timestamp < this.CONTEXT_CACHE_TTL)) {
      return Result.ok(this.contextCache.data);
    }
    try {
      const tabsResult = await this.chromeTabsAPI.queryTabs({});
      if (!tabsResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to query tabs for context', originalError: tabsResult.error });
      }
      const allTabs = tabsResult.value;
      const activeTab = allTabs.find(tab => tab.active);
      const groupsResult = await this.chromeTabsAPI.getAllGroups();
      if (!groupsResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to query groups for context', originalError: groupsResult.error });
      }
      const allGroups = groupsResult.value;
      const context: BrowserContext = {
        tabCount: allTabs.length,
        activeTab: activeTab ? { url: activeTab.url || '', title: activeTab.title || 'Untitled', domain: this.extractDomain(activeTab.url || '') } : null,
        currentHour: new Date().getHours(),
        recentEvents: [...this.recentEvents],
        groupCount: allGroups.length
      };
      this.contextCache = { data: context, timestamp: now };
      return Result.ok(context);
    } catch (error) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Unexpected error building context', originalError: error });
    }
  }

  private validateGroupName(name: string): Result<void, TabManagerError> {
    if (!name || name.trim().length === 0) {
      return Result.error({ type: 'InvalidGroupName', details: 'Group name cannot be empty' });
    }
    if (name.length > 50) {
      return Result.error({ type: 'InvalidGroupName', details: 'Group name must be 50 characters or less' });
    }
    return Result.ok(undefined);
  }

  private buildChromeUpdates(updates: GroupUpdateData): { title?: string; collapsed?: boolean; color?: string } {
    const chromeUpdates: Record<string, any> = {};
    if (updates.name !== undefined) chromeUpdates.title = updates.name;
    if (updates.collapsed !== undefined) chromeUpdates.collapsed = updates.collapsed;
    if (updates.color !== undefined) chromeUpdates.color = updates.color;
    return chromeUpdates;
  }

  private handleUpdateError(error: unknown, groupId: number): Result<void, TabManagerError> {
    const errorStr = error instanceof Error ? error.message : JSON.stringify(error);
    if (errorStr.includes('No group with id') || errorStr.includes('not found')) {
      return Result.error({ type: 'InvalidGroupId', details: 'Group does not exist', groupId });
    }
    return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to update group', originalError: error });
  }

  private selectRandomTab(allTabs: ChromeTab[], options?: RandomTabOptions): Result<ChromeTab, TabManagerError> {
    const excludePinned = options?.excludePinned ?? true;
    const excludeActive = options?.excludeActive ?? true;
    const eligibleTabs = allTabs.filter(tab => {
      if (excludePinned && tab.pinned) return false;
      if (excludeActive && tab.active) return false;
      return true;
    });
    if (eligibleTabs.length === 0) {
      let reason: string;
      if (excludePinned && excludeActive) reason = 'All tabs are pinned or active';
      else if (excludePinned) reason = 'All tabs are pinned';
      else reason = 'All tabs are active';
      return Result.error({ type: 'NoTabsToClose', details: reason, reason });
    }
    const randomIndex = Math.floor(Math.random() * eligibleTabs.length);
    return Result.ok(eligibleTabs[randomIndex]);
  }

  private async closeTabAndNotify(tabToClose: ChromeTab, totalTabCount: number): Promise<Result<TabClosureResult, TabManagerError>> {
    const closeResult = await this.chromeTabsAPI.removeTab(tabToClose.id);
    if (!closeResult.ok) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to close tab', originalError: closeResult.error });
    }
    const timestamp = Date.now();
    const humorTrigger: HumorTrigger = { type: 'FeelingLuckyClicked', data: { type: 'TabClosed', tabTitle: tabToClose.title || 'Untitled', tabUrl: tabToClose.url || '', trigger: 'FeelingLucky' }, timestamp };
    this.humorSystem.deliverQuip(humorTrigger).catch(error => { console.warn('Humor delivery failed:', error); });
    this.addRecentEvent('FeelingLuckyClicked');
    return Result.ok({ closedTabId: tabToClose.id, closedTabTitle: tabToClose.title || 'Untitled', closedTabUrl: tabToClose.url || '', remainingCount: totalTabCount - 1, timestamp });
  }

  private addRecentEvent(eventType: string): void {
    this.recentEvents.unshift(eventType);
    if (this.recentEvents.length > this.maxRecentEvents) {
      this.recentEvents = this.recentEvents.slice(0, this.maxRecentEvents);
    }
  }

  private extractDomain(url: string): string {
    try { return new URL(url).hostname; } catch { return ''; }
  }

  _invalidateContextCache(): void {
    this.contextCache = { data: null, timestamp: 0 };
  }
}
