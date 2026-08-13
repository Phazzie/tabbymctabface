/**
 * FILE: HumorSystem.ts
 *
 * WHAT: Context-aware humor selection, notification delivery, and durable delivery accounting.
 *
 * WHY: Implements IHumorSystem without fabricating browser state or losing exact Easter egg identity.
 *
 * HOW DATA FLOWS:
 *   1. TabManager supplies a HumorTrigger (SEAM-11).
 *   2. A BrowserContext provider supplies current-window state (SEAM-19).
 *   3. EasterEggFramework matches context and QuipStorage resolves the exact id (SEAM-16, 17).
 *   4. NotificationsAPI delivers the quip, then usage stats persist success (SEAM-15, 33).
 *
 * SEAMS:
 *   IN: TabManager/UI -> HumorSystem (SEAM-11)
 *   OUT: HumorSystem -> BrowserContext/EasterEgg/QuipStorage/Notifications/UsageStats (SEAM-15, 16, 17, 19, 33)
 *
 * CONTRACT: IHumorSystem v1.1.0
 * GENERATED: 2026-08-12
 */

import {
  BrowserContext,
  EasterEggMatch,
  HumorError,
  HumorTrigger,
  IHumorSystem,
  QuipDeliveryResult
} from '../contracts/IHumorSystem';
import {
  type IEasterEggFramework,
  type SupportedEasterEggCustomCheck
} from '../contracts/IEasterEggFramework';
import { HumorLevel, IQuipStorage } from '../contracts/IQuipStorage';
import { IChromeNotificationsAPI } from '../contracts/IChromeNotificationsAPI';
import type { IUsageStatsStore } from '../contracts/IUsageStats';
import type { TabManagerError } from '../contracts/ITabManager';
import { Result } from '../utils/Result';

export interface HumorSystemOptions {
  minDeliveryIntervalMs?: number;
  random?: () => number;
}

export type BrowserContextProvider = () => Promise<Result<BrowserContext, TabManagerError>>;
type SelectedQuip = { quipText: string; isEasterEgg: boolean; easterEggId: string | null };

export class HumorSystem implements IHumorSystem {
  private readonly humorLevel: HumorLevel = 'default';
  private lastDeliveryTimestamp = 0;
  private lastDeliveredEasterEggId: string | null = null;
  private deliveryQueue: Promise<void> = Promise.resolve();
  private readonly minDeliveryInterval: number;
  private readonly random: () => number;
  private readonly recentQuips = new Set<string>();
  private readonly recentQuipsList: string[] = [];
  private readonly maxRecentQuips = 10;
  private browserContextProvider?: BrowserContextProvider;

  constructor(
    private readonly easterEggFramework: IEasterEggFramework,
    private readonly quipStorage: IQuipStorage,
    private readonly notificationsAPI: IChromeNotificationsAPI,
    browserContextProvider?: BrowserContextProvider,
    private readonly usageStats?: IUsageStatsStore,
    options: HumorSystemOptions = {}
  ) {
    this.browserContextProvider = browserContextProvider;
    this.minDeliveryInterval = options.minDeliveryIntervalMs ?? 5000;
    this.random = options.random ?? Math.random;
  }

  setBrowserContextProvider(provider: BrowserContextProvider): void {
    this.browserContextProvider = provider;
  }

  async deliverQuip(trigger: HumorTrigger): Promise<Result<QuipDeliveryResult, HumorError>> {
    const previousDelivery = this.deliveryQueue;
    let releaseDelivery!: () => void;
    this.deliveryQueue = new Promise(resolve => {
      releaseDelivery = resolve;
    });
    await previousDelivery;
    try {
      return await this.deliverQuipSerially(trigger);
    } finally {
      releaseDelivery();
    }
  }

