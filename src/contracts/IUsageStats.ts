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

// === SEAM-33: TabManager/HumorSystem → UsageStatsStore ===
// === SEAM-34: UsageStatsStore → IChromeStorageAPI ===
// === SEAM-35: Background/Popup → UsageStatsStore ===

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
  /**
   * Return a validated statistics snapshot.
   * DATA IN: None.
   * DATA OUT: Result<UsageStats, UsageStatsError>; missing/malformed fields normalize to zero.
   * SEAM: SEAM-35 (Background/Popup → UsageStatsStore), SEAM-34 (store → Chrome storage).
   * FLOW: Read the versioned key, map storage errors, normalize a defensive snapshot.
   * ERRORS: StorageReadFailed.
   * PERFORMANCE: Browser-I/O-bound; store overhead <5ms excluding storage latency.
   */
  get(): Promise<Result<UsageStats, UsageStatsError>>;

  /**
   * Increment one allow-listed counter through a serialized read/modify/write operation.
   * DATA IN: counter, one of UsageCounter.
   * DATA OUT: Result<UsageStats, UsageStatsError> containing the persisted snapshot.
   * SEAM: SEAM-33 (core → UsageStatsStore), SEAM-34 (store → Chrome storage).
   * FLOW: Queue mutation, read normalized state, increment, stamp time, and persist.
   * ERRORS: StorageReadFailed, StorageWriteFailed.
   * PERFORMANCE: Browser-I/O-bound; queue overhead <5ms excluding storage latency.
   */
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
