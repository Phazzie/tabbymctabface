/**
 * FILE: test-helpers.ts
 *
 * WHAT: Test helper utilities and mock implementations for integration testing
 *
 * WHY: Provides mock Chrome APIs and helper functions for testing real implementations
 *      without requiring actual Chrome browser environment.
 *
 * SEAMS: None (test utilities)
 *
 * GENERATED: 2025-10-13
 */

import {
  IChromeTabsAPI,
  ChromeTab,
  ChromeTabGroup,
  TabQueryInfo,
  GroupUpdateProperties,
  ChromeAPIError
} from '../../contracts/IChromeTabsAPI';
import {
  IChromeNotificationsAPI,
  NotificationOptions,
  NotificationError
} from '../../contracts/IChromeNotificationsAPI';
import {
  IChromeStorageAPI,
  StorageAPIError
} from '../../contracts/IChromeStorageAPI';
import { Result } from '../../utils/Result';

// Define StorageData type
type StorageData = Record<string, any>;

/**
 * Mock Chrome Tabs API for testing
 */
export class MockChromeTabsAPI implements IChromeTabsAPI {
  private tabs: ChromeTab[] = [];
  private groups: ChromeTabGroup[] = [];
  private nextTabId = 1;
  private nextGroupId = 1;

  // Track calls for verification
  public createGroupCalls: Array<{ tabIds: number[] }> = [];
  public updateGroupCalls: Array<{ groupId: number; updates: GroupUpdateProperties }> = [];
  public removeTabCalls: Array<{ tabId: number }> = [];
  public queryTabsCalls: Array<{ query: TabQueryInfo }> = [];

  constructor(initialTabs: ChromeTab[] = []) {
    this.tabs = initialTabs;
  }

  async createGroup(tabIds: number[]): Promise<Result<number, ChromeAPIError>> {
    this.createGroupCalls.push({ tabIds });

    const groupId = this.nextGroupId++;
    const group: ChromeTabGroup = {
      id: groupId,
      title: '',
      color: 'grey',
      collapsed: false
    };

    this.groups.push(group);

    // Update tabs to be in this group
    for (const tabId of tabIds) {
      const tab = this.tabs.find(tab => tab.id === tabId);
      if (tab) {
        tab.groupId = groupId;
      }
    }

    return Result.ok(groupId);
  }

  async updateGroup(
    groupId: number,
    updates: GroupUpdateProperties
  ): Promise<Result<void, ChromeAPIError>> {
    this.updateGroupCalls.push({ groupId, updates });

    const group = this.groups.find(group => group.id === groupId);
    if (!group) {
      return Result.error({
        type: 'InvalidGroupId',
        details: `No group with id ${groupId}`,
        groupId
      });
    }

    if (updates.title !== undefined) group.title = updates.title;
    if (updates.color !== undefined) group.color = updates.color;
    if (updates.collapsed !== undefined) group.collapsed = updates.collapsed;

    return Result.ok(undefined);
  }

  async queryTabs(query: TabQueryInfo): Promise<Result<ChromeTab[], ChromeAPIError>> {
    this.queryTabsCalls.push({ query });

    let results = [...this.tabs];

    if (query.active !== undefined) {
      results = results.filter(tab => tab.active === query.active);
    }

    if (query.pinned !== undefined) {
      results = results.filter(tab => tab.pinned === query.pinned);
    }

    if (query.groupId !== undefined) {
      results = results.filter(tab => tab.groupId === query.groupId);
    }

    if (query.url !== undefined) {
      results = results.filter(tab => tab.url === query.url);
    }

    return Result.ok(results);
  }

  async removeTab(tabId: number): Promise<Result<void, ChromeAPIError>> {
    this.removeTabCalls.push({ tabId });

    const index = this.tabs.findIndex(tab => tab.id === tabId);
    if (index === -1) {
      return Result.error({
        type: 'InvalidTabId',
        details: `No tab with id ${tabId}`,
        tabId
      });
    }

    this.tabs.splice(index, 1);
    return Result.ok(undefined);
  }

  async getAllGroups(): Promise<Result<ChromeTabGroup[], ChromeAPIError>> {
    return Result.ok([...this.groups]);
  }

  // Helper methods for test setup
  addTab(tab: Partial<ChromeTab>): ChromeTab {
    const newTab: ChromeTab = {
      id: tab.id ?? this.nextTabId++,
      url: tab.url ?? 'https://example.com',
      title: tab.title ?? 'Example',
      active: tab.active ?? false,
      pinned: tab.pinned ?? false,
      groupId: tab.groupId ?? -1,
      index: tab.index ?? this.tabs.length,
      windowId: tab.windowId ?? 1
    };

    this.tabs.push(newTab);
    return newTab;
  }

  reset(): void {
    this.tabs = [];
    this.groups = [];
    this.nextTabId = 1;
    this.nextGroupId = 1;
    this.createGroupCalls = [];
    this.updateGroupCalls = [];
    this.removeTabCalls = [];
    this.queryTabsCalls = [];
  }
}

/**
 * Mock Chrome Notifications API for testing
 */
export class MockChromeNotificationsAPI implements IChromeNotificationsAPI {
  private notifications = new Map<string, NotificationOptions>();
  private nextNotificationId = 1;

  // Track calls for verification
  public createCalls: Array<{ options: NotificationOptions }> = [];
  public clearCalls: Array<{ notificationId: string }> = [];
  public updateCalls: Array<{ notificationId: string; options: Partial<NotificationOptions> }> = [];