  private async deliverQuipSerially(
    trigger: HumorTrigger
  ): Promise<Result<QuipDeliveryResult, HumorError>> {
    const now = Date.now();
    try {
      let context: BrowserContext | null = null;
      if (this.browserContextProvider) {
        const contextResult = await this.browserContextProvider();
        if (contextResult.ok) context = contextResult.value;
      }

      let preferredEventEgg: EasterEggMatch | undefined;
      const eventCustomChecks = customChecksForTrigger(trigger);
      if (context && eventCustomChecks.length > 0) {
        const eventCheck = await this.easterEggFramework.checkTriggers(context, {
          customChecks: eventCustomChecks
        });
        if (!eventCheck.ok) {
          return Result.error({ type: 'EasterEggCheckFailed', details: eventCheck.error.details });
        }
        preferredEventEgg = eventCheck.value ?? undefined;
      }

      if (now - this.lastDeliveryTimestamp < this.minDeliveryInterval) {
        const isNewEventEgg = preferredEventEgg !== undefined
          && preferredEventEgg.easterEggId !== this.lastDeliveredEasterEggId;
        if (!isNewEventEgg) return this.throttledResult(now);
      }

      const quipResult = await this.selectQuipForTrigger(trigger, context, preferredEventEgg);
      if (!quipResult.ok) return quipResult;
      return this.deliverAndEmit(
        quipResult.value.quipText,
        quipResult.value.isEasterEgg,
        quipResult.value.easterEggId,
        now
      );
    } catch (error) {
      return Result.error({
        type: 'PersonalityFailure',
        details: 'Unexpected error during quip delivery',
        originalError: error
      });
    }
  }

