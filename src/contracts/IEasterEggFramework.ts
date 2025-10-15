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
 *   4. Framework returns highest-priority match or null
 *   5. HumorSystem uses match to fetch easter egg quip
 * 
 * SEAMS:
 *   IN:  HumorSystem → EasterEggFramework (SEAM-16)
 *   OUT: EasterEggFramework → QuipStorage (SEAM-17 - for easter egg data)
 * 
 * CONTRACT: IEasterEggFramework v1.0.0
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import { BrowserContext } from './ITabManager';

/**
 * CONTRACT: IEasterEggFramework
 * VERSION: 1.0.0
 * 
 * Easter egg detection framework providing:
 * - Contextual trigger evaluation (AND-combined conditions)
 * - Priority-based matching (higher priority eggs checked first)
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
   * INPUT:
   *   - context: BrowserContext (current browser state from TabManager)
   * 
   * OUTPUT:
   *   - Success: EasterEggMatch | null (highest priority match or null)
   *   - Error: EasterEggError
   * 
   * ERRORS:
   *   - ConditionEvaluationFailed: Error evaluating a condition
   *   - NoEasterEggsRegistered: Framework not initialized
   * 
   * PERFORMANCE: <50ms (95th percentile)
   * 
   * LOGIC:
   *   1. Iterate through registered easter eggs (priority order)
   *   2. For each easter egg, evaluate ALL conditions (AND logic)
   *   3. Return first match (highest priority)
   *   4. Return null if no matches
   * 
   * SIDE EFFECTS: None (pure evaluation)
   * 
   * @param context - Current browser context
   * @returns Promise resolving to match or null
   */
  checkTriggers(
    context: BrowserContext
  ): Promise<Result<EasterEggMatch | null, EasterEggError>>;

  /**
   * Register a new easter egg trigger
   * 
   * INPUT:
   *   - definition: EasterEggDefinition
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
    definition: EasterEggDefinition
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

/**
 * Easter egg match result
 */
export interface EasterEggMatch {
  easterEggId: string; // e.g., "EE-001"
  easterEggType: string; // e.g., "42-tabs"
  matchedConditions: string[]; // List of condition names that matched
  priority: number; // Priority of matched easter egg
  metadata?: {
    nicheReference?: string;
    difficulty?: 'common' | 'uncommon' | 'rare' | 'legendary';
  };
}

/**
 * Easter egg definition (from JSON or programmatic registration)
 */
export interface EasterEggDefinition {
  id: string; // Unique ID (e.g., "EE-001")
  type: string; // Type identifier (e.g., "42-tabs")
  priority: number; // Higher = checked first (1-100)
  conditions: EasterEggConditions; // AND-combined trigger conditions
  metadata?: {
    nicheReference?: string; // e.g., "Douglas Adams - Hitchhiker's Guide"
    difficulty?: 'common' | 'uncommon' | 'rare' | 'legendary';
    description?: string; // Internal description
  };
}

/**
 * Easter egg trigger conditions (ALL must be true - AND logic)
 * 
 * V1 Supported Conditions:
 * - tabCount: Exact tab count or range
 * - domainRegex: Active tab domain pattern
 * - hourRange: Current hour range (0-23)
 * - titleContains: Active tab title contains text
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
   * Group count condition
   * - number: Exact match
   * - range: Min/max range
   */
  groupCount?: number | { min?: number; max?: number };

  /**
   * Custom check identifier (for complex conditions)
   * V1: Not implemented
   * Future: Hook for custom evaluation logic
   */
  customCheck?: string;
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
