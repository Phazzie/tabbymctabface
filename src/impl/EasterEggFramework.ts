/**
 * FILE: EasterEggFramework.ts
 *
 * WHAT: Contextual Easter-egg evaluation with safe predicates and fair match selection.
 *
 * WHY: Implements IEasterEggFramework without broad-rule shadowing or implicit condition matches.
 *
 * HOW DATA FLOWS:
 *   1. Definitions cross SEAM-17 from QuipStorage during lazy initialization.
 *   2. BrowserContext crosses SEAM-16 from HumorSystem.
 *   3. Every condition is evaluated with AND semantics and explicit failure handling.
 *   4. Top-specificity matches are selected by an injected rarity-weighted random source.
 *
 * SEAMS:
 *   IN: HumorSystem → EasterEggFramework (SEAM-16)
 *   OUT: EasterEggFramework → QuipStorage (SEAM-17)
 *
 * CONTRACT: IEasterEggFramework v1.1.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import type { BrowserContext } from '../contracts/ITabManager';
import {
  evaluateHourRange,
  evaluateNumberCondition,
  SUPPORTED_EASTER_EGG_CUSTOM_CHECKS,
  type EasterEggCheckOptions,
  type EasterEggConditions,
  type EasterEggDefinition,
  type EasterEggError,
  type EasterEggMatch,
  type EasterEggRegistration,
  type IEasterEggFramework,
  type SupportedEasterEggCustomCheck
} from '../contracts/IEasterEggFramework';
import type { IQuipStorage } from '../contracts/IQuipStorage';
import { Result } from '../utils/Result';

type Difficulty = NonNullable<EasterEggDefinition['metadata']>['difficulty'];
type RandomSource = () => number;
type ExtendedBrowserContext = BrowserContext & Partial<{
  currentMinute: number;
  currentDay: number;
  currentMonth: number;
  currentDate: string;
  currentTimestamp: number;
  tabUrls: string[];
  duplicateTabCount: number;
}>;

const CONDITION_KEYS = new Set<keyof EasterEggConditions>([
  'tabCount',
  'domainRegex',
  'hourRange',
  'titleContains',
  'urlContains',
  'groupCount',
  'customCheck'
]);
const CUSTOM_CHECKS = new Set<string>(SUPPORTED_EASTER_EGG_CUSTOM_CHECKS);

const DIFFICULTY_WEIGHTS: Record<NonNullable<Difficulty>, number> = {
  common: 8,
  uncommon: 4,
  rare: 2,
  legendary: 1
};

function cloneConditions(conditions: EasterEggConditions): EasterEggConditions {
  return {
    ...conditions,
    tabCount: typeof conditions.tabCount === 'object' && conditions.tabCount !== null
      ? { ...conditions.tabCount }
      : conditions.tabCount,
    groupCount: typeof conditions.groupCount === 'object' && conditions.groupCount !== null
      ? { ...conditions.groupCount }
      : conditions.groupCount,
    hourRange: conditions.hourRange ? { ...conditions.hourRange } : undefined
  };
}

function cloneDefinition(definition: EasterEggDefinition): EasterEggDefinition {
  return {
    ...definition,
    conditions: cloneConditions(definition.conditions),
    metadata: definition.metadata ? { ...definition.metadata } : undefined
  };
}

/** Real IEasterEggFramework implementation. */
export class EasterEggFramework implements IEasterEggFramework {
  private easterEggs: EasterEggDefinition[] = [];
  private readonly easterEggMap = new Map<string, EasterEggDefinition>();
  private readonly domainRegexCache = new Map<string, RegExp>();
  private initialized = false;
  private loadPromise: Promise<Result<void, EasterEggError>> | null = null;

  /** Inject storage and randomness so both seams are deterministic in tests. */
  constructor(
    private readonly quipStorage: IQuipStorage,
    private readonly random: RandomSource = Math.random
  ) {}

