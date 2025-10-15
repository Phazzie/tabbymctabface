/**
 * FILE: HumorSystem.ts
 *
 * WHAT: Real humor orchestration system coordinating easter eggs, quips, and notifications
 *
 * WHY: Implements IHumorSystem contract for TabbyMcTabface's core value proposition.
 *      Orchestrates humor delivery by evaluating context, selecting quips, and managing notifications.
 *
 * HOW DATA FLOWS:
 *   1. TabManager/UI calls deliverQuip with HumorTrigger (SEAM-11)
 *   2. HumorSystem builds BrowserContext from trigger data
 *   3. Checks EasterEggFramework for contextual triggers (SEAM-16)
 *   4. If easter egg match → fetch from QuipStorage (SEAM-17)
 *   5. Else → fetch passive-aggressive quips (SEAM-13)
 *   6. Deliver via ChromeNotificationsAPI (SEAM-15)
 *   7. Emit to notifications$ observable (SEAM-23)
 *
 * SEAMS:
 *   IN:  TabManager/UI → HumorSystem (SEAM-11)
 *   OUT: HumorSystem → EasterEggFramework (SEAM-16)
 *        HumorSystem → QuipStorage (SEAM-13, SEAM-17)
 *        HumorSystem → ChromeNotificationsAPI (SEAM-15)
 *        HumorSystem → UI Observable (SEAM-23)
 *
 * CONTRACT: IHumorSystem v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
 */

import {
  IHumorSystem,
  HumorTrigger,
  QuipDeliveryResult,
  HumorError,
  BrowserContext,
  EasterEggMatch,
  QuipNotification,
  TabEventType,
  TabEvent,
  UnsubscribeFn,
  Observable,
  Subscription
} from '../contracts/IHumorSystem';
import { IEasterEggFramework } from '../contracts/IEasterEggFramework';
import { IQuipStorage, HumorLevel } from '../contracts/IQuipStorage';
import { IChromeNotificationsAPI } from '../contracts/IChromeNotificationsAPI';
import { Result } from '../utils/Result';

/**
 * Real humor system implementation
 *
 * Orchestrates humor delivery through easter egg detection,
 * quip selection, and multi-channel notifications.
 * Manages throttling and deduplication.
 */
export class HumorSystem implements IHumorSystem {
  private humorLevel: HumorLevel = 'default';
  private lastDeliveryTimestamp = 0;
  private readonly minDeliveryInterval = 5000; // 5 seconds between quips
  private recentQuips: Set<string> = new Set(); // O(1) lookup
  private recentQuipsList: string[] = []; // Maintains order for FIFO
  private readonly maxRecentQuips = 10;
  private notificationObservers: Array<(value: QuipNotification) => void> = [];
  private eventHandlers = new Map<TabEventType, Array<(event: TabEvent) => void>>();

  /**
   * Constructor - inject all dependencies
   */
  constructor(
    private readonly easterEggFramework: IEasterEggFramework,
    private readonly quipStorage: IQuipStorage,
    private readonly notificationsAPI: IChromeNotificationsAPI
  ) { }

  /**
   * Observable stream of quip notifications
   *
   * SEAM: SEAM-23 (HumorSystem → UI)
   */
  notifications$: Observable<QuipNotification> = {
    subscribe: (observer: (value: QuipNotification) => void): Subscription => {
      this.notificationObservers.push(observer);
      return {
        unsubscribe: () => {
          const index = this.notificationObservers.indexOf(observer);
          if (index > -1) {
            this.notificationObservers.splice(index, 1);
          }
        }
      };
    }
  };

  /**
   * Deliver a quip based on trigger event
   *
   * DATA IN: trigger (HumorTrigger)
   * DATA OUT: Result<QuipDeliveryResult, HumorError>
   *
   * SEAM: SEAM-11 (TabManager/UI → HumorSystem)
   *
   * FLOW:
   *   1. Check throttling (avoid spam)
   *   2. Build browser context from trigger
   *   3. Check easter egg framework for matches (SEAM-16)
   *   4. If match → fetch easter egg quips (SEAM-17)
   *   5. Else → fetch passive-aggressive quips (SEAM-13)
   *   6. Select random quip (avoid duplicates)
   *   7. Deliver via notifications API (SEAM-15)
   *   8. Emit to observers (SEAM-23)
   *
   * ERRORS:
   *   - NoQuipsAvailable: No quips found for trigger
   *   - DeliveryFailed: Notification creation failed
   *
   * PERFORMANCE: <100ms (95th percentile)
   */
  async deliverQuip(trigger: HumorTrigger): Promise<Result<QuipDeliveryResult, HumorError>> {
    // Check throttling
    const now = Date.now();
    if (now - this.lastDeliveryTimestamp < this.minDeliveryInterval) {
      // Throttled - return success but don't deliver
      return Result.ok({
        delivered: false,
        quipText: null,
        deliveryMethod: 'none',
        isEasterEgg: false,
        timestamp: now
      });
    }

    try {
      // Build browser context
      const context = this.buildContextFromTrigger(trigger);

      // Select quip (easter egg or passive-aggressive)
      const quipResult = await this.selectQuipForTrigger(trigger, context);

      if (!quipResult.ok) {
        return quipResult;
      }

      const { quipText, isEasterEgg } = quipResult.value;

      // Deliver and emit
      return await this.deliverAndEmit(quipText, isEasterEgg, now);

    } catch (error) {
      return Result.error({
        type: 'PersonalityFailure',
        details: 'Unexpected error during quip delivery',
        originalError: error
      });
    }
  }

