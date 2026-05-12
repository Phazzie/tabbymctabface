/**
 * FILE: HumorSystem.ts
 *
 * WHAT: Real humor orchestration system coordinating easter eggs, quips, and notifications
 *
 * WHY: Implements IHumorSystem contract for TabbyMcTabface's core value proposition.
 *
 * CONTRACT: IHumorSystem v1.0.0
 * GENERATED: 2025-10-13
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

export class HumorSystem implements IHumorSystem {
  private humorLevel: HumorLevel = 'default';
  private lastDeliveryTimestamp = 0;
  private readonly minDeliveryInterval = 5000;
  private recentQuips: Set<string> = new Set();
  private recentQuipsList: string[] = [];
  private readonly maxRecentQuips = 10;
  private notificationObservers: Array<(value: QuipNotification) => void> = [];
  private eventHandlers = new Map<TabEventType, Array<(event: TabEvent) => void>>();

  constructor(
    private readonly easterEggFramework: IEasterEggFramework,
    private readonly quipStorage: IQuipStorage,
    private readonly notificationsAPI: IChromeNotificationsAPI
  ) { }

  notifications$: Observable<QuipNotification> = {
    subscribe: (observer: (value: QuipNotification) => void): Subscription => {
      this.notificationObservers.push(observer);
      return {
        unsubscribe: () => {
          const index = this.notificationObservers.indexOf(observer);
          if (index > -1) this.notificationObservers.splice(index, 1);
        }
      };
    }
  };

  async deliverQuip(trigger: HumorTrigger): Promise<Result<QuipDeliveryResult, HumorError>> {
    const now = Date.now();
    if (now - this.lastDeliveryTimestamp < this.minDeliveryInterval) {
      return Result.ok({ delivered: false, quipText: null, deliveryMethod: 'none', isEasterEgg: false, timestamp: now });
    }
    try {
      const context = this.buildContextFromTrigger(trigger);
      const quipResult = await this.selectQuipForTrigger(trigger, context);
      if (!quipResult.ok) return quipResult;
      const { quipText, isEasterEgg } = quipResult.value;
      return await this.deliverAndEmit(quipText, isEasterEgg, now);
    } catch (error) {
      return Result.error({ type: 'PersonalityFailure', details: 'Unexpected error during quip delivery', originalError: error });
    }
  }

  private async selectQuipForTrigger(trigger: HumorTrigger, context: BrowserContext): Promise<Result<{ quipText: string; isEasterEgg: boolean }, HumorError>> {
    const easterEggResult = await this.easterEggFramework.checkTriggers(context);
    let selectedQuip: string | null = null;
    let isEasterEgg = false;
    if (easterEggResult.ok && easterEggResult.value) {
      const match = easterEggResult.value;
      const easterEggQuips = await this.fetchEasterEggQuip(match);
      if (easterEggQuips.ok && easterEggQuips.value.length > 0) {
        selectedQuip = this.selectRandomQuip(easterEggQuips.value);
        isEasterEgg = true;
      }
    }
    if (!selectedQuip) {
      const passiveAggressiveQuips = await this.fetchPassiveAggressiveQuip(trigger.type);
      if (passiveAggressiveQuips.ok && passiveAggressiveQuips.value.length > 0) {
        selectedQuip = this.selectRandomQuip(passiveAggressiveQuips.value);
      }
    }
    if (!selectedQuip) {
      return Result.error({ type: 'NoQuipsAvailable', details: 'No quips found for trigger', triggerType: trigger.type });
    }
    return Result.ok({ quipText: selectedQuip, isEasterEgg });
  }

  private async deliverAndEmit(quipText: string, isEasterEgg: boolean, timestamp: number): Promise<Result<QuipDeliveryResult, HumorError>> {
    const deliveryResult = await this.deliverNotification(quipText, isEasterEgg);
    if (!deliveryResult.ok) {
      return Result.error({ type: 'DeliveryFailed', details: 'Failed to create notification', deliveryMethod: 'chrome.notifications' });
    }
    this.lastDeliveryTimestamp = timestamp;
    this.addToRecentQuips(quipText);
    const notification: QuipNotification = { id: deliveryResult.value, quipText, isEasterEgg, timestamp, displayDuration: 5000 };
    this.emitNotification(notification);
    return Result.ok({ delivered: true, quipText, deliveryMethod: 'chrome.notifications', isEasterEgg, timestamp });
  }

  async checkEasterEggs(context: BrowserContext): Promise<Result<EasterEggMatch | null, HumorError>> {
    try {
      const result = await this.easterEggFramework.checkTriggers(context);
      if (!result.ok) {
        return Result.error({ type: 'EasterEggCheckFailed', details: 'Easter egg framework check failed' });
      }
      return Result.ok(result.value);
    } catch (error) {
      return Result.error({ type: 'EasterEggCheckFailed', details: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` });
    }
  }

  onTabEvent(eventType: TabEventType, handler: (event: TabEvent) => void): UnsubscribeFn {
    if (!this.eventHandlers.has(eventType)) this.eventHandlers.set(eventType, []);
    const handlers = this.eventHandlers.get(eventType)!;
    handlers.push(handler);
    return () => {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    };
  }

  setHumorLevel(level: HumorLevel): Result<void, HumorError> {
    this.humorLevel = level;
    return Result.ok(undefined);
  }

  getHumorLevel(): HumorLevel { return this.humorLevel; }

  /**
   * Build browser context from trigger event.
   * Populates context fields from trigger.data where available
   * so easter egg evaluation has real data to work with.
   */
  private buildContextFromTrigger(trigger: HumorTrigger): BrowserContext {
    const context: BrowserContext = {
      tabCount: 0,
      activeTab: null,
      currentHour: new Date().getHours(),
      recentEvents: [trigger.type],
      groupCount: 0
    };

    // Populate fields from trigger data where available
    if (trigger.data.type === 'TabGroupCreated') {
      context.tabCount = (trigger.data as any).tabCount ?? 0;
      context.recentEvents.push('TabGroupCreated');
    } else if (trigger.data.type === 'TabClosed') {
      const tabUrl: string = (trigger.data as any).tabUrl ?? '';
      const tabTitle: string = (trigger.data as any).tabTitle ?? '';
      if (tabUrl) {
        let domain = '';
        try { domain = new URL(tabUrl).hostname; } catch { domain = ''; }
        context.activeTab = { url: tabUrl, title: tabTitle, domain };
      }
      context.recentEvents.push('TabClosed');
    }

    return context;
  }

  private async fetchEasterEggQuip(match: EasterEggMatch): Promise<Result<string[], HumorError>> {
    const result = await this.quipStorage.getEasterEggQuips(match.easterEggType, this.humorLevel);
    if (!result.ok) {
      return Result.error({ type: 'NoQuipsAvailable', details: 'Failed to fetch easter egg quips', triggerType: match.easterEggType });
    }
    const quipTexts = result.value.flatMap(egg => egg.quips);
    return Result.ok(quipTexts);
  }

  private async fetchPassiveAggressiveQuip(triggerType: string): Promise<Result<string[], HumorError>> {
    const result = await this.quipStorage.getPassiveAggressiveQuips(this.humorLevel, triggerType);
    if (!result.ok) {
      return Result.error({ type: 'NoQuipsAvailable', details: 'Failed to fetch passive-aggressive quips', triggerType });
    }
    const quipTexts = result.value.map(quip => quip.text);
    return Result.ok(quipTexts);
  }

  private selectRandomQuip(quips: string[]): string | null {
    if (quips.length === 0) return null;
    const availableQuips = quips.filter(quip => !this.recentQuips.has(quip));
    const selectionPool = availableQuips.length > 0 ? availableQuips : quips;
    return selectionPool[Math.floor(Math.random() * selectionPool.length)];
  }

  /**
   * Deliver notification via Chrome notifications API.
   * Uses 'icons/icon128.png' — correct path relative to extension root.
   */
  private async deliverNotification(quipText: string, isEasterEgg: boolean): Promise<Result<string, HumorError>> {
    const title = isEasterEgg ? '🥚 Easter Egg!' : 'TabbyMcTabface';
    const result = await this.notificationsAPI.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title,
      message: quipText,
      priority: isEasterEgg ? 2 : 1
    });
    if (!result.ok) {
      return Result.error({ type: 'DeliveryFailed', details: 'Notification creation failed', deliveryMethod: 'chrome.notifications' });
    }
    return Result.ok(result.value);
  }

  private addToRecentQuips(quip: string): void {
    this.recentQuips.add(quip);
    this.recentQuipsList.unshift(quip);
    if (this.recentQuipsList.length > this.maxRecentQuips) {
      const oldest = this.recentQuipsList.pop();
      if (oldest) this.recentQuips.delete(oldest);
    }
  }

  private emitNotification(notification: QuipNotification): void {
    for (const observer of this.notificationObservers) {
      try { observer(notification); } catch (error) { console.error('Observer error:', error); }
    }
  }

  private _emitTabEvent(event: TabEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (!handlers) return;
    for (const handler of handlers) {
      try { handler(event); } catch (error) { console.error('Tab event handler error:', error); }
    }
  }
}
