/**
 * FILE: MockEasterEggFramework.ts
 * 
 * WHAT: Mock implementation of IEasterEggFramework - simulates easter egg matching
 * 
 * WHY: Enables development and testing of HumorSystem without real easter egg logic.
 *      Proves IEasterEggFramework contract is implementable. Provides test double.
 * 
 * HOW DATA FLOWS:
 *   1. HumorSystem calls checkTriggers with BrowserContext (SEAM-16)
 *   2. Mock simulates condition evaluation
 *   3. Mock returns fake EasterEggMatch or null
 *   4. HumorSystem uses match to fetch quip
 * 
 * SEAMS:
 *   IN:  HumorSystem → EasterEggFramework (SEAM-16)
 *   OUT: None (mock terminates seam with fake matches)
 * 
 * CONTRACT: IEasterEggFramework v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import type {
    IEasterEggFramework,
    EasterEggMatch,
    EasterEggDefinition,
    EasterEggError,
} from '../contracts/IEasterEggFramework';
import type { BrowserContext } from '../contracts/ITabManager';

/**
 * Mock implementation of IEasterEggFramework
 * 
 * Provides fake easter egg matching for testing and development.
 * Simulates condition evaluation without real logic.
 * 
 * MOCK BEHAVIOR:
 * - Returns predetermined matches based on context
 * - Can be configured to return null (no match)
 * - Can be configured to return errors
 * - Tracks registered easter eggs
 * - Tracks call history
 */
export class MockEasterEggFramework implements IEasterEggFramework {
    private easterEggs: EasterEggDefinition[] = [];
    private callHistory: MockCallRecord[] = [];
    private shouldReturnNull = false;
    private shouldReturnError = false;
    private forcedMatch: EasterEggMatch | null = null;

    constructor() {
        // Seed with default easter eggs
        this.seedDefaultEasterEggs();
    }

    /**
     * Check if current context matches any easter egg triggers
     * 
     * DATA IN: context: BrowserContext
     * DATA OUT: Result<EasterEggMatch | null, EasterEggError>
     * 
     * SEAM: SEAM-16 (HumorSystem → EasterEggFramework)
     * 
     * FLOW:
     *   1. Check if configured to return error
     *   2. Check if forced match is set
     *   3. Check if configured to return null
     *   4. Evaluate simple conditions (tabCount, hourRange)
     *   5. Return first match or null
     * 
     * PERFORMANCE: <10ms (mock, simple checks)
     */
    async checkTriggers(
        context: BrowserContext
    ): Promise<Result<EasterEggMatch | null, EasterEggError>> {
        this.callHistory.push({
            method: 'checkTriggers',
            args: [context],
            timestamp: Date.now(),
        });

        // Simulate error if configured
        if (this.shouldReturnError) {
            return Result.error({
                type: 'ConditionEvaluationFailed',
                details: 'Mock configured to return error',
                conditionName: 'mock-condition',
                originalError: new Error('Mock error'),
            });
        }

        // Return forced match if set
        if (this.forcedMatch) {
            return Result.ok(this.forcedMatch);
        }

        // Return null if configured
        if (this.shouldReturnNull) {
            return Result.ok(null);
        }

        // Check no easter eggs registered
        if (this.easterEggs.length === 0) {
            return Result.error({
                type: 'NoEasterEggsRegistered',
                details: 'No easter eggs have been registered',
            });
        }

        // Simple condition evaluation (mock logic)
        for (const egg of this.easterEggs) {
            const conditions = egg.conditions;
            let allMatch = true;

            // Check tabCount condition
            if (conditions.tabCount !== undefined) {
                if (typeof conditions.tabCount === 'number') {
                    if (context.tabCount !== conditions.tabCount) {
                        allMatch = false;
                    }
                } else {
                    const { min, max } = conditions.tabCount;
                    if (min !== undefined && context.tabCount < min) allMatch = false;
                    if (max !== undefined && context.tabCount > max) allMatch = false;
                }
            }

            // Check hourRange condition
            if (conditions.hourRange && allMatch) {
                const { start, end } = conditions.hourRange;
                if (start <= end) {
                    if (context.currentHour < start || context.currentHour > end) {
                        allMatch = false;
                    }
                } else {
                    if (context.currentHour < start && context.currentHour > end) {
                        allMatch = false;
                    }
                }
            }

            // Check domainRegex condition
            if (conditions.domainRegex && allMatch && context.activeTab) {
                const regex = new RegExp(conditions.domainRegex);
                if (!regex.test(context.activeTab.domain)) {
                    allMatch = false;
                }
            }

            // Check titleContains condition
            if (conditions.titleContains && allMatch && context.activeTab) {
                if (!context.activeTab.title.toLowerCase().includes(
                    conditions.titleContains.toLowerCase()
                )) {
                    allMatch = false;
                }
            }

            // Check groupCount condition
            if (conditions.groupCount !== undefined && allMatch) {
                if (typeof conditions.groupCount === 'number') {
                    if (context.groupCount !== conditions.groupCount) {
                        allMatch = false;
                    }
                } else {
                    const { min, max } = conditions.groupCount;
                    if (min !== undefined && context.groupCount < min) allMatch = false;
                    if (max !== undefined && context.groupCount > max) allMatch = false;
                }
            }

            // If all conditions match, return this easter egg
            if (allMatch) {
                const matchedConditions: string[] = [];
                if (conditions.tabCount !== undefined) matchedConditions.push('tabCount');
                if (conditions.hourRange) matchedConditions.push('hourRange');
                if (conditions.domainRegex) matchedConditions.push('domainRegex');
                if (conditions.titleContains) matchedConditions.push('titleContains');
                if (conditions.groupCount !== undefined) matchedConditions.push('groupCount');

                return Result.ok({
                    easterEggId: egg.id,
                    easterEggType: egg.type,
                    matchedConditions,
                    priority: egg.priority,
                    metadata: egg.metadata,
                });
            }
        }

        // No matches
        return Result.ok(null);
    }

