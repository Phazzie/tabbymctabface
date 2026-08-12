/**
 * FILE: humor-runtime.test.ts
 *
 * WHAT: Tests real browser-context injection, exact Easter egg selection, and stats persistence.
 * WHY: Humor chosen at one seam must be the same egg retrieved at the next seam.
 * SEAMS: HumorSystem -> TabManager/EasterEgg/QuipStorage/Notifications/Stats (SEAM-15, 16, 17, 33)
 * CONTRACT: IHumorSystem v1.1.0
 * GENERATED: 2026-08-12
 */

import { describe, expect, it, vi } from 'vitest';
import { HumorSystem } from '../HumorSystem';
import { Result } from '../../utils/Result';
import type { BrowserContext, HumorTrigger } from '../../contracts/IHumorSystem';
import type { EasterEggData, IQuipStorage } from '../../contracts/IQuipStorage';
import { MockChromeNotificationsAPI } from './test-helpers';

const context: BrowserContext = {
  tabCount: 73,
  activeTab: { url: 'https://everquest.com', title: 'EverQuest', domain: 'everquest.com' },
  currentHour: 19,
  currentMinute: 12,
  currentDay: 3,
  currentMonth: 8,
  currentDate: '2026-08-12',
  currentTimestamp: 1_786_563_120_000,
  recentEvents: ['TabOpened'],
  groupCount: 4,
  tabUrls: ['https://everquest.com'],
  duplicateTabCount: 0
};

const trigger: HumorTrigger = {
  type: 'ManualTrigger',
  data: { type: 'ManualTrigger' },
  timestamp: Date.now()
};

function storageWithEggs(eggs: EasterEggData[]): IQuipStorage {
  return {
    initialize: async () => Result.ok(undefined),
    getPassiveAggressiveQuips: async () => Result.ok([]),
    getEasterEggQuips: async () => Result.error({ type: 'DataCorrupted', details: 'level-filtered lookup must not be used', dataType: 'easter-eggs' }),
    getAllEasterEggQuips: async () => Result.ok(eggs),
    getAvailableTriggerTypes: async () => Result.ok([]),
    isInitialized: () => true
  };
}

describe('HumorSystem runtime seams', () => {
  it('passes the provider browser context to EasterEggFramework', async () => {
    const checkTriggers = vi.fn(async () => Result.ok(null));
    const system = new HumorSystem(
      { checkTriggers, registerEasterEgg: vi.fn(), getAllEasterEggs: vi.fn(), clearAll: vi.fn() },
      storageWithEggs([]),
      new MockChromeNotificationsAPI(),
      async () => Result.ok(context),
      undefined,
      { minDeliveryIntervalMs: 0 }
    );

    await system.deliverQuip(trigger);
    expect(checkTriggers).toHaveBeenCalledWith(context);
  });

  it('fetches the exact matched Easter egg id regardless of configured humor level', async () => {
    const eggs: EasterEggData[] = [
      { id: 'EE-WRONG', type: 'same-type', conditions: {}, quips: ['wrong'], level: 'default' },
      { id: 'EE-RIGHT', type: 'same-type', conditions: {}, quips: ['right'], level: 'intense' }
    ];
    const system = new HumorSystem(
      {
        checkTriggers: async () => Result.ok({ easterEggId: 'EE-RIGHT', easterEggType: 'same-type', matchedConditions: ['tabCount'], priority: 1 }),
        registerEasterEgg: vi.fn(),
        getAllEasterEggs: vi.fn(),
        clearAll: vi.fn()
      },
      storageWithEggs(eggs),
      new MockChromeNotificationsAPI(),
      async () => Result.ok(context),
      undefined,
      { minDeliveryIntervalMs: 0, random: () => 0 }
    );

    const result = await system.deliverQuip(trigger);
    expect(result.ok && result.value).toMatchObject({ quipText: 'right', isEasterEgg: true });
  });

  it('increments quipsDelivered only after a successful notification', async () => {
    const increment = vi.fn(async () => Result.ok({
      schemaVersion: 1 as const,
      quipsDelivered: 1,
      groupsCreated: 0,
      tabsClosed: 0,
      luckyClicks: 0,
      lastUpdated: Date.now()
    }));
    const system = new HumorSystem(
      { checkTriggers: async () => Result.ok(null), registerEasterEgg: vi.fn(), getAllEasterEggs: vi.fn(), clearAll: vi.fn() },
      {
        ...storageWithEggs([]),
        getPassiveAggressiveQuips: async () => Result.ok([{ id: 'PA-1', text: 'A quip', triggerTypes: ['ManualTrigger'], level: 'default' }])
      },
      new MockChromeNotificationsAPI(),
      async () => Result.ok(context),
      { get: vi.fn(), increment },
      { minDeliveryIntervalMs: 0 }
    );

    const result = await system.deliverQuip(trigger);
    expect(result.ok && result.value.delivered).toBe(true);
    expect(increment).toHaveBeenCalledOnce();
    expect(increment).toHaveBeenCalledWith('quipsDelivered');
  });

  it('lets a newly matched event egg through the throttle exactly once', async () => {
    const eventEgg: EasterEggData = {
      id: 'EE-EVENT',
      type: 'event-egg',
      conditions: { customCheck: 'konami-code-entered' },
      quips: ['Event egg'],
      level: 'mild'
    };
    const checkTriggers = vi.fn()
      .mockResolvedValueOnce(Result.ok(null))
      .mockResolvedValue(Result.ok({
        easterEggId: eventEgg.id,
        easterEggType: eventEgg.type,
        matchedConditions: ['customCheck'],
        priority: 35
      }));
    const system = new HumorSystem(
      { checkTriggers, registerEasterEgg: vi.fn(), getAllEasterEggs: vi.fn(), clearAll: vi.fn() },
      {
        ...storageWithEggs([eventEgg]),
        getPassiveAggressiveQuips: async () => Result.ok([
          { id: 'PA-1', text: 'Ordinary quip', triggerTypes: ['ManualTrigger'], level: 'default' }
        ])
      },
      new MockChromeNotificationsAPI(),
      async () => Result.ok(context),
      undefined,
      { minDeliveryIntervalMs: 60_000, random: () => 0 }
    );
    const eventTrigger: HumorTrigger = {
      type: 'ManualTrigger',
      data: { type: 'ManualTrigger', event: 'KonamiCodeEntered' },
      timestamp: Date.now()
    };

    const ordinary = await system.deliverQuip(trigger);
    const eventDelivery = await system.deliverQuip(eventTrigger);
    const repeatedEvent = await system.deliverQuip(eventTrigger);

    expect(ordinary.ok && ordinary.value.quipText).toBe('Ordinary quip');
    expect(eventDelivery.ok && eventDelivery.value).toMatchObject({
      delivered: true,
      quipText: 'Event egg',
      isEasterEgg: true
    });
    expect(repeatedEvent.ok && repeatedEvent.value.delivered).toBe(false);
  });
});
