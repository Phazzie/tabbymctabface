/**
 * FILE: ChromeTabsAPI.ts
 *
 * WHAT: Real Chrome Tabs API wrapper implementation
 *
 * WHY: Provides actual chrome.tabs.* API calls with Result-type error handling.
 *      Satisfies IChromeTabsAPI contract, enables production tab management.
 *
 * HOW DATA FLOWS:
 *   1. TabManager calls IChromeTabsAPI methods (SEAM-02, 07, 08, 03)
 *   2. This implementation calls chrome.tabs.* APIs directly
 *   3. Chrome API returns result or throws error
 *   4. Errors mapped to Result<T, ChromeAPIError> types
 *   5. TabManager receives typed Result for error handling
 *
 * SEAMS:
 *   IN:  TabManager → ChromeTabsAPI (SEAM-02, 07, 08, 03)
 *   OUT: ChromeTabsAPI → chrome.tabs (external browser API)
 *
 * CONTRACT: IChromeTabsAPI v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
 */

import {
    IChromeTabsAPI,
    ChromeTab,
    ChromeTabGroup,
    GroupUpdateProperties,
    TabQueryInfo,
    ChromeAPIError,
    TabGroupColor
} from '../contracts/IChromeTabsAPI';
import { Result } from '../utils/Result';

/**
 * Real Chrome Tabs API implementation
 *
 * Wraps chrome.tabs.* calls with Result-type error handling.
 * Maps Chrome runtime errors to domain-specific ChromeAPIError types.
 * All methods are async and non-blocking.
 */
export class ChromeTabsAPI implements IChromeTabsAPI {
    /**
     * Create a new tab group
     *
     * DATA IN: tabIds (non-empty array of valid Chrome tab IDs)
     * DATA OUT: Result<number, ChromeAPIError> (groupId on success)
     *
     * SEAM: SEAM-02 (TabManager → ChromeTabsAPI)
     *
     * FLOW:
     *   1. Validate input tabIds array
     *   2. Call chrome.tabs.group() with tabIds
     *   3. Map Chrome errors to ChromeAPIError types
     *   4. Return Result with groupId or error
     *
     * ERRORS:
     *   - InvalidTabId: One or more tab IDs are invalid
     *   - PermissionDenied: Extension lacks tabs permission
     *   - ChromeAPIFailure: Unexpected Chrome API error
     *
     * PERFORMANCE: <20ms (95th percentile)
     */
    async createGroup(tabIds: number[]): Promise<Result<number, ChromeAPIError>> {
        try {
            // Validate input
            if (!tabIds || tabIds.length === 0) {
                return Result.error({
                    type: 'ChromeAPIFailure',
                    details: 'tabIds array cannot be empty',
                    originalError: new Error('Empty tabIds array')
                });
            }

            // Call Chrome API
            const groupId = await chrome.tabs.group({ tabIds });

            return Result.ok(groupId);
        } catch (error) {
            return this.mapChromeError(error, 'createGroup');
        }
    }

    /**
     * Update tab group properties
     *
     * DATA IN: groupId (valid Chrome group ID), properties (update object)
     * DATA OUT: Result<void, ChromeAPIError>
     *
     * SEAM: SEAM-03 (TabManager → ChromeTabsAPI)
     *
     * FLOW:
     *   1. Validate groupId is positive number
     *   2. Call chrome.tabGroups.update() with properties
     *   3. Map Chrome errors to ChromeAPIError types
     *   4. Return Result success or error
     *
     * ERRORS:
     *   - InvalidGroupId: Group ID doesn't exist
     *   - PermissionDenied: Extension lacks tabs permission
     *   - ChromeAPIFailure: Unexpected Chrome API error
     *
     * PERFORMANCE: <20ms (95th percentile)
     */
    async updateGroup(
        groupId: number,
        properties: GroupUpdateProperties
    ): Promise<Result<void, ChromeAPIError>> {
        try {
            // Validate input
            if (!groupId || groupId <= 0) {
                return Result.error({
                    type: 'InvalidGroupId',
                    details: 'groupId must be a positive number',
                    groupId
                });
            }

            // Call Chrome API
            await chrome.tabGroups.update(groupId, properties);

            return Result.ok(undefined);
        } catch (error) {
            return this.mapChromeError(error, 'updateGroup', { groupId });
        }
    }