  /**
   * Load and register all packaged definitions.
   * DATA IN: Initialized IQuipStorage injected at construction.
   * DATA OUT: Result<void, EasterEggError> after atomic definition publication.
   * SEAM: SEAM-17 (EasterEggFramework → QuipStorage).
   * FLOW: Read records, reject duplicates, derive specificity, sort, publish.
   * ERRORS: NoEasterEggsRegistered, DuplicateEasterEggId.
   * PERFORMANCE: Storage-I/O-bound; indexing is linear in definition count.
   */
  async initialize(): Promise<Result<void, EasterEggError>> {
    if (!this.quipStorage.isInitialized()) {
      return Result.error({
        type: 'NoEasterEggsRegistered',
        details: 'QuipStorage not initialized'
      });
    }

    // === SEAM-17: EasterEggFramework → QuipStorage ===
    const eggsResult = await this.quipStorage.getAllEasterEggQuips();
    if (!eggsResult.ok) {
      return Result.error({
        type: 'NoEasterEggsRegistered',
        details: `Failed to load Easter eggs: ${eggsResult.error.details}`
      });
    }
    if (eggsResult.value.length === 0) {
      return Result.error({
        type: 'NoEasterEggsRegistered',
        details: 'No Easter eggs loaded from storage'
      });
    }

    const definitions: EasterEggDefinition[] = [];
    const definitionsById = new Map<string, EasterEggDefinition>();
    for (const egg of eggsResult.value) {
      if (definitionsById.has(egg.id)) {
        return Result.error({
          type: 'DuplicateEasterEggId',
          details: `Duplicate Easter egg ID loaded from storage: ${egg.id}`,
          easterEggId: egg.id
        });
      }

      const definition: EasterEggDefinition = {
        id: egg.id,
        type: egg.type,
        priority: calculateConditionSpecificity(egg.conditions),
        conditions: cloneConditions(egg.conditions),
        metadata: egg.metadata ? { ...egg.metadata } : undefined
      };
      definitions.push(definition);
      definitionsById.set(definition.id, definition);
    }

    definitions.sort(compareDefinitions);
    this.easterEggs = definitions;
    this.easterEggMap.clear();
    for (const [id, definition] of definitionsById) {
      this.easterEggMap.set(id, definition);
    }
    this.initialized = true;
    return Result.ok(undefined);
  }

  /**
   * Evaluate definitions and select fairly among the most specific matches.
   * DATA IN: BrowserContext plus optional allow-listed event custom-check scope.
   * DATA OUT: Result<EasterEggMatch | null, EasterEggError>.
   * SEAM: SEAM-16 (HumorSystem → EasterEggFramework).
   * FLOW: Ensure data, scope definitions, evaluate AND conditions, rank, weight-select.
   * ERRORS: NoEasterEggsRegistered, ConditionEvaluationFailed.
   * PERFORMANCE: <50ms at the packaged catalog size.
   */
  async checkTriggers(
    context: BrowserContext,
    options?: EasterEggCheckOptions
  ): Promise<Result<EasterEggMatch | null, EasterEggError>> {
    // === SEAM-16: HumorSystem → EasterEggFramework ===
    const loadResult = await this.ensureLoaded();
    if (!loadResult.ok) return loadResult;

    const matches: Array<{ definition: EasterEggDefinition; match: EasterEggMatch }> = [];
    const scopedCustomChecks = options?.customChecks
      ? new Set<SupportedEasterEggCustomCheck>(options.customChecks)
      : null;
    for (const definition of this.easterEggs) {
      if (
        scopedCustomChecks
        && (
          definition.conditions.customCheck === undefined
          || !scopedCustomChecks.has(definition.conditions.customCheck)
        )
      ) {
        continue;
      }
      const evaluation = this.evaluateEasterEgg(definition, context);
      if (!evaluation.ok) return evaluation;
      if (evaluation.value) matches.push({ definition, match: evaluation.value });
    }

    if (matches.length === 0) return Result.ok(null);

    const highestSpecificity = Math.max(...matches.map(candidate => candidate.definition.priority));
    const topMatches = matches.filter(candidate => candidate.definition.priority === highestSpecificity);
    return Result.ok(this.selectWeighted(topMatches).match);
  }

  /**
   * Validate and register a programmatic definition with derived priority.
   * DATA IN: EasterEggRegistration without caller-controlled priority.
   * DATA OUT: Result<void, EasterEggError>.
   * SEAM: In-memory contract boundary; no external call.
   * FLOW: Reject duplicates, validate conditions, derive specificity, insert, sort.
   * ERRORS: DuplicateEasterEggId, InvalidConditions.
   * PERFORMANCE: <5ms at the packaged catalog size.
   */
  registerEasterEgg(
    definition: EasterEggRegistration
  ): Result<void, EasterEggError> {
    if (this.easterEggMap.has(definition.id)) {
      return Result.error({
        type: 'DuplicateEasterEggId',
        details: `Easter egg with ID ${definition.id} is already registered`,
        easterEggId: definition.id
      });
    }

    const violations = validateDefinition(definition);
    if (violations.length > 0) {
      return Result.error({
        type: 'InvalidConditions',
        details: 'Easter egg definition is invalid',
        violations
      });
    }

    const storedDefinition: EasterEggDefinition = {
      ...definition,
      priority: calculateConditionSpecificity(definition.conditions),
      conditions: cloneConditions(definition.conditions),
      metadata: definition.metadata ? { ...definition.metadata } : undefined
    };
    this.easterEggMap.set(storedDefinition.id, storedDefinition);
    this.easterEggs.push(storedDefinition);
    this.easterEggs.sort(compareDefinitions);
    this.initialized = true;
    return Result.ok(undefined);
  }

