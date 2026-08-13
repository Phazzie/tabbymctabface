/**
 * FILE: ChromeTabsAPI.ts
 *
 * WHAT: Real Chrome Tabs API wrapper implementation
 *
 * WHY: Provides actual chrome.tabs.* API calls with Result-type error handling.
 *      Satisfies IChromeTabsAPI contract, enables production tab management.
 *
 * CONTRACT: IChromeTabsAPI v1.1.0
 * GENERATED: 2025-10-13
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

export class ChromeTabsAPI implements IChromeTabsAPI {
    /**
     * Create a new group or move tabs into an existing group.
     * DATA IN: non-empty tabIds; optional existingGroupId must be a non-negative integer.
     * DATA OUT: Result<number, ChromeAPIError> containing Chrome's group ID.
     * SEAM: SEAM-20 (TabManager → ChromeTabsAPI).
     * FLOW: Validate, call chrome.tabs.group, map rejection, return Result.
     * ERRORS: InvalidGroupId, InvalidTabId, PermissionDenied, ChromeAPIFailure.
     * PERFORMANCE: Browser-I/O-bound; wrapper overhead <5ms excluding Chrome latency.
     */
    async createGroup(tabIds: number[], existingGroupId?: number): Promise<Result<number, ChromeAPIError>> {
        try {
            if (!tabIds || tabIds.length === 0) {
                return Result.error({ type: 'ChromeAPIFailure', details: 'tabIds array cannot be empty', originalError: new Error('Empty tabIds array') });
            }
            if (existingGroupId !== undefined && (!Number.isSafeInteger(existingGroupId) || existingGroupId < 0)) {
                return Result.error({ type: 'InvalidGroupId', details: 'groupId must be a non-negative integer', groupId: existingGroupId });
            }
            const chromeTabIds = tabIds as [number, ...number[]];
            const groupId: number = await chrome.tabs.group(
                existingGroupId === undefined ? { tabIds: chromeTabIds } : { tabIds: chromeTabIds, groupId: existingGroupId }
            );
            return Result.ok(groupId);
        } catch (error) {
            return this.mapChromeError(error, 'createGroup');
        }
    }

    async updateGroup(groupId: number, properties: GroupUpdateProperties): Promise<Result<void, ChromeAPIError>> {
        try {
            if (!Number.isSafeInteger(groupId) || groupId < 0) {
                return Result.error({ type: 'InvalidGroupId', details: 'groupId must be a non-negative integer', groupId });
            }
            await chrome.tabGroups.update(groupId, properties);
            return Result.ok(undefined);
        } catch (error) {
            return this.mapChromeError(error, 'updateGroup', { groupId });
        }
    }

    async queryTabs(queryInfo: TabQueryInfo): Promise<Result<ChromeTab[], ChromeAPIError>> {
        try {
            const chromeTabs = await chrome.tabs.query(queryInfo);
            const tabs: ChromeTab[] = chromeTabs.map(tab => ({
                id: tab.id!,
                url: tab.url || '',
                title: tab.title || '',
                pinned: tab.pinned || false,
                active: tab.active || false,
                groupId: tab.groupId ?? -1,
                windowId: tab.windowId,
                index: tab.index
            }));
            return Result.ok(tabs);
        } catch (error) {
            return this.mapChromeError(error, 'queryTabs');
        }
    }

    async removeTab(tabId: number): Promise<Result<void, ChromeAPIError>> {
        try {
            if (!Number.isSafeInteger(tabId) || tabId <= 0) {
                return Result.error({ type: 'InvalidTabId', details: 'tabId must be a positive number', tabId });
            }
            await chrome.tabs.remove(tabId);
            return Result.ok(undefined);
        } catch (error) {
            return this.mapChromeError(error, 'removeTab', { tabId });
        }
    }

    async getAllGroups(): Promise<Result<ChromeTabGroup[], ChromeAPIError>> {
        try {
            const chromeGroups = await chrome.tabGroups.query({});
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
     * Ungroup tabs by removing them from any tab group
     *
     * DATA IN: tabIds (non-empty array of valid Chrome tab IDs)
     * DATA OUT: Result<void, ChromeAPIError>
     *
     * FLOW:
     *    1. Validate input tabIds array is non-empty
     *    2. Call chrome.tabs.ungroup() with tabIds
     *    3. Map Chrome errors to ChromeAPIError types
     *    4. Return Result success or error
     *
     * PERFORMANCE: <20ms (95th percentile)
     */
    async ungroupTabs(tabIds: number[]): Promise<Result<void, ChromeAPIError>> {
        try {
            if (!tabIds || tabIds.length === 0) {
                return Result.error({ type: 'ChromeAPIFailure', details: 'tabIds array cannot be empty', originalError: new Error('Empty tabIds array') });
            }
            await chrome.tabs.ungroup(tabIds as [number, ...number[]]);
            return Result.ok(undefined);
        } catch (error) {
            return this.mapChromeError(error, 'ungroupTabs');
        }
    }

    private mapChromeError(error: unknown, operation: string, context?: { tabId?: number; groupId?: number }): Result<never, ChromeAPIError> {
        const chromeError = error ?? chrome.runtime?.lastError;
        if (!chromeError) {
            return Result.error({ type: 'ChromeAPIFailure', details: `Unknown error in ${operation}`, originalError: error });
        }
        const errorMessage = chromeError instanceof Error ? chromeError.message : String(chromeError);
        if (errorMessage.includes('No tab with id') || errorMessage.includes('Tab does not exist')) {
            return Result.error({ type: 'InvalidTabId', details: `Tab does not exist`, tabId: context?.tabId ?? -1 });
        }
        if (errorMessage.includes('No group with id') || errorMessage.includes('Group does not exist')) {
            return Result.error({ type: 'InvalidGroupId', details: `Group does not exist`, groupId: context?.groupId ?? -1 });
        }
        if (errorMessage.includes('permission') || errorMessage.includes('Permission denied')) {
            return Result.error({ type: 'PermissionDenied', details: `Missing tabs permission`, permission: 'tabs' });
        }
        return Result.error({ type: 'ChromeAPIFailure', details: `Chrome API error in ${operation}`, originalError: chromeError });
    }

}
