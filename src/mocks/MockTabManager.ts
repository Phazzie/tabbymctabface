/**
 * FILE: MockTabManager.ts
 * 
 * WHAT: Mock implementation of ITabManager - simulates tab management operations
 * 
 * WHY: Enables development and testing of UI and HumorSystem without real Chrome APIs.
 *      Proves ITabManager contract is implementable. Provides test double.
 * 
 * HOW DATA FLOWS:
 *   1. UI calls ITabManager methods (SEAM-01, SEAM-06, SEAM-20)
 *   2. Mock simulates tab operations
 *   3. Mock returns fake results
 *   4. Mock MAY emit events to HumorSystem
 * 
 * SEAMS:
 *   IN:  UI → TabManager (SEAM-01, SEAM-06, SEAM-20, SEAM-21, SEAM-22)
 *   OUT: None (mock terminates seams with fake data)
 * 
 * CONTRACT: ITabManager v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import type {
    ITabManager,
    GroupCreationSuccess,
    TabClosureResult,
    RandomTabOptions,
    GroupData,
    GroupUpdateData,
    BrowserContext,
    TabManagerError,
} from '../contracts/ITabManager';
import type { ChromeTab, ChromeTabGroup } from '../contracts/IChromeTabsAPI';

/**
 * Mock implementation of ITabManager
 * 
 * Provides fake tab management for testing and development.
 * Simulates Chrome tab operations without browser dependency.
 * 
 * MOCK BEHAVIOR:
 * - Maintains in-memory tab/group state
 * - Auto-increments IDs
 * - Validates inputs per contract
 * - Can be configured to return errors
 * - Tracks call history
 */
export class MockTabManager implements ITabManager {
    private mockTabs: ChromeTab[] = [];
    private mockGroups: Map<number, ChromeTabGroup> = new Map();
    private _nextTabId = 100;
    private nextGroupId = 1;
    private callHistory: MockCallRecord[] = [];
    private shouldReturnError = false;
    private recentEvents: string[] = [];

    constructor() {
        // Seed with default fake tabs
        this.seedDefaultTabs();
    }

    /**
     * Create a new tab group
     * 
     * DATA IN: groupName: string (1-50 chars), tabIds: number[]
     * DATA OUT: Result<GroupCreationSuccess, TabManagerError>
     * 
     * SEAM: SEAM-01 (UI → TabManager)
     * 
     * FLOW:
     *   1. Validate groupName (1-50 chars)
     *   2. Validate tabIds (non-empty)
     *   3. Check if configured to return error
     *   4. Create mock group
     *   5. Update tabs to belong to group
     *   6. Track event
     *   7. Return success
     * 
     * ERRORS:
     *   - InvalidGroupName: Name empty or >50 chars
     *   - NoTabsSelected: Empty tabIds array
     * 
     * PERFORMANCE: <10ms (mock, in-memory)
     */
    async createGroup(
        groupName: string,
        tabIds: number[]
    ): Promise<Result<GroupCreationSuccess, TabManagerError>> {
        this.callHistory.push({
            method: 'createGroup',
            args: [groupName, tabIds],
            timestamp: Date.now(),
        });

        // Validate groupName
        if (!groupName || groupName.trim().length === 0) {
            return Result.error({
                type: 'InvalidGroupName',
                details: 'Group name cannot be empty',
            });
        }

        if (groupName.length > 50) {
            return Result.error({
                type: 'InvalidGroupName',
                details: 'Group name exceeds 50 characters',
            });
        }

        // Validate tabIds
        if (!tabIds || tabIds.length === 0) {
            return Result.error({
                type: 'NoTabsSelected',
                details: 'At least one tab must be selected',
            });
        }

        // Simulate error if configured
        if (this.shouldReturnError) {
            return Result.error({
                type: 'ChromeAPIFailure',
                details: 'Mock configured to return error',
                originalError: new Error('Mock error'),
            });
        }

        // Create mock group
        const groupId = this.nextGroupId++;
        this.mockGroups.push({
            id: groupId,
            title: groupName,
            color: 'grey',
            collapsed: false,
        });

        // Update tabs
        tabIds.forEach(tabId => {
            const tab = this.mockTabs.find(t => t.id === tabId);
            if (tab) tab.groupId = groupId;
        });

        // Track event
        this.recentEvents.push('TabGroupCreated');
        if (this.recentEvents.length > 10) this.recentEvents.shift();

        return Result.ok({
            groupId,
            groupName,
            tabCount: tabIds.length,
            timestamp: Date.now(),
        });
    }

