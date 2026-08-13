/**
 * FILE: IEasterEggFramework.ts
 * 
 * WHAT: Contract for easter egg detection and matching framework
 * 
 * WHY: Defines interface for contextual easter egg triggers using AND-combined conditions.
 *      Enables extensible, data-driven easter egg system without hardcoded logic.
 * 
 * HOW DATA FLOWS:
 *   1. HumorSystem calls checkTriggers with current BrowserContext (SEAM-16)
 *   2. Framework evaluates all registered easter egg conditions
 *   3. Framework performs AND-combination matching for each easter egg
 *   4. Framework ranks matches by condition specificity
 *   5. Framework uses rarity only as a weighted tie-breaker
 *   6. HumorSystem uses match to fetch easter egg quip
 * 
 * SEAMS:
 *   IN:  HumorSystem → EasterEggFramework (SEAM-16)
 *   OUT: EasterEggFramework → QuipStorage (SEAM-17 - for easter egg data)
 * 
 * CONTRACT: IEasterEggFramework v1.1.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import { BrowserContext } from './ITabManager';

/**
 * Exact allow-list for complex contextual predicates implemented by the framework.
 * Packaged data is rejected if it references anything outside this contract.
 */
export const SUPPORTED_EASTER_EGG_CUSTOM_CHECKS = [
  'ctrl-shift-t-pressed-3x',
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
  'new-tab-opened-while-tabs-exist',
  'tab-closed-then-reopened',
  'browser-crashed-from-tabs'
] as const;

export type SupportedEasterEggCustomCheck =
  typeof SUPPORTED_EASTER_EGG_CUSTOM_CHECKS[number];

/**
 * CONTRACT: IEasterEggFramework
 * VERSION: 1.1.0
 * 
 * Easter egg detection framework providing:
 * - Contextual trigger evaluation (AND-combined conditions)
 * - Specificity-based matching so broad rules cannot shadow precise rules
 * - Rarity-weighted selection only among equally specific matches
 * - Extensible registration of new easter eggs
 * - Data-driven configuration (from JSON)
 * 
 * PERFORMANCE:
 * - checkTriggers: <50ms (95th percentile)
 * - registerEasterEgg: <5ms (synchronous)
 * 
 * V1: 5 initial easter eggs (niche references)
 * Future: Easy addition of new easter eggs via data files
 */
export interface IEasterEggFramework {
  /**
   * Check if current browser context matches any easter egg triggers
   * 
   * SEAM: SEAM-16 (HumorSystem → EasterEggFramework)
   * 
   * DATA IN:
   *   - context: BrowserContext (current browser state from TabManager)
   *   - options.customChecks: optional event scope. When present, only definitions
   *     declaring one of those allow-listed custom checks are evaluated; ordinary
   *     contextual definitions are intentionally skipped.
   * 
   * DATA OUT:
   *   - Success: EasterEggMatch | null (most-specific weighted match or null)
   *   - Error: EasterEggError
   * 
   * ERRORS:
   *   - ConditionEvaluationFailed: Error evaluating a condition
   *   - NoEasterEggsRegistered: Framework not initialized
   * 
   * PERFORMANCE: <50ms (95th percentile)
   * 
   * FLOW:
   *   1. If customChecks is present, select only definitions in that event scope
   *   2. Evaluate ALL conditions for each selected easter egg (AND logic)
   *   3. Rank matches by structural specificity
   *   4. Select by rarity weight among top-equivalent matches
   *   5. Return null if no definitions match
   * 
   * SIDE EFFECTS: None (pure evaluation)
   * 
   * @param context - Current browser context
   * @returns Promise resolving to match or null
   */
  checkTriggers(
    context: BrowserContext,
    options?: EasterEggCheckOptions
  ): Promise<Result<EasterEggMatch | null, EasterEggError>>;

  /**
   * Register a new easter egg trigger
   * 
   * INPUT:
   *   - definition: EasterEggRegistration; priority is derived from conditions
   * 
   * OUTPUT:
   *   - Success: void (easter egg registered)
   *   - Error: EasterEggError
   * 
   * ERRORS:
   *   - DuplicateEasterEggId: Easter egg ID already exists
   *   - InvalidConditions: Condition definition is invalid
   * 
   * PERFORMANCE: <5ms (synchronous operation)
   * 
   * Enables runtime registration of new easter eggs
   * (though V1 loads all from JSON at startup)
   * 
   * @param definition - Easter egg definition
   * @returns Result indicating success or error
   */
  registerEasterEgg(
    definition: EasterEggRegistration
  ): Result<void, EasterEggError>;

  /**
   * Get all registered easter eggs (for debugging/admin)
   * 
   * INPUT: void
   * 
   * OUTPUT:
   *   - Success: EasterEggDefinition[] (all registered easter eggs)
   *   - Error: EasterEggError
   * 
   * PERFORMANCE: <5ms (cached)
   * 
   * @returns Array of all registered easter egg definitions
   */
  getAllEasterEggs(): Result<EasterEggDefinition[], EasterEggError>;

