/**
 * FILE: MockChromeTabsAPI.ts
 *
 * WHAT: Mock implementation of IChromeTabsAPI
 *
 * WHY: Enables development and testing without browser environment.
 *      Satisfies IChromeTabsAPI contract v1.1.0 (includes ungroupTabs).
 *
 * CONTRACT: IChromeTabsAPI v1.1.0
 * GENERATED: 2025-10-12
 */

import { Result } from '../utils/Result';
import type {
  IChromeTabsAPI,
  ChromeTab,
  ChromeTabGroup,
  GroupUpdateProperties,
  TabQueryInfo,
  ChromeAPIError,
} from '../contracts/IChromeTabsAPI';

export class MockChromeTabsAPI implements IChromeTabsAPI {
  private mockTabs: ChromeTab[] = [];
  private mockGroups: ChromeTabGroup[] = [];
  private nextGroupId = 1;
  private nextTabId = 100;
  private callHistory: MockCallRecord[] = [];
  private currentWindowId: number;

  constructor(currentWindowId = 1) {
    this.currentWindowId = currentWindowId;
    this.seedDefaultTabs();
  }

  async createGroup(tabIds: number[], existingGroupId?: number): Promise<Result<number, ChromeAPIError>> {
    this.callHistory.push({ method: 'createGroup', args: [tabIds, existingGroupId], timestamp: Date.now() });
    for (const tabId of tabIds) {
      if (!this.mockTabs.find(t => t.id === tabId)) {
        return Result.error({ type: 'InvalidTabId', details: `Tab ID ${tabId} does not exist`, tabId });
      }
    }
    if (existingGroupId !== undefined) {
      if (!Number.isInteger(existingGroupId) || existingGroupId < 0) {
        return Result.error({
          type: 'InvalidGroupId',
          details: `Group ID ${existingGroupId} is invalid`,
          groupId: existingGroupId,
        });
      }
      if (!this.mockGroups.some(group => group.id === existingGroupId)) {
        return Result.error({
          type: 'InvalidGroupId',
          details: `Group ID ${existingGroupId} does not exist`,
          groupId: existingGroupId,
        });
      }
    }
    const previousGroupIds = new Set(
      tabIds.map(tabId => this.mockTabs.find(tab => tab.id === tabId)?.groupId ?? -1).filter(groupId => groupId >= 0)
    );
    const groupId = existingGroupId ?? this.nextAvailableGroupId();
    if (existingGroupId === undefined) {
      this.mockGroups.push({ id: groupId, title: '', color: 'grey', collapsed: false });
    }
    tabIds.forEach(tabId => {
      const tab = this.mockTabs.find(t => t.id === tabId);
      if (tab) tab.groupId = groupId;
    });
    this.deleteEmptyGroups(previousGroupIds);
    return Result.ok(groupId);
  }

  async updateGroup(groupId: number, properties: GroupUpdateProperties): Promise<Result<void, ChromeAPIError>> {
    this.callHistory.push({ method: 'updateGroup', args: [groupId, properties], timestamp: Date.now() });
    const group = this.mockGroups.find(g => g.id === groupId);
    if (!group) {
      return Result.error({ type: 'InvalidGroupId', details: `Group ID ${groupId} does not exist`, groupId });
    }
    if (properties.title !== undefined) group.title = properties.title;
    if (properties.color !== undefined) group.color = properties.color;
    if (properties.collapsed !== undefined) group.collapsed = properties.collapsed;
    return Result.ok(undefined);
  }

  async queryTabs(queryInfo: TabQueryInfo): Promise<Result<ChromeTab[], ChromeAPIError>> {
    this.callHistory.push({ method: 'queryTabs', args: [queryInfo], timestamp: Date.now() });
    let filtered = [...this.mockTabs];
    if (queryInfo.currentWindow) {
      filtered = filtered.filter(tab => tab.windowId === this.currentWindowId);
    }
    if (queryInfo.active !== undefined) filtered = filtered.filter(t => t.active === queryInfo.active);
    if (queryInfo.pinned !== undefined) filtered = filtered.filter(t => t.pinned === queryInfo.pinned);
    if (queryInfo.groupId !== undefined) filtered = filtered.filter(t => t.groupId === queryInfo.groupId);
    if (queryInfo.url !== undefined) {
      const urls = Array.isArray(queryInfo.url) ? queryInfo.url : [queryInfo.url];
      filtered = filtered.filter(t => urls.some(url => t.url.includes(url)));
    }
    if (queryInfo.title !== undefined) filtered = filtered.filter(t => t.title.includes(queryInfo.title!));
    return Result.ok(filtered);
  }

