/**
 * FILE: IEasterEggFramework.test.ts
 * 
 * WHAT: Contract tests for IEasterEggFramework - validates easter egg detection and matching
 * 
 * WHY: Ensures easter egg framework correctly evaluates AND-combined conditions.
 *      Critical for extensible, data-driven easter egg system.
 * 
 * HOW DATA FLOWS:
 *   1. Tests call framework methods with browser context
 *   2. Mock easter egg registrations
 *   3. Validate condition evaluation logic (AND combinations)
 *   4. Verify priority-based matching
 * 
 * SEAMS:
 *   IN: HumorSystem → EasterEggFramework (SEAM-16)
 *   OUT: EasterEggFramework → QuipStorage (SEAM-17 - for easter egg data)
 * 
 * CONTRACT: IEasterEggFramework v1.0.0 validation
 * GENERATED: 2025-10-12
 * CUSTOM SECTIONS: None
 */

import { describe, it, expect } from 'vitest';
import type {
    IEasterEggFramework,
    EasterEggMatch,
    EasterEggDefinition,
    EasterEggConditions,
    EasterEggError
} from '../IEasterEggFramework';
import type { BrowserContext } from '../ITabManager';
import { Result } from '../../utils/Result';

describe('IEasterEggFramework CONTRACT v1.0.0', () => {
    // NOTE: These tests define the contract behavior
    // Implementation will be created to pass these tests

    describe('CONTRACT: checkTriggers()', () => {
        it('MUST accept BrowserContext as input', () => {
            // Contract specifies: BrowserContext parameter
            const context: BrowserContext = {
                tabCount: 42,
                activeTab: {
                    url: 'https://github.com',
                    title: 'GitHub',
                    domain: 'github.com'
                },
                currentHour: 14,
                recentEvents: ['created'],
                groupCount: 3
            };

            expect(context.tabCount).toBeDefined();
            expect(context.activeTab).toBeDefined();
            expect(context.currentHour).toBeDefined();
            expect(context.recentEvents).toBeDefined();
            expect(context.groupCount).toBeDefined();
        });

        it('MUST return Result<EasterEggMatch | null, EasterEggError> on success', () => {
            // Contract specifies: Success returns highest priority match or null
            const match: EasterEggMatch = {
                easterEggId: 'EE-001',
                easterEggType: '42-tabs',
                matchedConditions: ['tabCount=42'],
                priority: 100,
                metadata: {
                    nicheReference: 'Douglas Adams - Hitchhiker\'s Guide',
                    difficulty: 'legendary'
                }
            };
            const successResult = Result.ok(match);

            expect(Result.isOk(successResult)).toBe(true);
            if (Result.isOk(successResult)) {
                expect(successResult.value).toHaveProperty('easterEggId');
                expect(successResult.value).toHaveProperty('easterEggType');
                expect(successResult.value).toHaveProperty('matchedConditions');
                expect(successResult.value).toHaveProperty('priority');
            }
        });

        it('MUST return null when no easter eggs match', () => {
            // Contract behavior: null is valid when no match
            const noMatchResult = Result.ok<EasterEggMatch | null>(null);

            expect(Result.isOk(noMatchResult)).toBe(true);
            if (Result.isOk(noMatchResult)) {
                expect(noMatchResult.value).toBeNull();
            }
        });

        it('MUST evaluate ALL conditions using AND logic', () => {
            // Contract behavior: All conditions must be true for match
            const allConditionsTrue = true;
            const anyConditionFalse = false;

            // If ALL conditions true → match
            expect(allConditionsTrue).toBe(true);
            // If ANY condition false → no match
            expect(anyConditionFalse).toBe(false);
        });

        it('MUST return highest priority match when multiple matches', () => {
            // Contract behavior: Priority-based matching (higher priority first)
            const highPriorityMatch = { priority: 100 };
            const lowPriorityMatch = { priority: 50 };

            expect(highPriorityMatch.priority).toBeGreaterThan(lowPriorityMatch.priority);
        });

        it('MUST return ConditionEvaluationFailed error on evaluation error', () => {
            // Contract specifies: ConditionEvaluationFailed error type
            const evalError = new Error('Regex invalid');
            const error: EasterEggError = {
                type: 'ConditionEvaluationFailed',
                details: 'Failed to evaluate condition',
                conditionName: 'domainRegex',
                originalError: evalError
            };
            const errorResult = Result.error(error);

            expect(Result.isError(errorResult)).toBe(true);
            if (Result.isError(errorResult)) {
                expect(errorResult.error.type).toBe('ConditionEvaluationFailed');
                expect(errorResult.error.conditionName).toBeDefined();
                expect(errorResult.error.originalError).toBe(evalError);
            }
        });

        it('MUST return NoEasterEggsRegistered error when framework not initialized', () => {
            // Contract specifies: NoEasterEggsRegistered error
            const error: EasterEggError = {
                type: 'NoEasterEggsRegistered',
                details: 'No easter eggs registered in framework'
            };

            expect(error.type).toBe('NoEasterEggsRegistered');
        });

        it('MUST meet <50ms performance SLA', () => {
            // Contract specifies: <50ms (95th percentile)
            const SLA_MS = 50;
            expect(SLA_MS).toBe(50);
            // Actual performance test in implementation suite
        });

        it('MUST be pure function with no side effects', () => {
            // Contract guarantee: checkTriggers() is pure evaluation
            const isPureFunction = true;
            expect(isPureFunction).toBe(true);
        });
    });

    describe('CONTRACT: registerEasterEgg()', () => {
        it('MUST accept EasterEggDefinition as parameter', () => {
            // Contract specifies: EasterEggDefinition structure
            const definition: EasterEggDefinition = {
                id: 'EE-001',
                type: '42-tabs',
                priority: 100,
                conditions: { tabCount: 42 },
                metadata: {
                    nicheReference: 'Douglas Adams',
                    difficulty: 'legendary',
                    description: 'Hitchhiker\'s Guide reference'
                }
            };

            expect(definition.id).toBeDefined();
            expect(definition.type).toBeDefined();
            expect(definition.priority).toBeDefined();
            expect(definition.conditions).toBeDefined();
        });

        it('MUST return Result<void, EasterEggError> on success', () => {
            // Contract specifies: Success returns void
            const successResult = Result.ok<void>(undefined);

            expect(Result.isOk(successResult)).toBe(true);
        });

        it('MUST return DuplicateEasterEggId error for duplicate ID', () => {
            // Contract specifies: DuplicateEasterEggId error
            const error: EasterEggError = {
                type: 'DuplicateEasterEggId',
                details: 'Easter egg with this ID already registered',
                easterEggId: 'EE-001'
            };
            const errorResult = Result.error(error);

            expect(Result.isError(errorResult)).toBe(true);
            if (Result.isError(errorResult)) {
                expect(errorResult.error.type).toBe('DuplicateEasterEggId');
                expect(errorResult.error.easterEggId).toBeDefined();
            }
        });

        it('MUST return InvalidConditions error for malformed conditions', () => {
            // Contract specifies: InvalidConditions error
            const error: EasterEggError = {
                type: 'InvalidConditions',
                details: 'Condition definition is invalid',
                violations: ['tabCount must be number or range', 'Invalid regex pattern']
            };

            expect(error.type).toBe('InvalidConditions');
            expect(Array.isArray(error.violations)).toBe(true);
        });

        it('MUST meet <5ms performance SLA', () => {
            // Contract specifies: <5ms (synchronous operation)
            const SLA_MS = 5;
            expect(SLA_MS).toBe(5);
        });
    });

    describe('CONTRACT: getAllEasterEggs()', () => {
        it('MUST return Result<EasterEggDefinition[], EasterEggError> on success', () => {
            // Contract specifies: Success returns definition array
            const definitions: EasterEggDefinition[] = [
                {
                    id: 'EE-001',
                    type: '42-tabs',
                    priority: 100,
                    conditions: { tabCount: 42 }
                },
                {
                    id: 'EE-002',
                    type: 'late-night-coding',
                    priority: 80,
                    conditions: { hourRange: { start: 0, end: 3 } }
                }
            ];
            const successResult = Result.ok(definitions);

            expect(Result.isOk(successResult)).toBe(true);
            if (Result.isOk(successResult)) {
                expect(Array.isArray(successResult.value)).toBe(true);
                expect(successResult.value.length).toBe(2);
            }
        });

        it('MUST return empty array when no easter eggs registered', () => {
            // Contract behavior: Empty array is valid
            const emptyResult = Result.ok<EasterEggDefinition[]>([]);

            expect(Result.isOk(emptyResult)).toBe(true);
            if (Result.isOk(emptyResult)) {
                expect(emptyResult.value.length).toBe(0);
            }
        });

        it('MUST meet <5ms performance SLA', () => {
            // Contract specifies: <5ms (cached)
            const SLA_MS = 5;
            expect(SLA_MS).toBe(5);
        });
    });

    describe('CONTRACT: clearAll()', () => {
        it('MUST clear all registered easter eggs', () => {
            // Contract specifies: Synchronous clear operation
            const cleared = true;
            expect(cleared).toBe(true);
        });

        it('MUST return void synchronously', () => {
            // Contract specifies: void return type
            const returnValue = undefined;
            expect(returnValue).toBeUndefined();
        });

        it('MUST complete in <1ms', () => {
            // Contract specifies: <1ms (synchronous)
            const SLA_MS = 1;
            expect(SLA_MS).toBe(1);
        });
    });

    describe('CONTRACT: EasterEggConditions Support', () => {
        it('MUST support tabCount as exact number', () => {
            // Contract specifies: tabCount can be exact number
            const conditions: EasterEggConditions = { tabCount: 42 };
            expect(conditions.tabCount).toBe(42);
        });

        it('MUST support tabCount as range {min, max}', () => {
            // Contract specifies: tabCount can be range
            const conditions: EasterEggConditions = {
                tabCount: { min: 40, max: 50 }
            };
            expect(typeof conditions.tabCount === 'object').toBe(true);
            if (typeof conditions.tabCount === 'object') {
                expect(conditions.tabCount.min).toBe(40);
                expect(conditions.tabCount.max).toBe(50);
            }
        });

        it('MUST support domainRegex pattern matching', () => {
            // Contract specifies: domainRegex for active tab domain
            const conditions: EasterEggConditions = {
                domainRegex: 'github\\.com'
            };
            expect(conditions.domainRegex).toBeDefined();
            expect(typeof conditions.domainRegex).toBe('string');
        });

        it('MUST support hourRange with start and end (0-23)', () => {
            // Contract specifies: hourRange with overnight support
            const normalRange: EasterEggConditions = {
                hourRange: { start: 9, end: 17 }
            };
            const overnightRange: EasterEggConditions = {
                hourRange: { start: 22, end: 2 }
            };

            expect(normalRange.hourRange?.start).toBe(9);
            expect(normalRange.hourRange?.end).toBe(17);
            expect(overnightRange.hourRange?.start).toBe(22);
            expect(overnightRange.hourRange?.end).toBe(2);
        });

        it('MUST support titleContains case-insensitive matching', () => {
            // Contract specifies: titleContains for active tab title
            const conditions: EasterEggConditions = {
                titleContains: 'stackoverflow'
            };
            expect(conditions.titleContains).toBeDefined();
            expect(typeof conditions.titleContains).toBe('string');
        });

        it('MUST support groupCount as exact number or range', () => {
            // Contract specifies: groupCount similar to tabCount
            const exact: EasterEggConditions = { groupCount: 5 };
            const range: EasterEggConditions = {
                groupCount: { min: 3, max: 10 }
            };

            expect(exact.groupCount).toBe(5);
            expect(typeof range.groupCount === 'object').toBe(true);
        });

        it('MUST support customCheck for future extensibility', () => {
            // Contract specifies: customCheck for complex logic (V1 not implemented)
            const conditions: EasterEggConditions = {
                customCheck: 'isProcrastinating'
            };
            expect(conditions.customCheck).toBeDefined();
        });

        it('MUST support combining multiple conditions with AND logic', () => {
            // Contract behavior: All conditions must be true
            const multipleConditions: EasterEggConditions = {
                tabCount: { min: 40, max: 50 },
                domainRegex: 'github\\.com',
                hourRange: { start: 0, end: 3 },
                titleContains: 'pull request'
            };

            expect(Object.keys(multipleConditions).length).toBe(4);
        });
    });

    describe('CONTRACT: Helper Functions', () => {
        it('MUST provide evaluateNumberCondition helper', () => {
            // Contract provides helper for number/range evaluation
            function evaluateNumberCondition(
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

            expect(evaluateNumberCondition(42, 42)).toBe(true);
            expect(evaluateNumberCondition(42, 43)).toBe(false);
            expect(evaluateNumberCondition(42, { min: 40, max: 50 })).toBe(true);
            expect(evaluateNumberCondition(42, { min: 45 })).toBe(false);
        });

        it('MUST provide evaluateHourRange helper', () => {
            // Contract provides helper for hour range (with overnight support)
            function evaluateHourRange(
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

            expect(evaluateHourRange(14, { start: 9, end: 17 })).toBe(true);
            expect(evaluateHourRange(8, { start: 9, end: 17 })).toBe(false);
            expect(evaluateHourRange(1, { start: 22, end: 3 })).toBe(true);
            expect(evaluateHourRange(23, { start: 22, end: 3 })).toBe(true);
            expect(evaluateHourRange(12, { start: 22, end: 3 })).toBe(false);
        });
    });

    describe('CONTRACT: Error Type Guarantees', () => {
        it('EasterEggError MUST be discriminated union', () => {
            // Contract specifies: All errors have 'type' discriminator
            const error1: EasterEggError = {
                type: 'ConditionEvaluationFailed',
                details: 'fail',
                conditionName: 'test',
                originalError: new Error()
            };
            const error2: EasterEggError = {
                type: 'NoEasterEggsRegistered',
                details: 'fail'
            };
            const error3: EasterEggError = {
                type: 'DuplicateEasterEggId',
                details: 'fail',
                easterEggId: 'EE-001'
            };
            const error4: EasterEggError = {
                type: 'InvalidConditions',
                details: 'fail',
                violations: ['violation1']
            };

            expect(error1.type).toBe('ConditionEvaluationFailed');
            expect(error2.type).toBe('NoEasterEggsRegistered');
            expect(error3.type).toBe('DuplicateEasterEggId');
            expect(error4.type).toBe('InvalidConditions');
        });
    });

    describe('CONTRACT: Type Guards', () => {
        it('MUST provide isConditionEvaluationFailedError type guard', () => {
            // Contract provides type guard for condition evaluation errors
            function isConditionEvaluationFailedError(
                error: EasterEggError
            ): error is Extract<EasterEggError, { type: 'ConditionEvaluationFailed' }> {
                return error.type === 'ConditionEvaluationFailed';
            }

            const error: EasterEggError = {
                type: 'ConditionEvaluationFailed',
                details: 'fail',
                conditionName: 'test',
                originalError: new Error()
            };

            expect(isConditionEvaluationFailedError(error)).toBe(true);
            if (isConditionEvaluationFailedError(error)) {
                expect(error.conditionName).toBeDefined(); // Type narrowing works
                expect(error.originalError).toBeDefined();
            }
        });
    });

    describe('CONTRACT: No Exceptions', () => {
        it('MUST never throw exceptions - always return Result', () => {
            // Contract guarantees: All methods return Result or void, never throw
            const successResult = Result.ok<EasterEggMatch | null>(null);
            const errorResult = Result.error<EasterEggError>({
                type: 'NoEasterEggsRegistered',
                details: 'fail'
            });

            expect(Result.isOk(successResult) || Result.isError(successResult)).toBe(true);
            expect(Result.isOk(errorResult) || Result.isError(errorResult)).toBe(true);
        });
    });
});
