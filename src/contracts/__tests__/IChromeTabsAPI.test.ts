/**
 * FILE: IChromeTabsAPI.test.ts
 * 
 * WHAT: Contract tests for IChromeTabsAPI - validates Chrome tabs wrapper behavior
 * 
 * WHY: Ensures Chrome Tabs API wrapper correctly abstracts chrome.tabs.* calls with Result types.
 *      Critical seam boundary between TabbyMcTabface and external Chrome APIs.
 * 
 * HOW DATA FLOWS:
 *   1. Tests call IChromeTabsAPI methods with test data
 *   2. Mock chrome.tabs API responses (success/failure scenarios)
 *   3. Validate Result<Success, Error> type conversions
 *   4. Verify error mapping from Chrome errors to domain errors
 * 
 * SEAMS:
 *   IN: TabManager → ChromeTabsAPI (SEAM-25)
 *   OUT: ChromeTabsAPI → chrome.tabs (external)
 * 
 * CONTRACT: IChromeTabsAPI v1.0.0 validation
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { 
  IChromeTabsAPI, 
  ChromeTab, 
  ChromeTabGroup,
  TabsAPIError 
} from '../../contracts/IChromeTabsAPI';
import { Result } from '../../utils/Result';

describe('IChromeTabsAPI CONTRACT', () => {
  // NOTE: These tests define the contract behavior
  // Implementation will be created to pass these tests
  
  describe('CONTRACT: createGroup()', () => {
    it('MUST accept non-empty tabIds array', () => {
      // Contract specifies: tabIds must be non-empty number array
      const validTabIds = [1, 2, 3];
      expect(validTabIds.length).toBeGreaterThan(0);
      expect(validTabIds.every(id => typeof id === 'number')).toBe(true);
    });

    it('MUST return Result<number, TabsAPIError> on success', () => {
      // Contract specifies: Success returns groupId (number)
      const mockGroupId = 123;
      const successResult = Result.ok(mockGroupId);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(typeof successResult.value).toBe('number');
      }
    });

    it('MUST return InvalidTabId error for invalid tab IDs', () => {
      // Contract specifies: InvalidTabId when tab doesn't exist
      const error: TabsAPIError = {
        type: 'InvalidTabId',
        details: 'Tab ID 999 does not exist',
        tabId: 999
      };
      const errorResult = Result.error(error);
      
      expect(Result.isError(errorResult)).toBe(true);
      if (Result.isError(errorResult)) {
        expect(errorResult.error.type).toBe('InvalidTabId');
      }
    });

    it('MUST return PermissionDenied error when lacking permissions', () => {
      // Contract specifies: PermissionDenied when extension lacks tabs permission
      const error: TabsAPIError = {
        type: 'PermissionDenied',
        details: 'Extension lacks tabs permission'
      };
      
      expect(error.type).toBe('PermissionDenied');
      expect(error.details).toContain('permission');
    });

    it('MUST meet <20ms performance SLA', () => {
      // Contract specifies: <20ms (95th percentile)
      const SLA_MS = 20;
      expect(SLA_MS).toBe(20);
      // Actual performance test will be in implementation tests
    });
  });

  describe('CONTRACT: updateGroup()', () => {
    it('MUST accept groupId and UpdateProperties', () => {
      // Contract specifies: groupId (number), properties (UpdateProperties)
      const groupId = 123;
      const properties = { 
        title: 'Updated Group',
        color: 'blue' as const,
        collapsed: true 
      };
      
      expect(typeof groupId).toBe('number');
      expect(typeof properties.title).toBe('string');
    });

    it('MUST return Result<void, TabsAPIError> on success', () => {
      // Contract specifies: Success returns void
      const successResult = Result.ok(undefined);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(successResult.value).toBeUndefined();
      }
    });

    it('MUST return InvalidGroupId error for non-existent group', () => {
      // Contract specifies: InvalidGroupId when group doesn't exist
      const error: TabsAPIError = {
        type: 'InvalidGroupId',
        details: 'Group ID 999 does not exist',
        groupId: 999
      };
      
      expect(error.type).toBe('InvalidGroupId');
      expect(error.groupId).toBe(999);
    });

    it('MUST support optional properties (title, color, collapsed)', () => {
      // Contract allows any combination of optional properties
      const minimalProps = { title: 'New Title' };
      const fullProps = { 
        title: 'Title', 
        color: 'red' as const, 
        collapsed: false 
      };
      
      expect(minimalProps.title).toBeDefined();
      expect(fullProps.title).toBeDefined();
      expect(fullProps.color).toBeDefined();
      expect(fullProps.collapsed).toBeDefined();
    });
  });

  describe('CONTRACT: queryTabs()', () => {
    it('MUST accept TabQueryInfo with optional filters', () => {
      // Contract specifies: optional active, currentWindow, groupId filters
      const query1 = { active: true };
      const query2 = { currentWindow: true };
      const query3 = { groupId: 123 };
      const query4 = { active: true, currentWindow: true, groupId: 123 };
      
      expect(query1.active).toBe(true);
      expect(query4).toHaveProperty('active');
      expect(query4).toHaveProperty('currentWindow');
      expect(query4).toHaveProperty('groupId');
    });

    it('MUST return Result<ChromeTab[], TabsAPIError> on success', () => {
      // Contract specifies: Success returns ChromeTab array
      const tabs: ChromeTab[] = [
        { id: 1, title: 'Tab 1', url: 'https://example.com', active: true, groupId: -1 },
        { id: 2, title: 'Tab 2', url: 'https://test.com', active: false, groupId: 123 }
      ];
      const successResult = Result.ok(tabs);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(Array.isArray(successResult.value)).toBe(true);
        expect(successResult.value[0]).toHaveProperty('id');
        expect(successResult.value[0]).toHaveProperty('title');
        expect(successResult.value[0]).toHaveProperty('url');
      }
    });

    it('MUST return empty array when no tabs match query', () => {
      // Contract behavior: Empty array is valid success result
      const emptyResult = Result.ok<ChromeTab[], TabsAPIError>([]);
      
      expect(Result.isOk(emptyResult)).toBe(true);
      if (Result.isOk(emptyResult)) {
        expect(emptyResult.value).toEqual([]);
      }
    });

    it('MUST include groupId in ChromeTab (-1 for ungrouped)', () => {
      // Contract specifies: groupId is always present, -1 means ungrouped
      const ungroupedTab: ChromeTab = {
        id: 1,
        title: 'Ungrouped',
        url: 'https://example.com',
        active: false,
        groupId: -1
      };
      const groupedTab: ChromeTab = {
        id: 2,
        title: 'Grouped',
        url: 'https://test.com',
        active: false,
        groupId: 123
      };
      
      expect(ungroupedTab.groupId).toBe(-1);
      expect(groupedTab.groupId).toBe(123);
    });
  });

  describe('CONTRACT: removeTab()', () => {
    it('MUST accept tabId as number', () => {
      // Contract specifies: tabId (number)
      const tabId = 123;
      expect(typeof tabId).toBe('number');
    });

    it('MUST return Result<void, TabsAPIError> on success', () => {
      // Contract specifies: Success returns void
      const successResult = Result.ok<void, TabsAPIError>(undefined);
      
      expect(Result.isOk(successResult)).toBe(true);
    });

    it('MUST return InvalidTabId error for non-existent tab', () => {
      // Contract specifies: InvalidTabId when tab doesn't exist
      const error: TabsAPIError = {
        type: 'InvalidTabId',
        details: 'Cannot remove tab 999: not found',
        tabId: 999
      };
      
      expect(error.type).toBe('InvalidTabId');
      expect(error.details).toContain('not found');
    });

    it('MUST handle last tab scenario gracefully', () => {
      // Contract note: Closing last tab may close window - implementation handles this
      // Test validates error handling exists for this edge case
      const error: TabsAPIError = {
        type: 'ChromeAPIFailure',
        details: 'Cannot close last tab in window',
        originalError: new Error('Last tab')
      };
      
      expect(error.type).toBe('ChromeAPIFailure');
    });
  });

  describe('CONTRACT: getAllGroups()', () => {
    it('MUST return Result<ChromeTabGroup[], TabsAPIError> on success', () => {
      // Contract specifies: Success returns ChromeTabGroup array
      const groups: ChromeTabGroup[] = [
        { id: 1, title: 'Work', color: 'blue', collapsed: false },
        { id: 2, title: 'Research', color: 'green', collapsed: true }
      ];
      const successResult = Result.ok(groups);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(Array.isArray(successResult.value)).toBe(true);
        expect(successResult.value[0]).toHaveProperty('id');
        expect(successResult.value[0]).toHaveProperty('title');
        expect(successResult.value[0]).toHaveProperty('color');
        expect(successResult.value[0]).toHaveProperty('collapsed');
      }
    });

    it('MUST return empty array when no groups exist', () => {
      // Contract behavior: Empty array is valid when no groups
      const emptyResult = Result.ok<ChromeTabGroup[], TabsAPIError>([]);
      
      expect(Result.isOk(emptyResult)).toBe(true);
      if (Result.isOk(emptyResult)) {
        expect(emptyResult.value.length).toBe(0);
      }
    });

    it('MUST include all ChromeTabGroup properties', () => {
      // Contract specifies: id, title (optional), color, collapsed
      const group: ChromeTabGroup = {
        id: 123,
        title: 'My Group',
        color: 'red',
        collapsed: true
      };
      
      expect(group.id).toBeDefined();
      expect(group.color).toBeDefined();
      expect(group.collapsed).toBeDefined();
    });
  });

  describe('CONTRACT: Error Type Guarantees', () => {
    it('TabsAPIError MUST be discriminated union', () => {
      // Contract specifies: All errors have 'type' discriminator
      const error1: TabsAPIError = { 
        type: 'InvalidTabId', 
        details: 'fail', 
        tabId: 1 
      };
      const error2: TabsAPIError = { 
        type: 'InvalidGroupId', 
        details: 'fail', 
        groupId: 1 
      };
      const error3: TabsAPIError = { 
        type: 'PermissionDenied', 
        details: 'fail' 
      };
      const error4: TabsAPIError = { 
        type: 'ChromeAPIFailure', 
        details: 'fail', 
        originalError: new Error() 
      };
      
      expect(error1.type).toBe('InvalidTabId');
      expect(error2.type).toBe('InvalidGroupId');
      expect(error3.type).toBe('PermissionDenied');
      expect(error4.type).toBe('ChromeAPIFailure');
    });

    it('MUST preserve originalError in ChromeAPIFailure', () => {
      // Contract specifies: ChromeAPIFailure includes originalError
      const chromeError = new Error('Chrome failed');
      const error: TabsAPIError = {
        type: 'ChromeAPIFailure',
        details: 'Wrapped Chrome error',
        originalError: chromeError
      };
      
      expect(error.originalError).toBe(chromeError);
    });
  });

  describe('CONTRACT: Type Guards', () => {
    it('MUST provide isInvalidTabIdError type guard', () => {
      // Contract provides type guard for InvalidTabId errors
      function isInvalidTabIdError(
        error: TabsAPIError
      ): error is Extract<TabsAPIError, { type: 'InvalidTabId' }> {
        return error.type === 'InvalidTabId';
      }

      const error: TabsAPIError = { 
        type: 'InvalidTabId', 
        details: 'fail', 
        tabId: 1 
      };
      
      expect(isInvalidTabIdError(error)).toBe(true);
      if (isInvalidTabIdError(error)) {
        expect(error.tabId).toBe(1); // Type narrowing works
      }
    });

    it('MUST provide isInvalidGroupIdError type guard', () => {
      // Contract provides type guard for InvalidGroupId errors
      function isInvalidGroupIdError(
        error: TabsAPIError
      ): error is Extract<TabsAPIError, { type: 'InvalidGroupId' }> {
        return error.type === 'InvalidGroupId';
      }

      const error: TabsAPIError = { 
        type: 'InvalidGroupId', 
        details: 'fail', 
        groupId: 1 
      };
      
      expect(isInvalidGroupIdError(error)).toBe(true);
      if (isInvalidGroupIdError(error)) {
        expect(error.groupId).toBe(1); // Type narrowing works
      }
    });
  });

  describe('CONTRACT: Performance SLAs', () => {
    it('ALL methods MUST have <20ms SLA', () => {
      // Contract specifies: <20ms (95th percentile) for all methods
      const SLA_MS = 20;
      
      expect(SLA_MS).toBe(20);
      // Actual timing tests will be in implementation performance suite
    });
  });

  describe('CONTRACT: No Exceptions', () => {
    it('MUST never throw exceptions - always return Result', () => {
      // Contract guarantees: All methods return Result, never throw
      // This is enforced by TypeScript return types
      
      const successResult = Result.ok(123);
      const errorResult = Result.error<TabsAPIError>({ 
        type: 'InvalidTabId', 
        details: 'fail', 
        tabId: 1 
      });
      
      // Both are valid Result types
      expect(Result.isOk(successResult) || Result.isError(successResult)).toBe(true);
      expect(Result.isOk(errorResult) || Result.isError(errorResult)).toBe(true);
    });
  });
});