  async removeTab(tabId: number): Promise<Result<void, ChromeAPIError>> {
    this.callHistory.push({ method: 'removeTab', args: [tabId], timestamp: Date.now() });
    const tabIndex = this.mockTabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) {
      return Result.error({ type: 'InvalidTabId', details: `Tab ID ${tabId} does not exist`, tabId });
    }
    const previousGroupId = this.mockTabs[tabIndex].groupId;
    this.mockTabs.splice(tabIndex, 1);
    this.deleteEmptyGroups(new Set([previousGroupId]));
    return Result.ok(undefined);
  }

  async getAllGroups(): Promise<Result<ChromeTabGroup[], ChromeAPIError>> {
    this.callHistory.push({ method: 'getAllGroups', args: [], timestamp: Date.now() });
    return Result.ok([...this.mockGroups]);
  }

  /**
   * Ungroup tabs - remove tabs from any tab group (set groupId to -1)
   */
  async ungroupTabs(tabIds: number[]): Promise<Result<void, ChromeAPIError>> {
    this.callHistory.push({ method: 'ungroupTabs', args: [tabIds], timestamp: Date.now() });
    const previousGroupIds = new Set<number>();
    for (const tabId of tabIds) {
      const tab = this.mockTabs.find(t => t.id === tabId);
      if (!tab) {
        return Result.error({ type: 'InvalidTabId', details: `Tab ID ${tabId} does not exist`, tabId });
      }
      if (tab.groupId >= 0) previousGroupIds.add(tab.groupId);
      tab.groupId = -1;
    }
    this.deleteEmptyGroups(previousGroupIds);
    return Result.ok(undefined);
  }

  seedMockTabs(tabs: ChromeTab[]): void { this.mockTabs = [...tabs]; }
  seedMockGroups(groups: ChromeTabGroup[]): void { this.mockGroups = [...groups]; }
  setCurrentWindowId(windowId: number): void { this.currentWindowId = windowId; }

  reset(): void {
    this.mockTabs = [];
    this.mockGroups = [];
    this.nextGroupId = 1;
    this.nextTabId = 100;
    this.callHistory = [];
    this.seedDefaultTabs();
  }

  getCallHistory(): MockCallRecord[] { return [...this.callHistory]; }

  private nextAvailableGroupId(): number {
    while (this.mockGroups.some(group => group.id === this.nextGroupId)) this.nextGroupId += 1;
    return this.nextGroupId++;
  }

  private deleteEmptyGroups(groupIds: Set<number>): void {
    this.mockGroups = this.mockGroups.filter(
      group => !groupIds.has(group.id) || this.mockTabs.some(tab => tab.groupId === group.id)
    );
  }

  private seedDefaultTabs(): void {
    this.mockTabs = [
      { id: 100, url: 'https://github.com/TabbyMcTabface', title: 'GitHub - TabbyMcTabface', pinned: false, active: true, groupId: -1, windowId: 1, index: 0 },
      { id: 101, url: 'https://stackoverflow.com/questions/typescript', title: 'TypeScript Questions - Stack Overflow', pinned: false, active: false, groupId: -1, windowId: 1, index: 1 },
      { id: 102, url: 'https://twitter.com', title: 'Twitter / X', pinned: true, active: false, groupId: -1, windowId: 1, index: 2 },
      { id: 103, url: 'https://docs.google.com/spreadsheets', title: 'Project Tracker - Google Sheets', pinned: false, active: false, groupId: -1, windowId: 1, index: 3 },
      { id: 104, url: 'https://news.ycombinator.com', title: 'Hacker News', pinned: false, active: false, groupId: -1, windowId: 1, index: 4 },
      { id: 105, url: 'https://reddit.com/r/programming', title: 'r/programming - Reddit', pinned: false, active: false, groupId: -1, windowId: 1, index: 5 },
      { id: 106, url: 'https://developer.mozilla.org', title: 'MDN Web Docs', pinned: true, active: false, groupId: -1, windowId: 1, index: 6 },
      { id: 107, url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: 'Totally work-related video', pinned: false, active: false, groupId: -1, windowId: 1, index: 7 },
    ];
  }
}

export interface MockCallRecord {
  method: string;
  args: any[];
  timestamp: number;
}
