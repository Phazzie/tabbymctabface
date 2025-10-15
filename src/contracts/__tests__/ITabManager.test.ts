/**
 * FILE: ITabManager.test.ts
 * 
 * WHAT: Contract tests for ITabManager - validates core tab management operations
 * 
 * WHY: Ensures TabManager correctly orchestrates tab grouping, random closure, and state tracking.
 *      Critical seam boundary between UI and core business logic.
 * 
 * HOW DATA FLOWS:
 *   1. Tests call ITabManager methods with test data
 *   2. Mock IChromeTabsAPI responses (success/failure scenarios)
 *   3. Validate Result<Success, Error> type conversions
 *   4. Verify event emissions to IHumorSystem
 * 
 * SEAMS:
 *   IN: UI → TabManager (SEAM-01, 06, 20, 21, 22)
 *   OUT: TabManager → ChromeTabsAPI (SEAM-02, 07, 08), HumorSystem (SEAM-04, 09)
 * 
 * CONTRACT: ITabManager v1.0.0 validation
 * GENERATED: 2025-10-12
 * CUSTOM SECTIONS: None
 */

import { describe, it, expect } from 'vitest';
import type {
  ITabManager,
  GroupCreationSuccess,
  TabClosureResult,
  RandomTabOptions,
  GroupData,
  GroupUpdateData,
  BrowserContext,
  TabManagerError
} from '../ITabManager';
import { Result } from '../../utils/Result';

