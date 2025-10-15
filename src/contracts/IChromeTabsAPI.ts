/**
 * FILE: IChromeTabsAPI.ts
 * 
 * WHAT: Contract for Chrome Tabs API wrapper - abstracts chrome.tabs.* calls
 * 
 * WHY: Wraps Chrome extension APIs behind testable interface with Result-type error handling.
 *      Enables unit testing without browser, maps Chrome errors to domain types.
 * 
 * HOW DATA FLOWS:
 *   1. TabManager calls IChromeTabsAPI methods (SEAM-02, 07, 08)
 *   2. Implementation calls chrome.tabs.* APIs
 *   3. Chrome API returns result or throws error
 *   4. Wrapper maps to Result<T, ChromeAPIError>
 *   5. TabManager receives typed Result
 * 
 * SEAMS:
 *   IN:  TabManager → ChromeTabsAPI (SEAM-02, 07, 08, 03)
 *   OUT: ChromeTabsAPI → chrome.tabs (external browser API)
 * 
 * CONTRACT: IChromeTabsAPI v1.0.0
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';

/**
 * CONTRACT: IChromeTabsAPI
 * VERSION: 1.0.0
 * 
 * Chrome Tabs API wrapper providing:
 * - Result-type error handling (no exceptions)
 * - Domain-specific error types
 * - Testable interface (mockable)
 * - Type-safe Chrome API interactions
 * 
 * PERFORMANCE: <20ms per call (95th percentile)
 * All methods are async and non-blocking
 */
export interface IChromeTabsAPI {
  /**
   * Create a new tab group
   * 
   * SEAM: SEAM-02 (TabManager → ChromeTabsAPI)
   * 
   * INPUT:
   *   - tabIds: number[] (non-empty, valid Chrome tab IDs)
   * 
   * OUTPUT:
   *   - Success: number (groupId)
   *   - Error: ChromeAPIError
   * 
   * ERRORS:
   *   - InvalidTabId: One or more tab IDs are invalid
   *   - PermissionDenied: Extension lacks tabs permission
   *   - ChromeAPIFailure: Unexpected Chrome API error
   * 
   * PERFORMANCE: <20ms (95th percentile)
   * 
   * @param tabIds - Array of tab IDs to group
   * @returns Result with groupId or error
   */
  createGroup(tabIds: number[]): Promise<Result<number, ChromeAPIError>>;

  /**
   * Update tab group properties (title, color, etc.)
   * 
   * SEAM: SEAM-03 (TabManager → ChromeTabsAPI)
   * 
   * INPUT:
   *   - groupId: number (valid Chrome group ID)
   *   - properties: GroupUpdateProperties
   * 
   * OUTPUT:
   *   - Success: void
   *   - Error: ChromeAPIError
   * 
   * ERRORS:
   *   - InvalidGroupId: Group ID doesn't exist
   *   - PermissionDenied: Extension lacks tabs permission
   *   - ChromeAPIFailure: Unexpected Chrome API error
   * 
   * PERFORMANCE: <20ms (95th percentile)
   */
  updateGroup(
    groupId: number,
    properties: GroupUpdateProperties
  ): Promise<Result<void, ChromeAPIError>>;

  /**
   * Query tabs matching criteria
   * 
   * SEAM: SEAM-07 (TabManager → ChromeTabsAPI)
   * 
   * INPUT:
   *   - queryInfo: TabQueryInfo
   * 
   * OUTPUT:
   *   - Success: ChromeTab[] (array of matching tabs)
   *   - Error: ChromeAPIError
   * 
   * ERRORS:
   *   - PermissionDenied: Extension lacks tabs permission
   *   - ChromeAPIFailure: Unexpected Chrome API error
   * 
   * PERFORMANCE: <30ms (95th percentile, may query many tabs)
   */
  queryTabs(queryInfo: TabQueryInfo): Promise<Result<ChromeTab[], ChromeAPIError>>;

  /**
   * Remove (close) a tab
   * 
   * SEAM: SEAM-08 (TabManager → ChromeTabsAPI)
   * 
   * INPUT:
   *   - tabId: number (valid Chrome tab ID)
   * 
   * OUTPUT:
   *   - Success: void
   *   - Error: ChromeAPIError
   * 
   * ERRORS:
   *   - InvalidTabId: Tab ID doesn't exist
   *   - PermissionDenied: Extension lacks tabs permission
   *   - ChromeAPIFailure: Unexpected Chrome API error
   * 
   * PERFORMANCE: <20ms (95th percentile)
   */
  removeTab(tabId: number): Promise<Result<void, ChromeAPIError>>;

  /**
   * Get all tab groups in current window
   * 
   * INPUT: void
   * OUTPUT:
   *   - Success: ChromeTabGroup[]
   *   - Error: ChromeAPIError
   * 
   * PERFORMANCE: <20ms (95th percentile)
   */
  getAllGroups(): Promise<Result<ChromeTabGroup[], ChromeAPIError>>;
}

/**
 * Chrome tab representation
 */
export interface ChromeTab {
  id: number;
  url: string;
  title: string;
  pinned: boolean;
  active: boolean;
  groupId: number; // -1 if not in group
  windowId: number;
  index: number;
}

/**
 * Chrome tab group representation
 */
export interface ChromeTabGroup {
  id: number;
  title?: string;
  color: TabGroupColor;
  collapsed: boolean;
}

/**
 * Tab group colors supported by Chrome
 */
export type TabGroupColor = 
  | 'grey'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'cyan'
  | 'orange';

/**
 * Properties for updating a tab group
 */
export interface GroupUpdateProperties {
  title?: string;
  color?: TabGroupColor;
  collapsed?: boolean;
}

/**
 * Query criteria for finding tabs
 */
export interface TabQueryInfo {
  currentWindow?: boolean;
  active?: boolean;
  pinned?: boolean;
  url?: string | string[];
  title?: string;
  groupId?: number;
}

/**
 * Chrome API error types
 * 
 * All Chrome errors mapped to these domain-specific types
 */
export type ChromeAPIError =
  | { type: 'InvalidTabId'; details: string; tabId: number }
  | { type: 'InvalidGroupId'; details: string; groupId: number }
  | { type: 'PermissionDenied'; details: string; permission: string }
  | { type: 'ChromeAPIFailure'; details: string; originalError: unknown };

/**
 * Type guards for error handling
 */
export function isInvalidTabIdError(error: ChromeAPIError): error is Extract<ChromeAPIError, { type: 'InvalidTabId' }> {
  return error.type === 'InvalidTabId';
}

export function isPermissionDeniedError(error: ChromeAPIError): error is Extract<ChromeAPIError, { type: 'PermissionDenied' }> {
  return error.type === 'PermissionDenied';
}
