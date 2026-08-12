/**
 * FILE: TabManager.ts
 *
 * WHAT: Current-window tab orchestration with fresh browser context and awaited side effects.
 *
 * WHY: Implements ITabManager while preventing cross-window mutation and MV3 fire-and-forget loss.
 *
 * HOW DATA FLOWS:
 *   1. Runtime/UI sends validated operations to ITabManager (SEAM-01, SEAM-06).
 *   2. TabManager queries and mutates the current window through IChromeTabsAPI (SEAM-02, 07, 08).
 *   3. Successful mutations invalidate context, persist action counters, and await humor (SEAM-09, 33).
 *   4. BrowserContext flows to HumorSystem and the EasterEggFramework (SEAM-19).
 *
 * SEAMS:
 *   IN: Runtime/UI/HumorSystem -> TabManager (SEAM-01, 06, 19)
 *   OUT: TabManager -> ChromeTabsAPI/HumorSystem/UsageStats (SEAM-02, 07, 08, 09, 33)
 *
 * CONTRACT: ITabManager v1.1.0
 * GENERATED: 2026-08-12
 */

import {
  BrowserContext,
  BrowserEventName,
  GroupCreationSuccess,
  GroupData,
  GroupUpdateData,
  ITabManager,
  RandomTabOptions,
  TabClosureResult,
  TabManagerError
} from '../contracts/ITabManager';
import { ChromeTab, IChromeTabsAPI } from '../contracts/IChromeTabsAPI';
import { HumorTrigger, IHumorSystem } from '../contracts/IHumorSystem';
import type { IUsageStatsStore, UsageCounter } from '../contracts/IUsageStats';
import { Result } from '../utils/Result';

export class TabManager implements ITabManager {
  private recentEvents: string[] = [];
  private readonly maxRecentEvents = 20;
  private contextCache: { data: BrowserContext | null; timestamp: number } = { data: null, timestamp: 0 };
  private readonly contextCacheTtl = 500;

  constructor(
    private readonly chromeTabsAPI: IChromeTabsAPI,
    private readonly humorSystem: IHumorSystem,
    private readonly usageStats?: IUsageStatsStore,
    private readonly random: () => number = Math.random
  ) {}

