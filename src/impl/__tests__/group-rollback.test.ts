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

describe('createGroup compensation', () => {
  it('ungroups selected tabs and returns the title failure when updating the new group fails', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(3));
    tabs.updateGroup = vi.fn(async () => Result.error({ type: 'ChromeAPIFailure', details: 'title failed', originalError: new Error('title failed') }));
    const manager = new TabManager(tabs, new MockHumorSystem());

    const result = await manager.createGroup('Work', [1, 2]);

    expect(result.ok).toBe(false);
    expect(tabs.ungroupTabsCalls).toEqual([{ tabIds: [1, 2] }]);
    if (!result.ok) expect(result.error.details).toContain('rolled back');
  });

  it('reports both failures when compensation also fails', async () => {
    const tabs = new MockChromeTabsAPI(createMockTabs(3));
    tabs.updateGroup = vi.fn(async () => Result.error({ type: 'ChromeAPIFailure', details: 'title failed', originalError: 'title' }));
    tabs.ungroupTabs = vi.fn(async () => Result.error({ type: 'ChromeAPIFailure', details: 'rollback failed', originalError: 'rollback' }));
    const manager = new TabManager(tabs, new MockHumorSystem());

    const result = await manager.createGroup('Work', [1, 2]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details).toContain('failed to roll back');
      expect(result.error).toHaveProperty('originalError.updateError');
      expect(result.error).toHaveProperty('originalError.rollbackError');
    }
  });
});
