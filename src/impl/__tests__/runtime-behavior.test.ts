/**
 * FILE: runtime-behavior.test.ts
 *
 * WHAT: Tests current-window tab operations, context freshness, and awaited humor delivery.
 * WHY: A tab action must never mutate another window or outlive its MV3 event promise.
 * HOW DATA FLOWS:
 *   1. Browser-like tab state enters TabManager through SEAM-02.
 *   2. Context, humor, and usage Results return through SEAM-09/33.
 * SEAMS:
 *   IN: Chrome API doubles -> TabManager (SEAM-02)
 *   OUT: TabManager -> humor and usage stores (SEAM-09, SEAM-33)
 * CONTRACT: ITabManager v1.1.0
 * GENERATED: 2026-08-12
 */

import { describe, expect, it, vi } from 'vitest';
import { TabManager } from '../TabManager';
import {
  MockChromeNotificationsAPI,
  MockChromeTabsAPI,
  createMockTabs
} from './test-helpers';
import { MockHumorSystem } from '../../mocks/MockHumorSystem';
import { Result } from '../../utils/Result';
import { QuipStorage } from '../QuipStorage';
import { EasterEggFramework } from '../EasterEggFramework';
import { HumorSystem } from '../HumorSystem';
import type { ChromeAPIError } from '../../contracts/IChromeTabsAPI';
import type { HumorError, QuipDeliveryResult } from '../../contracts/IHumorSystem';
import type { IUsageStatsStore, UsageStatsError } from '../../contracts/IUsageStats';

