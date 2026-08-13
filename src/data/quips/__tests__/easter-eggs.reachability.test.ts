/**
 * FILE: easter-eggs.reachability.test.ts
 *
 * WHAT: Proves every canonical Easter egg has at least one satisfiable browser context.
 *
 * WHY: Schema-valid content is still broken if its conditions can never select and retrieve a quip.
 *
 * HOW DATA FLOWS:
 *   1. Each canonical definition crosses the packaged-data seam (SEAM-14).
 *   2. A synthesized BrowserContext crosses SEAM-16 into the full production catalog.
 *   3. Selection samples prove each authored ID can win without isolated-test masking.
 *
 * SEAMS:
 *   IN: Packaged JSON → QuipStorage fixture (SEAM-14)
 *   OUT: BrowserContext → EasterEggFramework → QuipStorage (SEAM-16, SEAM-17)
 *
 * CONTRACT: IEasterEggFramework v1.1.0, IQuipStorage v1.1.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

// === SEAM-14: Packaged JSON → QuipStorage fixture ===
// === SEAM-16: BrowserContext → EasterEggFramework ===
// === SEAM-17: EasterEggFramework → QuipStorage fixture ===

import { describe, expect, it } from 'vitest';
import type { BrowserContext } from '../../../contracts/ITabManager';
import type { EasterEggData } from '../../../contracts/IQuipStorage';
import { EasterEggFramework } from '../../../impl/EasterEggFramework';
import { EASTER_EGGS } from '../../../impl/quip-data';
import { QuipStorage } from '../../../impl/QuipStorage';

/** Deliberately explicit so a novel regex cannot pass via a misleading string transformation. */
const CANDIDATE_DOMAINS = [
  'youtube.com',
  'reddit.com',
  'twitter.com',
  'google.com',
  'chatgpt.com',
  'claude.ai',
  'coinbase.com',
  'binance.com',
  'stackoverflow.com',
  'wikipedia.org',
  'github.com',
  'npmjs.com',
  'regex101.com',
  'news.ycombinator.com',
  'twitch.tv',
  'discord.com',
  'team.atlassian.net',
  'linkedin.com',
  'amazon.com',
  'developer.mozilla.org',
  'chromewebstore.google.com',
  'everquest.com',
  'eqresource.com',
  'spotify.com',
  'music.apple.com',
  'imdb.com',
  'developer.mozilla.org',
  'rfc-editor.org',
  'ietf.org',
  'britannica.com',
  'smithsonianmag.com',
  'history.com',
  'archive.org',
  'speedrun.com',
  'chess.com',
  'lichess.org',
  'boardgamegeek.com',
  'geoguessr.com',
  'wizards.com',
  'scryfall.com',
  'neocities.org',
  'winamp.com',
  'floodgap.com',
  'allrecipes.com',
  'foodnetwork.com',
  'microsoft.com',
  'weather.com',
  'noaa.gov',
  'city.gov'
] as const;
const PRODUCED_CUSTOM_CHECKS = new Set([
  'timestamp-is-unix-milestone',
  'konami-code-entered',
  'date-is-march-14',
  'date-is-may-4',
  'rapid-tab-opening',
  'time-after-midnight',
  'time-exactly-midnight',
  'day-is-friday-after-3pm',
  'season-is-winter',
  'duplicate-tabs-detected',
  'tab-just-closed',
  'new-tab-opened-while-tabs-exist'
]);
const EXACT_TAB_COUNTS = new Set(
  EASTER_EGGS.flatMap(egg => (
    typeof egg.conditions.tabCount === 'number' ? [egg.conditions.tabCount] : []
  ))
);
const EXACT_GROUP_COUNTS = new Set(
  EASTER_EGGS.flatMap(egg => (
    typeof egg.conditions.groupCount === 'number' ? [egg.conditions.groupCount] : []
  ))
);
const BOUNDED_TAB_RANGES = EASTER_EGGS.flatMap(egg => {
  const condition = egg.conditions.tabCount;
  return typeof condition === 'object'
    && condition.min !== undefined
    && condition.max !== undefined
    ? [condition]
    : [];
});
const BOUNDED_GROUP_RANGES = EASTER_EGGS.flatMap(egg => {
  const condition = egg.conditions.groupCount;
  return typeof condition === 'object'
    && condition.min !== undefined
    && condition.max !== undefined
    ? [condition]
    : [];
});

function valueForCount(
  condition: number | { min?: number; max?: number } | undefined,
  fallback: number,
  exactCounts: ReadonlySet<number>,
  boundedRanges: ReadonlyArray<{ min?: number; max?: number }>
): number {
  if (typeof condition === 'number') return condition;
  if (condition) {
    const min = Math.max(1, condition.min ?? 1);
    const max = condition.max ?? min + 512;
    for (let candidate = min; candidate <= max; candidate += 1) {
      const collidesWithNarrowerRange = boundedRanges.some(range => (
        range !== condition
        && candidate >= (range.min ?? 0)
        && candidate <= (range.max ?? Number.MAX_SAFE_INTEGER)
      ));
      if (!exactCounts.has(candidate) && !collidesWithNarrowerRange) return candidate;
    }
    return min;
  }
  return fallback;
}

