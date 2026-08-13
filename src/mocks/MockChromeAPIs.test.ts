/**
 * FILE: MockChromeAPIs.test.ts
 *
 * WHAT: Contract-fidelity tests for reusable Chrome and tab-manager mocks.
 * WHY: A permissive mock can hide invalid group IDs, window leakage, or event-order bugs.
 * HOW DATA FLOWS: Test fixtures → mock seam → Result/context assertions.
 * SEAMS:
 *   IN: Test fixtures → MockChromeTabsAPI / MockTabManager
 *   OUT: Mock results → contract assertions
 * CONTRACT: Mock fidelity v1.0.0
 * GENERATED: 2026-08-12
 */

import { describe, expect, it } from 'vitest';
import type { ChromeTab } from '../contracts/IChromeTabsAPI';
import type { BrowserEventName } from '../contracts/ITabManager';
import { MockChromeTabsAPI } from './MockChromeTabsAPI';
import { MockTabManager } from './MockTabManager';

// === SEAM-MOCK-01: Test fixtures → Chrome tab mock ===
describe('MockChromeTabsAPI contract fidelity', () => {
  it('rejects an existingGroupId that does not identify a seeded group', async () => {
    const tabs = new MockChromeTabsAPI();

    const result = await tabs.createGroup([100], 42);

    expect(result).toMatchObject({
      ok: false,
      error: {
        type: 'InvalidGroupId',
        details: 'Group ID 42 does not exist',
        groupId: 42,
      },
    });
  });

  it('supports group ID zero when that group already exists', async () => {
    const tabs = new MockChromeTabsAPI();
    tabs.seedMockGroups([{ id: 0, title: 'Zero', color: 'grey', collapsed: false }]);

    const result = await tabs.createGroup([100], 0);
    const groupedTabs = await tabs.queryTabs({ groupId: 0 });

    expect(result).toMatchObject({ ok: true, value: 0 });
    expect(groupedTabs.ok && groupedTabs.value.map(tab => tab.id)).toEqual([100]);
  });

  it('deletes a group after its last tab is ungrouped', async () => {
    const tabs = new MockChromeTabsAPI();
    tabs.seedMockGroups([{ id: 7, title: 'Temporary', color: 'grey', collapsed: false }]);
    tabs.seedMockTabs([
      { id: 100, url: 'https://one.example', title: 'One', pinned: false, active: true, groupId: 7, windowId: 1, index: 0 },
    ]);

    expect((await tabs.ungroupTabs([100])).ok).toBe(true);

    expect(await tabs.getAllGroups()).toMatchObject({ ok: true, value: [] });
    expect(await tabs.createGroup([100], 7)).toMatchObject({
      ok: false,
      error: { type: 'InvalidGroupId', groupId: 7 },
    });
  });

  it('uses the configured current-window ID', async () => {
    const tabs = new MockChromeTabsAPI(2);
    const seededTabs: ChromeTab[] = [
      { id: 1, url: 'https://one.example', title: 'One', pinned: false, active: true, groupId: -1, windowId: 1, index: 0 },
      { id: 2, url: 'https://two.example', title: 'Two', pinned: false, active: true, groupId: -1, windowId: 2, index: 0 },
    ];
    tabs.seedMockTabs(seededTabs);

    const result = await tabs.queryTabs({ currentWindow: true });

    expect(result.ok && result.value.map(tab => tab.id)).toEqual([2]);
  });
});

// === SEAM-MOCK-02: Test fixtures → TabManager mock context ===
describe('MockTabManager event history', () => {
  it('prepends every event path and caps history at twenty entries', async () => {
    const manager = new MockTabManager();
    await manager.createGroup('Work', [100]);
    await manager.closeRandomTab({ excludePinned: false, excludeActive: false });
    await manager.recordBrowserEvent('PopupOpened');

    const events: BrowserEventName[] = [
      'TabOpened',
      'TabActivated',
      'TabClosed',
      'PopupOpened',
    ];
    for (let index = 0; index < 21; index += 1) {
      await manager.recordBrowserEvent(events[index % events.length]);
    }

    const context = await manager.getBrowserContext();

    expect(context.ok).toBe(true);
    if (!context.ok) return;
    expect(context.value.recentEvents).toHaveLength(20);
    expect(context.value.recentEvents[0]).toBe(events[20 % events.length]);
    expect(context.value.recentEvents).not.toContain('TabGroupCreated');
  });
});