  /**
   * Select appropriate quip for trigger (easter egg or passive-aggressive)
   *
   * @private
   */
  private async selectQuipForTrigger(
    trigger: HumorTrigger,
    context: BrowserContext
  ): Promise<Result<{ quipText: string; isEasterEgg: boolean }, HumorError>> {
    // Check for easter eggs (SEAM-16)
    const easterEggResult = await this.easterEggFramework.checkTriggers(context);

    let selectedQuip: string | null = null;
    let isEasterEgg = false;

    if (easterEggResult.ok && easterEggResult.value) {
      // Easter egg matched!
      const match = easterEggResult.value;
      const easterEggQuips = await this.fetchEasterEggQuip(match);

      if (easterEggQuips.ok && easterEggQuips.value.length > 0) {
        selectedQuip = this.selectRandomQuip(easterEggQuips.value);
        isEasterEgg = true;
      }
    }

    // Fallback to passive-aggressive quips if no easter egg
    if (!selectedQuip) {
      const passiveAggressiveQuips = await this.fetchPassiveAggressiveQuip(trigger.type);

      if (passiveAggressiveQuips.ok && passiveAggressiveQuips.value.length > 0) {
        selectedQuip = this.selectRandomQuip(passiveAggressiveQuips.value);
      }
    }

    // No quips available
    if (!selectedQuip) {
      return Result.error({
        type: 'NoQuipsAvailable',
        details: 'No quips found for trigger',
        triggerType: trigger.type
      });
    }

    return Result.ok({ quipText: selectedQuip, isEasterEgg });
  }

  /**
   * Deliver notification and emit to observers
   *
   * @private
   */
  private async deliverAndEmit(
    quipText: string,
    isEasterEgg: boolean,
    timestamp: number
  ): Promise<Result<QuipDeliveryResult, HumorError>> {
    // Deliver notification (SEAM-15)
    const deliveryResult = await this.deliverNotification(quipText, isEasterEgg);

    if (!deliveryResult.ok) {
      return Result.error({
        type: 'DeliveryFailed',
        details: 'Failed to create notification',
        deliveryMethod: 'chrome.notifications'
      });
    }

    // Track delivery
    this.lastDeliveryTimestamp = timestamp;
    this.addToRecentQuips(quipText);

    // Emit to observers (SEAM-23)
    const notification: QuipNotification = {
      id: deliveryResult.value,
      quipText,
      isEasterEgg,
      timestamp,
      displayDuration: 5000
    };
    this.emitNotification(notification);

    // Return success
    return Result.ok({
      delivered: true,
      quipText,
      deliveryMethod: 'chrome.notifications',
      isEasterEgg,
      timestamp
    });
  }