function matchingDomain(pattern: string | undefined): string | undefined {
  if (!pattern) return 'example.com';
  const regex = new RegExp(pattern, 'i');
  return CANDIDATE_DOMAINS.find(domain => regex.test(domain));
}

function contextFor(egg: EasterEggData): BrowserContext {
  const conditions = egg.conditions;
  const domain = matchingDomain(conditions.domainRegex) ?? 'no-candidate.invalid';
  const tabCount = valueForCount(conditions.tabCount, 31, EXACT_TAB_COUNTS, BOUNDED_TAB_RANGES);
  const requestedGroupCount = valueForCount(
    conditions.groupCount,
    2,
    EXACT_GROUP_COUNTS,
    BOUNDED_GROUP_RANGES
  );
  const context: BrowserContext = {
    tabCount,
    activeTab: {
      domain,
      title: conditions.titleContains ?? 'Reachable Easter egg',
      url: `https://${domain}/${conditions.urlContains ?? 'reachable'}`
    },
    currentHour: conditions.hourRange?.start ?? 12,
    currentMinute: 30,
    currentDay: 1,
    currentMonth: 6,
    currentDate: '2026-06-15',
    currentTimestamp: 1_700_000_123_000,
    tabUrls: Array.from({ length: tabCount }, (_, index) => `https://example.com/${index}`),
    duplicateTabCount: 0,
    recentEvents: [],
    // A browser cannot contain more non-empty groups than tabs. Clamping here
    // prevents the reachability proof from accepting physically impossible fixtures.
    groupCount: Math.min(tabCount, requestedGroupCount)
  };

  switch (conditions.customCheck) {
    case 'timestamp-is-unix-milestone':
      context.currentTimestamp = 1_700_000_000_000;
      break;
    case 'konami-code-entered':
      context.recentEvents = ['KonamiCodeEntered'];
      break;
    case 'date-is-march-14':
      context.currentMonth = 3;
      context.currentDate = '2026-03-14';
      break;
    case 'date-is-may-4':
      context.currentMonth = 5;
      context.currentDate = '2026-05-04';
      break;
    case 'rapid-tab-opening':
      context.recentEvents = ['TabOpened', 'TabOpened', 'TabOpened'];
      break;
    case 'time-after-midnight':
      context.currentHour = 3;
      break;
    case 'time-exactly-midnight':
      context.currentHour = 0;
      context.currentMinute = 0;
      break;
    case 'day-is-friday-after-3pm':
      context.currentDay = 5;
      context.currentHour = 15;
      break;
    case 'season-is-winter':
      context.currentMonth = 12;
      context.currentDate = '2026-12-15';
      break;
    case 'duplicate-tabs-detected':
      context.duplicateTabCount = 1;
      context.tabUrls = Array.from(
        { length: context.tabCount },
        (_, index) => index < 2 ? 'https://example.com/same' : `https://example.com/${index}`
      );
      break;
    case 'tab-just-closed':
      context.recentEvents = ['TabClosed'];
      break;
    case 'new-tab-opened-while-tabs-exist':
      context.tabCount = Math.max(context.tabCount, 2);
      context.recentEvents = ['TabOpened'];
      break;
    case undefined:
      break;
  }

  return context;
}

describe('production catalog reachability', () => {
  it('has a curated matching hostname for every authored domain regex', () => {
    const missing = EASTER_EGGS
      .filter(egg => egg.conditions.domainRegex && !matchingDomain(egg.conditions.domainRegex))
      .map(egg => egg.id);

    expect(missing).toEqual([]);
  });

  it('uses only contexts and event predicates the shipped browser can produce', () => {
    for (const egg of EASTER_EGGS) {
      const customCheck = egg.conditions.customCheck;
      if (customCheck) expect(PRODUCED_CUSTOM_CHECKS.has(customCheck)).toBe(true);

      const tabCount = egg.conditions.tabCount;
      if (typeof tabCount === 'number') expect(tabCount).toBeGreaterThanOrEqual(1);
      if (typeof tabCount === 'object' && tabCount.max !== undefined) {
        expect(tabCount.max).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('can select every definition against the complete production catalog', async () => {
    const storage = new QuipStorage();
    expect((await storage.initialize()).ok).toBe(true);
    let random = 0;
    const framework = new EasterEggFramework(storage, () => random);
    expect((await framework.initialize()).ok).toBe(true);

    const unreachable: string[] = [];
    for (const egg of EASTER_EGGS) {
      let selected = false;
      for (let sample = 0; sample < 512 && !selected; sample += 1) {
        random = (sample + 0.5) / 512;
        // Use the unscoped production selection path so every egg competes with
        // the complete catalog. Event-only scoped checks are covered separately
        // at the HumorSystem producer boundary.
        const result = await framework.checkTriggers(contextFor(egg));
        selected = result.ok && result.value?.easterEggId === egg.id;
      }
      if (!selected) unreachable.push(egg.id);
    }

    expect(unreachable).toEqual([]);
  }, 30_000);
});