    /**
     * Query tabs matching criteria
     *
     * DATA IN: queryInfo (TabQueryInfo object with search criteria)
     * DATA OUT: Result<ChromeTab[], ChromeAPIError>
     *
     * SEAM: SEAM-07 (TabManager → ChromeTabsAPI)
     *
     * FLOW:
     *   1. Call chrome.tabs.query() with queryInfo
     *   2. Map Chrome Tab objects to ChromeTab interface
     *   3. Map Chrome errors to ChromeAPIError types
     *   4. Return Result with tab array or error
     *
     * ERRORS:
     *   - PermissionDenied: Extension lacks tabs permission
     *   - ChromeAPIFailure: Unexpected Chrome API error
     *
     * PERFORMANCE: <30ms (95th percentile, may query many tabs)
     */
    async queryTabs(queryInfo: TabQueryInfo): Promise<Result<ChromeTab[], ChromeAPIError>> {
        try {
            // Call Chrome API
            const chromeTabs = await chrome.tabs.query(queryInfo);

            // Map to our interface
            const tabs: ChromeTab[] = chromeTabs.map(tab => ({
                id: tab.id!,
                url: tab.url || '',
                title: tab.title || '',
                pinned: tab.pinned || false,
                active: tab.active || false,
                groupId: tab.groupId || -1,
                windowId: tab.windowId,
                index: tab.index
            }));

            return Result.ok(tabs);
        } catch (error) {
            return this.mapChromeError(error, 'queryTabs');
        }
    }

    /**
     * Remove (close) a tab
     *
     * DATA IN: tabId (valid Chrome tab ID)
     * DATA OUT: Result<void, ChromeAPIError>
     *
     * SEAM: SEAM-08 (TabManager → ChromeTabsAPI)
     *
     * FLOW:
     *   1. Validate tabId is positive number
     *   2. Call chrome.tabs.remove() with tabId
     *   3. Map Chrome errors to ChromeAPIError types
     *   4. Return Result success or error
     *
     * ERRORS:
     *   - InvalidTabId: Tab ID doesn't exist
     *   - PermissionDenied: Extension lacks tabs permission
     *   - ChromeAPIFailure: Unexpected Chrome API error
     *
     * PERFORMANCE: <20ms (95th percentile)
     */
    async removeTab(tabId: number): Promise<Result<void, ChromeAPIError>> {
        try {
            // Validate input
            if (!tabId || tabId <= 0) {
                return Result.error({
                    type: 'InvalidTabId',
                    details: 'tabId must be a positive number',
                    tabId
                });
            }

            // Call Chrome API
            await chrome.tabs.remove(tabId);

            return Result.ok(undefined);
        } catch (error) {
            return this.mapChromeError(error, 'removeTab', { tabId });
        }
    }

    /**
     * Get all tab groups in current window
     *
     * DATA IN: void
     * DATA OUT: Result<ChromeTabGroup[], ChromeAPIError>
     *
     * FLOW:
     *   1. Call chrome.tabGroups.query() for current window
     *   2. Map Chrome TabGroup objects to ChromeTabGroup interface
     *   3. Map Chrome errors to ChromeAPIError types
     *   4. Return Result with group array or error
     *
     * PERFORMANCE: <20ms (95th percentile)
     */
    async getAllGroups(): Promise<Result<ChromeTabGroup[], ChromeAPIError>> {
        try {
            // Call Chrome API
            const chromeGroups = await chrome.tabGroups.query({});

            // Map to our interface
            const groups: ChromeTabGroup[] = chromeGroups.map(group => ({
                id: group.id,
                title: group.title,
                color: group.color as TabGroupColor,
                collapsed: group.collapsed
            }));

            return Result.ok(groups);
        } catch (error) {
            return this.mapChromeError(error, 'getAllGroups');
        }
    }