  /**
   * Check if current context matches any easter egg conditions
   *
   * DATA IN: context (BrowserContext)
   * DATA OUT: Result<EasterEggMatch | null, HumorError>
   *
   * SEAM: SEAM-16 (→ EasterEggFramework)
   *
   * PERFORMANCE: <50ms (95th percentile)
   */
  async checkEasterEggs(
    context: BrowserContext
  ): Promise<Result<EasterEggMatch | null, HumorError>> {
    try {
      const result = await this.easterEggFramework.checkTriggers(context);

      if (!result.ok) {
        return Result.error({
          type: 'EasterEggCheckFailed',
          details: 'Easter egg framework check failed'
        });
      }

      return Result.ok(result.value);
    } catch (error) {
      return Result.error({
        type: 'EasterEggCheckFailed',
        details: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Subscribe to tab events for automatic humor triggers
   *
   * DATA IN: eventType, handler
   * DATA OUT: UnsubscribeFn
   *
   * SEAM: SEAM-04, SEAM-09 (TabManager → HumorSystem)
   */
  onTabEvent(
    eventType: TabEventType,
    handler: (event: TabEvent) => void
  ): UnsubscribeFn {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    const handlers = this.eventHandlers.get(eventType)!;
    handlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Set humor level (intensity)
   *
   * DATA IN: level (HumorLevel)
   * DATA OUT: Result<void, HumorError>
   */
  setHumorLevel(level: HumorLevel): Result<void, HumorError> {
    this.humorLevel = level;
    return Result.ok(undefined);
  }

  /**
   * Get current humor level
   *
   * DATA OUT: HumorLevel
   */
  getHumorLevel(): HumorLevel {
    return this.humorLevel;
  }

  /**
   * Build browser context from trigger event
   *
   * @private
   */
  private buildContextFromTrigger(trigger: HumorTrigger): BrowserContext {
    // Basic context - in real implementation, would query TabManager
    // For now, provide minimal context that works with easter eggs
    const context: BrowserContext = {
      tabCount: 0, // Would query chrome.tabs.query
      activeTab: null, // Would get active tab info
      currentHour: new Date().getHours(),
      recentEvents: [trigger.type],
      groupCount: 0 // Would query chrome.tabGroups
    };

    // Enhance with trigger data
    if (trigger.data.type === 'TabGroupCreated') {
      context.recentEvents.push('TabGroupCreated');
    } else if (trigger.data.type === 'TabClosed') {
      context.recentEvents.push('TabClosed');
    }

    return context;
  }

  /**
   * Fetch easter egg quip for matched easter egg
   *
   * SEAM: SEAM-17 (→ QuipStorage)
   *
   * @private
   */
  private async fetchEasterEggQuip(match: EasterEggMatch): Promise<Result<string[], HumorError>> {
    const result = await this.quipStorage.getEasterEggQuips(match.easterEggType, this.humorLevel);

    if (!result.ok) {
      return Result.error({
        type: 'NoQuipsAvailable',
        details: 'Failed to fetch easter egg quips',
        triggerType: match.easterEggType
      });
    }

    // Extract quip texts from EasterEggData
    const quipTexts = result.value.flatMap(egg => egg.quips);
    return Result.ok(quipTexts);
  }

  /**
   * Fetch passive-aggressive quip for trigger type
   *
   * SEAM: SEAM-13 (→ QuipStorage)
   *
   * @private
   */
  private async fetchPassiveAggressiveQuip(
    triggerType: string
  ): Promise<Result<string[], HumorError>> {
    const result = await this.quipStorage.getPassiveAggressiveQuips(
      this.humorLevel,
      triggerType
    );

    if (!result.ok) {
      return Result.error({
        type: 'NoQuipsAvailable',
        details: 'Failed to fetch passive-aggressive quips',
        triggerType
      });
    }

    // Extract quip texts from QuipData
    const quipTexts = result.value.map(quip => quip.text);
    return Result.ok(quipTexts);
  }

  /**
   * Select random quip from array, avoiding recent duplicates
   * Optimized: O(1) lookup using Set instead of O(n) array.includes()
   *
   * @private
   */
  private selectRandomQuip(quips: string[]): string | null {
    if (quips.length === 0) return null;

    // Filter out recently used quips - O(1) Set lookup
    const availableQuips = quips.filter(quip => !this.recentQuips.has(quip));

    // If all quips were recent, use any quip
    const selectionPool = availableQuips.length > 0 ? availableQuips : quips;

    // Random selection
    const randomIndex = Math.floor(Math.random() * selectionPool.length);
    return selectionPool[randomIndex];
  }

  /**
   * Deliver notification via Chrome API
   *
   * SEAM: SEAM-15 (→ ChromeNotificationsAPI)
   *
   * @private
   */
  private async deliverNotification(
    quipText: string,
    isEasterEgg: boolean
  ): Promise<Result<string, HumorError>> {
    const title = isEasterEgg ? '🎯 Easter Egg!' : 'TabbyMcTabface';

    const result = await this.notificationsAPI.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title,
      message: quipText,
      priority: isEasterEgg ? 2 : 1
    });

    if (!result.ok) {
      return Result.error({
        type: 'DeliveryFailed',
        details: 'Notification creation failed',
        deliveryMethod: 'chrome.notifications'
      });
    }

    return Result.ok(result.value);
  }

  /**
   * Add quip to recent history for deduplication
   * Maintains both Set (O(1) lookup) and List (FIFO ordering)
   *
   * @private
   */
  private addToRecentQuips(quip: string): void {
    this.recentQuips.add(quip);
    this.recentQuipsList.unshift(quip);

    // Keep only last N quips (FIFO)
    if (this.recentQuipsList.length > this.maxRecentQuips) {
      const oldest = this.recentQuipsList.pop();
      if (oldest) {
        this.recentQuips.delete(oldest);
      }
    }
  }

  /**
   * Emit notification to observers
   *
   * SEAM: SEAM-23 (→ UI Observable)
   *
   * @private
   */
  private emitNotification(notification: QuipNotification): void {
    for (const observer of this.notificationObservers) {
      try {
        observer(notification);
      } catch (error) {
        // Swallow observer errors to prevent cascading failures
        console.error('Observer error:', error);
      }
    }
  }

  /**
   * Emit tab event to registered handlers
   *
   * @private
   */
  private _emitTabEvent(event: TabEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('Tab event handler error:', error);
      }
    }
  }
}
