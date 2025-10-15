/**
 * FILE: MockHumorPersonality.ts
 * 
 * WHAT: Mock implementation of IHumorPersonality - returns fake quip selections
 * 
 * WHY: Enables development and testing of HumorSystem without real personality logic.
 *      Proves IHumorPersonality contract is implementable. Provides test double.
 * 
 * HOW DATA FLOWS:
 *   1. HumorSystem calls personality methods (SEAM-12, SEAM-18)
 *   2. Mock simulates quip selection logic
 *   3. Mock returns fake quip text or null
 *   4. HumorSystem receives quip for delivery
 * 
 * SEAMS:
 *   IN:  HumorSystem → Personality (SEAM-12, SEAM-18)
 *   OUT: None (mock terminates seam with fake quips)
 * 
 * CONTRACT: IHumorPersonality v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import type {
    IHumorPersonality,
    PersonalityMetadata,
    PersonalityError,
    HumorLevel,
    EasterEggMatch,
    BrowserContext,
} from '../contracts/IHumorPersonality';

/**
 * Mock implementation of IHumorPersonality
 * 
 * Provides fake quip selection for testing and development.
 * Simulates personality logic without real quip storage dependency.
 * 
 * MOCK BEHAVIOR:
 * - Returns predetermined quips based on trigger type
 * - Supports level filtering
 * - Can be configured to return null (no quip)
 * - Can be configured to return errors
 * - Tracks call history
 */
export class MockHumorPersonality implements IHumorPersonality {
    private callHistory: MockCallRecord[] = [];
    private shouldReturnNull = false;
    private shouldReturnError = false;
    private customQuipMap: Map<string, string> = new Map();

    /**
     * Get a passive-aggressive quip
     * 
     * DATA IN: triggerType: string, triggerData: any, level: HumorLevel
     * DATA OUT: Result<string | null, PersonalityError>
     * 
     * SEAM: SEAM-12 (HumorSystem → Personality)
     * 
     * FLOW:
     *   1. Check if configured to return error
     *   2. Check if configured to return null
     *   3. Look up quip in custom map
     *   4. Fall back to default quips by trigger type
     *   5. Return quip text or null
     * 
     * PERFORMANCE: <5ms (mock, in-memory)
     */
    async getPassiveAggressiveQuip(
        triggerType: string,
        triggerData: any,
        level: HumorLevel
    ): Promise<Result<string | null, PersonalityError>> {
        this.callHistory.push({
            method: 'getPassiveAggressiveQuip',
            args: [triggerType, triggerData, level],
            timestamp: Date.now(),
        });

        // Simulate error if configured
        if (this.shouldReturnError) {
            return Result.error({
                type: 'StorageFailure',
                details: 'Mock configured to return error',
                originalError: new Error('Mock error'),
            });
        }

        // Return null if configured
        if (this.shouldReturnNull) {
            return Result.ok(null);
        }

        // Check custom quip map
        if (this.customQuipMap.has(triggerType)) {
            return Result.ok(this.customQuipMap.get(triggerType)!);
        }

        // Default quips by trigger type
        const defaultQuips: Record<string, string> = {
            'TabGroupCreated': 'Oh, another tab group. How organized of you. 🙄',
            'TabClosed': 'Another tab bites the dust. Your browser thanks you... probably.',
            'FeelingLuckyClicked': 'Feeling lucky? More like feeling reckless.',
            'TabOpened': 'A new tab! Because clearly the other tabs weren\'t enough.',
            'TooManyTabs': 'Your tab count has reached alarming levels. Should I call someone?',
        };

        const quip = defaultQuips[triggerType] || null;
        return Result.ok(quip);
    }

    /**
     * Get an easter egg quip
     * 
     * DATA IN: easterEggMatch: EasterEggMatch, context: BrowserContext
     * DATA OUT: Result<string | null, PersonalityError>
     * 
     * SEAM: SEAM-18 (Personality → EasterEggFramework interaction)
     * 
     * FLOW:
     *   1. Check if configured to return error
     *   2. Check if configured to return null
     *   3. Look up quip in custom map (by easterEggType)
     *   4. Fall back to default easter egg quips
     *   5. Return quip text or null
     * 
     * PERFORMANCE: <5ms (mock, in-memory)
     */
    async getEasterEggQuip(
        easterEggMatch: EasterEggMatch,
        context: BrowserContext
    ): Promise<Result<string | null, PersonalityError>> {
        this.callHistory.push({
            method: 'getEasterEggQuip',
            args: [easterEggMatch, context],
            timestamp: Date.now(),
        });

        // Simulate error if configured
        if (this.shouldReturnError) {
            return Result.error({
                type: 'InvalidEasterEggType',
                details: 'Mock configured to return error',
                easterEggType: easterEggMatch.easterEggType,
            });
        }

        // Return null if configured
        if (this.shouldReturnNull) {
            return Result.ok(null);
        }

        // Check custom quip map
        if (this.customQuipMap.has(easterEggMatch.easterEggType)) {
            return Result.ok(this.customQuipMap.get(easterEggMatch.easterEggType)!);
        }

        // Default easter egg quips
        const defaultEasterEggs: Record<string, string> = {
            '42-tabs': 'The answer to life, the universe, and your tab count! 🎉',
            'late-night-coding': 'Midnight debugging? The bugs fear you now.',
            'tab-hoarder': '100+ tabs. You don\'t have a browser, you have a library.',
            'group-master': '10 groups?! You\'re either very organized or very chaotic.',
            'youtube-procrastination': 'YouTube tutorial at this hour? Learning or procrastinating? Both.',
        };

        const quip = defaultEasterEggs[easterEggMatch.easterEggType] || null;
        return Result.ok(quip);
    }

    /**
     * Get personality metadata
     * 
     * DATA IN: void
     * DATA OUT: PersonalityMetadata
     * 
     * PERFORMANCE: <1ms (synchronous)
     */
    getMetadata(): PersonalityMetadata {
        return {
            name: 'MockTabbyMcTabface',
            description: 'Mock passive-aggressive tab management humor (for testing)',
            level: 'default',
            version: '1.0.0-mock',
        };
    }

    /**
     * Check if personality supports given level
     * 
     * DATA IN: level: HumorLevel
     * DATA OUT: boolean
     * 
     * PERFORMANCE: <1ms (synchronous)
     */
    supportsLevel(level: HumorLevel): boolean {
        // Mock supports all levels
        return true;
    }

    // ========================================
    // MOCK HELPER METHODS
    // ========================================

    /**
     * Configure mock to return null for all quips
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
     * Set custom quip for specific trigger type or easter egg type
     */
    setCustomQuip(triggerOrEasterEggType: string, quip: string): void {
        this.customQuipMap.set(triggerOrEasterEggType, quip);
    }

    /**
     * Clear all custom quips
     */
    clearCustomQuips(): void {
        this.customQuipMap.clear();
    }

    /**
     * Reset mock to initial state
     */
    reset(): void {
        this.callHistory = [];
        this.shouldReturnNull = false;
        this.shouldReturnError = false;
        this.customQuipMap.clear();
    }

    /**
     * Get call history for test assertions
     */
    getCallHistory(): MockCallRecord[] {
        return [...this.callHistory];
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
