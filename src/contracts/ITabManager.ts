/**
 * FILE: ITabManager.ts
 * 
 * WHAT: Contract for core tab management operations (grouping, random closure, state tracking)
 * 
 * WHY: Defines interface for TabbyMcTabface's core tab functionality. Abstracts tab operations
 *      behind type-safe contract, enabling UI and Humor System to operate without direct Chrome dependencies.
 * 
 * HOW DATA FLOWS:
 *   1. UI calls ITabManager methods (SEAM-01, SEAM-06, SEAM-20)
 *   2. TabManager validates inputs
 *   3. TabManager calls IChromeTabsAPI wrapper (SEAM-02, 07, 08)
 *   4. Chrome API performs operation, returns result
 *   5. TabManager maps result to Result<T, TabManagerError>
 *   6. TabManager MAY emit events to IHumorSystem (SEAM-04, 09)
 *   7. Result flows back to UI
 * 
 * SEAMS:
 *   IN:  UI → TabManager (SEAM-01, SEAM-06, SEAM-20)
 *   OUT: TabManager → ChromeTabsAPI (SEAM-02, 07, 08)
 *        TabManager → HumorSystem (SEAM-04, 09 - events)
 * 
 * CONTRACT: ITabManager v1.0.0
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import { ChromeTab, ChromeTabGroup } from './IChromeTabsAPI';

/**
 * CONTRACT: ITabManager
 * VERSION: 1.0.0
 * 
 * Core tab management interface providing:
 * - Tab grouping operations
 * - Random tab closure ("Feeling Lucky?")
 * - Tab state querying
 * - Event emissions to humor system
 * 
 * PERFORMANCE:
 * - createGroup: <50ms (95th percentile)
 * - closeRandomTab: <30ms (95th percentile)
 * - getAllGroups: <20ms (95th percentile)
 * - getBrowserContext: <10ms (95th percentile)
 */
export interface ITabManager {
  /**
   * Create a new tab group with specified tabs
   * 
   * SEAM: SEAM-01 (UI → TabManager)
   * 
   * INPUT:
   *   - groupName: string (1-50 chars, non-empty)
   *   - tabIds: number[] (non-empty, valid Chrome tab IDs)
   * 
   * OUTPUT:
   *   - Success: GroupCreationSuccess {groupId, groupName, tabCount, timestamp}
   *   - Error: TabManagerError
   * 
   * ERRORS:
   *   - InvalidGroupName: groupName empty or >50 chars
   *   - NoTabsSelected: tabIds is empty array
   *   - ChromeAPIFailure: Chrome API returned error
   * 
   * PERFORMANCE: <50ms (95th percentile)
   * 
   * SIDE EFFECTS:
   *   - Creates group in Chrome via SEAM-02, SEAM-03
   *   - Emits TabGroupCreatedEvent to IHumorSystem via SEAM-04
   * 
   * @param groupName - Human-readable group name (1-50 chars)
   * @param tabIds - Array of valid Chrome tab IDs to include in group
   * @returns Promise resolving to Result with groupId or error
   */
  createGroup(
    groupName: string,
    tabIds: number[]
  ): Promise<Result<GroupCreationSuccess, TabManagerError>>;

  /**
   * Close a random tab (excluding pinned/active tabs by default)
   * "Feeling Lucky?" button functionality
   * 
   * SEAM: SEAM-06 (UI → TabManager)
   * 
   * INPUT:
   *   - options: RandomTabOptions {excludePinned?, excludeActive?}
   * 
   * OUTPUT:
   *   - Success: TabClosureResult {closedTabId, closedTabTitle, remainingCount}
   *   - Error: TabManagerError
   * 
   * ERRORS:
   *   - NoTabsToClose: No eligible tabs to close (all pinned/active)
   *   - ChromeAPIFailure: Chrome API returned error
   * 
   * PERFORMANCE: <30ms (95th percentile)
   * 
   * SIDE EFFECTS:
   *   - Queries tabs via SEAM-07
   *   - Closes tab via SEAM-08
   *   - Emits TabClosedEvent to IHumorSystem via SEAM-09
   * 
   * @param options - Tab closure options
   * @returns Promise resolving to Result with closure details or error
   */
  closeRandomTab(
    options?: RandomTabOptions
  ): Promise<Result<TabClosureResult, TabManagerError>>;

