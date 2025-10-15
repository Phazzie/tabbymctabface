/**
 * FILE: EasterEggFramework.ts
 *
 * WHAT: Real easter egg detection framework using context-driven condition evaluation
 *
 * WHY: Implements IEasterEggFramework contract for matching browser context to easter eggs.
 *      Evaluates AND-combined conditions, prioritizes matches, and returns appropriate eggs.
 *
 * HOW DATA FLOWS:
 *   1. HumorSystem calls checkTriggers with BrowserContext (SEAM-16)
 *   2. Framework iterates registered easter eggs (priority-ordered)
 *   3. For each egg, evaluates ALL conditions (AND logic)
 *   4. Returns first match (highest priority) or null
 *   5. HumorSystem uses match to fetch quip from QuipStorage
 *
 * SEAMS:
 *   IN:  HumorSystem → EasterEggFramework (SEAM-16)
 *   OUT: EasterEggFramework → QuipStorage (SEAM-17)
 *
 * CONTRACT: IEasterEggFramework v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
 */

import {
  IEasterEggFramework,
  EasterEggMatch,
  EasterEggDefinition,
  EasterEggConditions,
  EasterEggError,
  evaluateNumberCondition,
  evaluateHourRange
} from '../contracts/IEasterEggFramework';
import { IQuipStorage } from '../contracts/IQuipStorage';
import { BrowserContext } from '../contracts/ITabManager';
import { Result } from '../utils/Result';

/**
 * Real easter egg framework implementation
 *
 * Evaluates browser context against registered easter egg conditions.
 * Uses priority-based matching and AND-combined condition logic.
 * Loads easter eggs from QuipStorage at initialization.
 */
export class EasterEggFramework implements IEasterEggFramework {
  private easterEggs: EasterEggDefinition[] = [];
  private readonly easterEggMap = new Map<string, EasterEggDefinition>();
  private initialized = false;

  /**
   * Constructor - inject QuipStorage dependency
   */
  constructor(private readonly quipStorage: IQuipStorage) {}

