/**
 * FILE: MockChromeTabsAPI.ts
 * 
 * WHAT: Mock implementation of IChromeTabsAPI - returns fake tab/group data without Chrome APIs
 * 
 * WHY: Enables development and testing without browser environment. Proves IChromeTabsAPI
 *      contract is implementable. Provides test double for unit testing TabManager and UI.
 * 
 * HOW DATA FLOWS:
 *   1. TabManager calls IChromeTabsAPI methods (SEAM-02, 07, 08, 03)
 *   2. Mock stores state in-memory (mockTabs[], mockGroups[])
 *   3. Mock returns fake data wrapped in Result<T, E>
 *   4. TabManager receives valid contract responses
 *   5. NO actual Chrome API calls made
 * 
 * SEAMS:
 *   IN:  TabManager → ChromeTabsAPI (SEAM-02, SEAM-07, SEAM-08, SEAM-03)
 *   OUT: None (mock terminates seam with fake data)
 * 
 * CONTRACT: IChromeTabsAPI v1.0.0
 * GENERATED: 2025-10-12
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import type {
  IChromeTabsAPI,
  ChromeTab,
  ChromeTabGroup,
  GroupUpdateProperties,
  TabQueryInfo,
  ChromeAPIError,
  TabGroupColor,
} from '../contracts/IChromeTabsAPI';

/**
 * Mock implementation of IChromeTabsAPI
 * 
 * Provides fake Chrome Tabs API responses for testing and development.
 * Stores state in-memory, supports seeding test data.
 * 
 * MOCK BEHAVIOR:
 * - Returns fake tab/group data
 * - Auto-increments IDs (nextTabId, nextGroupId)
 * - Validates inputs per contract
 * - Tracks call history for test assertions
 * - Supports state reset between tests
 */
export class MockChromeTabsAPI implements IChromeTabsAPI {
  private mockTabs: ChromeTab[] = [];
  private mockGroups: ChromeTabGroup[] = [];
  private nextGroupId = 1;
  private nextTabId = 100;
  private callHistory: MockCallRecord[] = [];

  constructor() {
    // Seed with default fake tabs
    this.seedDefaultTabs();
  }

  /**
   * Create a new tab group
   * 
   * DATA IN: tabIds: number[] (non-empty)
   * DATA OUT: Result<number, ChromeAPIError> (groupId or error)
   * 
   * SEAM: SEAM-02 (TabManager → ChromeTabsAPI)
   * 
   * FLOW:
   *   1. Validate tabIds are non-empty
   *   2. Check all tabIds exist in mockTabs
   *   3. Generate new groupId
   *   4. Create mock group
   *   5. Update tabs to belong to group
   *   6. Return groupId
   * 
   * ERRORS:
   *   - InvalidTabId: One or more tab IDs don't exist
   * 
   * PERFORMANCE: <5ms (mock, no I/O)
   */
  async createGroup(tabIds: number[]): Promise<Result<number, ChromeAPIError>> {
    this.callHistory.push({ method: 'createGroup', args: [tabIds], timestamp: Date.now() });

    // Validate tabIds exist
    for (const tabId of tabIds) {
      if (!this.mockTabs.find(t => t.id === tabId)) {
        return Result.error({
          type: 'InvalidTabId',
          details: `Tab ID ${tabId} does not exist`,
          tabId,
        });
      }
    }

    // Create mock group
    const groupId = this.nextGroupId++;
    this.mockGroups.push({
      id: groupId,
      title: '',
      color: 'grey',
      collapsed: false,
    });

    // Update tabs to belong to this group
    tabIds.forEach(tabId => {
      const tab = this.mockTabs.find(t => t.id === tabId);
      if (tab) tab.groupId = groupId;
    });

    return Result.ok(groupId);
  }

  /**
   * Update tab group properties
   * 
   * DATA IN: groupId: number, properties: GroupUpdateProperties
   * DATA OUT: Result<void, ChromeAPIError>
   * 
   * SEAM: SEAM-03 (TabManager → ChromeTabsAPI)
   * 
   * FLOW:
   *   1. Find group by groupId
   *   2. If not found, return InvalidGroupId error
   *   3. Update group properties
   *   4. Return success
   * 
   * ERRORS:
   *   - InvalidGroupId: Group doesn't exist
   * 
   * PERFORMANCE: <5ms (mock, no I/O)
   */
  async updateGroup(
    groupId: number,
    properties: GroupUpdateProperties
  ): Promise<Result<void, ChromeAPIError>> {
    this.callHistory.push({ method: 'updateGroup', args: [groupId, properties], timestamp: Date.now() });

    const group = this.mockGroups.find(g => g.id === groupId);
    if (!group) {
      return Result.error({
        type: 'InvalidGroupId',
        details: `Group ID ${groupId} does not exist`,
        groupId,
      });
    }

    // Update group properties
    if (properties.title !== undefined) group.title = properties.title;
    if (properties.color !== undefined) group.color = properties.color;
    if (properties.collapsed !== undefined) group.collapsed = properties.collapsed;

    return Result.ok(undefined);
  }

