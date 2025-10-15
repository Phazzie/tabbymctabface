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
 *   3. HumorSystem calls IHumorPersonality for quip selection (SEAM-12)
 *   4. Personality queries IQuipStorage for available quips (SEAM-13)
 *   5. HumorSystem checks easter egg conditions (SEAM-16)
 *   6. HumorSystem delivers quip via notifications (SEAM-15, SEAM-10)
 * 
 * SEAMS:
 *   IN:  TabManager/UI → HumorSystem (SEAM-11: deliverQuip)
 *        TabManager → HumorSystem (SEAM-04, 09: event subscriptions)
 *   OUT: HumorSystem → Personality (SEAM-12: quip selection)
 *        HumorSystem → EasterEggFramework (SEAM-16: condition checking)
 *        HumorSystem → NotificationAPI (SEAM-15: delivery)
 *        HumorSystem → UI (SEAM-10, 23: notifications observable)
 * 
 * CONTRACT: IHumorSystem v1.0.0
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';

/**
 * CONTRACT: IHumorSystem
 * VERSION: 1.0.0
 * 
 * Humor orchestration interface providing:
 * - Passive-aggressive quip delivery
 * - Easter egg detection and delivery
 * - Quip deduplication (avoid repetition)
 * - Multi-channel delivery (popup + chrome.notifications)
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
   *   - PersonalityFailure: Personality module returned error
   * 
   * PERFORMANCE: <100ms total (95th percentile)
   * 
   * SIDE EFFECTS:
   *   - Calls SEAM-12 (HumorSystem → Personality)
   *   - MAY call SEAM-16 (HumorSystem → EasterEggFramework)
   *   - Displays notification via SEAM-15 or SEAM-10
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

  /**
   * Observable stream of quip notifications for UI display
   * 
   * SEAM: SEAM-23 (HumorSystem → PopupUI)
   * 
   * OUTPUT: Observable<QuipNotification>
   * 
   * Emits whenever a quip is delivered, allowing UI to display in popup
   */
  notifications$: Observable<QuipNotification>;

  /**
   * Subscribe to tab events for automatic humor triggers
   * 
   * SEAM: SEAM-04, SEAM-09 (TabManager → HumorSystem events)
   * 
   * INPUT:
   *   - eventType: TabEventType
   *   - handler: (event: TabEvent) => void
   * 
   * OUTPUT: UnsubscribeFn
   * 
   * Allows HumorSystem to react to tab events automatically
   */
  onTabEvent(
    eventType: TabEventType,
    handler: (event: TabEvent) => void
  ): UnsubscribeFn;
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
  | { type: 'ManualTrigger' };

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
 * Notification for UI display
 */
export interface QuipNotification {
  id: string;
  quipText: string;
  isEasterEgg: boolean;
  timestamp: number;
  displayDuration: number; // ms
}

/**
 * Tab event types
 */
export type TabEventType =
  | 'created'
  | 'closed'
  | 'grouped'
  | 'ungrouped';

/**
 * Tab event data
 */
export interface TabEvent {
  type: TabEventType;
  tabId?: number;
  groupId?: number;
  timestamp: number;
  data: Record<string, any>;
}

/**
 * Browser context for easter egg evaluation
 * (Re-exported from ITabManager for convenience)
 */
export interface BrowserContext {
  tabCount: number;
  activeTab: {
    url: string;
    title: string;
    domain: string;
  } | null;
  currentHour: number;
  recentEvents: string[];
  groupCount: number;
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
 * Simple observable interface (can use RxJS or custom implementation)
 */
export interface Observable<T> {
  subscribe(observer: (value: T) => void): Subscription;
}

export interface Subscription {
  unsubscribe(): void;
}

export type UnsubscribeFn = () => void;

/**
 * Type guard for easter egg delivery
 */
export function isEasterEggDelivery(
  result: QuipDeliveryResult
): boolean {
  return result.isEasterEgg === true;
}
