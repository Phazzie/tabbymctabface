/**
 * FILE: IChromeTabsAPI.ts
 *
 * WHAT: Contract for Chrome Tabs API wrapper - abstracts chrome.tabs.* calls
 *
 * WHY: Wraps Chrome extension APIs behind testable interface with Result-type error handling.
 *      Enables unit testing without browser, maps Chrome errors to domain types.
 *
 * HOW DATA FLOWS:
 *    1. TabManager calls IChromeTabsAPI methods (SEAM-02, 07, 08)
 *    2. Implementation calls chrome.tabs.* APIs
 *    3. Chrome API returns result or throws error
 *    4. Wrapper maps to Result<T, ChromeAPIError>
 *    5. TabManager receives typed Result
 *
 * SEAMS:
 *    IN:  TabManager ⟿ ChromeTabsAPI (SEAM-02, 07, 08, 03)
 *    OUT: ChromeTabsAPI ⟿ chrome.tabs (external browser API)
 *
 * CONTRACT: IChromeTabsAPI v1.1.0
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';

export interface IChromeTabsAPI {
  /**
   * Create a group or move tabs into an existing group.
   *
   * DATA IN:
   *   - tabIds: non-empty array of valid Chrome tab IDs
   *   - existingGroupId: optional non-negative integer identifying the destination group
   * DATA OUT: Result<number, ChromeAPIError> containing the created or destination group ID.
   * SEAM: SEAM-20 (TabManager → ChromeTabsAPI)
   * FLOW: Validate input, call chrome.tabs.group, then map the browser response to Result.
   * ERRORS: InvalidGroupId, InvalidTabId, PermissionDenied, ChromeAPIFailure.
   * PERFORMANCE: Browser-I/O-bound; wrapper overhead <5ms excluding Chrome API latency.
   */
  createGroup(tabIds: number[], existingGroupId?: number): Promise<Result<number, ChromeAPIError>>;
  updateGroup(groupId: number, properties: GroupUpdateProperties): Promise<Result<void, ChromeAPIError>>;
  queryTabs(queryInfo: TabQueryInfo): Promise<Result<ChromeTab[], ChromeAPIError>>;
  removeTab(tabId: number): Promise<Result<void, ChromeAPIError>>;
  getAllGroups(): Promise<Result<ChromeTabGroup[], ChromeAPIError>>;

  /**
   * Ungroup tabs (remove them from any tab group)
   *
   * SEAM: SEAM-02 (TabManager ⟿ ChromeTabsAPI)
   *
   * INPUT:
   *   - tabIds: number[] (non-empty, valid Chrome tab IDs)
   *
   * OUTPUT:
   *   - Success: void
   *   - Error: ChromeAPIError
   *
   * ERRORS:
   *   - InvalidTabId: One or more tab IDs are invalid
   *   - ChromeAPIFailure: Unexpected Chrome API error
   *
   * PERFORMANCE: <20ms (95th percentile)
   */
  ungroupTabs(tabIds: number[]): Promise<Result<void, ChromeAPIError>>;
}

export interface ChromeTab {
  id: number;
  url: string;
  title: string;
  pinned: boolean;
  active: boolean;
  groupId: number;
  windowId: number;
  index: number;
}

export interface ChromeTabGroup {
  id: number;
  title?: string;
  color: TabGroupColor;
  collapsed: boolean;
}

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

export interface GroupUpdateProperties {
  title?: string;
  color?: TabGroupColor;
  collapsed?: boolean;
}

export interface TabQueryInfo {
  currentWindow?: boolean;
  active?: boolean;
  pinned?: boolean;
  url?: string | string[];
  title?: string;
  groupId?: number;
}

export type ChromeAPIError =
  | { type: 'InvalidTabId'; details: string; tabId: number }
  | { type: 'InvalidGroupId'; details: string; groupId: number }
  | { type: 'PermissionDenied'; details: string; permission: string }
  | { type: 'ChromeAPIFailure'; details: string; originalError: unknown };

export function isInvalidTabIdError(error: ChromeAPIError): error is Extract<ChromeAPIError, { type: 'InvalidTabId' }> {
  return error.type === 'InvalidTabId';
}

export function isPermissionDeniedError(error: ChromeAPIError): error is Extract<ChromeAPIError, { type: 'PermissionDenied' }> {
  return error.type === 'PermissionDenied';
}
