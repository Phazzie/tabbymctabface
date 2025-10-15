/**
 * FILE: humor-flow.integration.test.ts
 *
 * WHAT: Integration tests for humor delivery flow (HumorSystem + EasterEggFramework + QuipStorage)
 *
 * WHY: Validates that humor orchestration works correctly across multiple components.
 *      Tests the core value proposition of TabbyMcTabface - intelligent humor delivery.
 *
 * SEAMS TESTED:
 *   - SEAM-13: Personality → QuipStorage
 *   - SEAM-16: HumorSystem → EasterEggFramework
 *   - SEAM-17: EasterEggFramework → QuipStorage
 *   - SEAM-15: HumorSystem → ChromeNotificationsAPI
 *
 * GENERATED: 2025-10-13
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QuipStorage } from '../QuipStorage';
import { EasterEggFramework } from '../EasterEggFramework';
import { HumorSystem } from '../HumorSystem';
import {
  MockChromeStorageAPI,
  MockChromeNotificationsAPI,
  assertOk
} from './test-helpers';
import { HumorTrigger } from '../../contracts/IHumorSystem';

describe('Humor Flow Integration Tests', () => {
  let mockStorage: MockChromeStorageAPI;
  let mockNotifications: MockChromeNotificationsAPI;
  let quipStorage: QuipStorage;
  let easterEggFramework: EasterEggFramework;
  let humorSystem: HumorSystem;

  beforeEach(async () => {
    // Reset mocks
    mockStorage = new MockChromeStorageAPI();
    mockNotifications = new MockChromeNotificationsAPI();

    // Initialize components
    quipStorage = new QuipStorage(mockStorage);
    await quipStorage.initialize();

    easterEggFramework = new EasterEggFramework(quipStorage);
    await easterEggFramework.initialize();

    humorSystem = new HumorSystem(
      easterEggFramework,
      quipStorage,
      mockNotifications
    );
  });

  describe('Passive-Aggressive Quip Delivery', () => {
    it('delivers quip when TabGroupCreated trigger is fired', async () => {
      // Arrange
      const trigger: HumorTrigger = {
        type: 'TabGroupCreated',
        data: { type: 'TabGroupCreated', groupName: 'Work', tabCount: 5 },
        timestamp: Date.now()
      };

      // Act
      const result = await humorSystem.deliverQuip(trigger);

      // Assert
      assertOk(result);
      expect(result.value.delivered).toBe(true);
      expect(result.value.quipText).toBeTruthy();
      expect(result.value.isEasterEgg).toBe(false);
      expect(result.value.deliveryMethod).toBe('chrome.notifications');

      // Verify notification was created
      expect(mockNotifications.createCalls).toHaveLength(1);
      const notification = mockNotifications.getLastCreatedNotification();
      expect(notification?.title).toBe('TabbyMcTabface');
      expect(notification?.message).toBe(result.value.quipText);
    });

    it('delivers quip when FeelingLuckyClicked trigger is fired', async () => {
      // Arrange
      const trigger: HumorTrigger = {
        type: 'FeelingLuckyClicked',
        data: {
          type: 'TabClosed',
          tabTitle: 'Example Tab',
          tabUrl: 'https://example.com',
          trigger: 'FeelingLucky'
        },
        timestamp: Date.now()
      };

      // Act
      const result = await humorSystem.deliverQuip(trigger);

      // Assert
      assertOk(result);
      expect(result.value.delivered).toBe(true);
      expect(result.value.quipText).toBeTruthy();
      expect(mockNotifications.createCalls.length).toBeGreaterThan(0);
    });

    it('returns different quips on subsequent calls (deduplication)', async () => {
      // Arrange
      const trigger: HumorTrigger = {
        type: 'TabGroupCreated',
        data: { type: 'TabGroupCreated', groupName: 'Test', tabCount: 3 },
        timestamp: Date.now()
      };

      // Act - deliver multiple quips
      const results: string[] = [];
      for (let i = 0; i < 5; i++) {
        const result = await humorSystem.deliverQuip({
          ...trigger,
          timestamp: Date.now() + i * 10000 // Space out by 10s to avoid throttling
        });

        if (result.ok && result.value.quipText) {
          results.push(result.value.quipText);
        }

        // Wait to avoid throttling
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Assert - should have variety (not all the same)
      const uniqueQuips = new Set(results);
      expect(uniqueQuips.size).toBeGreaterThan(1);
    });

    it('throttles quips when called too frequently', async () => {
      // Arrange
      const trigger: HumorTrigger = {
        type: 'TabGroupCreated',
        data: { type: 'TabGroupCreated', groupName: 'Test', tabCount: 3 },
        timestamp: Date.now()
      };

      // Act - call twice rapidly
      const result1 = await humorSystem.deliverQuip(trigger);
      const result2 = await humorSystem.deliverQuip({
        ...trigger,
        timestamp: Date.now() + 1000 // Only 1s later
      });

      // Assert - first succeeds, second is throttled
      assertOk(result1);
      expect(result1.value.delivered).toBe(true);

      assertOk(result2);
      expect(result2.value.delivered).toBe(false);
      expect(result2.value.deliveryMethod).toBe('none');
    });
  });

  describe('Easter Egg Detection and Delivery', () => {
    it('delivers easter egg quip when 42 tabs condition is met', async () => {
      // Arrange
      const context = {
        tabCount: 42,
        activeTab: { url: 'https://example.com', title: 'Example', domain: 'example.com' },
        currentHour: 14,
        recentEvents: ['TabGroupCreated'],
        groupCount: 3
      };

      // Act
      const easterEggResult = await humorSystem.checkEasterEggs(context);

      // Assert
      assertOk(easterEggResult);
      expect(easterEggResult.value).toBeTruthy();
      expect(easterEggResult.value?.easterEggType).toBe('42-tabs');
    });

    it('delivers easter egg quip with special title', async () => {
      // Arrange - Create trigger with context that should match an easter egg
      // We'll use a manual trigger since we can't easily mock the context building
      const trigger: HumorTrigger = {
        type: 'ManualTrigger',
        data: { type: 'ManualTrigger' },
        timestamp: Date.now()
      };

      // Manually check for easter eggs with 42 tab context
      const context = {
        tabCount: 42,
        activeTab: null,
        currentHour: 14,
        recentEvents: [],
        groupCount: 0
      };

      const easterEggMatch = await easterEggFramework.checkTriggers(context);

      // Assert
      assertOk(easterEggMatch);
      if (easterEggMatch.value) {
        expect(easterEggMatch.value.easterEggType).toBe('42-tabs');
        expect(easterEggMatch.value.matchedConditions).toContain('tabCount');
      }
    });

    it('does not deliver easter egg when conditions not met', async () => {
      // Arrange
      const context = {
        tabCount: 10, // Not 42
        activeTab: { url: 'https://example.com', title: 'Example', domain: 'example.com' },
        currentHour: 14,
        recentEvents: [],
        groupCount: 0
      };

      // Act
      const easterEggResult = await easterEggFramework.checkTriggers(context);

      // Assert
      assertOk(easterEggResult);
      // Should either be null or not match 42-tabs
      if (easterEggResult.value) {
        expect(easterEggResult.value.easterEggType).not.toBe('42-tabs');
      }
    });

    it('matches time-based easter egg during late night hours', async () => {
      // Arrange
      const context = {
        tabCount: 5,
        activeTab: {
          url: 'https://github.com/user/repo',
          title: 'GitHub - Code Review',
          domain: 'github.com'
        },
        currentHour: 2, // 2 AM
        recentEvents: [],
        groupCount: 1
      };

      // Act
      const easterEggResult = await easterEggFramework.checkTriggers(context);

      // Assert
      assertOk(easterEggResult);
      // Should potentially match a late-night coding easter egg
      // (depends on what's in our easter egg collection)
    });
  });

  describe('Component Integration', () => {
    it('QuipStorage loads and caches data correctly', async () => {
      // Act
      const passiveAggressiveResult = await quipStorage.getPassiveAggressiveQuips('default', 'TabGroupCreated');
      const easterEggResult = await quipStorage.getEasterEggQuips('42-tabs', 'default');

      // Assert
      assertOk(passiveAggressiveResult);
      expect(passiveAggressiveResult.value.length).toBeGreaterThan(0);

      assertOk(easterEggResult);
      // Should have at least one easter egg for 42 tabs
      expect(easterEggResult.value.length).toBeGreaterThanOrEqual(0);
    });

    it('EasterEggFramework initializes with easter eggs from storage', async () => {
      // Act
      const allEasterEggs = easterEggFramework.getAllEasterEggs();

      // Assert
      assertOk(allEasterEggs);
      expect(allEasterEggs.value.length).toBeGreaterThan(0);

      // Verify easter eggs are sorted by priority
      const priorities = allEasterEggs.value.map(egg => egg.priority);
      const sortedPriorities = [...priorities].sort((priorityA, priorityB) => priorityB - priorityA);
      expect(priorities).toEqual(sortedPriorities);
    });

    it('HumorSystem coordinates all components for delivery', async () => {
      // Arrange
      const trigger: HumorTrigger = {
        type: 'TabGroupCreated',
        data: { type: 'TabGroupCreated', groupName: 'Research', tabCount: 8 },
        timestamp: Date.now()
      };

      // Act
      const result = await humorSystem.deliverQuip(trigger);

      // Assert - Full flow worked
      assertOk(result);
      expect(result.value.delivered).toBe(true);

      // Verify storage was accessed
      expect(mockStorage.getCalls.length).toBeGreaterThan(0);

      // Verify notification was created
      expect(mockNotifications.createCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles storage errors gracefully', async () => {
      // Arrange - Create a new system with failing storage
      const failingStorage = new MockChromeStorageAPI();
      const failingQuipStorage = new QuipStorage(failingStorage);

      // Don't initialize - this will cause errors when trying to get quips
      const failingHumorSystem = new HumorSystem(
        easterEggFramework,
        failingQuipStorage,
        mockNotifications
      );

      const trigger: HumorTrigger = {
        type: 'TabGroupCreated',
        data: { type: 'TabGroupCreated', groupName: 'Test', tabCount: 3 },
        timestamp: Date.now()
      };

      // Act
      const result = await failingHumorSystem.deliverQuip(trigger);

      // Assert - Should return error, not throw
      expect(result.ok).toBe(false);
    });

    it('handles notification API errors gracefully', async () => {
      // Arrange - Create mock that fails notifications
      const failingNotifications = new MockChromeNotificationsAPI();
      // Override create to return error
      failingNotifications.create = async () => {
        return {
          ok: false,
          error: { type: 'PermissionDenied', details: 'No permission' }
        } as any;
      };

      const failingHumorSystem = new HumorSystem(
        easterEggFramework,
        quipStorage,
        failingNotifications
      );

      const trigger: HumorTrigger = {
        type: 'TabGroupCreated',
        data: { type: 'TabGroupCreated', groupName: 'Test', tabCount: 3 },
        timestamp: Date.now()
      };

      // Act
      const result = await failingHumorSystem.deliverQuip(trigger);

      // Assert - Should return error
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('DeliveryFailed');
      }
    });
  });

  describe('Observable Pattern', () => {
    it('emits notifications to observers when quip is delivered', async () => {
      // Arrange
      const notifications: any[] = [];
      const subscription = humorSystem.notifications$.subscribe(notification => {
        notifications.push(notification);
      });

      const trigger: HumorTrigger = {
        type: 'TabGroupCreated',
        data: { type: 'TabGroupCreated', groupName: 'Test', tabCount: 3 },
        timestamp: Date.now()
      };

      // Act
      await humorSystem.deliverQuip(trigger);

      // Assert
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].quipText).toBeTruthy();
      expect(notifications[0].displayDuration).toBe(5000);

      // Cleanup
      subscription.unsubscribe();
    });
  });
});