  /**
   * Initialize framework by loading easter eggs from storage
   *
   * DATA IN: void
   * DATA OUT: Result<void, EasterEggError>
   *
   * SEAM: Internal initialization, uses SEAM-17 (→ QuipStorage)
   *
   * FLOW:
   *   1. Query QuipStorage for all easter eggs
   *   2. Convert to EasterEggDefinition format
   *   3. Sort by priority (descending)
   *   4. Build lookup map
   *
   * ERRORS:
   *   - NoEasterEggsRegistered: QuipStorage returned no eggs
   *
   * PERFORMANCE: <100ms (one-time initialization)
   */
  async initialize(): Promise<Result<void, EasterEggError>> {
    if (!this.quipStorage.isInitialized()) {
      return Result.error({
        type: 'NoEasterEggsRegistered',
        details: 'QuipStorage not initialized'
      });
    }

    try {
      // Load all easter eggs from storage (all levels)
      const levels = ['default', 'mild', 'intense'] as const;
      const allEggs: EasterEggDefinition[] = [];

      for (const level of levels) {
        // Get unique easter egg types for this level
        const eggsResult = await this.quipStorage.getEasterEggQuips('', level);
        
        if (eggsResult.ok) {
          const eggs = eggsResult.value;
          
          // Convert EasterEggData to EasterEggDefinition
          for (const egg of eggs) {
            // Check if we already have this egg (avoid duplicates)
            if (!this.easterEggMap.has(egg.id)) {
              const definition: EasterEggDefinition = {
                id: egg.id,
                type: egg.type,
                priority: this.calculatePriority(egg.metadata?.difficulty),
                conditions: egg.conditions,
                metadata: egg.metadata
              };
              
              allEggs.push(definition);
              this.easterEggMap.set(egg.id, definition);
            }
          }
        }
      }

      if (allEggs.length === 0) {
        return Result.error({
          type: 'NoEasterEggsRegistered',
          details: 'No easter eggs loaded from storage'
        });
      }

      // Sort by priority (highest first)
      this.easterEggs = [...allEggs].sort((eggA, eggB) => eggB.priority - eggA.priority);
      this.initialized = true;

      return Result.ok(undefined);
    } catch (error) {
      return Result.error({
        type: 'NoEasterEggsRegistered',
        details: `Failed to load easter eggs from storage: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Check if current browser context matches any easter egg triggers
   *
   * DATA IN: context (BrowserContext)
   * DATA OUT: Result<EasterEggMatch | null, EasterEggError>
   *
   * SEAM: SEAM-16 (HumorSystem → EasterEggFramework)
   *
   * FLOW:
   *   1. Iterate through registered easter eggs (priority order)
   *   2. For each egg, evaluate ALL conditions (AND logic)
   *   3. Return first match (highest priority)
   *   4. Return null if no matches
   *
   * ERRORS:
   *   - NoEasterEggsRegistered: Framework not initialized
   *   - ConditionEvaluationFailed: Error evaluating condition
   *
   * PERFORMANCE: <50ms (95th percentile)
   */
  async checkTriggers(
    context: BrowserContext
  ): Promise<Result<EasterEggMatch | null, EasterEggError>> {
    if (!this.initialized) {
      return Result.error({
        type: 'NoEasterEggsRegistered',
        details: 'EasterEggFramework not initialized. Call initialize() first.'
      });
    }

    try {
      // Iterate through easter eggs in priority order
      for (const egg of this.easterEggs) {
        const matchResult = await this.evaluateEasterEgg(egg, context);
        
        if (!matchResult.ok) {
          // Condition evaluation failed - return error
          return matchResult;
        }

        if (matchResult.value) {
          // Match found - return it
          return Result.ok(matchResult.value);
        }
      }

      // No matches found
      return Result.ok(null);
    } catch (error) {
      return Result.error({
        type: 'ConditionEvaluationFailed',
        details: 'Unexpected error during easter egg evaluation',
        conditionName: 'unknown',
        originalError: error
      });
    }
  }

  /**
   * Register a new easter egg trigger
   *
   * DATA IN: definition (EasterEggDefinition)
   * DATA OUT: Result<void, EasterEggError>
   *
   * FLOW:
   *   1. Validate definition
   *   2. Check for duplicate ID
   *   3. Add to registry
   *   4. Re-sort by priority
   *
   * ERRORS:
   *   - DuplicateEasterEggId: ID already exists
   *   - InvalidConditions: No conditions defined
   *
   * PERFORMANCE: <5ms (synchronous operation)
   */
  registerEasterEgg(
    definition: EasterEggDefinition
  ): Result<void, EasterEggError> {
    // Check for duplicate
    if (this.easterEggMap.has(definition.id)) {
      return Result.error({
        type: 'DuplicateEasterEggId',
        details: `Easter egg with ID ${definition.id} already registered`,
        easterEggId: definition.id
      });
    }

    // Validate conditions
    if (!definition.conditions || Object.keys(definition.conditions).length === 0) {
      return Result.error({
        type: 'InvalidConditions',
        details: 'Easter egg must have at least one condition',
        violations: ['No conditions defined']
      });
    }

    // Register
    this.easterEggMap.set(definition.id, definition);
    this.easterEggs.push(definition);

    // Re-sort by priority
    this.easterEggs.sort((eggA, eggB) => eggB.priority - eggA.priority);

    return Result.ok(undefined);
  }

  /**
   * Get all registered easter eggs (for debugging/admin)
   *
   * DATA IN: void
   * DATA OUT: Result<EasterEggDefinition[], EasterEggError>
   *
   * PERFORMANCE: <5ms (cached)
   */
  getAllEasterEggs(): Result<EasterEggDefinition[], EasterEggError> {
    if (!this.initialized) {
      return Result.error({
        type: 'NoEasterEggsRegistered',
        details: 'EasterEggFramework not initialized'
      });
    }

    return Result.ok([...this.easterEggs]);
  }

  /**
   * Clear all registered easter eggs (for testing)
   *
   * DATA IN: void
   * DATA OUT: void
   *
   * PERFORMANCE: <1ms (synchronous)
   */
  clearAll(): void {
    this.easterEggs = [];
    this.easterEggMap.clear();
    this.initialized = false;
  }

  /**
   * Evaluate a single easter egg against browser context
   *
   * @private
   */
  private async evaluateEasterEgg(
    egg: EasterEggDefinition,
    context: BrowserContext
  ): Promise<Result<EasterEggMatch | null, EasterEggError>> {
    const conditions = egg.conditions;
    const matchedConditions: string[] = [];

    try {
      // Evaluate all conditions - if any fail, return null or error
      const conditionResults = await this.evaluateAllConditions(conditions, context, matchedConditions);
      if (!conditionResults.ok) return conditionResults;
      if (!conditionResults.value) return Result.ok(null);

      // All conditions passed - return match
      const match: EasterEggMatch = {
        easterEggId: egg.id,
        easterEggType: egg.type,
        matchedConditions,
        priority: egg.priority,
        metadata: egg.metadata
      };

      return Result.ok(match);
    } catch (error) {
      return Result.error({
        type: 'ConditionEvaluationFailed',
        details: 'Unexpected error evaluating conditions',
        conditionName: 'unknown',
        originalError: error
      });
    }
  }

  /**
   * Evaluate all conditions for an easter egg
   */
  private async evaluateAllConditions(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matchedConditions: string[]
  ): Promise<Result<boolean, EasterEggError>> {
    // Helper to check condition result
    const checkResult = (result: Result<boolean, EasterEggError>) => {
      if (!result.ok) return result;
      if (!result.value) return Result.ok(false);
      return null; // Continue to next condition
    };

    // Evaluate each condition
    const tabCountResult = checkResult(this.evaluateTabCount(conditions, context, matchedConditions));
    if (tabCountResult) return tabCountResult;

    const domainResult = checkResult(this.evaluateDomainRegex(conditions, context, matchedConditions));
    if (domainResult) return domainResult;

    const hourResult = checkResult(this.evaluateHourRange(conditions, context, matchedConditions));
    if (hourResult) return hourResult;

    const titleResult = checkResult(this.evaluateTitleContains(conditions, context, matchedConditions));
    if (titleResult) return titleResult;

    const groupResult = checkResult(this.evaluateGroupCount(conditions, context, matchedConditions));
    if (groupResult) return groupResult;

    return Result.ok(true);
  }

  /**
   * Evaluate tabCount condition
   */
  private evaluateTabCount(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matchedConditions: string[]
  ): Result<boolean, EasterEggError> {
    if (conditions.tabCount !== undefined) {
      const matches = evaluateNumberCondition(context.tabCount, conditions.tabCount);
      if (!matches) return Result.ok(false);
      matchedConditions.push('tabCount');
    }
    return Result.ok(true);
  }

  /**
   * Evaluate domainRegex condition
   */
  private evaluateDomainRegex(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matchedConditions: string[]
  ): Result<boolean, EasterEggError> {
    if (conditions.domainRegex && context.activeTab) {
      try {
        const regex = new RegExp(conditions.domainRegex, 'i');
        const matches = regex.test(context.activeTab.domain);
        if (!matches) return Result.ok(false);
        matchedConditions.push('domainRegex');
      } catch (regexError) {
        return Result.error({
          type: 'ConditionEvaluationFailed',
          details: 'Invalid domain regex pattern',
          conditionName: 'domainRegex',
          originalError: regexError
        });
      }
    }
    return Result.ok(true);
  }

  /**
   * Evaluate hourRange condition
   */
  private evaluateHourRange(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matchedConditions: string[]
  ): Result<boolean, EasterEggError> {
    if (conditions.hourRange) {
      const matches = evaluateHourRange(context.currentHour, conditions.hourRange);
      if (!matches) return Result.ok(false);
      matchedConditions.push('hourRange');
    }
    return Result.ok(true);
  }

  /**
   * Evaluate titleContains condition
   */
  private evaluateTitleContains(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matchedConditions: string[]
  ): Result<boolean, EasterEggError> {
    if (conditions.titleContains && context.activeTab) {
      const matches = context.activeTab.title
        .toLowerCase()
        .includes(conditions.titleContains.toLowerCase());
      if (!matches) return Result.ok(false);
      matchedConditions.push('titleContains');
    }
    return Result.ok(true);
  }

  /**
   * Evaluate groupCount condition
   */
  private evaluateGroupCount(
    conditions: EasterEggConditions,
    context: BrowserContext,
    matchedConditions: string[]
  ): Result<boolean, EasterEggError> {
    if (conditions.groupCount !== undefined) {
      const matches = evaluateNumberCondition(context.groupCount, conditions.groupCount);
      if (!matches) return Result.ok(false);
      matchedConditions.push('groupCount');
    }
    return Result.ok(true);
  }

  /**
   * Calculate priority from difficulty level
   *
   * @private
   */
  private calculatePriority(
    difficulty?: 'common' | 'uncommon' | 'rare' | 'legendary'
  ): number {
    switch (difficulty) {
      case 'legendary':
        return 100;
      case 'rare':
        return 75;
      case 'uncommon':
        return 50;
      case 'common':
      default:
        return 25;
    }
  }
}
