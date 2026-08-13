/**
 * FILE: group-rollback.test.ts
 * WHAT: Tests transactional compensation for partial group creation.
 * WHY: A failed group-title update must not leave an unnamed partial group behind.
 * SEAMS: TabManager -> IChromeTabsAPI create/update/ungroup (SEAM-02, 03)
 * CONTRACT: ITabManager.createGroup v1.1.0
 * GENERATED: 2026-08-12
 */

import { describe, expect, it, vi } from 'vitest';
import { TabManager } from '../TabManager';
import { MockChromeTabsAPI, createMockTabs } from './test-helpers';
import { MockHumorSystem } from '../../mocks/MockHumorSystem';
import { Result } from '../../utils/Result';
import type { ChromeAPIError } from '../../contracts/IChromeTabsAPI';

describe('createGroup compensation', () => {
  it('ungroups selected tabs and returns the title failure when updating the new group fails', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(3));
    tabs.updateGroup = vi.fn(async (): Promise<Result<void, ChromeAPIError>> => Result.error({ type: 'ChromeAPIFailure', details: 'title failed', originalError: new Error('title failed') }));
    const manager = new TabManager(tabs, new MockHumorSystem());

    const result = await manager.createGroup('Work', [1, 2]);

    expect(result.ok).toBe(false);
    expect(tabs.ungroupTabsCalls).toEqual([{ tabIds: [1, 2] }]);
    if (!result.ok) expect(result.error.details).toContain('rolled back');
  });

  it('reports both failures when compensation also fails', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(3));
    tabs.updateGroup = vi.fn(async (): Promise<Result<void, ChromeAPIError>> => Result.error({ type: 'ChromeAPIFailure', details: 'title failed', originalError: 'title' }));
    tabs.ungroupTabs = vi.fn(async (): Promise<Result<void, ChromeAPIError>> => Result.error({ type: 'ChromeAPIFailure', details: 'rollback failed', originalError: 'rollback' }));
    const manager = new TabManager(tabs, new MockHumorSystem());

    const result = await manager.createGroup('Work', [1, 2]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details).toContain('failed to roll back');
      expect(result.error).toHaveProperty('originalError.updateError');
      expect(result.error).toHaveProperty('originalError.rollbackError');
    }
  });

  it('restores selected tabs to source groups deleted by a failed create', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(4));
    expect((await tabs.createGroup([1, 2])).ok).toBe(true);
    expect((await tabs.createGroup([3, 4])).ok).toBe(true);
    await tabs.updateGroup(1, { title: 'First', color: 'blue', collapsed: true });
    await tabs.updateGroup(2, { title: 'Second', color: 'red', collapsed: false });
    const updateGroup = tabs.updateGroup.bind(tabs);
    tabs.updateGroup = vi.fn(async (groupId, properties): Promise<Result<void, ChromeAPIError>> => (
      properties.title === 'Combined'
        ? Result.error({ type: 'ChromeAPIFailure', details: 'title failed', originalError: 'title' })
        : updateGroup(groupId, properties)
    ));
    const manager = new TabManager(tabs, new MockHumorSystem());

    const result = await manager.createGroup('Combined', [1, 2, 3, 4]);
    const groups = await tabs.getAllGroups();

    expect(result.ok).toBe(false);
    expect(groups.ok && groups.value).toHaveLength(2);
    if (!groups.ok) return;
    const first = groups.value.find(group => group.title === 'First');
    const second = groups.value.find(group => group.title === 'Second');
    expect(first).toMatchObject({ color: 'blue', collapsed: true });
    expect(second).toMatchObject({ color: 'red', collapsed: false });
    if (!first || !second) return;
    const firstTabs = await tabs.queryTabs({ currentWindow: true, groupId: first.id });
    const secondTabs = await tabs.queryTabs({ currentWindow: true, groupId: second.id });
    expect(firstTabs.ok && firstTabs.value.map(tab => tab.id).sort()).toEqual([1, 2]);
    expect(secondTabs.ok && secondTabs.value.map(tab => tab.id).sort()).toEqual([3, 4]);
  });
});