    /**
     * Close a random tab
     * 
     * DATA IN: options?: RandomTabOptions
     * DATA OUT: Result<TabClosureResult, TabManagerError>
     * 
     * SEAM: SEAM-06 (UI → TabManager)
     * 
     * FLOW:
     *   1. Filter eligible tabs (exclude pinned/active)
     *   2. Check if any tabs available
     *   3. Select random tab
     *   4. Remove from mockTabs
     *   5. Track event
     *   6. Return closure result
     * 
     * ERRORS:
     *   - NoTabsToClose: No eligible tabs
     * 
     * PERFORMANCE: <10ms (mock, in-memory)
     */
    async closeRandomTab(
        options?: RandomTabOptions
    ): Promise<Result<TabClosureResult, TabManagerError>> {
        this.callHistory.push({
            method: 'closeRandomTab',
            args: [options],
            timestamp: Date.now(),
        });

        const excludePinned = options?.excludePinned ?? true;
        const excludeActive = options?.excludeActive ?? true;

        // Filter eligible tabs
        let eligible = [...this.mockTabs];
        if (excludePinned) {
            eligible = eligible.filter(tab => !tab.pinned);
        }
        if (excludeActive) {
            eligible = eligible.filter(tab => !tab.active);
        }

        // Check if any tabs available
        if (eligible.length === 0) {
            return Result.error({
                type: 'NoTabsToClose',
                details: 'No eligible tabs to close',
                reason: 'All tabs are pinned or active',
            });
        }

        // Simulate error if configured
        if (this.shouldReturnError) {
            return Result.error({
                type: 'ChromeAPIFailure',
                details: 'Mock configured to return error',
                originalError: new Error('Mock error'),
            });
        }

        // Select random tab
        const randomIndex = Math.floor(Math.random() * eligible.length);
        const tabToClose = eligible[randomIndex];

        // Remove from mockTabs
        this.mockTabs = this.mockTabs.filter(t => t.id !== tabToClose.id);

        // Track event
        this.recentEvents.push('TabClosed');
        if (this.recentEvents.length > 10) this.recentEvents.shift();

        return Result.ok({
            closedTabId: tabToClose.id,
            closedTabTitle: tabToClose.title,
            closedTabUrl: tabToClose.url,
            remainingCount: this.mockTabs.length,
            timestamp: Date.now(),
        });
    }

    /**
     * Get all tab groups
     * 
     * DATA IN: void
     * DATA OUT: Result<GroupData[], TabManagerError>
     * 
     * SEAM: SEAM-20 (PopupUI → TabManager)
     * 
     * FLOW:
     *   1. Iterate through mockGroups
     *   2. For each group, find associated tabs
     *   3. Build GroupData objects
     *   4. Return array
     * 
     * PERFORMANCE: <10ms (mock, in-memory)
     */
    async getAllGroups(): Promise<Result<GroupData[], TabManagerError>> {
        this.callHistory.push({
            method: 'getAllGroups',
            args: [],
            timestamp: Date.now(),
        });

        // Simulate error if configured
        if (this.shouldReturnError) {
            return Result.error({
                type: 'ChromeAPIFailure',
                details: 'Mock configured to return error',
                originalError: new Error('Mock error'),
            });
        }

        const groupData: GroupData[] = this.mockGroups.map(group => {
            const groupTabs = this.mockTabs.filter(tab => tab.groupId === group.id);
            return {
                groupId: group.id,
                groupName: group.title || 'Unnamed Group',
                tabCount: groupTabs.length,
                tabs: groupTabs,
                color: group.color,
                collapsed: group.collapsed,
            };
        });

        return Result.ok(groupData);
    }

    /**
     * Update existing tab group
     * 
     * DATA IN: groupId: number, updates: GroupUpdateData
     * DATA OUT: Result<void, TabManagerError>
     * 
     * SEAM: SEAM-21 (PopupUI → TabManager)
     * 
     * FLOW:
     *   1. Find group by groupId
     *   2. Validate updates
     *   3. Apply updates
     *   4. Return success
     * 
     * ERRORS:
     *   - InvalidGroupId: Group doesn't exist
     *   - InvalidGroupName: Name validation failed
     * 
     * PERFORMANCE: <10ms (mock, in-memory)
     */
    async updateGroup(
        groupId: number,
        updates: GroupUpdateData
    ): Promise<Result<void, TabManagerError>> {
        this.callHistory.push({
            method: 'updateGroup',
            args: [groupId, updates],
            timestamp: Date.now(),
        });

        const group = this.mockGroups.find(g => g.id === groupId);
        if (!group) {
            return Result.error({
                type: 'InvalidGroupId',
                details: `Group ID ${groupId} does not exist`,
                groupId,
            });
        }

        // Validate name if provided
        if (updates.name !== undefined) {
            if (updates.name.length === 0 || updates.name.length > 50) {
                return Result.error({
                    type: 'InvalidGroupName',
                    details: 'Group name must be 1-50 characters',
                });
            }
            group.title = updates.name;
        }

        // Update color
        if (updates.color !== undefined) {
            group.color = updates.color as any;
        }

        // Update collapsed
        if (updates.collapsed !== undefined) {
            group.collapsed = updates.collapsed;
        }

        // Update tabIds
        if (updates.tabIds !== undefined) {
            // First, ungroup all tabs in this group
            this.mockTabs.forEach(tab => {
                if (tab.groupId === groupId) tab.groupId = -1;
            });
            // Then, add new tabs to group
            updates.tabIds.forEach(tabId => {
                const tab = this.mockTabs.find(t => t.id === tabId);
                if (tab) tab.groupId = groupId;
            });
        }

        return Result.ok(undefined);
    }

