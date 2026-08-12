/**
 * FILE: easter-eggs.reachability.test.ts
 *
 * WHAT: Proves every canonical Easter egg has at least one satisfiable browser context.
 *
 * WHY: Schema-valid content is still broken if its conditions can never select and retrieve a quip.
 *
 * HOW DATA FLOWS:
 *   1. Each canonical definition crosses the packaged-data seam (SEAM-14).
 *   2. A synthesized BrowserContext crosses SEAM-16 into an isolated framework.
 *   3. The selected type crosses SEAM-17 back to storage for its authored quip.
 *
 * SEAMS:
 *   IN: Packaged JSON → QuipStorage fixture (SEAM-14)
 *   OUT: BrowserContext → EasterEggFramework → QuipStorage (SEAM-16, SEAM-17)
 *
 * CONTRACT: IEasterEggFramework v1.1.0, IQuipStorage v1.1.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import { describe, expect, it } from 'vitest';
import type { BrowserContext } from '../../../contracts/ITabManager';
import type {
  EasterEggData,
  HumorLevel,
  IQuipStorage,
  QuipData
} from '../../../contracts/IQuipStorage';
import { EasterEggFramework } from '../../../impl/EasterEggFramework';
import { EASTER_EGGS } from '../../../impl/quip-data';
import { Result } from '../../../utils/Result';

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

class SingleEggStorage implements IQuipStorage {
  constructor(private readonly egg: EasterEggData) {}

  async initialize() { return Result.ok<void>(undefined); }
  async getPassiveAggressiveQuips(_level: HumorLevel, _triggerType?: string) {
    return Result.ok<QuipData[]>([]);
  }
  async getEasterEggQuips(type: string, _level: HumorLevel) {
    return Result.ok(type === this.egg.type ? [this.egg] : []);
  }
  async getAllEasterEggQuips(_level?: HumorLevel) { return Result.ok([this.egg]); }
  async getAvailableTriggerTypes() { return Result.ok<string[]>([]); }
  isInitialized() { return true; }
}

function valueForCount(
  condition: number | { min?: number; max?: number } | undefined,
  fallback: number
): number {
  if (typeof condition === 'number') return condition;
  if (condition?.min !== undefined) return condition.min;
  if (condition?.max !== undefined) return Math.max(0, condition.max);
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
  const tabCount = valueForCount(conditions.tabCount, 8);
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
    currentTimestamp: 1_700_000_000_000,
    tabUrls: ['https://example.com/a', 'https://example.com/b'],
    duplicateTabCount: 0,
    recentEvents: [],
    groupCount: valueForCount(conditions.groupCount, 2)
  };

  switch (conditions.customCheck) {
    case 'ctrl-shift-t-pressed-3x':
      context.recentEvents = ['TabReopened', 'TabReopened', 'TabReopened'];
      break;
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
      context.tabUrls = ['https://example.com/same', 'https://example.com/same'];
      break;
    case 'tab-just-closed':
      context.recentEvents = ['TabClosed'];
      break;
    case 'new-tab-opened-while-tabs-exist':
      context.tabCount = Math.max(context.tabCount, 2);
      context.recentEvents = ['TabOpened'];
      break;
    case 'tab-closed-then-reopened':
      context.recentEvents = ['TabReopened', 'TabClosed'];
      break;
    case 'browser-crashed-from-tabs':
      context.tabCount = Math.max(context.tabCount, 200);
      context.recentEvents = ['BrowserCrashed'];
      break;
    case undefined:
      break;
  }

  return context;
}

describe.each(EASTER_EGGS)('$id ($type) reachability', egg => {
  it('has a curated domain candidate when it declares a domain regex', () => {
    if (!egg.conditions.domainRegex) return;
    expect(matchingDomain(egg.conditions.domainRegex)).toBeDefined();
  });

  it('can be selected alone and its authored quip can be retrieved', async () => {
    const storage = new SingleEggStorage(egg);
    const framework = new EasterEggFramework(storage, () => 0);
    const result = await framework.checkTriggers(contextFor(egg));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value?.easterEggId).toBe(egg.id);

    const quips = await storage.getEasterEggQuips(
      result.value?.easterEggType ?? '',
      egg.level
    );
    expect(quips.ok && quips.value[0]?.id).toBe(egg.id);
    expect(quips.ok && quips.value[0]?.quips.length).toBeGreaterThan(0);
  });
});