  /**
   * Clear all registered easter eggs (for testing)
   * 
   * INPUT: void
   * OUTPUT: void
   * 
   * PERFORMANCE: <1ms (synchronous)
   * 
   * @returns void
   */
  clearAll(): void;
}

/** Optional match scope used when a concrete browser event must take precedence. */
export interface EasterEggCheckOptions {
  customChecks?: SupportedEasterEggCustomCheck[];
}

/**
 * Easter egg match result
 */
export interface EasterEggMatch {
  easterEggId: string; // e.g., "EE-001"
  easterEggType: string; // e.g., "42-tabs"
  matchedConditions: string[]; // List of condition names that matched
  priority: number; // Structural specificity score used for selection
  metadata?: {
    nicheReference?: string;
    difficulty?: 'common' | 'uncommon' | 'rare' | 'legendary';
    category?: string;
  };
}

/**
 * Easter egg definition (from JSON or programmatic registration)
 */
export interface EasterEggDefinition {
  id: string; // Unique ID (e.g., "EE-001")
  type: string; // Type identifier (e.g., "42-tabs")
  priority: number; // Framework-derived structural specificity score
  conditions: EasterEggConditions; // AND-combined trigger conditions
  metadata?: {
    nicheReference?: string; // e.g., "Douglas Adams - Hitchhiker's Guide"
    difficulty?: 'common' | 'uncommon' | 'rare' | 'legendary';
    description?: string; // Internal description
    category?: string; // Content-family label
  };
}

/** Caller-authored registration input; selection priority cannot be overridden. */
export type EasterEggRegistration = Omit<EasterEggDefinition, 'priority'>;

/**
 * Easter egg trigger conditions (ALL must be true - AND logic)
 * 
 * V1 Supported Conditions:
 * - tabCount: Exact tab count or range
 * - domainRegex: Active tab domain pattern
 * - hourRange: Current hour range (0-23)
 * - titleContains: Active tab title contains text
 * - urlContains: Active tab URL contains text
 * - groupCount: Group count or range
 * 
 * Future: customCheck for complex logic
 */
export interface EasterEggConditions {
  /**
   * Tab count condition
   * - number: Exact match (e.g., 42)
   * - range: Min/max range (e.g., {min: 40, max: 50})
   */
  tabCount?: number | { min?: number; max?: number };

  /**
   * Active tab domain regex pattern
   * Example: "github\\.com" matches github.com
   */
  domainRegex?: string;

  /**
   * Hour range (0-23, 24-hour format)
   * Example: {start: 0, end: 3} matches midnight to 3am
   */
  hourRange?: { start: number; end: number };

  /**
   * Active tab title contains text (case-insensitive)
   * Example: "stackoverflow" matches any tab with "stackoverflow" in title
   */
  titleContains?: string;

  /**
   * Active tab URL contains text (case-insensitive)
   * Example: "pull/" matches a pull-request URL
   */
  urlContains?: string;

  /**
   * Group count condition
   * - number: Exact match
   * - range: Min/max range
   */
  groupCount?: number | { min?: number; max?: number };

  /**
   * Custom check identifier for an allow-listed contextual predicate.
   * Unknown identifiers are safe non-matches, never implicit matches.
   */
  customCheck?: SupportedEasterEggCustomCheck;
}

/**
 * Easter egg framework error types
 */
export type EasterEggError =
  | { type: 'ConditionEvaluationFailed'; details: string; conditionName: string; originalError: unknown }
  | { type: 'NoEasterEggsRegistered'; details: string }
  | { type: 'DuplicateEasterEggId'; details: string; easterEggId: string }
  | { type: 'InvalidConditions'; details: string; violations: string[] };

/**
 * Type guard for condition evaluation failures
 */
export function isConditionEvaluationFailedError(
  error: EasterEggError
): error is Extract<EasterEggError, { type: 'ConditionEvaluationFailed' }> {
  return error.type === 'ConditionEvaluationFailed';
}

/**
 * Helper: Evaluate if a number/range condition matches
 */
export function evaluateNumberCondition(
  actual: number,
  condition: number | { min?: number; max?: number }
): boolean {
  if (typeof condition === 'number') {
    return actual === condition;
  }
  const { min, max } = condition;
  if (min !== undefined && actual < min) return false;
  if (max !== undefined && actual > max) return false;
  return true;
}

/**
 * Helper: Evaluate if hour is within range
 */
export function evaluateHourRange(
  currentHour: number,
  range: { start: number; end: number }
): boolean {
  const { start, end } = range;
  if (start <= end) {
    // Normal range (e.g., 9am-5pm)
    return currentHour >= start && currentHour <= end;
  } else {
    // Overnight range (e.g., 11pm-3am)
    return currentHour >= start || currentHour <= end;
  }
}
