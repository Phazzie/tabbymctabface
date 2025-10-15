/**
 * FILE: TabManager.ts
 *
 * WHAT: Real tab management orchestrator coordinating tab operations with humor delivery
 *
 * WHY: Implements ITabManager contract for TabbyMcTabface's core functionality.
 *      Bridges UI interactions, Chrome tab operations, and humor system events.
 *
 * HOW DATA FLOWS:
 *   1. UI calls TabManager methods (createGroup, closeRandomTab, etc.)
 *   2. TabManager validates inputs
 *   3. Calls ChromeTabsAPI for tab operations (SEAM-02, 07, 08)
 *   4. On success, triggers HumorSystem with appropriate event (SEAM-04, 09)
 *   5. Returns result to UI
 *   6. Tracks events for browser context building
 *
 * SEAMS:
 *   IN:  UI → TabManager (SEAM-01, SEAM-06, SEAM-20)
 *   OUT: TabManager → ChromeTabsAPI (SEAM-02, 07, 08)
 *        TabManager → HumorSystem (SEAM-04, 09)
 *
 * CONTRACT: ITabManager v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
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

/**
 * Real tab manager implementation
 *
 * Coordinates tab operations with humor delivery.
 * Tracks events for context building and easter egg evaluation.
 * Validates all inputs per contract specifications.
 */
export class TabManager implements ITabManager {
  private recentEvents: string[] = [];
  private readonly maxRecentEvents = 10;

  /**
   * Constructor - inject dependencies
   */
  constructor(
    private readonly chromeTabsAPI: IChromeTabsAPI,
    private readonly humorSystem: IHumorSystem
  ) {}

