/**
 * FILE: runtime-behavior.test.ts
 *
 * WHAT: Tests current-window tab operations, context freshness, and awaited humor delivery.
 * WHY: A tab action must never mutate another window or outlive its MV3 event promise.
 * SEAMS: TabManager -> ChromeTabs/Humor/UsageStats (SEAM-02, SEAM-09, SEAM-33)
 * CONTRACT: ITabManager v1.1.0
 * GENERATED: 2026-08-12
 */

import { describe, expect, it, vi } from 'vitest';
import { TabManager } from '../TabManager';
import {
  MockChromeNotificationsAPI,
  MockChromeStorageAPI,
  MockChromeTabsAPI,
  createMockTabs
} from './test-helpers';
import { MockHumorSystem } from '../../mocks/MockHumorSystem';
import { Result } from '../../utils/Result';
import { QuipStorage } from '../QuipStorage';
import { EasterEggFramework } from '../EasterEggFramework';
import { HumorSystem } from '../HumorSystem';

describe('TabManager runtime behavior', () => {
  it('queries only the current window before Feeling Lucky closes a tab', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(2));
    const manager = new TabManager(tabs, new MockHumorSystem());

    const result = await manager.closeRandomTab();

    expect(result.ok).toBe(true);
    expect(tabs.queryTabsCalls[0].query).toEqual({ currentWindow: true });
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

  it('evaluates and delivers an event-only easter egg after recording the event', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(2));
    const storage = new QuipStorage(new MockChromeStorageAPI());
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
  });

  it('serializes concurrent browser events so rapid opening produces one notification', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(2, {
      url: 'https://stackoverflow.com/questions/typescript',
      title: 'TypeScript Questions - Stack Overflow'
    }));
    const storage = new QuipStorage(new MockChromeStorageAPI());
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
    humor.deliverQuip = vi.fn(() => new Promise(resolve => {
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
});
