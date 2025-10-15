/**
 * FILE: tab-management.integration.test.ts
 *
 * WHAT: Integration tests for tab management flow (TabManager + HumorSystem + ChromeTabsAPI)
 *
 * WHY: Validates that tab operations trigger appropriate humor delivery and work correctly
 *      across the TabManager → HumorSystem boundary.
 *
 * SEAMS TESTED:
 *   - SEAM-01: UI → TabManager (createGroup)
 *   - SEAM-02: TabManager → ChromeTabsAPI (createGroup)
 *   - SEAM-04: TabManager → HumorSystem (TabGroupCreated event)
 *   - SEAM-06: UI → TabManager (closeRandomTab)
 *   - SEAM-07/08: TabManager → ChromeTabsAPI (queryTabs, removeTab)
 *   - SEAM-09: TabManager → HumorSystem (FeelingLucky event)
 *
 * GENERATED: 2025-10-13
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TabManager } from '../TabManager';
import { HumorSystem } from '../HumorSystem';
import { QuipStorage } from '../QuipStorage';
import { EasterEggFramework } from '../EasterEggFramework';
import {
  MockChromeTabsAPI,
  MockChromeNotificationsAPI,
  MockChromeStorageAPI,
  createMockTabs,
  assertOk,
  assertError
} from './test-helpers';

describe('Tab Management Integration Tests', () => {
  let mockTabs: MockChromeTabsAPI;
  let mockNotifications: MockChromeNotificationsAPI;
  let mockStorage: MockChromeStorageAPI;
  let tabManager: TabManager;
  let humorSystem: HumorSystem;

  beforeEach(async () => {
    // Reset mocks
    mockTabs = new MockChromeTabsAPI();
    mockNotifications = new MockChromeNotificationsAPI();
    mockStorage = new MockChromeStorageAPI();

    // Initialize humor system
    const quipStorage = new QuipStorage(mockStorage);
    await quipStorage.initialize();

    const easterEggFramework = new EasterEggFramework(quipStorage);
    await easterEggFramework.initialize();

    humorSystem = new HumorSystem(
      easterEggFramework,
      quipStorage,
      mockNotifications
    );

    // Initialize tab manager
    tabManager = new TabManager(mockTabs, humorSystem);
  });

  describe('Create Group Flow', () => {
    it('creates tab group and triggers humor delivery', async () => {
      // Arrange
      const tabs = createMockTabs(5);
      tabs.forEach(tab => mockTabs.addTab(tab));
      const tabIds = tabs.map(tab => tab.id);

      // Act
      const result = await tabManager.createGroup('Work Stuff', tabIds);

      // Assert
      assertOk(result);
      expect(result.value.groupId).toBeGreaterThan(0);
      expect(result.value.groupName).toBe('Work Stuff');
      expect(result.value.tabCount).toBe(5);

      // Verify Chrome API was called
      expect(mockTabs.createGroupCalls).toHaveLength(1);
      expect(mockTabs.updateGroupCalls).toHaveLength(1);
      expect(mockTabs.updateGroupCalls[0].updates.title).toBe('Work Stuff');

      // Verify humor was triggered (wait a bit for async delivery)
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockNotifications.createCalls.length).toBeGreaterThan(0);
    });

    it('validates group name (rejects empty name)', async () => {
      // Arrange
      const tabs = createMockTabs(3);
      tabs.forEach(tab => mockTabs.addTab(tab));

      // Act
      const result = await tabManager.createGroup('', tabs.map(tab => tab.id));

      // Assert
      assertError(result);
      expect(result.error.type).toBe('InvalidGroupName');
      expect(result.error.details).toContain('empty');

      // Verify Chrome API was NOT called
      expect(mockTabs.createGroupCalls).toHaveLength(0);
    });

    it('validates group name (rejects >50 chars)', async () => {
      // Arrange
      const tabs = createMockTabs(3);
      tabs.forEach(tab => mockTabs.addTab(tab));
      const longName = 'A'.repeat(51);

      // Act
      const result = await tabManager.createGroup(longName, tabs.map(tab => tab.id));

      // Assert
      assertError(result);
      expect(result.error.type).toBe('InvalidGroupName');
      expect(result.error.details).toContain('50 characters');
    });

    it('validates tab selection (rejects empty array)', async () => {
      // Act
      const result = await tabManager.createGroup('Test Group', []);

      // Assert
      assertError(result);
      expect(result.error.type).toBe('NoTabsSelected');
    });
  });

  describe('Feeling Lucky Flow', () => {
    it('closes random tab and triggers humor delivery', async () => {
      // Arrange - Create 10 tabs
      const tabs = createMockTabs(10);
      tabs.forEach(tab => mockTabs.addTab(tab));

      // Act
      const result = await tabManager.closeRandomTab();

      // Assert
      assertOk(result);
      expect(result.value.closedTabId).toBeGreaterThan(0);
      expect(result.value.closedTabTitle).toBeTruthy();
      expect(result.value.remainingCount).toBe(9);

      // Verify tab was removed
      expect(mockTabs.removeTabCalls).toHaveLength(1);

      // Verify humor was triggered
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockNotifications.createCalls.length).toBeGreaterThan(0);
    });

    it('excludes pinned tabs by default', async () => {
      // Arrange - Create tabs with some pinned
      const tabs = createMockTabs(5);
      tabs[0].pinned = true;
      tabs[1].pinned = true;
      tabs.forEach(tab => mockTabs.addTab(tab));

      // Act
      const result = await tabManager.closeRandomTab();

      // Assert
      assertOk(result);
      // Should not close tab 1 or 2 (pinned)
      expect([1, 2]).not.toContain(result.value.closedTabId);
    });

    it('excludes active tab by default', async () => {
      // Arrange - Create tabs with one active
      const tabs = createMockTabs(5);
      tabs[2].active = true; // Tab 3 is active
      tabs.forEach(tab => mockTabs.addTab(tab));

      // Act
      const result = await tabManager.closeRandomTab();

      // Assert
      assertOk(result);
      // Should not close tab 3 (active)
      expect(result.value.closedTabId).not.toBe(3);
    });

    it('returns error when no eligible tabs to close', async () => {
      // Arrange - Only pinned tabs
      const tabs = createMockTabs(3);
      tabs.forEach(tab => {
        tab.pinned = true;
        mockTabs.addTab(tab);
      });

      // Act
      const result = await tabManager.closeRandomTab();

      // Assert
      assertError(result);
      expect(result.error.type).toBe('NoTabsToClose');
      expect(result.error.details).toContain('pinned');
    });

    it('allows closing pinned tabs when explicitly enabled', async () => {
      // Arrange - Only pinned tabs
      const tabs = createMockTabs(3);
      tabs.forEach(tab => {
        tab.pinned = true;
        mockTabs.addTab(tab);
      });

      // Act
      const result = await tabManager.closeRandomTab({ excludePinned: false, excludeActive: false });

      // Assert
      assertOk(result);
      expect(result.value.closedTabId).toBeGreaterThan(0);
    });
  });

  describe('Get All Groups Flow', () => {
    it('returns all tab groups with associated tabs', async () => {
      // Arrange - Create tabs in groups
      const tabs = createMockTabs(10);
      tabs.forEach(tab => mockTabs.addTab(tab));

      // Create some groups
      await mockTabs.createGroup([1, 2, 3]);
      await mockTabs.createGroup([4, 5]);

      // Act
      const result = await tabManager.getAllGroups();

      // Assert
      assertOk(result);
      expect(result.value.length).toBe(2);

      const group1 = result.value[0];
      expect(group1.tabCount).toBe(3);
      expect(group1.tabs).toHaveLength(3);

      const group2 = result.value[1];
      expect(group2.tabCount).toBe(2);
      expect(group2.tabs).toHaveLength(2);
    });

    it('returns empty array when no groups exist', async () => {
      // Arrange - Tabs but no groups
      const tabs = createMockTabs(5);
      tabs.forEach(tab => mockTabs.addTab(tab));

      // Act
      const result = await tabManager.getAllGroups();

      // Assert
      assertOk(result);
      expect(result.value).toEqual([]);
    });
  });

  describe('Update Group Flow', () => {
    it('updates group name successfully', async () => {
      // Arrange
      const tabs = createMockTabs(3);
      tabs.forEach(tab => mockTabs.addTab(tab));
      const groupResult = await mockTabs.createGroup([1, 2, 3]);
      assertOk(groupResult);
      const groupId = groupResult.value;

      // Act
      const result = await tabManager.updateGroup(groupId, { name: 'Updated Name' });

      // Assert
      assertOk(result);
      expect(mockTabs.updateGroupCalls).toHaveLength(1);
      expect(mockTabs.updateGroupCalls[0].updates.title).toBe('Updated Name');
    });

    it('validates group name when updating', async () => {
      // Arrange
      const tabs = createMockTabs(3);
      tabs.forEach(tab => mockTabs.addTab(tab));
      const groupResult = await mockTabs.createGroup([1, 2, 3]);
      assertOk(groupResult);

      // Act - Try to update with empty name
      const result = await tabManager.updateGroup(groupResult.value, { name: '' });

      // Assert
      assertError(result);
      expect(result.error.type).toBe('InvalidGroupName');
    });

    it('returns error for invalid group ID', async () => {
      // Act
      const result = await tabManager.updateGroup(999, { name: 'Test' });

      // Assert
      assertError(result);
      expect(result.error.type).toBe('InvalidGroupId');
    });
  });

  describe('Delete Group Flow', () => {
    it('ungroups tabs successfully', async () => {
      // Arrange
      const tabs = createMockTabs(3);
      tabs.forEach(tab => mockTabs.addTab(tab));
      const groupResult = await mockTabs.createGroup([1, 2, 3]);
      assertOk(groupResult);
      const groupId = groupResult.value;

      // Act
      const result = await tabManager.deleteGroup(groupId);

      // Assert
      assertOk(result);
      // Verify ungroup was called
      expect(mockTabs.createGroupCalls.length).toBeGreaterThan(1);
    });

    it('returns error for non-existent group', async () => {
      // Act
      const result = await tabManager.deleteGroup(999);

      // Assert
      assertError(result);
      expect(result.error.type).toBe('InvalidGroupId');
    });
  });

  describe('Get Browser Context Flow', () => {
    it('builds comprehensive browser context', async () => {
      // Arrange
      const tabs = createMockTabs(15);
      tabs[0].active = true;
      tabs[0].url = 'https://github.com/user/repo';
      tabs[0].title = 'GitHub - Code';
      tabs.forEach(tab => mockTabs.addTab(tab));

      await mockTabs.createGroup([1, 2, 3]);
      await mockTabs.createGroup([4, 5]);

      // Act
      const result = await tabManager.getBrowserContext();

      // Assert
      assertOk(result);
      const context = result.value;

      expect(context.tabCount).toBe(15);
      expect(context.groupCount).toBe(2);
      expect(context.activeTab).toBeTruthy();
      expect(context.activeTab?.domain).toBe('github.com');
      expect(context.currentHour).toBeGreaterThanOrEqual(0);
      expect(context.currentHour).toBeLessThanOrEqual(23);
    });

    it('handles no active tab gracefully', async () => {
      // Arrange - No active tabs
      const tabs = createMockTabs(5);
      tabs.forEach(tab => {
        tab.active = false;
        mockTabs.addTab(tab);
      });

      // Act
      const result = await tabManager.getBrowserContext();

      // Assert
      assertOk(result);
      expect(result.value.activeTab).toBeNull();
    });

    it('tracks recent events in context', async () => {
      // Arrange
      const tabs = createMockTabs(5);
      tabs.forEach(tab => mockTabs.addTab(tab));

      // Act - Perform some actions
      await tabManager.createGroup('Test1', [1, 2]);
      await tabManager.closeRandomTab();

      const result = await tabManager.getBrowserContext();

      // Assert
      assertOk(result);
      expect(result.value.recentEvents).toContain('TabGroupCreated');
      expect(result.value.recentEvents).toContain('FeelingLuckyClicked');
    });
  });

  describe('End-to-End Flows', () => {
    it('complete user flow: create group → humor delivered → notification shown', async () => {
      // Arrange
      const tabs = createMockTabs(8);
      tabs.forEach(tab => mockTabs.addTab(tab));

      // Act
      const createResult = await tabManager.createGroup('Research', [1, 2, 3, 4, 5]);

      // Wait for async humor delivery
      await new Promise(resolve => setTimeout(resolve, 150));

      // Assert
      assertOk(createResult);

      // Verify full flow
      expect(mockTabs.createGroupCalls).toHaveLength(1);
      expect(mockNotifications.createCalls).toHaveLength(1);

      const notification = mockNotifications.getLastCreatedNotification();
      expect(notification?.title).toBe('TabbyMcTabface');
      expect(notification?.message).toBeTruthy();
    });

    it('complete user flow: feeling lucky → tab closed → humor delivered', async () => {
      // Arrange
      const tabs = createMockTabs(10);
      tabs.forEach(tab => mockTabs.addTab(tab));

      // Act
      const closeResult = await tabManager.closeRandomTab();

      // Wait for async humor delivery
      await new Promise(resolve => setTimeout(resolve, 150));

      // Assert
      assertOk(closeResult);

      expect(mockTabs.removeTabCalls).toHaveLength(1);
      expect(mockNotifications.createCalls).toHaveLength(1);

      const notification = mockNotifications.getLastCreatedNotification();
      expect(notification?.message).toBeTruthy();
    });
  });
});