  /**
   * Create a new tab group with specified tabs
   *
   * DATA IN: groupName (string, 1-50 chars), tabIds (number[], non-empty)
   * DATA OUT: Result<GroupCreationSuccess, TabManagerError>
   *
   * SEAM: SEAM-01 (UI → TabManager)
   *
   * FLOW:
   *   1. Validate group name (1-50 chars)
   *   2. Validate tabIds (non-empty)
   *   3. Create group via ChromeTabsAPI (SEAM-02)
   *   4. Update group title (SEAM-03)
   *   5. Trigger humor system (SEAM-04)
   *   6. Track event
   *   7. Return success
   *
   * ERRORS:
   *   - InvalidGroupName: empty or >50 chars
   *   - NoTabsSelected: empty tabIds array
   *   - ChromeAPIFailure: Chrome API error
   *
   * PERFORMANCE: <50ms (95th percentile)
   */
  async createGroup(
    groupName: string,
    tabIds: number[]
  ): Promise<Result<GroupCreationSuccess, TabManagerError>> {
    // Validate group name
    if (!groupName || groupName.trim().length === 0) {
      return Result.error({
        type: 'InvalidGroupName',
        details: 'Group name cannot be empty'
      });
    }

    if (groupName.length > 50) {
      return Result.error({
        type: 'InvalidGroupName',
        details: 'Group name must be 50 characters or less'
      });
    }

    // Validate tabIds
    if (!tabIds || tabIds.length === 0) {
      return Result.error({
        type: 'NoTabsSelected',
        details: 'At least one tab must be selected'
      });
    }

    try {
      // Create group via Chrome API (SEAM-02)
      const createResult = await this.chromeTabsAPI.createGroup(tabIds);

      if (!createResult.ok) {
        return Result.error({
          type: 'ChromeAPIFailure',
          details: 'Failed to create tab group',
          originalError: createResult.error
        });
      }

      const groupId = createResult.value;

      // Update group title (SEAM-03)
      const updateResult = await this.chromeTabsAPI.updateGroup(groupId, {
        title: groupName
      });

      if (!updateResult.ok) {
        return Result.error({
          type: 'ChromeAPIFailure',
          details: 'Failed to set group name',
          originalError: updateResult.error
        });
      }

      const timestamp = Date.now();

      // Trigger humor system (SEAM-04)
      const humorTrigger: HumorTrigger = {
        type: 'TabGroupCreated',
        data: { type: 'TabGroupCreated', groupName, tabCount: tabIds.length },
        timestamp
      };

      // Fire and forget - don't block on humor delivery
      this.humorSystem.deliverQuip(humorTrigger).catch(error => {
        console.warn('Humor delivery failed:', error);
      });

      // Track event
      this.addRecentEvent('TabGroupCreated');

      // Return success
      return Result.ok({
        groupId,
        groupName,
        tabCount: tabIds.length,
        timestamp
      });

    } catch (error) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Unexpected error during group creation',
        originalError: error
      });
    }
  }

  /**
   * Close a random tab (Feeling Lucky feature)
   *
   * DATA IN: options (RandomTabOptions, optional)
   * DATA OUT: Result<TabClosureResult, TabManagerError>
   *
   * SEAM: SEAM-06 (UI → TabManager)
   *
   * FLOW:
   *   1. Query all tabs (SEAM-07)
   *   2. Filter by options (exclude pinned/active)
   *   3. Select random tab
   *   4. Close tab (SEAM-08)
   *   5. Trigger humor system (SEAM-09)
   *   6. Track event
   *   7. Return closure details
   *
   * ERRORS:
   *   - NoTabsToClose: All tabs are pinned/active
   *   - ChromeAPIFailure: Chrome API error
   *
   * PERFORMANCE: <30ms (95th percentile)
   */
  async closeRandomTab(
    options?: RandomTabOptions
  ): Promise<Result<TabClosureResult, TabManagerError>> {
    try {
      // Query all tabs (SEAM-07)
      const queryResult = await this.chromeTabsAPI.queryTabs({});

      if (!queryResult.ok) {
        return Result.error({
          type: 'ChromeAPIFailure',
          details: 'Failed to query tabs',
          originalError: queryResult.error
        });
      }

      const allTabs = queryResult.value;

      // Filter and select tab
      const tabResult = this.selectRandomTab(allTabs, options);
      if (!tabResult.ok) return tabResult;

      const tabToClose = tabResult.value;

      // Close and notify
      return await this.closeTabAndNotify(tabToClose, allTabs.length);

    } catch (error) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Unexpected error during random tab closure',
        originalError: error
      });
    }
  }

  /**
   * Get all tab groups in current window
   *
   * DATA IN: void
   * DATA OUT: Result<GroupData[], TabManagerError>
   *
   * SEAM: SEAM-20 (PopupUI → TabManager)
   *
   * FLOW:
   *   1. Query all tab groups
   *   2. For each group, query tabs
   *   3. Build GroupData objects
   *   4. Return array
   *
   * PERFORMANCE: <20ms (95th percentile)
   */
  async getAllGroups(): Promise<Result<GroupData[], TabManagerError>> {
    try {
      // Query all groups
      const groupsResult = await this.chromeTabsAPI.getAllGroups();

      if (!groupsResult.ok) {
        return Result.error({
          type: 'ChromeAPIFailure',
          details: 'Failed to query tab groups',
          originalError: groupsResult.error
        });
      }

      const groups = groupsResult.value;

      // Query all tabs to map tabs to groups
      const tabsResult = await this.chromeTabsAPI.queryTabs({});

      if (!tabsResult.ok) {
        return Result.error({
          type: 'ChromeAPIFailure',
          details: 'Failed to query tabs',
          originalError: tabsResult.error
        });
      }

      const allTabs = tabsResult.value;

      // Build GroupData for each group
      const groupData: GroupData[] = groups.map(group => {
        const groupTabs = allTabs.filter(tab => tab.groupId === group.id);

        return {
          groupId: group.id,
          groupName: group.title || 'Untitled Group',
          tabCount: groupTabs.length,
          tabs: groupTabs,
          color: group.color || 'grey',
          collapsed: group.collapsed || false
        };
      });

      return Result.ok(groupData);

    } catch (error) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Unexpected error querying groups',
        originalError: error
      });
    }
  }

  /**
   * Update existing tab group
   *
   * DATA IN: groupId (number), updates (GroupUpdateData)
   * DATA OUT: Result<void, TabManagerError>
   *
   * SEAM: SEAM-21 (PopupUI → TabManager)
   *
   * FLOW:
   *   1. Validate groupId exists
   *   2. Validate updates (if name provided, check length)
   *   3. Apply updates via ChromeTabsAPI
   *   4. Return success
   *
   * PERFORMANCE: <50ms (95th percentile)
   */
  async updateGroup(
    groupId: number,
    updates: GroupUpdateData
  ): Promise<Result<void, TabManagerError>> {
    // Validate group name if provided
    if (updates.name !== undefined) {
      const nameValidation = this.validateGroupName(updates.name);
      if (!nameValidation.ok) return nameValidation;
    }

    try {
      // Build Chrome API update object
      const chromeUpdates = this.buildChromeUpdates(updates);

      // Update via Chrome API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateResult = await this.chromeTabsAPI.updateGroup(groupId, chromeUpdates as any);

      if (!updateResult.ok) {
        return this.handleUpdateError(updateResult.error, groupId);
      }

      return Result.ok(undefined);

    } catch (error) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Unexpected error updating group',
        originalError: error
      });
    }
  }

  /**
   * Delete a tab group (ungroups tabs, doesn't close them)
   *
   * DATA IN: groupId (number)
   * DATA OUT: Result<void, TabManagerError>
   *
   * SEAM: SEAM-22 (PopupUI → TabManager)
   *
   * FLOW:
   *   1. Query tabs in group
   *   2. Ungroup all tabs
   *   3. Return success
   *
   * PERFORMANCE: <30ms (95th percentile)
   */
  async deleteGroup(groupId: number): Promise<Result<void, TabManagerError>> {
    try {
      // Query tabs in this group
      const tabsResult = await this.chromeTabsAPI.queryTabs({ groupId });

      if (!tabsResult.ok) {
        return Result.error({
          type: 'ChromeAPIFailure',
          details: 'Failed to query group tabs',
          originalError: tabsResult.error
        });
      }

      const groupTabs = tabsResult.value;

      if (groupTabs.length === 0) {
        // Group doesn't exist or is already empty
        return Result.error({
          type: 'InvalidGroupId',
          details: 'Group does not exist or has no tabs',
          groupId
        });
      }

      // Ungroup all tabs by updating each tab to remove from group
      // Chrome API: Setting groupId to chrome.tabGroups.TAB_GROUP_ID_NONE (-1) ungroups
      const tabIds = groupTabs.map(tab => tab.id);
      const ungroupResult = await this.chromeTabsAPI.createGroup(tabIds);

      if (!ungroupResult.ok) {
        return Result.error({
          type: 'ChromeAPIFailure',
          details: 'Failed to ungroup tabs',
          originalError: ungroupResult.error
        });
      }

      return Result.ok(undefined);

    } catch (error) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Unexpected error deleting group',
        originalError: error
      });
    }
  }

  /**
   * Get current browser context for easter egg evaluation
   *
   * DATA IN: void
   * DATA OUT: Result<BrowserContext, TabManagerError>
   *
   * SEAM: SEAM-19 (HumorSystem → TabManager)
   *
   * FLOW:
   *   1. Query all tabs
   *   2. Get active tab
   *   3. Query all groups
   *   4. Build context object
   *   5. Return context
   *
   * PERFORMANCE: <10ms (95th percentile)
   */
  async getBrowserContext(): Promise<Result<BrowserContext, TabManagerError>> {
    try {
      // Query all tabs
      const tabsResult = await this.chromeTabsAPI.queryTabs({});

      if (!tabsResult.ok) {
        return Result.error({
          type: 'ChromeAPIFailure',
          details: 'Failed to query tabs for context',
          originalError: tabsResult.error
        });
      }

      const allTabs = tabsResult.value;

      // Find active tab
      const activeTab = allTabs.find(tab => tab.active);

      // Query all groups
      const groupsResult = await this.chromeTabsAPI.getAllGroups();

      if (!groupsResult.ok) {
        return Result.error({
          type: 'ChromeAPIFailure',
          details: 'Failed to query groups for context',
          originalError: groupsResult.error
        });
      }

      const allGroups = groupsResult.value;

      // Build context
      const context: BrowserContext = {
        tabCount: allTabs.length,
        activeTab: activeTab
          ? {
              url: activeTab.url || '',
              title: activeTab.title || 'Untitled',
              domain: this.extractDomain(activeTab.url || '')
            }
          : null,
        currentHour: new Date().getHours(),
        recentEvents: [...this.recentEvents],
        groupCount: allGroups.length
      };

      return Result.ok(context);

    } catch (error) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Unexpected error building context',
        originalError: error
      });
    }
  }

  /**
   * Validate group name
   *
   * @private
   */
  private validateGroupName(name: string): Result<void, TabManagerError> {
    if (!name || name.trim().length === 0) {
      return Result.error({
        type: 'InvalidGroupName',
        details: 'Group name cannot be empty'
      });
    }

    if (name.length > 50) {
      return Result.error({
        type: 'InvalidGroupName',
        details: 'Group name must be 50 characters or less'
      });
    }

    return Result.ok(undefined);
  }

  /**
   * Build Chrome API update object
   *
   * @private
   */
  private buildChromeUpdates(updates: GroupUpdateData): {
    title?: string;
    collapsed?: boolean;
    color?: string;
  } {
    const chromeUpdates: Record<string, any> = {};

    if (updates.name !== undefined) {
      chromeUpdates.title = updates.name;
    }

    if (updates.collapsed !== undefined) {
      chromeUpdates.collapsed = updates.collapsed;
    }

    if (updates.color !== undefined) {
      chromeUpdates.color = updates.color;
    }

    return chromeUpdates;
  }

  /**
   * Handle update error from Chrome API
   *
   * @private
   */
  private handleUpdateError(
    error: unknown,
    groupId: number
  ): Result<void, TabManagerError> {
    const errorStr = error instanceof Error ? error.message : JSON.stringify(error);
    if (errorStr.includes('No group with id') || errorStr.includes('not found')) {
      return Result.error({
        type: 'InvalidGroupId',
        details: 'Group does not exist',
        groupId
      });
    }

    return Result.error({
      type: 'ChromeAPIFailure',
      details: 'Failed to update group',
      originalError: error
    });
  }

  /**
   * Select random tab from eligible tabs
   *
   * @private
   */
  private selectRandomTab(
    allTabs: ChromeTab[],
    options?: RandomTabOptions
  ): Result<ChromeTab, TabManagerError> {
    const excludePinned = options?.excludePinned ?? true;
    const excludeActive = options?.excludeActive ?? true;

    // Filter eligible tabs
    const eligibleTabs = allTabs.filter(tab => {
      if (excludePinned && tab.pinned) return false;
      if (excludeActive && tab.active) return false;
      return true;
    });

    if (eligibleTabs.length === 0) {
      let reason: string;
      if (excludePinned && excludeActive) {
        reason = 'All tabs are pinned or active';
      } else if (excludePinned) {
        reason = 'All tabs are pinned';
      } else {
        reason = 'All tabs are active';
      }

      return Result.error({
        type: 'NoTabsToClose',
        details: 'No eligible tabs to close',
        reason
      });
    }

    // Select random tab
    const randomIndex = Math.floor(Math.random() * eligibleTabs.length);
    return Result.ok(eligibleTabs[randomIndex]);
  }

  /**
   * Close tab and trigger humor notification
   *
   * @private
   */
  private async closeTabAndNotify(
    tabToClose: ChromeTab,
    totalTabCount: number
  ): Promise<Result<TabClosureResult, TabManagerError>> {
    // Close tab (SEAM-08)
    const closeResult = await this.chromeTabsAPI.removeTab(tabToClose.id);

    if (!closeResult.ok) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Failed to close tab',
        originalError: closeResult.error
      });
    }

    const timestamp = Date.now();

    // Trigger humor system (SEAM-09)
    const humorTrigger: HumorTrigger = {
      type: 'FeelingLuckyClicked',
      data: {
        type: 'TabClosed',
        tabTitle: tabToClose.title || 'Untitled',
        tabUrl: tabToClose.url || '',
        trigger: 'FeelingLucky'
      },
      timestamp
    };

    // Fire and forget
    this.humorSystem.deliverQuip(humorTrigger).catch(error => {
      console.warn('Humor delivery failed:', error);
    });

    // Track event
    this.addRecentEvent('FeelingLuckyClicked');

    // Return success
    return Result.ok({
      closedTabId: tabToClose.id,
      closedTabTitle: tabToClose.title || 'Untitled',
      closedTabUrl: tabToClose.url || '',
      remainingCount: totalTabCount - 1,
      timestamp
    });
  }

  /**
   * Add event to recent events tracking
   *
   * @private
   */
  private addRecentEvent(eventType: string): void {
    this.recentEvents.unshift(eventType);

    // Keep only last N events
    if (this.recentEvents.length > this.maxRecentEvents) {
      this.recentEvents = this.recentEvents.slice(0, this.maxRecentEvents);
    }
  }

  /**
   * Extract domain from URL
   *
   * @private
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }
}