  async createGroup(
    groupName: string,
    tabIds: number[]
  ): Promise<Result<GroupCreationSuccess, TabManagerError>> {
    const nameValidation = this.validateGroupName(groupName);
    if (!nameValidation.ok) return nameValidation;
    if (!Array.isArray(tabIds) || tabIds.length === 0) {
      return Result.error({ type: 'NoTabsSelected', details: 'At least one tab must be selected' });
    }

    try {
      const scopeValidation = await this.validateCurrentWindowTabs(tabIds);
      if (!scopeValidation.ok) return scopeValidation;

      const createResult = await this.chromeTabsAPI.createGroup(tabIds);
      if (!createResult.ok) {
        return Result.error({
          type: 'ChromeAPIFailure',
          details: 'Failed to create tab group',
          originalError: createResult.error
        });
      }
      this.invalidateContextCache();

      const groupId = createResult.value;
      const updateResult = await this.chromeTabsAPI.updateGroup(groupId, { title: groupName.trim() });
      if (!updateResult.ok) {
        const rollbackResult = await this.chromeTabsAPI.ungroupTabs(tabIds);
        this.invalidateContextCache();
        return Result.error({
          type: 'ChromeAPIFailure',
          details: rollbackResult.ok
            ? 'Failed to set group name; the partial group was rolled back'
            : 'Failed to set group name and failed to roll back the partial group',
          originalError: rollbackResult.ok
            ? updateResult.error
            : { updateError: updateResult.error, rollbackError: rollbackResult.error }
        });
      }

      const timestamp = Date.now();
      this.addRecentEvent('TabGroupCreated');
      this.invalidateContextCache();
      await this.incrementStat('groupsCreated');
      await this.deliverHumorSafely({
        type: 'TabGroupCreated',
        data: { type: 'TabGroupCreated', groupName: groupName.trim(), tabCount: tabIds.length },
        timestamp
      });

      return Result.ok({ groupId, groupName: groupName.trim(), tabCount: tabIds.length, timestamp });
    } catch (error) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Unexpected error during group creation',
        originalError: error
      });
    }
  }

  async closeRandomTab(
    options?: RandomTabOptions
  ): Promise<Result<TabClosureResult, TabManagerError>> {
    try {
      const queryResult = await this.chromeTabsAPI.queryTabs({ currentWindow: true });
      if (!queryResult.ok) {
        return Result.error({
          type: 'ChromeAPIFailure',
          details: 'Failed to query tabs in the current window',
          originalError: queryResult.error
        });
      }
      const tabResult = this.selectRandomTab(queryResult.value, options);
      if (!tabResult.ok) return tabResult;
      return this.closeTabAndNotify(tabResult.value, queryResult.value.length);
    } catch (error) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Unexpected error during random tab closure',
        originalError: error
      });
    }
  }

  async getAllGroups(): Promise<Result<GroupData[], TabManagerError>> {
    try {
      const tabsResult = await this.chromeTabsAPI.queryTabs({ currentWindow: true });
      if (!tabsResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to query current-window tabs', originalError: tabsResult.error });
      }
      const groupsResult = await this.chromeTabsAPI.getAllGroups();
      if (!groupsResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to query tab groups', originalError: groupsResult.error });
      }

      const currentTabs = tabsResult.value;
      const currentGroupIds = new Set(currentTabs.filter(tab => tab.groupId >= 0).map(tab => tab.groupId));
      const groupData = groupsResult.value
        .filter(group => currentGroupIds.has(group.id))
        .map<GroupData>(group => {
          const tabs = currentTabs.filter(tab => tab.groupId === group.id);
          return {
            groupId: group.id,
            groupName: group.title || 'Untitled Group',
            tabCount: tabs.length,
            tabs,
            color: group.color || 'grey',
            collapsed: group.collapsed ?? false
          };
        });
      return Result.ok(groupData);
    } catch (error) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Unexpected error querying groups', originalError: error });
    }
  }

  async updateGroup(
    groupId: number,
    updates: GroupUpdateData
  ): Promise<Result<void, TabManagerError>> {
    if (!Number.isInteger(groupId) || groupId < 0) {
      return Result.error({ type: 'InvalidGroupId', details: 'Group id must be a non-negative integer', groupId });
    }
    if (updates.name !== undefined) {
      const nameValidation = this.validateGroupName(updates.name);
      if (!nameValidation.ok) return nameValidation;
    }

    try {
      const groupTabs = await this.chromeTabsAPI.queryTabs({ currentWindow: true, groupId });
      if (!groupTabs.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to validate group', originalError: groupTabs.error });
      }
      if (groupTabs.value.length === 0) {
        return Result.error({ type: 'InvalidGroupId', details: 'Group does not exist in the current window', groupId });
      }

      const chromeUpdates = this.buildChromeUpdates(updates);
      if (Object.keys(chromeUpdates).length > 0) {
        const updateResult = await this.chromeTabsAPI.updateGroup(groupId, chromeUpdates);
        if (!updateResult.ok) return this.handleUpdateError(updateResult.error, groupId);
      }

      if (updates.tabIds !== undefined) {
        if (updates.tabIds.length === 0) {
          return Result.error({ type: 'NoTabsSelected', details: 'At least one tab must remain in the group' });
        }
        const scopeValidation = await this.validateCurrentWindowTabs(updates.tabIds);
        if (!scopeValidation.ok) return scopeValidation;

        const desiredIds = new Set(updates.tabIds);
        const existingIds = new Set(groupTabs.value.map(tab => tab.id));
        const tabIdsToAdd = updates.tabIds.filter(tabId => !existingIds.has(tabId));
        const tabIdsToRemove = groupTabs.value.map(tab => tab.id).filter(tabId => !desiredIds.has(tabId));
        if (tabIdsToAdd.length > 0) {
          const moveResult = await this.chromeTabsAPI.createGroup(tabIdsToAdd, groupId);
          if (!moveResult.ok) {
            return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to add tabs to group', originalError: moveResult.error });
          }
        }
        if (tabIdsToRemove.length > 0) {
          const removeResult = await this.chromeTabsAPI.ungroupTabs(tabIdsToRemove);
          if (!removeResult.ok) {
            const rollbackResult = tabIdsToAdd.length > 0
              ? await this.chromeTabsAPI.ungroupTabs(tabIdsToAdd)
              : Result.ok(undefined);
            return Result.error({
              type: 'ChromeAPIFailure',
              details: rollbackResult.ok
                ? 'Failed to remove old tabs from group; newly added tabs were rolled back'
                : 'Failed to update group membership and failed to roll back newly added tabs',
              originalError: rollbackResult.ok
                ? removeResult.error
                : { membershipError: removeResult.error, rollbackError: rollbackResult.error }
            });
          }
        }
      }
      this.invalidateContextCache();
      return Result.ok(undefined);
    } catch (error) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Unexpected error updating group', originalError: error });
    }
  }

  async deleteGroup(groupId: number): Promise<Result<void, TabManagerError>> {
    if (!Number.isInteger(groupId) || groupId < 0) {
      return Result.error({ type: 'InvalidGroupId', details: 'Group id must be a non-negative integer', groupId });
    }
    try {
      const tabsResult = await this.chromeTabsAPI.queryTabs({ currentWindow: true, groupId });
      if (!tabsResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to query group tabs', originalError: tabsResult.error });
      }
      if (tabsResult.value.length === 0) {
        return Result.error({ type: 'InvalidGroupId', details: 'Group does not exist in the current window', groupId });
      }
      const ungroupResult = await this.chromeTabsAPI.ungroupTabs(tabsResult.value.map(tab => tab.id));
      if (!ungroupResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to ungroup tabs', originalError: ungroupResult.error });
      }
      this.invalidateContextCache();
      this.addRecentEvent('TabUngrouped');
      return Result.ok(undefined);
    } catch (error) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Unexpected error deleting group', originalError: error });
    }
  }

  async getBrowserContext(): Promise<Result<BrowserContext, TabManagerError>> {
    const timestamp = Date.now();
    if (this.contextCache.data && timestamp - this.contextCache.timestamp < this.contextCacheTtl) {
      return Result.ok(this.contextCache.data);
    }
    try {
      const tabsResult = await this.chromeTabsAPI.queryTabs({ currentWindow: true });
      if (!tabsResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to query tabs for context', originalError: tabsResult.error });
      }
      const groupsResult = await this.chromeTabsAPI.getAllGroups();
      if (!groupsResult.ok) {
        return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to query groups for context', originalError: groupsResult.error });
      }

      const tabs = tabsResult.value;
      const activeTab = tabs.find(tab => tab.active);
      const now = new Date(timestamp);
      const tabUrls = tabs.map(tab => tab.url || '');
      const comparableUrls = tabUrls.filter(Boolean);
      const currentGroupIds = new Set(tabs.filter(tab => tab.groupId >= 0).map(tab => tab.groupId));
      const knownGroupIds = new Set(groupsResult.value.map(group => group.id));
      const context: BrowserContext = {
        tabCount: tabs.length,
        activeTab: activeTab
          ? { url: activeTab.url || '', title: activeTab.title || 'Untitled', domain: this.extractDomain(activeTab.url || '') }
          : null,
        currentHour: now.getHours(),
        currentMinute: now.getMinutes(),
        currentDay: now.getDay(),
        currentMonth: now.getMonth() + 1,
        currentDate: this.formatLocalDate(now),
        currentTimestamp: timestamp,
        recentEvents: [...this.recentEvents],
        groupCount: [...currentGroupIds].filter(id => knownGroupIds.has(id)).length,
        tabUrls,
        duplicateTabCount: comparableUrls.length - new Set(comparableUrls).size
      };
      this.contextCache = { data: context, timestamp };
      return Result.ok(context);
    } catch (error) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Unexpected error building context', originalError: error });
    }
  }

  async recordBrowserEvent(event: BrowserEventName): Promise<void> {
    this.addRecentEvent(event);
    this.invalidateContextCache();
    await this.deliverHumorSafely(this.toHumorTrigger(event));
  }

  /** Kept as a public test hook for the context-cache contract. */
  _invalidateContextCache(): void {
    this.invalidateContextCache();
  }

  private async validateCurrentWindowTabs(tabIds: number[]): Promise<Result<void, TabManagerError>> {
    if (tabIds.some(tabId => !Number.isInteger(tabId) || tabId <= 0) || new Set(tabIds).size !== tabIds.length) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Tab ids must be unique positive integers', originalError: tabIds });
    }
    const currentTabs = await this.chromeTabsAPI.queryTabs({ currentWindow: true });
    if (!currentTabs.ok) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to validate selected tabs', originalError: currentTabs.error });
    }
    const availableIds = new Set(currentTabs.value.map(tab => tab.id));
    const outsideCurrentWindow = tabIds.filter(tabId => !availableIds.has(tabId));
    if (outsideCurrentWindow.length > 0) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Selected tabs must belong to the current window',
        originalError: outsideCurrentWindow
      });
    }
    return Result.ok(undefined);
  }

  private validateGroupName(name: string): Result<void, TabManagerError> {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return Result.error({ type: 'InvalidGroupName', details: 'Group name cannot be empty' });
    }
    if (name.trim().length > 50) {
      return Result.error({ type: 'InvalidGroupName', details: 'Group name must be 50 characters or less' });
    }
    return Result.ok(undefined);
  }

  private buildChromeUpdates(updates: GroupUpdateData) {
    return {
      ...(updates.name !== undefined ? { title: updates.name.trim() } : {}),
      ...(updates.collapsed !== undefined ? { collapsed: updates.collapsed } : {}),
      ...(updates.color !== undefined ? { color: updates.color as 'grey' | 'blue' | 'red' | 'yellow' | 'green' | 'pink' | 'purple' | 'cyan' | 'orange' } : {})
    };
  }

  private handleUpdateError(error: unknown, groupId: number): Result<void, TabManagerError> {
    const errorText = error instanceof Error ? error.message : JSON.stringify(error);
    if (errorText.includes('No group with id') || errorText.includes('not found') || errorText.includes('InvalidGroupId')) {
      return Result.error({ type: 'InvalidGroupId', details: 'Group does not exist', groupId });
    }
    return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to update group', originalError: error });
  }

  private selectRandomTab(allTabs: ChromeTab[], options?: RandomTabOptions): Result<ChromeTab, TabManagerError> {
    const excludePinned = options?.excludePinned ?? true;
    const excludeActive = options?.excludeActive ?? true;
    const eligibleTabs = allTabs.filter(tab => !(excludePinned && tab.pinned) && !(excludeActive && tab.active));
    if (eligibleTabs.length === 0) {
      const reason = excludePinned && excludeActive
        ? 'All tabs are pinned or active'
        : excludePinned
          ? 'All tabs are pinned'
          : 'All tabs are active';
      return Result.error({ type: 'NoTabsToClose', details: reason, reason });
    }
    const randomIndex = Math.min(eligibleTabs.length - 1, Math.floor(this.random() * eligibleTabs.length));
    return Result.ok(eligibleTabs[randomIndex]);
  }

  private async closeTabAndNotify(
    tabToClose: ChromeTab,
    totalTabCount: number
  ): Promise<Result<TabClosureResult, TabManagerError>> {
    const closeResult = await this.chromeTabsAPI.removeTab(tabToClose.id);
    if (!closeResult.ok) {
      return Result.error({ type: 'ChromeAPIFailure', details: 'Failed to close tab', originalError: closeResult.error });
    }
    const timestamp = Date.now();
    this.addRecentEvent('TabClosed');
    this.addRecentEvent('FeelingLuckyClicked');
    this.invalidateContextCache();
    await this.incrementStat('tabsClosed');
    await this.incrementStat('luckyClicks');
    await this.deliverHumorSafely({
      type: 'FeelingLuckyClicked',
      data: {
        type: 'TabClosed',
        tabTitle: tabToClose.title || 'Untitled',
        tabUrl: tabToClose.url || '',
        trigger: 'FeelingLucky'
      },
      timestamp
    });
    return Result.ok({
      closedTabId: tabToClose.id,
      closedTabTitle: tabToClose.title || 'Untitled',
      closedTabUrl: tabToClose.url || '',
      remainingCount: Math.max(0, totalTabCount - 1),
      timestamp
    });
  }

  private async deliverHumorSafely(trigger: HumorTrigger): Promise<void> {
    try {
      await this.humorSystem.deliverQuip(trigger);
    } catch (error) {
      console.warn('[TabbyMcTabface] Humor delivery failed without blocking the tab action', error);
    }
  }

  private toHumorTrigger(event: BrowserEventName): HumorTrigger {
    const timestamp = Date.now();
    if (event === 'TabOpened') {
      return {
        type: 'TabOpened',
        data: { type: 'TabOpened', tabUrl: '', tabTitle: 'Untitled' },
        timestamp
      };
    }
    if (event === 'TabClosed') {
      return {
        type: 'TabClosed',
        data: { type: 'TabClosed', tabTitle: 'Untitled', tabUrl: '', trigger: 'Manual' },
        timestamp
      };
    }
    return { type: 'ManualTrigger', data: { type: 'ManualTrigger', event }, timestamp };
  }

  private async incrementStat(counter: UsageCounter): Promise<void> {
    if (!this.usageStats) return;
    try {
      await this.usageStats.increment(counter);
    } catch (error) {
      console.warn('[TabbyMcTabface] Usage statistics update failed', error);
    }
  }

  private addRecentEvent(eventType: string): void {
    this.recentEvents.unshift(eventType);
    if (this.recentEvents.length > this.maxRecentEvents) this.recentEvents.length = this.maxRecentEvents;
  }

  private invalidateContextCache(): void {
    this.contextCache = { data: null, timestamp: 0 };
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  private formatLocalDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}
