/**
 * FILE: EasterEggFramework.test.ts
 *
 * WHAT: Behavioral contract tests for contextual Easter-egg matching.
 *
 * WHY: Proves AND semantics, safe condition handling, and fair specificity selection.
 *
 * HOW DATA FLOWS:
 *   1. A deterministic storage seam supplies definitions (SEAM-17).
 *   2. BrowserContext crosses SEAM-16 into the framework.
 *   3. The framework evaluates every condition and returns a Result match.
 *
 * SEAMS:
 *   IN: HumorSystem → EasterEggFramework (SEAM-16)
 *   OUT: EasterEggFramework → QuipStorage (SEAM-17)
 *
 * CONTRACT: IEasterEggFramework v1.1.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import { describe, expect, it } from 'vitest';
import type { BrowserContext } from '../../contracts/ITabManager';
import type {
  EasterEggData,
  IQuipStorage,
  HumorLevel,
  QuipData
} from '../../contracts/IQuipStorage';
import { Result } from '../../utils/Result';
import { EasterEggFramework } from '../EasterEggFramework';

const baseContext: BrowserContext = {
  tabCount: 8,
  activeTab: {
    url: 'https://github.com/phazzie/tabbymctabface/pull/21',
    title: 'Ship TabbyMcTabface pull request',
    domain: 'github.com'
  },
  currentHour: 16,
  currentMinute: 30,
  currentDay: 5,
  currentMonth: 12,
  currentDate: '2026-12-04',
  currentTimestamp: 1_700_000_000_000,
  tabUrls: ['https://github.com/a', 'https://github.com/a'],
  duplicateTabCount: 1,
  recentEvents: ['TabReopened', 'TabClosed', 'TabOpened', 'TabOpened', 'TabOpened'],
  groupCount: 2
};

function egg(
  id: string,
  conditions: EasterEggData['conditions'],
  difficulty: NonNullable<EasterEggData['metadata']>['difficulty'] = 'common'
): EasterEggData {
  return {
    id,
    type: `type-${id}`,
    conditions,
    quips: [`Quip for ${id}`],
    level: 'default',
    metadata: { difficulty }
  };
}

class FixtureStorage implements IQuipStorage {
  constructor(private readonly eggs: EasterEggData[]) {}
  async initialize() { return Result.ok<void>(undefined); }
  async getPassiveAggressiveQuips(_level: HumorLevel, _triggerType?: string) {
    return Result.ok<QuipData[]>([]);
  }
  async getEasterEggQuips(type: string, _level: HumorLevel) {
    return Result.ok(this.eggs.filter(candidate => candidate.type === type));
  }
  async getAllEasterEggQuips(_level?: HumorLevel) { return Result.ok(this.eggs); }
  async getAvailableTriggerTypes() { return Result.ok<string[]>([]); }
  isInitialized() { return true; }
}

async function match(
  eggs: EasterEggData[],
  context: BrowserContext = baseContext,
  random: () => number = () => 0
) {
  const framework = new EasterEggFramework(new FixtureStorage(eggs), random);
  return framework.checkTriggers(context);
}

describe('EasterEggFramework condition contract', () => {
  it.each([
    ['exact tab count', { tabCount: 8 }],
    ['tab count range', { tabCount: { min: 5, max: 10 } }],
    ['domain regex', { domainRegex: '^github\\.com$' }],
    ['title text', { titleContains: 'tabbymctabface' }],
    ['URL text', { urlContains: '/pull/21' }],
    ['group count', { groupCount: { min: 1, max: 3 } }],
    ['normal hour range', { hourRange: { start: 9, end: 17 } }],
    ['overnight hour range', { hourRange: { start: 22, end: 17 } }]
  ] as const)('matches %s', async (_name, conditions) => {
    const result = await match([egg('EE-901', conditions)]);

    expect(result.ok && result.value?.easterEggId).toBe('EE-901');
  });

  it('applies all conditions with AND semantics', async () => {
    const passing = egg('EE-901', {
      tabCount: 8,
      domainRegex: '^github\\.com$',
      titleContains: 'ship',
      urlContains: '/pull/',
      groupCount: 2,
      hourRange: { start: 15, end: 17 }
    });
    const failing = egg('EE-902', { tabCount: 8, titleContains: 'not present' });

    const result = await match([failing, passing]);

    expect(result.ok && result.value?.easterEggId).toBe('EE-901');
    if (result.ok && result.value) {
      expect(result.value.matchedConditions).toEqual([
        'tabCount', 'domainRegex', 'hourRange', 'titleContains', 'urlContains', 'groupCount'
      ]);
    }
  });

  it.each([
    { domainRegex: 'github' },
    { titleContains: 'ship' },
    { urlContains: '/pull/' }
  ])('does not satisfy active-tab conditions when activeTab is null: %o', async conditions => {
    const result = await match(
      [egg('EE-901', conditions)],
      { ...baseContext, activeTab: null }
    );

    expect(result.ok && result.value).toBeNull();
  });

  it('returns a typed error for an invalid regular expression', async () => {
    const result = await match([egg('EE-901', { domainRegex: '[' })]);

    expect(result.ok).toBe(false);
    if (!result.ok && result.error.type === 'ConditionEvaluationFailed') {
      expect(result.error.type).toBe('ConditionEvaluationFailed');
      expect(result.error.conditionName).toBe('domainRegex');
    }
  });

  it('does not let an exact Chrome Web Store hostname rule match an attacker suffix', async () => {
    const conditions = {
      domainRegex: '(?:^|\\.)(chromewebstore\\.google\\.com|chrome\\.google\\.com)$'
    };
    const attacker = await match([egg('EE-901', conditions)], {
      ...baseContext,
      activeTab: {
        url: 'https://chromewebstore.google.com.attacker.example',
        title: 'Tabs',
        domain: 'chromewebstore.google.com.attacker.example'
      }
    });
    const legitimate = await match([egg('EE-901', conditions)], {
      ...baseContext,
      activeTab: {
        url: 'https://chromewebstore.google.com/detail/example',
        title: 'Tabs',
        domain: 'chromewebstore.google.com'
      }
    });

    expect(attacker.ok && attacker.value).toBeNull();
    expect(legitimate.ok && legitimate.value?.easterEggId).toBe('EE-901');
  });

  it('treats an unknown custom predicate as a safe non-match', async () => {
    const result = await match([egg(
      'EE-901',
      { customCheck: 'unknown-predicate' } as unknown as EasterEggData['conditions']
    )]);

    expect(result.ok && result.value).toBeNull();
  });
});

describe('EasterEggFramework custom-check contract', () => {
  it.each([
    ['timestamp-is-unix-milestone', baseContext],
    ['konami-code-entered', { ...baseContext, recentEvents: ['KonamiCodeEntered'] }],
    ['rapid-tab-opening', baseContext],
    ['time-after-midnight', { ...baseContext, currentHour: 3 }],
    ['time-exactly-midnight', { ...baseContext, currentHour: 0, currentMinute: 0 }],
    ['day-is-friday-after-3pm', baseContext],
    ['season-is-winter', baseContext],
    ['duplicate-tabs-detected', baseContext],
    ['tab-just-closed', { ...baseContext, recentEvents: ['TabClosed'] }],
    ['new-tab-opened-while-tabs-exist', { ...baseContext, recentEvents: ['TabOpened'] }],
    ['tab-closed-then-reopened', baseContext],
    ['ctrl-shift-t-pressed-3x', { ...baseContext, recentEvents: ['TabReopened', 'TabReopened', 'TabReopened'] }],
    ['date-is-march-14', { ...baseContext, currentDate: '2026-03-14', currentMonth: 3 }],
    ['date-is-may-4', { ...baseContext, currentDate: '2026-05-04', currentMonth: 5 }]
  ] as const)('evaluates %s from structural BrowserContext fields', async (customCheck, context) => {
    const result = await match([egg('EE-901', { customCheck })], context as BrowserContext);

    expect(result.ok && result.value?.easterEggId).toBe('EE-901');
  });

  it('requires every custom predicate input rather than guessing', async () => {
    const result = await match([
      egg('EE-901', { customCheck: 'konami-code-entered' })
    ], { ...baseContext, recentEvents: [] });

    expect(result.ok && result.value).toBeNull();
  });
});

describe('EasterEggFramework selection contract', () => {
  it('selects the most-specific match instead of allowing a broad early rule to shadow it', async () => {
    const broad = egg('EE-901', { tabCount: { min: 5 } }, 'legendary');
    const precise = egg('EE-902', {
      tabCount: 8,
      domainRegex: '^github\\.com$',
      titleContains: 'ship'
    }, 'common');

    const result = await match([broad, precise]);

    expect(result.ok && result.value?.easterEggId).toBe('EE-902');
  });

  it('uses injected weighted randomness only among top-equivalent matches', async () => {
    const common = egg('EE-901', { tabCount: 8 }, 'common');
    const legendary = egg('EE-902', { tabCount: 8 }, 'legendary');

    const lowRoll = await match([common, legendary], baseContext, () => 0);
    const highRoll = await match([common, legendary], baseContext, () => 0.99);

    expect(lowRoll.ok && lowRoll.value?.easterEggId).toBe('EE-901');
    expect(highRoll.ok && highRoll.value?.easterEggId).toBe('EE-902');
  });

  it('rejects duplicate runtime registrations', async () => {
    const framework = new EasterEggFramework(new FixtureStorage([egg('EE-901', { tabCount: 8 })]));
    await framework.initialize();
    const duplicate = framework.registerEasterEgg({
      id: 'EE-901',
      type: 'duplicate',
      conditions: { tabCount: 8 }
    });

    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.error.type).toBe('DuplicateEasterEggId');
  });

  it('derives registration priority so a caller cannot make a broad rule shadow a precise rule', async () => {
    const framework = new EasterEggFramework(new FixtureStorage([]));
    expect(framework.registerEasterEgg({
      id: 'EE-901',
      type: 'broad',
      conditions: { tabCount: { min: 1 } }
    }).ok).toBe(true);
    expect(framework.registerEasterEgg({
      id: 'EE-902',
      type: 'precise',
      conditions: { tabCount: 8, domainRegex: '^github\\.com$' }
    }).ok).toBe(true);

    const result = await framework.checkTriggers(baseContext);

    expect(result.ok && result.value?.easterEggId).toBe('EE-902');
    const definitions = framework.getAllEasterEggs();
    expect(definitions.ok && definitions.value.find(item => item.id === 'EE-902')?.priority)
      .toBeGreaterThan(definitions.ok
        ? definitions.value.find(item => item.id === 'EE-901')?.priority ?? 0
        : 0);
  });

  it.each([
    ['tabCount', { tabCount: { min: 9, max: 4 } }],
    ['groupCount', { groupCount: { min: Number.NaN, max: 4 } }]
  ] as const)('rejects invalid %s registration ranges', (_name, conditions) => {
    const framework = new EasterEggFramework(new FixtureStorage([]));
    const result = framework.registerEasterEgg({
      id: 'EE-999',
      type: 'invalid-range',
      conditions
    });

    expect(result.ok).toBe(false);
    if (!result.ok && result.error.type === 'InvalidConditions') {
      expect(result.error.violations.some(violation => violation.includes(_name))).toBe(true);
    }
  });
});