  /**
   * Query tabs matching criteria
   * 
   * DATA IN: queryInfo: TabQueryInfo
   * DATA OUT: Result<ChromeTab[], ChromeAPIError>
   * 
   * SEAM: SEAM-07 (TabManager → ChromeTabsAPI)
   * 
   * FLOW:
   *   1. Start with all mockTabs
   *   2. Filter by currentWindow (always true for mock)
   *   3. Filter by active flag
   *   4. Filter by pinned flag
   *   5. Filter by url pattern
   *   6. Filter by groupId
   *   7. Return filtered tabs
   * 
   * PERFORMANCE: <5ms (mock, in-memory filtering)
   */
  async queryTabs(queryInfo: TabQueryInfo): Promise<Result<ChromeTab[], ChromeAPIError>> {
    this.callHistory.push({ method: 'queryTabs', args: [queryInfo], timestamp: Date.now() });

    let filtered = [...this.mockTabs];

    // Apply filters
    if (queryInfo.active !== undefined) {
      filtered = filtered.filter(t => t.active === queryInfo.active);
    }
    if (queryInfo.pinned !== undefined) {
      filtered = filtered.filter(t => t.pinned === queryInfo.pinned);
    }
    if (queryInfo.groupId !== undefined) {
      filtered = filtered.filter(t => t.groupId === queryInfo.groupId);
    }
    if (queryInfo.url !== undefined) {
      const urls = Array.isArray(queryInfo.url) ? queryInfo.url : [queryInfo.url];
      filtered = filtered.filter(t => urls.some(url => t.url.includes(url)));
    }
    if (queryInfo.title !== undefined) {
      filtered = filtered.filter(t => t.title.includes(queryInfo.title!));
    }

    return Result.ok(filtered);
  }

  /**
   * Remove (close) a tab
   * 
   * DATA IN: tabId: number
   * DATA OUT: Result<void, ChromeAPIError>
   * 
   * SEAM: SEAM-08 (TabManager → ChromeTabsAPI)
   * 
   * FLOW:
   *   1. Find tab by tabId
   *   2. If not found, return InvalidTabId error
   *   3. Remove from mockTabs
   *   4. Return success
   * 
   * ERRORS:
   *   - InvalidTabId: Tab doesn't exist
   * 
   * PERFORMANCE: <5ms (mock, no I/O)
   */
  async removeTab(tabId: number): Promise<Result<void, ChromeAPIError>> {
    this.callHistory.push({ method: 'removeTab', args: [tabId], timestamp: Date.now() });

    const tabIndex = this.mockTabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) {
      return Result.error({
        type: 'InvalidTabId',
        details: `Tab ID ${tabId} does not exist`,
        tabId,
      });
    }

    this.mockTabs.splice(tabIndex, 1);
    return Result.ok(undefined);
  }

  /**
   * Get all tab groups
   * 
   * DATA IN: void
   * DATA OUT: Result<ChromeTabGroup[], ChromeAPIError>
   * 
   * FLOW:
   *   1. Return copy of mockGroups array
   * 
   * PERFORMANCE: <5ms (mock, no I/O)
   */
  async getAllGroups(): Promise<Result<ChromeTabGroup[], ChromeAPIError>> {
    this.callHistory.push({ method: 'getAllGroups', args: [], timestamp: Date.now() });
    return Result.ok([...this.mockGroups]);
  }

  // ========================================
  // MOCK HELPER METHODS
  // ========================================

  /**
   * Seed mock with custom tabs
   * 
   * Used by tests to set up specific scenarios
   */
  seedMockTabs(tabs: ChromeTab[]): void {
    this.mockTabs = [...tabs];
  }

  /**
   * Seed mock with custom groups
   * 
   * Used by tests to set up specific scenarios
   */
  seedMockGroups(groups: ChromeTabGroup[]): void {
    this.mockGroups = [...groups];
  }

  /**
   * Reset mock to initial state
   * 
   * Call between tests to ensure isolation
   */
  reset(): void {
    this.mockTabs = [];
    this.mockGroups = [];
    this.nextGroupId = 1;
    this.nextTabId = 100;
    this.callHistory = [];
    this.seedDefaultTabs();
  }

  /**
   * Get call history for test assertions
   * 
   * Enables verifying mock was called with expected arguments
   */
  getCallHistory(): MockCallRecord[] {
    return [...this.callHistory];
  }

  /**
   * Seed default fake tabs
   * 
   * Provides realistic tab data for development/testing
   */
  private seedDefaultTabs(): void {
    this.mockTabs = [
      {
        id: 100,
        url: 'https://github.com/TabbyMcTabface',
        title: 'GitHub - TabbyMcTabface',
        pinned: false,
        active: true,
        groupId: -1,
        windowId: 1,
        index: 0,
      },
      {
        id: 101,
        url: 'https://stackoverflow.com/questions/typescript',
        title: 'TypeScript Questions - Stack Overflow',
        pinned: false,
        active: false,
        groupId: -1,
        windowId: 1,
        index: 1,
      },
      {
        id: 102,
        url: 'https://twitter.com',
        title: 'Twitter / X',
        pinned: true,
        active: false,
        groupId: -1,
        windowId: 1,
        index: 2,
      },
      {
        id: 103,
        url: 'https://docs.google.com/spreadsheets',
        title: 'Project Tracker - Google Sheets',
        pinned: false,
        active: false,
        groupId: -1,
        windowId: 1,
        index: 3,
      },
      {
        id: 104,
        url: 'https://news.ycombinator.com',
        title: 'Hacker News',
        pinned: false,
        active: false,
        groupId: -1,
        windowId: 1,
        index: 4,
      },
      {
        id: 105,
        url: 'https://reddit.com/r/programming',
        title: 'r/programming - Reddit',
        pinned: false,
        active: false,
        groupId: -1,
        windowId: 1,
        index: 5,
      },
      {
        id: 106,
        url: 'https://developer.mozilla.org',
        title: 'MDN Web Docs',
        pinned: true,
        active: false,
        groupId: -1,
        windowId: 1,
        index: 6,
      },
      {
        id: 107,
        url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Totally work-related video',
        pinned: false,
        active: false,
        groupId: -1,
        windowId: 1,
        index: 7,
      },
    ];
  }
}

/**
 * Record of mock method calls
 * 
 * Used for test assertions - verify mock was called correctly
 */
export interface MockCallRecord {
  method: string;
  args: any[];
  timestamp: number;
}