describe('TabManager runtime behavior', () => {
  it('serializes overlapping tab mutations', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(4));
    expect((await tabs.createGroup([1, 2])).ok).toBe(true);
    const originalQuery = tabs.queryTabs.bind(tabs);
    let releaseFirstQuery!: () => void;
    let firstQueryBlocked = true;
    tabs.queryTabs = vi.fn(async query => {
      if (firstQueryBlocked && query.groupId === 1) {
        firstQueryBlocked = false;
        await new Promise<void>(resolve => { releaseFirstQuery = resolve; });
      }
      return originalQuery(query);
    });
    const manager = new TabManager(tabs, new MockHumorSystem());

    const first = manager.updateGroup(1, { tabIds: [1, 3] });
    await vi.waitFor(() => expect(releaseFirstQuery).toBeTypeOf('function'));
    const second = manager.updateGroup(1, { tabIds: [2, 4] });
    await Promise.resolve();
    expect(tabs.queryTabs).toHaveBeenCalledTimes(1);
    releaseFirstQuery();
    expect((await first).ok).toBe(true);
    expect((await second).ok).toBe(true);

    const finalTabs = await tabs.queryTabs({ currentWindow: true, groupId: 1 });
    expect(finalTabs.ok && finalTabs.value.map(tab => tab.id).sort()).toEqual([2, 4]);
  });

  it('queries only the current window before Feeling Lucky closes a tab', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(2));
    const manager = new TabManager(tabs, new MockHumorSystem());

    const result = await manager.closeRandomTab();

    expect(result.ok).toBe(true);
    expect(tabs.queryTabsCalls[0].query).toEqual({ currentWindow: true });
  });

  it('delivers the tab-just-closed Easter egg for a Feeling Lucky closure', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(2));
    const storage = new QuipStorage();
    expect((await storage.initialize()).ok).toBe(true);
    const framework = new EasterEggFramework(storage, () => 0);
    expect((await framework.initialize()).ok).toBe(true);
    const notifications = new MockChromeNotificationsAPI();
    const humor = new HumorSystem(framework, storage, notifications, undefined, undefined, {
      minDeliveryIntervalMs: 60_000,
      random: () => 0
    });
    const manager = new TabManager(tabs, humor, undefined, () => 0);
    humor.setBrowserContextProvider(() => manager.getBrowserContext());

    await manager.recordBrowserEvent('PopupOpened');
    const result = await manager.closeRandomTab();

    expect(result.ok).toBe(true);
    expect(notifications.createCalls).toHaveLength(2);
    expect(notifications.createCalls[1].options.title).toBe('Skeptical Wombat found something');
    expect(notifications.createCalls[1].options.message).toContain('YOU SHALL NOT PASS');
  });

  it('invalidates cached context after recording or mutating browser state', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(2));
    const manager = new TabManager(tabs, new MockHumorSystem());
    await manager.getBrowserContext();
    await manager.recordBrowserEvent('TabOpened');
    await manager.getBrowserContext();

    expect(tabs.queryTabsCalls).toHaveLength(2);
    const context = await manager.getBrowserContext();
    expect(context.ok && context.value.recentEvents).toContain('TabOpened');
  });

  it('discards a late browser snapshot after an intervening tab event', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(1));
    const originalQuery = tabs.queryTabs.bind(tabs);
    let releaseSnapshot!: () => void;
    let holdFirstSnapshot = true;
    tabs.queryTabs = vi.fn(async query => {
      const snapshot = await originalQuery(query);
      if (holdFirstSnapshot && query.currentWindow) {
        holdFirstSnapshot = false;
        await new Promise<void>(resolve => { releaseSnapshot = resolve; });
      }
      return snapshot;
    });
    const manager = new TabManager(tabs, new MockHumorSystem());

    const pendingContext = manager.getBrowserContext();
    await vi.waitFor(() => expect(releaseSnapshot).toBeTypeOf('function'));
    tabs.addTab({ ...createMockTabs(1)[0], id: 2, index: 1, active: false });
    await manager.recordBrowserEvent('TabOpened');
    releaseSnapshot();

    const refreshed = await pendingContext;
    expect(refreshed.ok && refreshed.value.tabCount).toBe(2);
    expect(tabs.queryTabs).toHaveBeenCalledTimes(2);
    const cached = await manager.getBrowserContext();
    expect(cached.ok && cached.value).toBe(refreshed.ok ? refreshed.value : null);
    expect(tabs.queryTabs).toHaveBeenCalledTimes(2);
  });

  it('evaluates and delivers an event-only easter egg after recording the event', async () => {
    vi.useFakeTimers();
    try {
      // Keep unrelated hour/date eggs from making this event-edge regression
      // depend on the CI runner's local time zone.
      vi.setSystemTime(new Date(2026, 5, 15, 12, 30, 0));
      const tabs = new MockChromeTabsAPI(createMockTabs(2));
      const storage = new QuipStorage();
      expect((await storage.initialize()).ok).toBe(true);
      const framework = new EasterEggFramework(storage, () => 0);
      expect((await framework.initialize()).ok).toBe(true);
      const notifications = new MockChromeNotificationsAPI();
      const humor = new HumorSystem(framework, storage, notifications, undefined, undefined, {
        minDeliveryIntervalMs: 60_000,
        random: () => 0
      });
      const manager = new TabManager(tabs, humor);
      humor.setBrowserContextProvider(() => manager.getBrowserContext());

      await manager.recordBrowserEvent('PopupOpened');
      expect(notifications.createCalls).toHaveLength(1);
      expect(notifications.createCalls[0].options.message).toContain('tab portal');

      await manager.recordBrowserEvent('KonamiCodeEntered');

      expect(notifications.createCalls).toHaveLength(2);
      expect(notifications.createCalls[1].options.title).toBe('Skeptical Wombat found something');
      expect(notifications.createCalls[1].options.message).toContain('30 extra tabs unlocked');
    } finally {
      vi.useRealTimers();
    }
  });

  it('serializes concurrent browser events so rapid opening produces one notification', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(2, {
      url: 'https://stackoverflow.com/questions/typescript',
      title: 'TypeScript Questions - Stack Overflow'
    }));
    const storage = new QuipStorage();
    expect((await storage.initialize()).ok).toBe(true);
    const framework = new EasterEggFramework(storage, () => 0);
    expect((await framework.initialize()).ok).toBe(true);
    const notifications = new MockChromeNotificationsAPI();
    const humor = new HumorSystem(framework, storage, notifications, undefined, undefined, {
      minDeliveryIntervalMs: 60_000,
      random: () => 0
    });
    const manager = new TabManager(tabs, humor);
    humor.setBrowserContextProvider(() => manager.getBrowserContext());

    await Promise.all([
      manager.recordBrowserEvent('TabOpened'),
      manager.recordBrowserEvent('TabOpened'),
      manager.recordBrowserEvent('TabOpened')
    ]);

    expect(notifications.createCalls).toHaveLength(1);
    expect(notifications.createCalls[0].options.message).toContain('warp speed');
  });

  it('awaits humor delivery so the service-worker event keeps the notification work alive', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(3));
    let release!: () => void;
    const humor = new MockHumorSystem();
    humor.deliverQuip = vi.fn(() => new Promise<Result<QuipDeliveryResult, HumorError>>(resolve => {
      release = () => resolve(Result.ok({
        delivered: true,
        quipText: 'done',
        deliveryMethod: 'chrome.notifications',
        isEasterEgg: false,
        timestamp: Date.now()
      }));
    }));
    const manager = new TabManager(tabs, humor);
    let settled = false;
    const pending = manager.createGroup('Work', [1, 2]).then(result => {
      settled = true;
      return result;
    });

    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    expect(settled).toBe(false);
    release();
    expect((await pending).ok).toBe(true);
  });

  it('derives date, URL, duplicate, and current-window group context', async () => {
    const initial = createMockTabs(4);
    initial[0].url = 'https://example.com/a';
    initial[1].url = 'https://example.com/a';
    const tabs = new MockChromeTabsAPI(initial);
    await tabs.createGroup([1, 2]);
    const manager = new TabManager(tabs, new MockHumorSystem());
    const result = await manager.getBrowserContext();

    expect(result.ok && result.value).toMatchObject({
      tabCount: 4,
      duplicateTabCount: 1,
      groupCount: 1
    });
    expect(result.ok && result.value.currentMinute).toBeTypeOf('number');
    expect(result.ok && result.value.currentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.ok && result.value.tabUrls).toHaveLength(4);
  });

  it('derives the exact local calendar fields used by date-based eggs', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 2, 14, 23, 7, 0));
      const manager = new TabManager(
        new MockChromeTabsAPI(createMockTabs(1)),
        new MockHumorSystem()
      );

      const result = await manager.getBrowserContext();

      expect(result.ok && result.value).toMatchObject({
        currentDate: '2026-03-14',
        currentMonth: 3,
        currentHour: 23,
        currentMinute: 7
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects selected tabs outside the current window before creating a group', async () => {
    const initial = createMockTabs(3);
    initial[2].windowId = 2;
    const tabs = new MockChromeTabsAPI(initial);
    const manager = new TabManager(tabs, new MockHumorSystem());

    const result = await manager.createGroup('Cross window', [1, 3]);

    expect(result.ok).toBe(false);
    expect(tabs.createGroupCalls).toHaveLength(0);
    if (!result.ok) expect(result.error.details).toContain('current window');
  });

  it('supports changing group membership through the existing-group wrapper seam', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(4));
    const group = await tabs.createGroup([1, 2]);
    expect(group.ok).toBe(true);
    const manager = new TabManager(tabs, new MockHumorSystem());

    const result = await manager.updateGroup(1, { tabIds: [3, 4], name: 'Updated' });

    expect(result.ok).toBe(true);
    expect(tabs.createGroupCalls.at(-1)).toEqual({ tabIds: [3, 4], existingGroupId: 1 });
    expect(tabs.ungroupTabsCalls).toEqual([{ tabIds: [1, 2] }]);
    expect(tabs.updateGroupCalls.at(-1)?.updates.title).toBe('Updated');
  });

  it('does not update properties when a membership change fails', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(4));
    expect((await tabs.createGroup([1, 2])).ok).toBe(true);
    tabs.updateGroupCalls = [];
    tabs.ungroupTabs = vi.fn(async (): Promise<Result<void, ChromeAPIError>> => Result.error({
      type: 'ChromeAPIFailure', details: 'remove failed', originalError: null
    }));
    const manager = new TabManager(tabs, new MockHumorSystem());

    const result = await manager.updateGroup(1, { tabIds: [3, 4], name: 'Must not apply' });

    expect(result.ok).toBe(false);
    expect(tabs.updateGroupCalls).toHaveLength(0);
  });

  it('rolls membership back when a later property update fails', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(4));
    expect((await tabs.createGroup([1, 2])).ok).toBe(true);
    tabs.updateGroup = vi.fn(async (): Promise<Result<void, ChromeAPIError>> => Result.error({
      type: 'ChromeAPIFailure', details: 'title failed', originalError: null
    }));
    const manager = new TabManager(tabs, new MockHumorSystem());

    const result = await manager.updateGroup(1, { tabIds: [3, 4], name: 'Fails' });
    const originalGroup = await tabs.queryTabs({ currentWindow: true, groupId: 1 });
    const ungrouped = await tabs.queryTabs({ currentWindow: true, groupId: -1 });

    expect(result.ok).toBe(false);
    expect(originalGroup.ok && originalGroup.value.map(tab => tab.id).sort()).toEqual([1, 2]);
    expect(ungrouped.ok && ungrouped.value.map(tab => tab.id).sort()).toEqual([3, 4]);
    if (!result.ok) expect(result.error.details).toContain('membership changes were rolled back');
  });

  it('restores added tabs to their original group during property-failure rollback', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(4));
    const source = await tabs.createGroup([3, 4]);
    const destination = await tabs.createGroup([1, 2]);
    expect(source.ok && source.value).toBe(1);
    expect(destination.ok && destination.value).toBe(2);
    await tabs.updateGroup(1, { title: 'Source', color: 'blue', collapsed: true });
    const updateGroup = tabs.updateGroup.bind(tabs);
    tabs.updateGroup = vi.fn(async (groupId, properties): Promise<Result<void, ChromeAPIError>> => (
      groupId === 2
        ? Result.error({ type: 'ChromeAPIFailure', details: 'title failed', originalError: null })
        : updateGroup(groupId, properties)
    ));
    const manager = new TabManager(tabs, new MockHumorSystem());

    const result = await manager.updateGroup(2, { tabIds: [3, 4], name: 'Fails' });
    const destinationTabs = await tabs.queryTabs({ currentWindow: true, groupId: 2 });
    const groups = await tabs.getAllGroups();
    const restoredSource = groups.ok
      ? groups.value.find(group => group.title === 'Source' && group.color === 'blue' && group.collapsed)
      : undefined;
    const sourceTabs = restoredSource
      ? await tabs.queryTabs({ currentWindow: true, groupId: restoredSource.id })
      : Result.ok([]);

    expect(result.ok).toBe(false);
    expect(sourceTabs.ok && sourceTabs.value.map(tab => tab.id).sort()).toEqual([3, 4]);
    expect(destinationTabs.ok && destinationTabs.value.map(tab => tab.id).sort()).toEqual([1, 2]);
    expect(restoredSource?.id).not.toBe(1);
    if (!result.ok) expect(result.error.details).toContain('membership changes were rolled back');
  });

  it('reports an empty window accurately when no Lucky exclusions apply', async () => {
    const manager = new TabManager(new MockChromeTabsAPI([]), new MockHumorSystem());

    const result = await manager.closeRandomTab({ excludePinned: false, excludeActive: false });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.details).toBe('There are no tabs to close');
  });

  it('logs Result failures from non-blocking humor and statistics side effects', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(2));
    const humor = new MockHumorSystem();
    humor.deliverQuip = vi.fn(async () => Result.error<HumorError>({
      type: 'DeliveryFailed',
      details: 'notification failed',
      deliveryMethod: 'notification'
    }));
    const usageStats = {
      increment: vi.fn(async () => Result.error<UsageStatsError>({
        type: 'StorageWriteFailed',
        details: 'storage failed',
        originalError: null
      }))
    } as unknown as IUsageStatsStore;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const manager = new TabManager(tabs, humor, usageStats);

    const result = await manager.createGroup('Work', [1]);

    expect(result.ok).toBe(true);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Usage statistics update failed'),
      expect.objectContaining({ type: 'StorageWriteFailed' })
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Humor delivery failed'),
      expect.objectContaining({ type: 'DeliveryFailed' })
    );
    warn.mockRestore();
  });
});