    /**
     * Delete a tab group
     * 
     * DATA IN: groupId: number
     * DATA OUT: Result<void, TabManagerError>
     * 
     * SEAM: SEAM-22 (PopupUI → TabManager)
     * 
     * FLOW:
     *   1. Find group by groupId
     *   2. Ungroup all tabs
     *   3. Remove group
     *   4. Return success
     * 
     * ERRORS:
     *   - InvalidGroupId: Group doesn't exist
     * 
     * PERFORMANCE: <10ms (mock, in-memory)
     */
    async deleteGroup(groupId: number): Promise<Result<void, TabManagerError>> {
        this.callHistory.push({
            method: 'deleteGroup',
            args: [groupId],
            timestamp: Date.now(),
        });

        const groupIndex = this.mockGroups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) {
            return Result.error({
                type: 'InvalidGroupId',
                details: `Group ID ${groupId} does not exist`,
                groupId,
            });
        }

        // Ungroup all tabs
        this.mockTabs.forEach(tab => {
            if (tab.groupId === groupId) tab.groupId = -1;
        });

        // Remove group
        this.mockGroups.splice(groupIndex, 1);

        return Result.ok(undefined);
    }

    /**
     * Get current browser context
     * 
     * DATA IN: void
     * DATA OUT: Result<BrowserContext, TabManagerError>
     * 
     * SEAM: SEAM-19 (HumorSystem → TabManager)
     * 
     * FLOW:
     *   1. Find active tab
     *   2. Get current hour
     *   3. Build BrowserContext
     *   4. Return context
     * 
     * PERFORMANCE: <5ms (mock, in-memory)
     */
    async getBrowserContext(): Promise<Result<BrowserContext, TabManagerError>> {
        this.callHistory.push({
            method: 'getBrowserContext',
            args: [],
            timestamp: Date.now(),
        });

        const activeTab = this.mockTabs.find(tab => tab.active);
        const currentHour = new Date().getHours();

        const context: BrowserContext = {
            tabCount: this.mockTabs.length,
            activeTab: activeTab ? {
                url: activeTab.url,
                title: activeTab.title,
                domain: new URL(activeTab.url).hostname,
            } : null,
            currentHour,
            recentEvents: [...this.recentEvents],
            groupCount: this.mockGroups.length,
        };

        return Result.ok(context);
    }

    // ========================================
    // MOCK HELPER METHODS
    // ========================================

    /**
     * Configure mock to return errors
     */
    setShouldReturnError(value: boolean): void {
        this.shouldReturnError = value;
    }

    /**
     * Seed mock with custom tabs
     */
    seedTabs(tabs: ChromeTab[]): void {
        this.mockTabs = [...tabs];
    }

    /**
     * Seed mock with custom groups
     */
    seedGroups(groups: ChromeTabGroup[]): void {
        this.mockGroups = [...groups];
    }

    /**
     * Get current mock tabs
     */
    getMockTabs(): ChromeTab[] {
        return [...this.mockTabs];
    }

    /**
     * Get current mock groups
     */
    getMockGroups(): ChromeTabGroup[] {
        return [...this.mockGroups];
    }

    /**
     * Reset mock to initial state
     */
    reset(): void {
        this.callHistory = [];
        this.shouldReturnError = false;
        this.mockTabs = [];
        this.mockGroups = [];
        this.nextGroupId = 1;
        this.nextTabId = 100;
        this.recentEvents = [];
        this.seedDefaultTabs();
    }

    /**
     * Get call history for test assertions
     */
    getCallHistory(): MockCallRecord[] {
        return [...this.callHistory];
    }

    /**
     * Seed default fake tabs
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
        ];
    }
}

/**
 * Record of mock method calls
 */
export interface MockCallRecord {
    method: string;
    args: any[];
    timestamp: number;
}
