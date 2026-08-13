/**
 * FILE: IHumorSystem.ts
 * 
 * WHAT: Contract for humor orchestration - delivers passive-aggressive quips and easter eggs
 * 
 * WHY: Defines interface for TabbyMcTabface's unique value proposition - injecting humor into tab management.
 *      Abstracts humor delivery from tab operations, enabling independent evolution of humor strategies.
 * 
 * HOW DATA FLOWS:
 *   1. TabManager/UI emits HumorTrigger event (SEAM-11)
 *   2. HumorSystem evaluates trigger and context
 *   3. HumorSystem queries IQuipStorage for available quips (SEAM-13)
 *   4. HumorSystem checks easter egg conditions (SEAM-16)
 *   5. HumorSystem delivers the selected quip via notifications (SEAM-15)
 * 
 * SEAMS:
 *   IN:  TabManager/UI → HumorSystem (SEAM-11: deliverQuip)
 *   OUT: HumorSystem → EasterEggFramework (SEAM-16: condition checking)
 *        HumorSystem → NotificationAPI (SEAM-15: delivery)
 * 
 * CONTRACT: IHumorSystem v1.0.0
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import type { BrowserContext, BrowserEventName } from './ITabManager';
export type { BrowserContext } from './ITabManager';

/**
 * CONTRACT: IHumorSystem
 * VERSION: 1.0.0
 * 
 * Humor orchestration interface providing:
 * - Passive-aggressive quip delivery
 * - Easter egg detection and delivery
 * - Quip deduplication (avoid repetition)
 * - Chrome notification delivery
 * 
 * PERFORMANCE:
 * - deliverQuip: <100ms total (95th percentile)
 * - checkEasterEggs: <50ms (95th percentile)
 * - Graceful degradation: Falls silent on errors rather than breaking UX
 */
export interface IHumorSystem {
  /**
   * Deliver a quip based on trigger event
   * 
   * SEAM: SEAM-11 (TabManager/UI → HumorSystem)
   * 
   * INPUT:
   *   - trigger: HumorTrigger {type, data, timestamp}
   * 
   * OUTPUT:
   *   - Success: QuipDeliveryResult {delivered, quipText, deliveryMethod}
   *   - Error: HumorError
   * 
   * ERRORS:
   *   - NoQuipsAvailable: No quips match trigger criteria
   *   - DeliveryFailed: Failed to show notification
   *   - PersonalityFailure: Unexpected orchestration failure
   * 
   * PERFORMANCE: <100ms total (95th percentile)
   * 
   * SIDE EFFECTS:
   *   - MAY call SEAM-16 (HumorSystem → EasterEggFramework)
   *   - Displays notification via SEAM-15
   *   - Updates internal quip history for deduplication
   * 
   * GRACEFUL DEGRADATION:
   *   - On error: Returns error Result but doesn't throw
   *   - Falls silent rather than breaking tab management UX
   * 
   * @param trigger - Event that triggered humor delivery
   * @returns Promise resolving to delivery result or error
   */
  deliverQuip(trigger: HumorTrigger): Promise<Result<QuipDeliveryResult, HumorError>>;

  /**
   * Check if current context matches any easter egg conditions
   * 
   * SEAM: SEAM-16 interaction (internal check)
   * 
   * INPUT:
   *   - context: BrowserContext (from SEAM-19)
   * 
   * OUTPUT:
   *   - Success: EasterEggMatch | null
   *   - Error: HumorError
   * 
   * PERFORMANCE: <50ms (95th percentile)
   * 
   * @param context - Current browser state
   * @returns Promise resolving to match or null
   */
  checkEasterEggs(context: BrowserContext): Promise<Result<EasterEggMatch | null, HumorError>>;

}

/**
 * Humor trigger event
 */
export interface HumorTrigger {
  type: HumorTriggerType;
  data: HumorTriggerData;
  timestamp: number;
}

/**
 * Types of events that trigger humor
 */
export type HumorTriggerType =
  | 'TabGroupCreated'
  | 'TabClosed'
  | 'FeelingLuckyClicked'
  | 'TabOpened'
  | 'TooManyTabs'
  | 'ManualTrigger';

/**
 * Data associated with humor trigger
 */
export type HumorTriggerData =
  | { type: 'TabGroupCreated'; groupName: string; tabCount: number }
  | { type: 'TabClosed'; tabTitle: string; tabUrl: string; trigger: 'FeelingLucky' | 'Manual' }
  | { type: 'TabOpened'; tabUrl: string; tabTitle: string }
  | { type: 'TooManyTabs'; tabCount: number }
  | { type: 'ManualTrigger'; event?: BrowserEventName };

/**
 * Result of quip delivery attempt
 */
export interface QuipDeliveryResult {
  delivered: boolean;
  quipText: string | null;
  deliveryMethod: 'popup' | 'chrome.notifications' | 'none';
  isEasterEgg: boolean;
  timestamp: number;
}

/**
 * Easter egg match result
 */
export interface EasterEggMatch {
  easterEggId: string;
  easterEggType: string;
  matchedConditions: string[];
  priority: number; // Higher = more important
}

/**
 * Humor System error types
 */
export type HumorError =
  | { type: 'NoQuipsAvailable'; details: string; triggerType: string }
  | { type: 'DeliveryFailed'; details: string; deliveryMethod: string }
  | { type: 'PersonalityFailure'; details: string; originalError: unknown }
  | { type: 'EasterEggCheckFailed'; details: string };

/**
 * Type guard for easter egg delivery
 */
export function isEasterEggDelivery(
  result: QuipDeliveryResult
): boolean {
  return result.isEasterEgg === true;
}