  async create(options: NotificationOptions): Promise<Result<string, NotificationError>> {
    const notificationId = `notification-${this.nextNotificationId++}`;
    this.createCalls.push({ options });
    this.notifications.set(notificationId, options);
    return Result.ok(notificationId);
  }

  async clear(notificationId: string): Promise<Result<boolean, NotificationError>> {
    this.clearCalls.push({ notificationId });
    const existed = this.notifications.has(notificationId);
    this.notifications.delete(notificationId);
    return Result.ok(existed);
  }

  async update(
    notificationId: string,
    options: NotificationOptions
  ): Promise<Result<boolean, NotificationError>> {
    this.updateCalls.push({ notificationId, options });

    const existing = this.notifications.get(notificationId);
    if (!existing) {
      return Result.error({
        type: 'InvalidNotificationId',
        details: `No notification with id ${notificationId}`,
        notificationId
      });
    }

    this.notifications.set(notificationId, { ...existing, ...options });
    return Result.ok(true);
  }

  // Helper methods for test verification
  getLastCreatedNotification(): NotificationOptions | undefined {
    return this.createCalls[this.createCalls.length - 1]?.options;
  }

  reset(): void {
    this.notifications.clear();
    this.nextNotificationId = 1;
    this.createCalls = [];
    this.clearCalls = [];
    this.updateCalls = [];
  }
}

/**
 * Mock Chrome Storage API for testing
 */
export class MockChromeStorageAPI implements IChromeStorageAPI {
  private storage = new Map<string, any>();
  private quotaBytes = 10_485_760; // 10MB

  // Track calls for verification
  public getCalls: Array<{ keys: string | string[] }> = [];
  public setCalls: Array<{ items: StorageData }> = [];
  public removeCalls: Array<{ keys: string | string[] }> = [];

  async get(keys: string | string[]): Promise<Result<StorageData, StorageAPIError>> {
    this.getCalls.push({ keys });

    const keysArray = Array.isArray(keys) ? keys : [keys];
    const result: StorageData = {};

    for (const key of keysArray) {
      if (this.storage.has(key)) {
        result[key] = this.storage.get(key);
      }
    }

    return Result.ok(result);
  }

  async set(items: StorageData): Promise<Result<void, StorageAPIError>> {
    this.setCalls.push({ items });

    // Check quota
    const currentSize = this.calculateSize();
    const newSize = currentSize + this.calculateObjectSize(items);

    if (newSize > this.quotaBytes) {
      return Result.error({
        type: 'QuotaExceeded',
        details: 'Storage quota exceeded',
        bytesUsed: currentSize,
        quotaLimit: this.quotaBytes
      });
    }

    // Store items
    for (const [key, value] of Object.entries(items)) {
      this.storage.set(key, value);
    }

    return Result.ok(undefined);
  }

  async remove(keys: string | string[]): Promise<Result<void, StorageAPIError>> {
    this.removeCalls.push({ keys });

    const keysArray = Array.isArray(keys) ? keys : [keys];

    for (const key of keysArray) {
      this.storage.delete(key);
    }

    return Result.ok(undefined);
  }

  async clear(): Promise<Result<void, StorageAPIError>> {
    this.storage.clear();
    return Result.ok(undefined);
  }

  async getBytesInUse(keys: string | string[] | null = null): Promise<Result<number, StorageAPIError>> {
    if (!keys) {
      return Result.ok(this.calculateSize());
    }

    const keysArray = Array.isArray(keys) ? keys : [keys];
    let size = 0;

    for (const key of keysArray) {
      if (this.storage.has(key)) {
        size += this.calculateObjectSize({ [key]: this.storage.get(key) });
      }
    }

    return Result.ok(size);
  }

  // Helper methods
  private calculateSize(): number {
    let size = 0;
    for (const [key, value] of this.storage.entries()) {
      size += this.calculateObjectSize({ [key]: value });
    }
    return size;
  }

  private calculateObjectSize(obj: any): number {
    // Rough approximation - JSON string length
    return JSON.stringify(obj).length;
  }

  reset(): void {
    this.storage.clear();
    this.getCalls = [];
    this.setCalls = [];
    this.removeCalls = [];
  }
}

/**
 * Helper to create a set of mock tabs for testing
 */
export function createMockTabs(count: number, options: Partial<ChromeTab> = {}): ChromeTab[] {
  const tabs: ChromeTab[] = [];

  for (let i = 0; i < count; i++) {
    tabs.push({
      id: i + 1,
      url: options.url ?? `https://example.com/${i}`,
      title: options.title ?? `Tab ${i + 1}`,
      active: options.active ?? (i === 0),
      pinned: options.pinned ?? false,
      groupId: options.groupId ?? -1,
      index: i,
      windowId: 1
    });
  }

  return tabs;
}

/**
 * Helper to wait for async operations
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper to assert Result is Ok
 */
export function assertOk<T, E>(result: Result<T, E>): asserts result is Result<T, E> & { ok: true } {
  if (!result.ok) {
    throw new Error(`Expected Ok result, got Error: ${JSON.stringify(result.error)}`);
  }
}

/**
 * Helper to assert Result is Error
 */
export function assertError<T, E>(result: Result<T, E>): asserts result is Result<T, E> & { ok: false } {
  if (result.ok) {
    throw new Error(`Expected Error result, got Ok: ${JSON.stringify(result.value)}`);
  }
}