  /** Return a defensive definition-array copy in stable selection order. */
  getAllEasterEggs(): Result<EasterEggDefinition[], EasterEggError> {
    if (!this.initialized) {
      return Result.error({
        type: 'NoEasterEggsRegistered',
        details: 'EasterEggFramework not initialized'
      });
    }
    return Result.ok(this.easterEggs.map(cloneDefinition));
  }

  /** Clear runtime definitions for isolation in tests. */
  clearAll(): void {
    this.easterEggs = [];
    this.easterEggMap.clear();
    this.domainRegexCache.clear();
    this.initialized = false;
    this.loadPromise = null;
  }

  private async ensureLoaded(): Promise<Result<void, EasterEggError>> {
    if (this.initialized) return Result.ok(undefined);
    if (!this.loadPromise) this.loadPromise = this.initialize();

    const result = await this.loadPromise;
    if (!result.ok) this.loadPromise = null;
    return result;
  }

  private evaluateEasterEgg(
    definition: EasterEggDefinition,
    context: BrowserContext
  ): Result<EasterEggMatch | null, EasterEggError> {
    const matchedConditions: string[] = [];
    const conditionResult = this.evaluateAllConditions(
      definition.conditions,
      context,
      matchedConditions
    );
    if (!conditionResult.ok) return conditionResult;
    if (!conditionResult.value) return Result.ok(null);

    return Result.ok({
      easterEggId: definition.id,
      easterEggType: definition.type,
      matchedConditions,
      priority: definition.priority,
      metadata: definition.metadata
    });
  }

  private evaluateAllConditions(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matchedConditions: string[]
  ): Result<boolean, EasterEggError> {
    const evaluators: Array<() => Result<boolean, EasterEggError>> = [
      () => this.evaluateTabCount(conditions, context, matchedConditions),
      () => this.evaluateDomainRegex(conditions, context, matchedConditions),
      () => this.evaluateHour(conditions, context, matchedConditions),
      () => this.evaluateTitle(conditions, context, matchedConditions),
      () => this.evaluateUrl(conditions, context, matchedConditions),
      () => this.evaluateGroupCount(conditions, context, matchedConditions),
      () => this.evaluateCustomCheck(conditions, context, matchedConditions)
    ];

    for (const evaluate of evaluators) {
      const result = evaluate();
      if (!result.ok || !result.value) return result;
    }
    return Result.ok(true);
  }

  private evaluateTabCount(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matched: string[]
  ): Result<boolean, EasterEggError> {
    if (conditions.tabCount === undefined) return Result.ok(true);
    if (!evaluateNumberCondition(context.tabCount, conditions.tabCount)) return Result.ok(false);
    matched.push('tabCount');
    return Result.ok(true);
  }

  private evaluateDomainRegex(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matched: string[]
  ): Result<boolean, EasterEggError> {
    if (conditions.domainRegex === undefined) return Result.ok(true);
    if (!context.activeTab) return Result.ok(false);

    try {
      let regex = this.domainRegexCache.get(conditions.domainRegex);
      if (!regex) {
        regex = new RegExp(conditions.domainRegex, 'i');
        this.domainRegexCache.set(conditions.domainRegex, regex);
      }
      const match = regex.exec(context.activeTab.domain);
      const startsAtHostnameBoundary = Boolean(match) && (
        match!.index === 0
        || match![0].startsWith('.')
        || context.activeTab.domain[match!.index - 1] === '.'
      );
      const endsAtHostnameBoundary = Boolean(match)
        && match!.index + match![0].length === context.activeTab.domain.length;
      if (!match || !startsAtHostnameBoundary || !endsAtHostnameBoundary) {
        return Result.ok(false);
      }
    } catch (error) {
      return Result.error({
        type: 'ConditionEvaluationFailed',
        details: 'Invalid domain regular expression',
        conditionName: 'domainRegex',
        originalError: error
      });
    }

    matched.push('domainRegex');
    return Result.ok(true);
  }