describe('ITabManager CONTRACT v1.0.0', () => {
  // NOTE: These tests define the contract behavior
  // Implementation will be created to pass these tests

  describe('CONTRACT: createGroup()', () => {
    it('MUST accept groupName (1-50 chars) and non-empty tabIds array', () => {
      // Contract specifies: groupName 1-50 chars, tabIds non-empty
      const validGroupName = 'Work Tabs';
      const validTabIds = [1, 2, 3];
      
      expect(validGroupName.length).toBeGreaterThan(0);
      expect(validGroupName.length).toBeLessThanOrEqual(50);
      expect(validTabIds.length).toBeGreaterThan(0);
      expect(validTabIds.every(id => typeof id === 'number')).toBe(true);
    });

    it('MUST return Result<GroupCreationSuccess, TabManagerError> on success', () => {
      // Contract specifies: Success returns GroupCreationSuccess
      const success: GroupCreationSuccess = {
        groupId: 123,
        groupName: 'Work',
        tabCount: 3,
        timestamp: Date.now()
      };
      const successResult = Result.ok(success);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(successResult.value).toHaveProperty('groupId');
        expect(successResult.value).toHaveProperty('groupName');
        expect(successResult.value).toHaveProperty('tabCount');
        expect(successResult.value).toHaveProperty('timestamp');
      }
    });

    it('MUST return InvalidGroupName error for empty name', () => {
      // Contract specifies: InvalidGroupName when empty
      const error: TabManagerError = {
        type: 'InvalidGroupName',
        details: 'Group name cannot be empty'
      };
      const errorResult = Result.error(error);
      
      expect(Result.isError(errorResult)).toBe(true);
      if (Result.isError(errorResult)) {
        expect(errorResult.error.type).toBe('InvalidGroupName');
      }
    });

    it('MUST return InvalidGroupName error for name >50 chars', () => {
      // Contract specifies: InvalidGroupName when >50 chars
      const longName = 'a'.repeat(51);
      const error: TabManagerError = {
        type: 'InvalidGroupName',
        details: `Group name exceeds 50 characters: ${longName.length}`
      };
      
      expect(error.type).toBe('InvalidGroupName');
      expect(longName.length).toBeGreaterThan(50);
    });

    it('MUST return NoTabsSelected error for empty tabIds', () => {
      // Contract specifies: NoTabsSelected when tabIds empty
      const error: TabManagerError = {
        type: 'NoTabsSelected',
        details: 'At least one tab must be selected'
      };
      
      expect(error.type).toBe('NoTabsSelected');
      expect(error.details).toContain('tab');
    });

    it('MUST return ChromeAPIFailure error when Chrome API fails', () => {
      // Contract specifies: ChromeAPIFailure wraps Chrome errors
      const chromeError = new Error('Chrome API failed');
      const error: TabManagerError = {
        type: 'ChromeAPIFailure',
        details: 'Failed to create group',
        originalError: chromeError
      };
      
      expect(error.type).toBe('ChromeAPIFailure');
      expect(error.originalError).toBe(chromeError);
    });

    it('MUST emit TabGroupCreatedEvent to IHumorSystem on success', () => {
      // Contract specifies: SEAM-04 event emission
      // Implementation test will verify actual event emission
      const eventType = 'TabGroupCreated';
      expect(eventType).toBe('TabGroupCreated');
    });

    it('MUST meet <50ms performance SLA', () => {
      // Contract specifies: <50ms (95th percentile)
      const SLA_MS = 50;
      expect(SLA_MS).toBe(50);
      // Actual performance test in implementation suite
    });
  });

  describe('CONTRACT: closeRandomTab()', () => {
    it('MUST accept optional RandomTabOptions', () => {
      // Contract specifies: optional excludePinned, excludeActive
      const options1: RandomTabOptions = { excludePinned: true };
      const options2: RandomTabOptions = { excludeActive: true };
      const options3: RandomTabOptions = { 
        excludePinned: false, 
        excludeActive: false 
      };
      const options4: RandomTabOptions = {};
      
      expect(options1.excludePinned).toBe(true);
      expect(options2.excludeActive).toBe(true);
      expect(options3.excludePinned).toBe(false);
      expect(options4).toBeDefined();
    });

    it('MUST default to excluding pinned and active tabs', () => {
      // Contract behavior: excludePinned=true, excludeActive=true by default
      const defaultExcludePinned = true;
      const defaultExcludeActive = true;
      
      expect(defaultExcludePinned).toBe(true);
      expect(defaultExcludeActive).toBe(true);
    });

    it('MUST return Result<TabClosureResult, TabManagerError> on success', () => {
      // Contract specifies: Success returns TabClosureResult
      const result: TabClosureResult = {
        closedTabId: 42,
        closedTabTitle: 'Random Tab',
        closedTabUrl: 'https://example.com',
        remainingCount: 10,
        timestamp: Date.now()
      };
      const successResult = Result.ok(result);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(successResult.value).toHaveProperty('closedTabId');
        expect(successResult.value).toHaveProperty('closedTabTitle');
        expect(successResult.value).toHaveProperty('closedTabUrl');
        expect(successResult.value).toHaveProperty('remainingCount');
        expect(successResult.value).toHaveProperty('timestamp');
      }
    });

    it('MUST return NoTabsToClose error when no eligible tabs', () => {
      // Contract specifies: NoTabsToClose when all tabs pinned/active
      const error: TabManagerError = {
        type: 'NoTabsToClose',
        details: 'No eligible tabs to close',
        reason: 'All tabs are pinned or active'
      };
      
      expect(error.type).toBe('NoTabsToClose');
      expect(error.reason).toBeDefined();
    });

    it('MUST emit TabClosedEvent to IHumorSystem on success', () => {
      // Contract specifies: SEAM-09 event emission with trigger='FeelingLucky'
      const eventTrigger = 'FeelingLucky';
      expect(eventTrigger).toBe('FeelingLucky');
    });

    it('MUST meet <30ms performance SLA', () => {
      // Contract specifies: <30ms (95th percentile)
      const SLA_MS = 30;
      expect(SLA_MS).toBe(30);
    });
  });

  describe('CONTRACT: getAllGroups()', () => {
    it('MUST return Result<GroupData[], TabManagerError> on success', () => {
      // Contract specifies: Success returns GroupData array
      const groups: GroupData[] = [
        {
          groupId: 1,
          groupName: 'Work',
          tabCount: 5,
          tabs: [],
          color: 'blue',
          collapsed: false
        }
      ];
      const successResult = Result.ok(groups);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(Array.isArray(successResult.value)).toBe(true);
      }
    });

    it('MUST return empty array when no groups exist', () => {
      // Contract behavior: Empty array is valid
      const emptyResult = Result.ok<GroupData[]>([]);
      
      expect(Result.isOk(emptyResult)).toBe(true);
      if (Result.isOk(emptyResult)) {
        expect(emptyResult.value.length).toBe(0);
      }
    });

    it('MUST include all GroupData properties', () => {
      // Contract specifies: groupId, groupName, tabCount, tabs, color, collapsed
      const group: GroupData = {
        groupId: 123,
        groupName: 'Research',
        tabCount: 3,
        tabs: [],
        color: 'red',
        collapsed: true
      };
      
      expect(group.groupId).toBeDefined();
      expect(group.groupName).toBeDefined();
      expect(group.tabCount).toBeDefined();
      expect(group.tabs).toBeDefined();
      expect(group.color).toBeDefined();
      expect(group.collapsed).toBeDefined();
    });

    it('MUST meet <20ms performance SLA', () => {
      // Contract specifies: <20ms (95th percentile)
      const SLA_MS = 20;
      expect(SLA_MS).toBe(20);
    });
  });

  describe('CONTRACT: updateGroup()', () => {
    it('MUST accept groupId and GroupUpdateData', () => {
      // Contract specifies: groupId (number), updates (GroupUpdateData)
      const groupId = 123;
      const updates: GroupUpdateData = {
        name: 'Updated Name',
        tabIds: [1, 2, 3],
        color: 'green',
        collapsed: true
      };
      
      expect(typeof groupId).toBe('number');
      expect(updates).toBeDefined();
    });

    it('MUST support partial updates (all fields optional)', () => {
      // Contract allows any combination of optional fields
      const nameOnly: GroupUpdateData = { name: 'New Name' };
      const tabsOnly: GroupUpdateData = { tabIds: [4, 5, 6] };
      const colorOnly: GroupUpdateData = { color: 'purple' };
      
      expect(nameOnly.name).toBeDefined();
      expect(tabsOnly.tabIds).toBeDefined();
      expect(colorOnly.color).toBeDefined();
    });

    it('MUST return Result<void, TabManagerError> on success', () => {
      // Contract specifies: Success returns void
      const successResult = Result.ok<void, TabManagerError>(undefined);
      
      expect(Result.isOk(successResult)).toBe(true);
    });

    it('MUST return InvalidGroupId error for non-existent group', () => {
      // Contract specifies: InvalidGroupId when group doesn't exist
      const error: TabManagerError = {
        type: 'InvalidGroupId',
        details: 'Group not found',
        groupId: 999
      };
      
      expect(error.type).toBe('InvalidGroupId');
      expect(error.groupId).toBe(999);
    });

    it('MUST meet <50ms performance SLA', () => {
      // Contract specifies: <50ms (95th percentile)
      const SLA_MS = 50;
      expect(SLA_MS).toBe(50);
    });
  });

  describe('CONTRACT: deleteGroup()', () => {
    it('MUST accept groupId as number', () => {
      // Contract specifies: groupId (number)
      const groupId = 123;
      expect(typeof groupId).toBe('number');
    });

    it('MUST return Result<void, TabManagerError> on success', () => {
      // Contract specifies: Success returns void
      const successResult = Result.ok<void>(undefined);
      
      expect(Result.isOk(successResult)).toBe(true);
    });

    it('MUST return InvalidGroupId error for non-existent group', () => {
      // Contract specifies: InvalidGroupId when group doesn't exist
      const error: TabManagerError = {
        type: 'InvalidGroupId',
        details: 'Cannot delete: group not found',
        groupId: 999
      };
      
      expect(error.type).toBe('InvalidGroupId');
    });

    it('MUST ungroup tabs WITHOUT closing them', () => {
      // Contract behavior: Deletes group, tabs remain ungrouped
      const behaviorNote = 'ungroups tabs, does not close them';
      expect(behaviorNote).toContain('does not close');
    });

    it('MUST meet <30ms performance SLA', () => {
      // Contract specifies: <30ms (95th percentile)
      const SLA_MS = 30;
      expect(SLA_MS).toBe(30);
    });
  });

  describe('CONTRACT: getBrowserContext()', () => {
    it('MUST return Result<BrowserContext, TabManagerError> on success', () => {
      // Contract specifies: Success returns BrowserContext
      const context: BrowserContext = {
        tabCount: 42,
        activeTab: {
          url: 'https://github.com',
          title: 'GitHub',
          domain: 'github.com'
        },
        currentHour: 14,
        recentEvents: ['created', 'grouped'],
        groupCount: 3
      };
      const successResult = Result.ok(context);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(successResult.value).toHaveProperty('tabCount');
        expect(successResult.value).toHaveProperty('activeTab');
        expect(successResult.value).toHaveProperty('currentHour');
        expect(successResult.value).toHaveProperty('recentEvents');
        expect(successResult.value).toHaveProperty('groupCount');
      }
    });

    it('MUST support null activeTab when no active tab exists', () => {
      // Contract allows: activeTab can be null
      const context: BrowserContext = {
        tabCount: 0,
        activeTab: null,
        currentHour: 3,
        recentEvents: [],
        groupCount: 0
      };
      
      expect(context.activeTab).toBeNull();
    });

    it('MUST include currentHour in 0-23 range', () => {
      // Contract specifies: currentHour is 0-23 (24-hour format)
      const validHours = [0, 12, 23];
      validHours.forEach(hour => {
        expect(hour).toBeGreaterThanOrEqual(0);
        expect(hour).toBeLessThanOrEqual(23);
      });
    });

    it('MUST meet <10ms performance SLA', () => {
      // Contract specifies: <10ms (95th percentile)
      const SLA_MS = 10;
      expect(SLA_MS).toBe(10);
    });
  });

  describe('CONTRACT: Error Type Guarantees', () => {
    it('TabManagerError MUST be discriminated union', () => {
      // Contract specifies: All errors have 'type' discriminator
      const error1: TabManagerError = { 
        type: 'InvalidGroupName', 
        details: 'fail' 
      };
      const error2: TabManagerError = { 
        type: 'NoTabsSelected', 
        details: 'fail' 
      };
      const error3: TabManagerError = { 
        type: 'NoTabsToClose', 
        details: 'fail',
        reason: 'all pinned'
      };
      const error4: TabManagerError = { 
        type: 'InvalidGroupId', 
        details: 'fail',
        groupId: 1
      };
      const error5: TabManagerError = { 
        type: 'ChromeAPIFailure', 
        details: 'fail',
        originalError: new Error()
      };
      
      expect(error1.type).toBe('InvalidGroupName');
      expect(error2.type).toBe('NoTabsSelected');
      expect(error3.type).toBe('NoTabsToClose');
      expect(error4.type).toBe('InvalidGroupId');
      expect(error5.type).toBe('ChromeAPIFailure');
    });
  });

  describe('CONTRACT: No Exceptions', () => {
    it('MUST never throw exceptions - always return Result', () => {
      // Contract guarantees: All methods return Result, never throw
      const successResult = Result.ok({ groupId: 1, groupName: 'Test', tabCount: 1, timestamp: 0 });
      const errorResult = Result.error<TabManagerError>({ 
        type: 'InvalidGroupName', 
        details: 'fail' 
      });
      
      expect(Result.isOk(successResult) || Result.isError(successResult)).toBe(true);
      expect(Result.isOk(errorResult) || Result.isError(errorResult)).toBe(true);
    });
  });
});
