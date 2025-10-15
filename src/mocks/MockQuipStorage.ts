/**
 * FILE: MockQuipStorage.ts
 * 
 * WHAT: Mock implementation of IQuipStorage - returns fake quip/easter egg data
 * 
 * WHY: Enables development and testing without JSON file I/O. Proves IQuipStorage
 *      contract is implementable. Provides test double for personality testing.
 * 
 * HOW DATA FLOWS:
 *   1. Personality calls storage methods (SEAM-13, SEAM-17)
 *   2. Mock returns fake quips from in-memory arrays
 *   3. No file I/O - instant data access
 *   4. Personality receives typed quip arrays
 * 
 * SEAMS:
 *   IN:  Personality → QuipStorage (SEAM-13, SEAM-17)
 *   OUT: None (mock terminates seam with fake data)
 * 
 * CONTRACT: IQuipStorage v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import type {
    IQuipStorage,
    QuipData,
    EasterEggData,
    StorageError,
    HumorLevel,
} from '../contracts/IQuipStorage';

/**
 * Mock implementation of IQuipStorage
 * 
 * Provides fake quip and easter egg data for testing and development.
 * No file I/O - all data stored in-memory.
 * 
 * MOCK BEHAVIOR:
 * - Returns fake quips and easter eggs
 * - Filters by level and trigger type
 * - Simulates initialization delay
 * - Tracks initialization state
 * - Supports seeding custom test data
 */
export class MockQuipStorage implements IQuipStorage {
    private initialized = false;
    private mockQuips: QuipData[] = [];
    private mockEasterEggs: EasterEggData[] = [];
    private callHistory: MockCallRecord[] = [];

    constructor() {
        // Seed with default fake data
        this.seedDefaultData();
    }

    /**
     * Initialize storage (simulates loading JSON)
     * 
     * DATA IN: void
     * DATA OUT: Result<void, StorageError>
     * 
     * SEAM: Internal initialization
     * 
     * FLOW:
     *   1. Simulate async delay (10ms)
     *   2. Mark as initialized
     *   3. Return success
     * 
     * PERFORMANCE: <20ms (mock, simulated delay)
     */
    async initialize(): Promise<Result<void, StorageError>> {
        this.callHistory.push({ method: 'initialize', args: [], timestamp: Date.now() });

        // Simulate async loading delay
        await new Promise(resolve => setTimeout(resolve, 10));

        this.initialized = true;
        return Result.ok(undefined);
    }

    /**
     * Get passive-aggressive quips
     * 
     * DATA IN: level: HumorLevel, triggerType?: string
     * DATA OUT: Result<QuipData[], StorageError>
     * 
     * SEAM: SEAM-13 (Personality → QuipStorage)
     * 
     * FLOW:
     *   1. Check if initialized
     *   2. Filter quips by level
     *   3. If triggerType provided, filter by trigger
     *   4. Return filtered quips
     * 
     * ERRORS:
     *   - NotInitialized: initialize() not called
     * 
     * PERFORMANCE: <5ms (mock, in-memory)
     */
    async getPassiveAggressiveQuips(
        level: HumorLevel,
        triggerType?: string
    ): Promise<Result<QuipData[], StorageError>> {
        this.callHistory.push({
            method: 'getPassiveAggressiveQuips',
            args: [level, triggerType],
            timestamp: Date.now()
        });

        if (!this.initialized) {
            return Result.error({
                type: 'NotInitialized',
                details: 'Call initialize() before accessing quips',
            });
        }

        let filtered = this.mockQuips.filter(q => q.level === level);

        if (triggerType) {
            filtered = filtered.filter(q => q.triggerTypes.includes(triggerType));
        }

        return Result.ok(filtered);
    }

    /**
     * Get easter egg quips
     * 
     * DATA IN: easterEggType: string, level: HumorLevel
     * DATA OUT: Result<EasterEggData[], StorageError>
     * 
     * SEAM: SEAM-17 (EasterEggFramework/Personality → QuipStorage)
     * 
     * FLOW:
     *   1. Check if initialized
     *   2. Filter easter eggs by type
     *   3. Filter by level
     *   4. Return filtered easter eggs
     * 
     * ERRORS:
     *   - NotInitialized: initialize() not called
     * 
     * PERFORMANCE: <5ms (mock, in-memory)
     */
    async getEasterEggQuips(
        easterEggType: string,
        level: HumorLevel
    ): Promise<Result<EasterEggData[], StorageError>> {
        this.callHistory.push({
            method: 'getEasterEggQuips',
            args: [easterEggType, level],
            timestamp: Date.now()
        });

        if (!this.initialized) {
            return Result.error({
                type: 'NotInitialized',
                details: 'Call initialize() before accessing easter eggs',
            });
        }

        const filtered = this.mockEasterEggs.filter(
            ee => ee.type === easterEggType && ee.level === level
        );

        return Result.ok(filtered);
    }

    /**
     * Get all available trigger types
     * 
     * DATA IN: void
     * DATA OUT: Result<string[], StorageError>
     * 
     * FLOW:
     *   1. Extract all triggerTypes from mockQuips
     *   2. Return unique trigger types
     * 
     * PERFORMANCE: <5ms (mock, in-memory)
     */
    async getAvailableTriggerTypes(): Promise<Result<string[], StorageError>> {
        this.callHistory.push({
            method: 'getAvailableTriggerTypes',
            args: [],
            timestamp: Date.now()
        });

        const triggerTypes = new Set<string>();
        this.mockQuips.forEach(quip => {
            quip.triggerTypes.forEach(type => triggerTypes.add(type));
        });

        return Result.ok(Array.from(triggerTypes));
    }