    /**
     * Map Chrome runtime errors to domain-specific ChromeAPIError types
     */
    private mapChromeError(
        error: unknown,
        operation: string,
        context?: { tabId?: number; groupId?: number }
    ): Result<never, ChromeAPIError> {
        const chromeError = chrome.runtime.lastError || error;

        if (!chromeError) {
            return Result.error({
                type: 'ChromeAPIFailure',
                details: `Unknown error in ${operation}`,
                originalError: error
            });
        }

        const errorMessage = chromeError instanceof Error ? chromeError.message : String(chromeError);

        // Map tab not found errors
        if (errorMessage.includes('No tab with id') || errorMessage.includes('Tab does not exist')) {
            return Result.error({
                type: 'InvalidTabId',
                details: `Tab does not exist`,
                tabId: context?.tabId || -1
            });
        }

        // Map group not found errors
        if (errorMessage.includes('No group with id') || errorMessage.includes('Group does not exist')) {
            return Result.error({
                type: 'InvalidGroupId',
                details: `Group does not exist`,
                groupId: context?.groupId || -1
            });
        }

        // Map permission errors
        if (errorMessage.includes('permission') || errorMessage.includes('Permission denied')) {
            return Result.error({
                type: 'PermissionDenied',
                details: `Missing tabs permission`,
                permission: 'tabs'
            });
        }

        // Default Chrome API failure
        return Result.error({
            type: 'ChromeAPIFailure',
            details: `Chrome API error in ${operation}`,
            originalError: chromeError
        });
    } private _getChromeError(error: unknown): unknown {
        return chrome.runtime.lastError || error;
    }

    private _getErrorMessage(chromeError: unknown): string {
        return chromeError instanceof Error ? chromeError.message : String(chromeError);
    }

    private _mapSpecificError(
        errorMessage: string,
        context?: { tabId?: number; groupId?: number }
    ): Result<never, ChromeAPIError> | null {
        if (this.isTabNotFoundError(errorMessage)) {
            return Result.error({
                type: 'InvalidTabId',
                details: `Tab does not exist: ${errorMessage}`,
                tabId: context?.tabId || -1
            });
        }

        if (this.isGroupNotFoundError(errorMessage)) {
            return Result.error({
                type: 'InvalidGroupId',
                details: `Group does not exist: ${errorMessage}`,
                groupId: context?.groupId || -1
            });
        }

        if (this.isPermissionError(errorMessage)) {
            return Result.error({
                type: 'PermissionDenied',
                details: `Missing tabs permission: ${errorMessage}`,
                permission: 'tabs'
            });
        }

        return null;
    }

    private isTabNotFoundError(message: string): boolean {
        return message.includes('No tab with id') || message.includes('Tab does not exist');
    }

    private isGroupNotFoundError(message: string): boolean {
        return message.includes('No group with id') || message.includes('Group does not exist');
    }

    private isPermissionError(message: string): boolean {
        return message.includes('permission') || message.includes('Permission denied');
    }

    private _createGenericError(error: unknown, operation: string): Result<never, ChromeAPIError> {
        return Result.error({
            type: 'ChromeAPIFailure',
            details: `Unknown error in ${operation}`,
            originalError: error
        });
    }

    private _createChromeAPIFailure(
        errorMessage: string,
        operation: string,
        originalError: unknown
    ): Result<never, ChromeAPIError> {
        return Result.error({
            type: 'ChromeAPIFailure',
            details: `Chrome API error in ${operation}: ${errorMessage}`,
            originalError
        });
    }
}