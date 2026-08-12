/**
 * FILE: chrome-wrappers.test.ts
 *
 * WHAT: Contract-level tests for Chrome API wrapper edge cases.
 * WHY: Values returned by Chrome must cross wrapper seams without truthiness corruption.
 * SEAMS: Chrome APIs -> wrappers (SEAM-25, SEAM-26, SEAM-27)
 * CONTRACTS: IChromeTabsAPI v1.1.0, IChromeNotificationsAPI v1.0.0
 * GENERATED: 2026-08-12
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChromeNotificationsAPI } from '../ChromeNotificationsAPI';
import { ChromeStorageAPI } from '../ChromeStorageAPI';
import { ChromeTabsAPI } from '../ChromeTabsAPI';

describe('Chrome wrappers', () => {
  const group = vi.fn();
  const query = vi.fn();
  const updateGroup = vi.fn();
  const clearNotification = vi.fn();
  const updateNotification = vi.fn();
  const createNotification = vi.fn();
  const getURL = vi.fn((path: string) => `chrome-extension://test/${path}`);
  const removeTab = vi.fn();
  const ungroup = vi.fn();
  const queryGroups = vi.fn();
  const storageGet = vi.fn();
  const storageSet = vi.fn();
  const storageRemove = vi.fn();
  const storageClear = vi.fn();
  const getBytesInUse = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('chrome', {
      runtime: { getURL, lastError: undefined },
      tabs: {
        group,
        query,
        remove: removeTab,
        ungroup
      },
      tabGroups: { update: updateGroup, query: queryGroups },
      notifications: {
        create: createNotification,
        clear: clearNotification,
        update: updateNotification
      },
      storage: {
        local: {
          get: storageGet,
          set: storageSet,
          remove: storageRemove,
          clear: storageClear,
          getBytesInUse
        }
      }
    });
    queryGroups.mockResolvedValue([]);
    storageGet.mockResolvedValue({});
    storageSet.mockResolvedValue(undefined);
    storageRemove.mockResolvedValue(undefined);
    storageClear.mockResolvedValue(undefined);
    getBytesInUse.mockResolvedValue(12);
  });

  it('preserves group id zero when grouping, updating, and mapping tabs', async () => {
    group.mockResolvedValue(0);
    updateGroup.mockResolvedValue(undefined);
    query.mockResolvedValue([{
      id: 1,
      url: 'https://example.com',
      title: 'Example',
      pinned: false,
      active: true,
      groupId: 0,
      windowId: 1,
      index: 0
    }]);

    const api = new ChromeTabsAPI();
    const grouped = await api.createGroup([1], 0);
    const updated = await api.updateGroup(0, { title: 'Zero' });
    const tabs = await api.queryTabs({ currentWindow: true });

    expect(group).toHaveBeenCalledWith({ tabIds: [1], groupId: 0 });
    expect(grouped.ok && grouped.value).toBe(0);
    expect(updated.ok).toBe(true);
    expect(tabs.ok && tabs.value[0].groupId).toBe(0);
  });

  it('returns Chrome clear/update boolean values and uses the packaged fallback icon', async () => {
    clearNotification.mockResolvedValue(false);
    updateNotification.mockResolvedValue(false);
    createNotification.mockResolvedValue('ignored-by-explicit-id');
    const api = new ChromeNotificationsAPI();

    const created = await api.create({ title: 'Title', message: 'Message' });
    const cleared = await api.clear('gone');
    const updated = await api.update('gone', { title: 'Title', message: 'Message' });

    expect(created.ok).toBe(true);
    expect(getURL).toHaveBeenCalledWith('icons/icon128.png');
    expect(cleared.ok && cleared.value).toBe(false);
    expect(updated.ok && updated.value).toBe(false);
  });

  it('covers every tabs wrapper success path and maps browser values', async () => {
    group.mockResolvedValue(7);
    updateGroup.mockResolvedValue(undefined);
    removeTab.mockResolvedValue(undefined);
    ungroup.mockResolvedValue(undefined);
    query.mockResolvedValue([{ id: 3, windowId: 2, index: 4 }]);
    queryGroups.mockResolvedValue([{ id: 7, title: 'Work', color: 'blue', collapsed: true }]);
    const api = new ChromeTabsAPI();

    expect((await api.createGroup([3])).ok).toBe(true);
    expect((await api.updateGroup(7, { title: 'Work' })).ok).toBe(true);
    expect((await api.queryTabs({ currentWindow: true })).ok).toBe(true);
    expect((await api.removeTab(3)).ok).toBe(true);
    expect((await api.getAllGroups()).ok).toBe(true);
    expect((await api.ungroupTabs([3])).ok).toBe(true);
  });

  it('rejects invalid IDs and maps tab, group, permission, and generic failures', async () => {
    const api = new ChromeTabsAPI();
    expect((await api.createGroup([])).ok).toBe(false);
    expect((await api.createGroup([1], -1)).ok).toBe(false);
    expect((await api.updateGroup(-1, {})).ok).toBe(false);
    expect((await api.removeTab(0)).ok).toBe(false);
    expect((await api.ungroupTabs([])).ok).toBe(false);

    removeTab.mockRejectedValueOnce(new Error('No tab with id: 8'));
    expect((await api.removeTab(8)).ok).toBe(false);
    updateGroup.mockRejectedValueOnce(new Error('No group with id: 4'));
    expect((await api.updateGroup(4, {})).ok).toBe(false);
    query.mockRejectedValueOnce(new Error('Permission denied'));
    expect((await api.queryTabs({})).ok).toBe(false);
    queryGroups.mockRejectedValueOnce(new Error('unexpected'));
    expect((await api.getAllGroups()).ok).toBe(false);
  });

  it('validates notification input and maps notification errors', async () => {
    const api = new ChromeNotificationsAPI();
    expect((await api.create({ title: '', message: 'message' })).ok).toBe(false);
    expect((await api.create({ title: 'title', message: '' })).ok).toBe(false);
    expect((await api.create({ title: 'x'.repeat(257), message: 'message' })).ok).toBe(false);
    expect((await api.create({ title: 'title', message: 'x'.repeat(513) })).ok).toBe(false);
    expect((await api.create({ title: 'title', message: 'message', priority: 3 })).ok).toBe(false);
    expect((await api.create({ title: 'title', message: 'message', buttons: [{ title: 'a' }, { title: 'b' }, { title: 'c' }] })).ok).toBe(false);
    expect((await api.clear('')).ok).toBe(false);
    expect((await api.update('', { title: 'title', message: 'message' })).ok).toBe(false);

    createNotification.mockRejectedValueOnce(new Error('Permission denied'));
    expect((await api.create({ title: 'title', message: 'message' })).ok).toBe(false);
    clearNotification.mockRejectedValueOnce(new Error('notification not found'));
    expect((await api.clear('missing')).ok).toBe(false);
    updateNotification.mockRejectedValueOnce(new Error('unexpected'));
    expect((await api.update('id', { title: 'title', message: 'message' })).ok).toBe(false);
  });

  it('covers storage operations, serialization validation, and error mapping', async () => {
    const api = new ChromeStorageAPI();
    storageGet.mockResolvedValueOnce({ value: 1 });
    expect((await api.get('value')).ok).toBe(true);
    expect((await api.set({ value: 1 })).ok).toBe(true);
    expect((await api.remove('value')).ok).toBe(true);
    expect((await api.clear()).ok).toBe(true);
    expect((await api.getBytesInUse(null)).ok).toBe(true);

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect((await api.set({ cyclic })).ok).toBe(false);

    storageGet.mockRejectedValueOnce(new Error('Permission denied'));
    expect((await api.get(null)).ok).toBe(false);
    storageSet.mockRejectedValueOnce(new Error('QUOTA_BYTES quota'));
    expect((await api.set({ value: 1 })).ok).toBe(false);
    storageRemove.mockRejectedValueOnce(new Error('unexpected'));
    expect((await api.remove('value')).ok).toBe(false);
    storageClear.mockRejectedValueOnce(new Error('unexpected'));
    expect((await api.clear()).ok).toBe(false);
    getBytesInUse.mockRejectedValueOnce(new Error('unexpected'));
    expect((await api.getBytesInUse(null)).ok).toBe(false);
  });
});