    /**
     * Check if storage is initialized
     * 
     * DATA IN: void
     * DATA OUT: boolean
     * 
     * PERFORMANCE: <1ms (synchronous)
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    // ========================================
    // MOCK HELPER METHODS
    // ========================================

    /**
     * Seed mock with custom quips
     */
    seedQuips(quips: QuipData[]): void {
        this.mockQuips = [...quips];
    }

    /**
     * Seed mock with custom easter eggs
     */
    seedEasterEggs(easterEggs: EasterEggData[]): void {
        this.mockEasterEggs = [...easterEggs];
    }

    /**
     * Reset mock to initial state
     */
    reset(): void {
        this.initialized = false;
        this.callHistory = [];
        this.seedDefaultData();
    }

    /**
     * Get call history for test assertions
     */
    getCallHistory(): MockCallRecord[] {
        return [...this.callHistory];
    }

    /**
     * Seed default fake data
     */
    private seedDefaultData(): void {
        this.mockQuips = [
            {
                id: 'PA-001',
                text: 'Oh, another tab group. How organized of you. 🙄',
                triggerTypes: ['TabGroupCreated'],
                level: 'default',
                metadata: {
                    tags: ['tab-management', 'organization'],
                    rarity: 'common',
                },
            },
            {
                id: 'PA-002',
                text: 'Feeling lucky? More like feeling reckless.',
                triggerTypes: ['FeelingLuckyClicked'],
                level: 'default',
                metadata: {
                    tags: ['tab-closure', 'risk'],
                    rarity: 'common',
                },
            },
            {
                id: 'PA-003',
                text: 'Another tab bites the dust. Your browser thanks you... probably.',
                triggerTypes: ['TabClosed'],
                level: 'default',
                metadata: {
                    tags: ['tab-closure'],
                    rarity: 'common',
                },
            },
            {
                id: 'PA-004',
                text: 'A new tab! Because clearly the other 47 weren\'t enough.',
                triggerTypes: ['TabOpened'],
                level: 'default',
                metadata: {
                    tags: ['tab-opening', 'procrastination'],
                    rarity: 'common',
                },
            },
            {
                id: 'PA-005',
                text: 'Your tab count has reached alarming levels. Should I call someone?',
                triggerTypes: ['TooManyTabs'],
                level: 'default',
                metadata: {
                    tags: ['tab-hoarding'],
                    rarity: 'uncommon',
                },
            },
            {
                id: 'PA-006',
                text: 'Grouping tabs: The digital equivalent of "I\'ll organize this later."',
                triggerTypes: ['TabGroupCreated'],
                level: 'default',
                metadata: {
                    tags: ['procrastination', 'organization'],
                    rarity: 'uncommon',
                },
            },
            {
                id: 'PA-007',
                text: 'Closing tabs randomly. Bold strategy. Let\'s see if it pays off.',
                triggerTypes: ['FeelingLuckyClicked'],
                level: 'default',
                metadata: {
                    tags: ['risk', 'tab-closure'],
                    rarity: 'uncommon',
                },
            },
        ];

        this.mockEasterEggs = [
            {
                id: 'EE-001',
                type: '42-tabs',
                conditions: {
                    tabCount: 42,
                },
                quips: [
                    'The answer to life, the universe, and your tab count! 🎉',
                    '42 tabs. I see you\'ve found the meaning of everything... or just procrastination.',
                ],
                level: 'default',
                metadata: {
                    nicheReference: 'Douglas Adams - Hitchhiker\'s Guide to the Galaxy',
                    difficulty: 'uncommon',
                },
            },
            {
                id: 'EE-002',
                type: 'late-night-coding',
                conditions: {
                    hourRange: { start: 0, end: 3 },
                    domainRegex: 'stackoverflow\\.com|github\\.com',
                },
                quips: [
                    'Midnight debugging? The bugs fear you now.',
                    '3am and Stack Overflow? Someone\'s in deep. Respect.',
                ],
                level: 'default',
                metadata: {
                    nicheReference: 'Developer culture - late night coding sessions',
                    difficulty: 'common',
                },
            },
            {
                id: 'EE-003',
                type: 'tab-hoarder',
                conditions: {
                    tabCount: { min: 100 },
                },
                quips: [
                    '100+ tabs. You don\'t have a browser, you have a library.',
                    'Triple digits! Your RAM weeps, but I\'m impressed.',
                ],
                level: 'default',
                metadata: {
                    nicheReference: 'Tab hoarding culture',
                    difficulty: 'rare',
                },
            },
            {
                id: 'EE-004',
                type: 'group-master',
                conditions: {
                    groupCount: { min: 10 },
                },
                quips: [
                    '10 groups?! You\'re either very organized or very chaotic. No in-between.',
                    'Tab group master achieved. Your organizational skills are... something.',
                ],
                level: 'default',
                metadata: {
                    nicheReference: 'Organization culture',
                    difficulty: 'rare',
                },
            },
            {
                id: 'EE-005',
                type: 'youtube-procrastination',
                conditions: {
                    domainRegex: 'youtube\\.com',
                    titleContains: 'tutorial',
                },
                quips: [
                    'YouTube tutorial at this hour? Learning or procrastinating? Both. Definitely both.',
                    'Ah yes, the "tutorial" defense. Classic.',
                ],
                level: 'default',
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
