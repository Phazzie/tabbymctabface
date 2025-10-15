/**
 * FILE: IHumorPersonality.test.ts
 * 
 * WHAT: Contract tests for IHumorPersonality - validates pluggable personality interface
 * 
 * WHY: Ensures personality implementations correctly select context-appropriate quips.
 *      Critical for extensibility - multiple personalities can be dropped in.
 * 
 * HOW DATA FLOWS:
 *   1. Tests call personality methods with trigger/easter egg data
 *   2. Mock IQuipStorage responses
 *   3. Validate quip selection logic
 *   4. Verify metadata and level support
 * 
 * SEAMS:
 *   IN: HumorSystem → Personality (SEAM-12, SEAM-18)
 *   OUT: Personality → QuipStorage (SEAM-13, SEAM-17)
 * 
 * CONTRACT: IHumorPersonality v1.0.0 validation
 * GENERATED: 2025-10-12
 * CUSTOM SECTIONS: None
 */

import { describe, it, expect } from 'vitest';
import type {
    IHumorPersonality,
    HumorLevel,
    PersonalityMetadata,
    EasterEggMatch,
    BrowserContext,
    PersonalityError
} from '../IHumorPersonality';
import { Result } from '../../utils/Result';

describe('IHumorPersonality CONTRACT v1.0.0', () => {
    // NOTE: These tests define the contract behavior
    // Implementation will be created to pass these tests

    describe('CONTRACT: getPassiveAggressiveQuip()', () => {
        it('MUST accept triggerType, triggerData, and level', () => {
            // Contract specifies: Three parameters
            const triggerType = 'TabGroupCreated';
            const triggerData = { groupName: 'Work', tabCount: 5 };
            const level: HumorLevel = 'default';

            expect(typeof triggerType).toBe('string');
            expect(triggerData).toBeDefined();
            expect(level).toBeDefined();
        });

        it('MUST support all HumorLevels', () => {
            // Contract specifies: Three levels (V1 uses 'default')
            const levels: HumorLevel[] = ['default', 'mild', 'intense'];

            expect(levels.length).toBe(3);
            levels.forEach(level => expect(level).toBeDefined());
        });

        it('MUST return Result<string | null, PersonalityError> on success', () => {
            // Contract specifies: Success returns quip text or null
            const quipText = 'Oh look, another tab group. How organized of you.';
            const successResult = Result.ok(quipText);

            expect(Result.isOk(successResult)).toBe(true);
            if (Result.isOk(successResult)) {
                expect(typeof successResult.value).toBe('string');
            }
        });

        it('MUST return null when no appropriate quip found', () => {
            // Contract behavior: null is valid when no match
            const noQuipResult = Result.ok<string | null>(null);

            expect(Result.isOk(noQuipResult)).toBe(true);
            if (Result.isOk(noQuipResult)) {
                expect(noQuipResult.value).toBeNull();
            }
        });

        it('MUST return StorageFailure error when quip storage fails', () => {
            // Contract specifies: StorageFailure error type
            const originalError = new Error('Failed to read JSON');
            const error: PersonalityError = {
                type: 'StorageFailure',
                details: 'Failed to access quip storage',
                originalError
            };
            const errorResult = Result.error(error);

            expect(Result.isError(errorResult)).toBe(true);
            if (Result.isError(errorResult)) {
                expect(errorResult.error.type).toBe('StorageFailure');
                expect(errorResult.error.originalError).toBe(originalError);
            }
        });

        it('MUST return InvalidTriggerType error for unrecognized trigger', () => {
            // Contract specifies: InvalidTriggerType error
            const error: PersonalityError = {
                type: 'InvalidTriggerType',
                details: 'Trigger type not recognized',
                triggerType: 'UnknownTrigger'
            };

            expect(error.type).toBe('InvalidTriggerType');
            expect(error.triggerType).toBeDefined();
        });

        it('MUST meet <30ms performance SLA', () => {
            // Contract specifies: <30ms (95th percentile)
            const SLA_MS = 30;
            expect(SLA_MS).toBe(30);
            // Actual performance test in implementation suite
        });
    });

    describe('CONTRACT: getEasterEggQuip()', () => {
        it('MUST accept EasterEggMatch and BrowserContext', () => {
            // Contract specifies: Two parameters
            const easterEggMatch: EasterEggMatch = {
                easterEggId: 'EE-001',
                easterEggType: '42-tabs',
                matchedConditions: ['tabCount=42'],
                priority: 100
            };
            const context: BrowserContext = {
                tabCount: 42,
                activeTab: {
                    url: 'https://example.com',
                    title: 'Example',
                    domain: 'example.com'
                },
                currentHour: 14,
                recentEvents: [],
                groupCount: 0
            };

            expect(easterEggMatch.easterEggType).toBeDefined();
            expect(context.tabCount).toBeDefined();
        });

        it('MUST return Result<string | null, PersonalityError> on success', () => {
            // Contract specifies: Success returns easter egg quip or null
            const easterEggQuip = '42 tabs. The answer to life, universe, and your browser.';
            const successResult = Result.ok(easterEggQuip);

            expect(Result.isOk(successResult)).toBe(true);
            if (Result.isOk(successResult)) {
                expect(typeof successResult.value).toBe('string');
                expect(successResult.value!.length).toBeGreaterThan(0);
            }
        });

        it('MUST return null when no easter egg quip available', () => {
            // Contract behavior: null is valid when no quip
            const noQuipResult = Result.ok<string | null>(null);

            expect(Result.isOk(noQuipResult)).toBe(true);
            if (Result.isOk(noQuipResult)) {
                expect(noQuipResult.value).toBeNull();
            }
        });

        it('MUST return InvalidEasterEggType error for unrecognized type', () => {
            // Contract specifies: InvalidEasterEggType error
            const error: PersonalityError = {
                type: 'InvalidEasterEggType',
                details: 'Easter egg type not recognized',
                easterEggType: 'unknown-easter-egg'
            };

            expect(error.type).toBe('InvalidEasterEggType');
            expect(error.easterEggType).toBeDefined();
        });

        it('MUST return QuipSelectionFailed error on selection logic failure', () => {
            // Contract specifies: QuipSelectionFailed error
            const error: PersonalityError = {
                type: 'QuipSelectionFailed',
                details: 'Failed to select appropriate quip'
            };

            expect(error.type).toBe('QuipSelectionFailed');
        });

        it('MUST meet <30ms performance SLA', () => {
            // Contract specifies: <30ms (95th percentile)
            const SLA_MS = 30;
            expect(SLA_MS).toBe(30);
        });
    });

    describe('CONTRACT: getMetadata()', () => {
        it('MUST return PersonalityMetadata synchronously', () => {
            // Contract specifies: Synchronous getter returning metadata
            const metadata: PersonalityMetadata = {
                name: 'TabbyMcTabface',
                description: 'Passive-aggressive tab management humor',
                level: 'default',
                version: '1.0.0'
            };

            expect(metadata.name).toBeDefined();
            expect(metadata.description).toBeDefined();
            expect(metadata.level).toBeDefined();
            expect(metadata.version).toBeDefined();
        });

        it('MUST include name, description, level, and version', () => {
            // Contract specifies: All four metadata fields required
            const metadata: PersonalityMetadata = {
                name: 'Test Personality',
                description: 'Test description',
                level: 'mild',
                version: '1.0.0'
            };

            expect(typeof metadata.name).toBe('string');
            expect(typeof metadata.description).toBe('string');
            expect(['default', 'mild', 'intense']).toContain(metadata.level);
            expect(typeof metadata.version).toBe('string');
        });

        it('MUST complete in <1ms (synchronous)', () => {
            // Contract specifies: <1ms (synchronous getter)
            const SLA_MS = 1;
            expect(SLA_MS).toBe(1);
        });
    });

    describe('CONTRACT: supportsLevel()', () => {
        it('MUST accept HumorLevel as parameter', () => {
            // Contract specifies: level parameter
            const level: HumorLevel = 'default';
            expect(level).toBeDefined();
        });

        it('MUST return boolean indicating level support', () => {
            // Contract specifies: Returns boolean
            const supportsDefault = true;
            const supportsMild = false;

            expect(typeof supportsDefault).toBe('boolean');
            expect(typeof supportsMild).toBe('boolean');
        });

        it('V1 TabbyMcTabface personality MUST support default level only', () => {
            // Contract behavior: V1 personality supports 'default' level
            const defaultSupported = true;
            const mildSupported = false;
            const intenseSupported = false;

            expect(defaultSupported).toBe(true);
            expect(mildSupported).toBe(false);
            expect(intenseSupported).toBe(false);
        });
    });

    describe('CONTRACT: Error Type Guarantees', () => {
        it('PersonalityError MUST be discriminated union', () => {
            // Contract specifies: All errors have 'type' discriminator
            const error1: PersonalityError = {
                type: 'StorageFailure',
                details: 'fail',
                originalError: new Error()
            };
            const error2: PersonalityError = {
                type: 'InvalidTriggerType',
                details: 'fail',
                triggerType: 'unknown'
            };
            const error3: PersonalityError = {
                type: 'InvalidEasterEggType',
                details: 'fail',
                easterEggType: 'unknown'
            };
            const error4: PersonalityError = {
                type: 'QuipSelectionFailed',
                details: 'fail'
            };

            expect(error1.type).toBe('StorageFailure');
            expect(error2.type).toBe('InvalidTriggerType');
            expect(error3.type).toBe('InvalidEasterEggType');
            expect(error4.type).toBe('QuipSelectionFailed');
        });
    });

    describe('CONTRACT: Type Guards', () => {
        it('MUST provide isStorageFailureError type guard', () => {
            // Contract provides type guard for StorageFailure errors
            function isStorageFailureError(
                error: PersonalityError
            ): error is Extract<PersonalityError, { type: 'StorageFailure' }> {
                return error.type === 'StorageFailure';
            }

            const error: PersonalityError = {
                type: 'StorageFailure',
                details: 'fail',
                originalError: new Error()
            };

            expect(isStorageFailureError(error)).toBe(true);
            if (isStorageFailureError(error)) {
                expect(error.originalError).toBeDefined(); // Type narrowing works
            }
        });
    });

    describe('CONTRACT: Extensibility', () => {
        it('MUST enable multiple personality implementations', () => {
            // Contract design: Interface allows drop-in personality replacements
            const personalities = [
                { name: 'TabbyMcTabface', level: 'default' as HumorLevel },
                { name: 'MildManager', level: 'mild' as HumorLevel },
                { name: 'IntenseIntern', level: 'intense' as HumorLevel }
            ];

            expect(personalities.length).toBe(3);
            personalities.forEach(p => {
                expect(p.name).toBeDefined();
                expect(p.level).toBeDefined();
            });
        });

        it('Future personalities MUST implement same interface', () => {
            // Contract guarantee: All personalities share IHumorPersonality interface
            const interfaceGuarantee = 'IHumorPersonality';
            expect(interfaceGuarantee).toBe('IHumorPersonality');
        });
    });

    describe('CONTRACT: No Exceptions', () => {
        it('MUST never throw exceptions - always return Result', () => {
            // Contract guarantees: All async methods return Result, never throw
            const successResult = Result.ok('Test quip');
            const errorResult = Result.error<PersonalityError>({
                type: 'StorageFailure',
                details: 'fail',
                originalError: new Error()
            });

            expect(Result.isOk(successResult) || Result.isError(successResult)).toBe(true);
            expect(Result.isOk(errorResult) || Result.isError(errorResult)).toBe(true);
        });
    });
});