  private evaluateHour(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matched: string[]
  ): Result<boolean, EasterEggError> {
    if (conditions.hourRange === undefined) return Result.ok(true);
    if (!evaluateHourRange(context.currentHour, conditions.hourRange)) return Result.ok(false);
    matched.push('hourRange');
    return Result.ok(true);
  }

  private evaluateTitle(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matched: string[]
  ): Result<boolean, EasterEggError> {
    if (conditions.titleContains === undefined) return Result.ok(true);
    if (!context.activeTab) return Result.ok(false);
    if (!includesCaseInsensitive(context.activeTab.title, conditions.titleContains)) {
      return Result.ok(false);
    }
    matched.push('titleContains');
    return Result.ok(true);
  }

  private evaluateUrl(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matched: string[]
  ): Result<boolean, EasterEggError> {
    if (conditions.urlContains === undefined) return Result.ok(true);
    if (!context.activeTab) return Result.ok(false);
    if (!includesCaseInsensitive(context.activeTab.url, conditions.urlContains)) {
      return Result.ok(false);
    }
    matched.push('urlContains');
    return Result.ok(true);
  }

  private evaluateGroupCount(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matched: string[]
  ): Result<boolean, EasterEggError> {
    if (conditions.groupCount === undefined) return Result.ok(true);
    if (!evaluateNumberCondition(context.groupCount, conditions.groupCount)) return Result.ok(false);
    matched.push('groupCount');
    return Result.ok(true);
  }

  private evaluateCustomCheck(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matched: string[]
  ): Result<boolean, EasterEggError> {
    if (conditions.customCheck === undefined) return Result.ok(true);
    if (!evaluateCustomPredicate(conditions.customCheck, context)) return Result.ok(false);
    matched.push('customCheck');
    return Result.ok(true);
  }

  private selectWeighted(
    candidates: Array<{ definition: EasterEggDefinition; match: EasterEggMatch }>
  ): { definition: EasterEggDefinition; match: EasterEggMatch } {
    const weights = candidates.map(candidate => {
      const difficulty = candidate.definition.metadata?.difficulty ?? 'common';
      return DIFFICULTY_WEIGHTS[difficulty];
    });
    const totalWeight = weights.reduce((total, weight) => total + weight, 0);
    const normalizedRandom = Math.min(Math.max(this.random(), 0), 0.999999999999);
    let threshold = normalizedRandom * totalWeight;

    for (let index = 0; index < candidates.length; index += 1) {
      threshold -= weights[index];
      if (threshold < 0) return candidates[index];
    }
    return candidates[candidates.length - 1];
  }
}

function compareDefinitions(left: EasterEggDefinition, right: EasterEggDefinition): number {
  return right.priority - left.priority || left.id.localeCompare(right.id);
}

function includesCaseInsensitive(value: string, expected: string): boolean {
  return value.toLocaleLowerCase().includes(expected.toLocaleLowerCase());
}

function eventName(event: string): string {
  return event.split(':', 1)[0].replace(/[^a-z0-9]/gi, '').toLocaleLowerCase();
}

function countEvents(context: BrowserContext, ...names: string[]): number {
  const accepted = new Set(names.map(name => eventName(name)));
  return context.recentEvents.filter(event => accepted.has(eventName(event))).length;
}

function eventIndex(context: BrowserContext, name: string): number {
  const expected = eventName(name);
  return context.recentEvents.findIndex(event => eventName(event) === expected);
}

function evaluateCustomPredicate(identifier: string, context: BrowserContext): boolean {
  const extended = context as ExtendedBrowserContext;

  switch (identifier) {
    case 'timestamp-is-unix-milestone': {
      const timestamp = extended.currentTimestamp;
      return typeof timestamp === 'number'
        && Number.isFinite(timestamp)
        && timestamp > 0
        && Math.floor(timestamp / 1000) % 1_000_000 === 0;
    }
    case 'konami-code-entered':
      return countEvents(context, 'KonamiCodeEntered') > 0;
    case 'date-is-march-14':
      return typeof extended.currentDate === 'string' && /^\d{4}-03-14$/.test(extended.currentDate);
    case 'date-is-may-4':
      return typeof extended.currentDate === 'string' && /^\d{4}-05-04$/.test(extended.currentDate);
    case 'rapid-tab-opening':
      return countEvents(context, 'TabOpened') >= 3;
    case 'time-after-midnight':
      return context.currentHour >= 0 && context.currentHour < 6;
    case 'time-exactly-midnight':
      return context.currentHour === 0 && extended.currentMinute === 0;
    case 'day-is-friday-after-3pm':
      return extended.currentDay === 5 && context.currentHour >= 15;
    case 'season-is-winter':
      return extended.currentMonth === 12
        || extended.currentMonth === 1
        || extended.currentMonth === 2;
    case 'duplicate-tabs-detected': {
      if (typeof extended.duplicateTabCount === 'number' && extended.duplicateTabCount > 0) {
        return true;
      }
      if (!Array.isArray(extended.tabUrls)) return false;
      const urls = extended.tabUrls.filter(url => url.length > 0);
      return new Set(urls).size < urls.length;
    }
    case 'tab-just-closed':
      return eventIndex(context, 'TabClosed') === 0;
    case 'new-tab-opened-while-tabs-exist':
      return context.tabCount > 1 && eventIndex(context, 'TabOpened') === 0;
    default:
      return false;
  }
}

