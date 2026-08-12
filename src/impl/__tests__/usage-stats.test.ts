/**
 * FILE: usage-stats.test.ts
 *
 * WHAT: Tests the durable usage-statistics read/modify/write seam.
 * WHY: Concurrent MV3 events must not lose increments and popup stats must survive suspension.
 * SEAMS: UsageStatsStore -> IChromeStorageAPI (SEAM-34)
 * CONTRACT: IUsageStatsStore v1.0.0
 * GENERATED: 2026-08-12
 */

import { describe, expect, it } from 'vitest';
import type { IChromeStorageAPI } from '../../contracts/IChromeStorageAPI';
import { ChromeUsageStatsStore } from '../ChromeStorageAPI';
import { Result } from '../../utils/Result';

class MemoryStorage implements IChromeStorageAPI {
  data: Record<string, unknown> = {};

  async get(keys: string | string[] | null) {
    await Promise.resolve();
    if (keys === null) return Result.ok({ ...this.data });
    const requested = Array.isArray(keys) ? keys : [keys];
    return Result.ok(Object.fromEntries(requested.filter(key => key in this.data).map(key => [key, this.data[key]])));
  }

  async set(items: Record<string, unknown>) {
    await Promise.resolve();
    Object.assign(this.data, items);
    return Result.ok(undefined);
  }

  async remove(keys: string | string[]) {
    for (const key of Array.isArray(keys) ? keys : [keys]) delete this.data[key];
    return Result.ok(undefined);
  }

  async clear() {
    this.data = {};
    return Result.ok(undefined);
  }

  async getBytesInUse(_keys: string | string[] | null) {
    return Result.ok(JSON.stringify(this.data).length);
  }
}

describe('ChromeUsageStatsStore', () => {
  it('returns a zeroed, versioned snapshot when storage is empty', async () => {
    const result = await new ChromeUsageStatsStore(new MemoryStorage()).get();
    expect(result.ok && result.value).toMatchObject({
      schemaVersion: 1,
      quipsDelivered: 0,
      groupsCreated: 0,
      tabsClosed: 0,
      luckyClicks: 0,
      lastUpdated: null
    });
  });

  it('serializes concurrent increments without losing updates', async () => {
    const store = new ChromeUsageStatsStore(new MemoryStorage());
    await Promise.all(Array.from({ length: 25 }, () => store.increment('quipsDelivered')));
    const result = await store.get();
    expect(result.ok && result.value.quipsDelivered).toBe(25);
  });

  it('repairs malformed persisted counters instead of leaking NaN or negatives', async () => {
    const storage = new MemoryStorage();
    storage.data['usageStats.v1'] = { schemaVersion: 99, quipsDelivered: -4, groupsCreated: 'bad' };
    const result = await new ChromeUsageStatsStore(storage).get();
    expect(result.ok && result.value).toMatchObject({ quipsDelivered: 0, groupsCreated: 0 });
  });
});