    /**
     * Register a new easter egg trigger
     * 
     * DATA IN: definition: EasterEggDefinition
     * DATA OUT: Result<void, EasterEggError>
     * 
     * FLOW:
     *   1. Check for duplicate ID
     *   2. Add to easterEggs array
     *   3. Sort by priority (descending)
     *   4. Return success
     * 
     * ERRORS:
     *   - DuplicateEasterEggId: ID already exists
     * 
     * PERFORMANCE: <5ms (mock, in-memory)
     */
    registerEasterEgg(
        definition: EasterEggDefinition
    ): Result<void, EasterEggError> {
        this.callHistory.push({
            method: 'registerEasterEgg',
            args: [definition],
            timestamp: Date.now(),
        });

        // Check for duplicate
        if (this.easterEggs.some(ee => ee.id === definition.id)) {
            return Result.error({
                type: 'DuplicateEasterEggId',
                details: `Easter egg with ID ${definition.id} already exists`,
                easterEggId: definition.id,
            });
        }

        // Add and sort by priority
        this.easterEggs.push(definition);
        this.easterEggs.sort((a, b) => b.priority - a.priority);

        return Result.ok(undefined);
    }

    /**
     * Get all registered easter eggs
     * 
     * DATA IN: void
     * DATA OUT: Result<EasterEggDefinition[], EasterEggError>
     * 
     * PERFORMANCE: <5ms (mock, in-memory)
     */
    getAllEasterEggs(): Result<EasterEggDefinition[], EasterEggError> {
        this.callHistory.push({
            method: 'getAllEasterEggs',
            args: [],
            timestamp: Date.now(),
        });

        return Result.ok([...this.easterEggs]);
    }

    /**
     * Clear all registered easter eggs
     * 
     * DATA IN: void
     * DATA OUT: void
     * 
     * PERFORMANCE: <1ms (synchronous)
     */
    clearAll(): void {
        this.callHistory.push({
            method: 'clearAll',
            args: [],
            timestamp: Date.now(),
        });

        this.easterEggs = [];
    }

    // ========================================
    // MOCK HELPER METHODS
    // ========================================

    /**
     * Configure mock to return null for all checks
     */
    setShouldReturnNull(value: boolean): void {
        this.shouldReturnNull = value;
    }

    /**
     * Configure mock to return errors
     */
    setShouldReturnError(value: boolean): void {
        this.shouldReturnError = value;
    }

    /**
     * Force specific match to be returned
     */
    setForcedMatch(match: EasterEggMatch | null): void {
        this.forcedMatch = match;
    }

    /**
     * Reset mock to initial state
     */
    reset(): void {
        this.callHistory = [];
        this.shouldReturnNull = false;
        this.shouldReturnError = false;
        this.forcedMatch = null;
        this.easterEggs = [];
        this.seedDefaultEasterEggs();
    }

    /**
     * Get call history for test assertions
     */
    getCallHistory(): MockCallRecord[] {
        return [...this.callHistory];
    }

    /**
     * Seed default easter eggs
     */
    private seedDefaultEasterEggs(): void {
        this.easterEggs = [
            {
                id: 'EE-001',
                type: '42-tabs',
                priority: 10,
                conditions: { tabCount: 42 },
                metadata: {
                    nicheReference: 'Douglas Adams - Hitchhiker\'s Guide',
                    difficulty: 'uncommon',
                },
            },
            {
                id: 'EE-002',
                type: 'late-night-coding',
                priority: 8,
                conditions: {
                    hourRange: { start: 0, end: 3 },
                    domainRegex: 'stackoverflow\\.com|github\\.com',
                },
                metadata: {
                    nicheReference: 'Developer late night coding',
                    difficulty: 'common',
                },
            },
            {
                id: 'EE-003',
                type: 'tab-hoarder',
                priority: 7,
                conditions: {
                    tabCount: { min: 100 },
                },
                metadata: {
                    nicheReference: 'Tab hoarding culture',
                    difficulty: 'rare',
                },
            },
            {
                id: 'EE-004',
                type: 'group-master',
                priority: 6,
                conditions: {
                    groupCount: { min: 10 },
                },
                metadata: {
                    nicheReference: 'Organization culture',
                    difficulty: 'rare',
                },
            },
            {
                id: 'EE-005',
                type: 'youtube-procrastination',
                priority: 5,
                conditions: {
                    domainRegex: 'youtube\\.com',
                    titleContains: 'tutorial',
                },
                metadata: {
                    nicheReference: 'Productivity procrastination',
                    difficulty: 'common',
                },
            },
        ];
    }
}

/**
 * Record of mock method calls
 */
export interface MockCallRecord {
    method: string;
    args: any[];
    timestamp: number;
}
