/**
 * FILE: IUsageStats.ts
 *
 * WHAT: Contract for durable, serialized usage-counter persistence.
 *
 * WHY: Popup statistics and ship-readiness telemetry must survive MV3 worker suspension.
 *
 * HOW DATA FLOWS:
 *   1. TabManager and HumorSystem report successful actions (SEAM-33).
 *   2. IUsageStatsStore serializes read/modify/write operations through Chrome storage (SEAM-34).
 *   3. Background and popup read a stable snapshot (SEAM-35).
 *
 * SEAMS:
 *   IN: TabManager/HumorSystem/Background -> UsageStatsStore (SEAM-33, SEAM-35)
 *   OUT: UsageStatsStore -> IChromeStorageAPI (SEAM-34)
 *
 * CONTRACT: IUsageStatsStore v1.0.0
 * GENERATED: 2026-08-12
 */

import { Result } from '../utils/Result';

export interface UsageStats {
  schemaVersion: 1;
  quipsDelivered: number;
  groupsCreated: number;
  tabsClosed: number;
  luckyClicks: number;
  lastUpdated: number | null;
}

export type UsageCounter =
  | 'quipsDelivered'
  | 'groupsCreated'
  | 'tabsClosed'
  | 'luckyClicks';

export type UsageStatsError =
  | { type: 'StorageReadFailed'; details: string; originalError: unknown }
  | { type: 'StorageWriteFailed'; details: string; originalError: unknown };

export interface IUsageStatsStore {
  /** Return a validated snapshot, using zeroes when no snapshot has been stored. */
  get(): Promise<Result<UsageStats, UsageStatsError>>;

  /** Increment exactly one counter through a serialized read/modify/write operation. */
  increment(counter: UsageCounter): Promise<Result<UsageStats, UsageStatsError>>;
}

export const EMPTY_USAGE_STATS: UsageStats = Object.freeze({
  schemaVersion: 1,
  quipsDelivered: 0,
  groupsCreated: 0,
  tabsClosed: 0,
  luckyClicks: 0,
  lastUpdated: null
});