  /**
   * Get all tab groups in current window
   * 
   * SEAM: SEAM-20 (PopupUI → TabManager)
   * 
   * INPUT: void
   * 
   * OUTPUT:
   *   - Success: GroupData[] (array of groups with tabs)
   *   - Error: TabManagerError
   * 
   * ERRORS:
   *   - ChromeAPIFailure: Chrome API returned error
   * 
   * PERFORMANCE: <20ms (95th percentile)
   * 
   * @returns Promise resolving to Result with groups or error
   */
  getAllGroups(): Promise<Result<GroupData[], TabManagerError>>;

  /**
   * Update existing tab group (name, tabs, color, etc.)
   * 
   * SEAM: SEAM-21 (PopupUI → TabManager)
   * 
   * INPUT:
   *   - groupId: number (valid group ID)
   *   - updates: GroupUpdateData
   * 
   * OUTPUT:
   *   - Success: void
   *   - Error: TabManagerError
   * 
   * ERRORS:
   *   - InvalidGroupId: Group doesn't exist
   *   - InvalidGroupName: Name validation failed
   *   - ChromeAPIFailure: Chrome API error
   * 
   * PERFORMANCE: <50ms (95th percentile)
   */
  updateGroup(
    groupId: number,
    updates: GroupUpdateData
  ): Promise<Result<void, TabManagerError>>;

  /**
   * Delete a tab group (ungroups tabs, doesn't close them)
   * 
   * SEAM: SEAM-22 (PopupUI → TabManager)
   * 
   * INPUT:
   *   - groupId: number (valid group ID)
   * 
   * OUTPUT:
   *   - Success: void
   *   - Error: TabManagerError
   * 
   * ERRORS:
   *   - InvalidGroupId: Group doesn't exist
   *   - ChromeAPIFailure: Chrome API error
   * 
   * PERFORMANCE: <30ms (95th percentile)
   */
  deleteGroup(groupId: number): Promise<Result<void, TabManagerError>>;

  /**
   * Get current browser context for easter egg evaluation
   * 
   * SEAM: SEAM-19 (HumorSystem → TabManager)
   * 
   * INPUT: void
   * 
   * OUTPUT:
   *   - Success: BrowserContext
   *   - Error: TabManagerError
   * 
   * PERFORMANCE: <10ms (95th percentile)
   * 
   * @returns Browser state including tab count, active tab, current time
   */
  getBrowserContext(): Promise<Result<BrowserContext, TabManagerError>>;
}

/**
 * Success data for group creation
 */
export interface GroupCreationSuccess {
  groupId: number;
  groupName: string;
  tabCount: number;
  timestamp: number;
}

/**
 * Success data for tab closure
 */
export interface TabClosureResult {
  closedTabId: number;
  closedTabTitle: string;
  closedTabUrl: string;
  remainingCount: number;
  timestamp: number;
}

/**
 * Options for random tab closure
 */
export interface RandomTabOptions {
  excludePinned?: boolean; // default: true
  excludeActive?: boolean; // default: true
}

/**
 * Group data with associated tabs
 */
export interface GroupData {
  groupId: number;
  groupName: string;
  tabCount: number;
  tabs: ChromeTab[];
  color: string;
  collapsed: boolean;
}

/**
 * Updates that can be applied to a group
 */
export interface GroupUpdateData {
  name?: string;
  tabIds?: number[];
  color?: string;
  collapsed?: boolean;
}

/**
 * Browser context for easter egg evaluation
 */
export interface BrowserContext {
  tabCount: number;
  activeTab: {
    url: string;
    title: string;
    domain: string;
  } | null;
  currentHour: number; // 0-23
  recentEvents: string[]; // last 10 tab events
  groupCount: number;
}

/**
 * Tab Manager error types
 */
export type TabManagerError =
  | { type: 'InvalidGroupName'; details: string }
  | { type: 'NoTabsSelected'; details: string }
  | { type: 'NoTabsToClose'; details: string; reason: string }
  | { type: 'InvalidGroupId'; details: string; groupId: number }
  | { type: 'ChromeAPIFailure'; details: string; originalError: unknown };

/**
 * Type guards for error handling
 */
export function isNoTabsToCloseError(
  error: TabManagerError
): error is Extract<TabManagerError, { type: 'NoTabsToClose' }> {
  return error.type === 'NoTabsToClose';
}

export function isInvalidGroupNameError(
  error: TabManagerError
): error is Extract<TabManagerError, { type: 'InvalidGroupName' }> {
  return error.type === 'InvalidGroupName';
}