/** Structural specificity is independent from authored rarity/difficulty. */
export function calculateConditionSpecificity(conditions: EasterEggConditions): number {
  let score = 0;
  score += countConditionSpecificity(conditions.tabCount, 40);
  // A group count is as structurally discriminating as a tab count. Giving it
  // a lower base score made group-only rules impossible whenever a broad tab
  // rule also matched the live browser context.
  score += countConditionSpecificity(conditions.groupCount, 40);
  if (conditions.domainRegex !== undefined) score += 30;
  if (conditions.titleContains !== undefined) score += 25;
  if (conditions.urlContains !== undefined) score += 25;
  if (conditions.hourRange !== undefined) {
    const { start, end } = conditions.hourRange;
    const width = start <= end ? end - start + 1 : (24 - start) + end + 1;
    score += 12 + Math.max(0, 24 - width);
  }
  if (conditions.customCheck !== undefined) score += 35;
  return score;
}

function countConditionSpecificity(
  condition: number | { min?: number; max?: number } | undefined,
  exactScore: number
): number {
  if (typeof condition === 'number') return exactScore;
  if (!condition) return 0;
  if (condition.min !== undefined && condition.max !== undefined) {
    const width = Math.max(0, condition.max - condition.min);
    return (exactScore - 15) + Math.max(0, 10 - Math.min(width, 10));
  }
  return Math.max(1, exactScore - 30);
}

function validateDefinition(definition: EasterEggRegistration): string[] {
  const violations: string[] = [];
  if (!definition.id || !definition.type) violations.push('id and type are required');
  if (!definition.conditions || Object.keys(definition.conditions).length === 0) {
    violations.push('at least one condition is required');
    return violations;
  }
  for (const key of Object.keys(definition.conditions)) {
    if (!CONDITION_KEYS.has(key as keyof EasterEggConditions)) {
      violations.push(`unknown condition key: ${key}`);
    }
  }
  if (definition.conditions.domainRegex !== undefined) {
    try {
      new RegExp(definition.conditions.domainRegex, 'i');
    } catch {
      violations.push('domainRegex must be a valid regular expression');
    }
  }
  if (
    definition.conditions.customCheck !== undefined
    && !CUSTOM_CHECKS.has(definition.conditions.customCheck)
  ) {
    violations.push(`unsupported customCheck: ${definition.conditions.customCheck}`);
  }
  if (definition.conditions.hourRange) {
    const { start, end } = definition.conditions.hourRange;
    if (!Number.isInteger(start) || start < 0 || start > 23) {
      violations.push('hourRange.start must be an integer from 0 to 23');
    }
    if (!Number.isInteger(end) || end < 0 || end > 23) {
      violations.push('hourRange.end must be an integer from 0 to 23');
    }
  }
  violations.push(...validateCountCondition(definition.conditions.tabCount, 'tabCount'));
  violations.push(...validateCountCondition(definition.conditions.groupCount, 'groupCount'));
  return violations;
}

function validateCountCondition(
  condition: number | { min?: number; max?: number } | undefined,
  name: 'tabCount' | 'groupCount'
): string[] {
  if (condition === undefined) return [];
  if (typeof condition === 'number') {
    return Number.isSafeInteger(condition) && condition >= 0
      ? []
      : [`${name} must be a non-negative safe integer`];
  }

  const violations: string[] = [];
  if (condition.min === undefined && condition.max === undefined) {
    violations.push(`${name} range must define min or max`);
  }
  for (const [endpoint, value] of [['min', condition.min], ['max', condition.max]] as const) {
    if (value !== undefined && (!Number.isSafeInteger(value) || value < 0)) {
      violations.push(`${name}.${endpoint} must be a non-negative safe integer`);
    }
  }
  if (condition.min !== undefined && condition.max !== undefined && condition.min > condition.max) {
    violations.push(`${name}.min must be less than or equal to max`);
  }
  return violations;
}
