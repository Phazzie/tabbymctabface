/**
 * FILE: IRuntimeMessaging.ts
 *
 * WHAT: Wire-safe request and response contracts for popup/background messaging.
 *
 * WHY: MV3 messages cross a structured-clone seam and must not contain Result methods or unchecked data.
 *
 * HOW DATA FLOWS:
 *   1. Popup sends a RuntimeRequest (SEAM-30).
 *   2. Background validates the discriminated request before invoking core contracts.
 *   3. Background converts domain Results into function-free WireResults (SEAM-31).
 *
 * SEAMS:
 *   IN: Popup/Chrome runtime -> Background (SEAM-30)
 *   OUT: Background -> Popup/Chrome runtime (SEAM-31)
 *
 * CONTRACT: RuntimeMessaging v1.0.0
 * GENERATED: 2026-08-12
 */

import type { BrowserContext, BrowserEventName, RandomTabOptions } from './ITabManager';
import type { UsageStats } from './IUsageStats';

export type RuntimeRequest =
  | { action: 'createGroup'; groupName: string; tabIds: number[] }
  | { action: 'closeRandomTab'; options?: RandomTabOptions }
  | { action: 'getAllGroups' }
  | { action: 'getCurrentTabs' }
  | { action: 'getBrowserContext' }
  | { action: 'getUsageStats' }
  | { action: 'getStats' }
  | { action: 'recordBrowserEvent'; event: BrowserEventName };

export interface PopupStats {
  browser: BrowserContext;
  usage: UsageStats;
}

export type WireResult<T, E = { type: string; details: string }> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface RuntimeResponse<T = unknown, E = { type: string; details: string }> {
  result: WireResult<T, E>;
}

export type RuntimeMessageError =
  | { type: 'InvalidMessage'; details: string }
  | { type: 'InitializationFailed'; details: string }
  | { type: 'UnexpectedFailure'; details: string };