  async checkEasterEggs(context: BrowserContext): Promise<Result<EasterEggMatch | null, HumorError>> {
    try {
      const result = await this.easterEggFramework.checkTriggers(context);
      if (!result.ok) {
        return Result.error({ type: 'EasterEggCheckFailed', details: result.error.details });
      }
      return Result.ok(result.value);
    } catch (error) {
      return Result.error({
        type: 'EasterEggCheckFailed',
        details: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  private async selectQuipForTrigger(
    trigger: HumorTrigger,
    context: BrowserContext | null,
    preferredEasterEgg?: EasterEggMatch
  ): Promise<Result<SelectedQuip, HumorError>> {
    const easterEggQuip = await this.resolveEasterEggQuip(context, preferredEasterEgg);
    if (!easterEggQuip.ok) return easterEggQuip;
    if (easterEggQuip.value) return Result.ok(easterEggQuip.value);

    const passiveAggressiveQuips = await this.quipStorage.getPassiveAggressiveQuips(this.humorLevel, trigger.type);
    if (!passiveAggressiveQuips.ok) {
      return Result.error({
        type: 'NoQuipsAvailable',
        details: 'Failed to fetch passive-aggressive quips',
        triggerType: trigger.type
      });
    }
    const selected = this.selectRandomQuip(passiveAggressiveQuips.value.map(quip => quip.text));
    if (!selected) {
      return Result.error({ type: 'NoQuipsAvailable', details: 'No quips found for trigger', triggerType: trigger.type });
    }
    return Result.ok({ quipText: selected, isEasterEgg: false, easterEggId: null });
  }

  private async resolveEasterEggQuip(
    context: BrowserContext | null,
    preferredEasterEgg?: EasterEggMatch
  ): Promise<Result<SelectedQuip | null, HumorError>> {
    if (!context) return Result.ok(null);

    let match: EasterEggMatch | null | undefined = preferredEasterEgg;
    if (match === undefined) {
      const result = await this.easterEggFramework.checkTriggers(context);
      if (!result.ok) {
        return Result.error({ type: 'EasterEggCheckFailed', details: result.error.details });
      }
      match = result.value;
    }
    if (!match) return Result.ok(null);

    const quips = await this.fetchExactEasterEggQuip(match);
    if (!quips.ok) return quips;
    const selected = this.selectRandomQuip(quips.value);
    return Result.ok(selected
      ? { quipText: selected, isEasterEgg: true, easterEggId: match.easterEggId }
      : null);
  }

  private async fetchExactEasterEggQuip(match: EasterEggMatch): Promise<Result<string[], HumorError>> {
    const allEggs = await this.quipStorage.getAllEasterEggQuips();
    if (!allEggs.ok) {
      return Result.error({ type: 'NoQuipsAvailable', details: 'Failed to fetch Easter egg quips', triggerType: match.easterEggType });
    }
    const exact = allEggs.value.find(egg => egg.id === match.easterEggId);
    if (exact) return Result.ok(exact.quips);

    // Backward-compatible fallback for custom frameworks that return only a type.
    const byType = await this.quipStorage.getEasterEggQuips(match.easterEggType, this.humorLevel);
    if (!byType.ok) {
      return Result.error({ type: 'NoQuipsAvailable', details: 'Matched Easter egg content was not found', triggerType: match.easterEggType });
    }
    return Result.ok(byType.value.flatMap(egg => egg.quips));
  }

  private async deliverAndEmit(
    quipText: string,
    isEasterEgg: boolean,
    easterEggId: string | null,
    timestamp: number
  ): Promise<Result<QuipDeliveryResult, HumorError>> {
    const deliveryResult = await this.deliverNotification(quipText, isEasterEgg);
    if (!deliveryResult.ok) return deliveryResult;

    this.lastDeliveryTimestamp = timestamp;
    if (easterEggId !== null) this.lastDeliveredEasterEggId = easterEggId;
    this.addToRecentQuips(quipText);
    if (this.usageStats) {
      const statsResult = await this.usageStats.increment('quipsDelivered');
      if (!statsResult.ok) {
        console.warn('[TabbyMcTabface] Quip delivered, but usage counter could not be saved', statsResult.error);
      }
    }
    return Result.ok({
      delivered: true,
      quipText,
      deliveryMethod: 'chrome.notifications',
      isEasterEgg,
      timestamp
    });
  }

  private async deliverNotification(
    quipText: string,
    isEasterEgg: boolean
  ): Promise<Result<string, HumorError>> {
    const result = await this.notificationsAPI.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: isEasterEgg ? 'Skeptical Wombat found something' : 'TabbyMcTabface',
      message: quipText,
      priority: isEasterEgg ? 2 : 1
    });
    if (!result.ok) {
      return Result.error({ type: 'DeliveryFailed', details: result.error.details, deliveryMethod: 'chrome.notifications' });
    }
    return Result.ok(result.value);
  }

  private selectRandomQuip(quips: string[]): string | null {
    if (quips.length === 0) return null;
    const fresh = quips.filter(quip => !this.recentQuips.has(quip));
    const pool = fresh.length > 0 ? fresh : quips;
    const index = Math.min(pool.length - 1, Math.floor(this.random() * pool.length));
    return pool[index];
  }

  private throttledResult(timestamp: number): Result<QuipDeliveryResult, HumorError> {
    return Result.ok({
      delivered: false,
      quipText: null,
      deliveryMethod: 'none',
      isEasterEgg: false,
      timestamp
    });
  }

  private addToRecentQuips(quip: string): void {
    this.recentQuips.add(quip);
    this.recentQuipsList.unshift(quip);
    if (this.recentQuipsList.length > this.maxRecentQuips) {
      const oldest = this.recentQuipsList.pop();
      if (oldest) this.recentQuips.delete(oldest);
    }
  }

}

function customChecksForTrigger(trigger: HumorTrigger): SupportedEasterEggCustomCheck[] {
  if (trigger.type === 'TabOpened') {
    return ['rapid-tab-opening', 'new-tab-opened-while-tabs-exist'];
  }
  if (trigger.type === 'TabClosed') {
    return ['tab-just-closed'];
  }
  if (trigger.type === 'FeelingLuckyClicked' && trigger.data.type === 'TabClosed') {
    return ['tab-just-closed'];
  }
  if (trigger.data.type !== 'ManualTrigger') return [];

  switch (trigger.data.event) {
    case 'KonamiCodeEntered':
      return ['konami-code-entered'];
    default:
      return [];
  }
}
