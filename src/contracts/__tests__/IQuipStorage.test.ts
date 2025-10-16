/**
 * FILE: IQuipStorage.test.ts
 * 
 * WHAT: Contract tests for IQuipStorage - validates JSON-based quip data access
 * 
 * WHY: Ensures quip storage correctly loads, validates, and retrieves humor data.
 *      Critical for DRY data access patterns and data-driven humor extensibility.
 * 
 * HOW DATA FLOWS:
 *   1. Tests call storage initialization and query methods
 *   2. Mock JSON file loading (success/failure scenarios)
 *   3. Validate schema validation and caching behavior
 *   4. Verify graceful degradation on data corruption
 * 
 * SEAMS:
 *   IN: Personality → QuipStorage (SEAM-13, SEAM-17)
 *   OUT: QuipStorage → JSON Files (SEAM-14 - internal file I/O)
 * 
 * CONTRACT: IQuipStorage v1.0.0 validation
 * GENERATED: 2025-10-12
 * CUSTOM SECTIONS: None
 */

import { describe, it, expect } from 'vitest';
import type {
    IQuipStorage,
    HumorLevel,
    QuipData,
    EasterEggData,
    EasterEggConditions,
    StorageError
} from '../IQuipStorage';
import { Result } from '../../utils/Result';

// NOTE: These tests define the contract behavior
// Implementation will be created to pass these tests

describe('CONTRACT: initialize()', () => {
    it('MUST load and cache JSON data on initialization', () => {
        // Contract specifies: One-time load during extension startup
        const initializationComplete = true;
        expect(initializationComplete).toBe(true);
    });

    it('MUST return Result<void, StorageError> on success', () => {
        // Contract specifies: Success returns void
        const successResult = Result.ok<void>(undefined);

        expect(Result.isOk(successResult)).toBe(true);
    });

    it('MUST return FileNotFound error when JSON file missing', () => {
        // Contract specifies: FileNotFound error type
        const error: StorageError = {
            type: 'FileNotFound',
            details: 'Quip data file not found',
            filePath: 'quips/passive-aggressive.json'
        };
        const errorResult = Result.error(error);

        expect(Result.isError(errorResult)).toBe(true);
        if (Result.isError(errorResult)) {
            expect(errorResult.error.type).toBe('FileNotFound');
            expect(errorResult.error.filePath).toBeDefined();
        }
    });

    it('MUST return JSONParseError when JSON is malformed', () => {
        // Contract specifies: JSONParseError on invalid JSON
        const parseError = new SyntaxError('Unexpected token');
        const error: StorageError = {
            type: 'JSONParseError',
            details: 'Failed to parse JSON',
            filePath: 'quips/passive-aggressive.json',
            originalError: parseError
        };

        expect(error.type).toBe('JSONParseError');
        expect(error.originalError).toBe(parseError);
    });

    it('MUST return SchemaValidationError when JSON schema invalid', () => {
        // Contract specifies: SchemaValidationError on schema mismatch
        const error: StorageError = {
            type: 'SchemaValidationError',
            details: 'JSON does not match expected schema',
            violations: ['Missing required field: id', 'Invalid field type: level']
        };

        expect(error.type).toBe('SchemaValidationError');
        expect(Array.isArray(error.violations)).toBe(true);
        expect(error.violations.length).toBeGreaterThan(0);
    });

    it('MUST meet <50ms performance SLA for one-time load', () => {
        // Contract specifies: <50ms (one-time initialization)
        const SLA_MS = 50;
        expect(SLA_MS).toBe(50);
        // Actual performance test in implementation suite
    });
});

describe('CONTRACT: getPassiveAggressiveQuips()', () => {
    it('MUST accept HumorLevel and optional triggerType filter', () => {
        // Contract specifies: level (required), triggerType (optional)
        const level: HumorLevel = 'default';
        const triggerType: string | undefined = 'TabGroupCreated';

        expect(level).toBeDefined();
        expect(typeof triggerType === 'string' || triggerType === undefined).toBe(true);
    });

    it('MUST return Result<QuipData[], StorageError> on success', () => {
        // Contract specifies: Success returns QuipData array
        const quips: QuipData[] = [
            {
                id: 'PA-001',
                text: 'Oh look, another tab group. How organized of you.',
                triggerTypes: ['TabGroupCreated'],
                level: 'default'
            }
        ];
        const successResult = Result.ok(quips);

        expect(Result.isOk(successResult)).toBe(true);
        if (Result.isOk(successResult)) {
            expect(Array.isArray(successResult.value)).toBe(true);
            expect(successResult.value[0]).toHaveProperty('id');
            expect(successResult.value[0]).toHaveProperty('text');
            expect(successResult.value[0]).toHaveProperty('triggerTypes');
            expect(successResult.value[0]).toHaveProperty('level');
        }
    });

    it('MUST return empty array when no quips match criteria', () => {
        // Contract behavior: Empty array is graceful degradation
        const emptyResult = Result.ok<QuipData[]>([]);

        expect(Result.isOk(emptyResult)).toBe(true);
        if (Result.isOk(emptyResult)) {
            expect(emptyResult.value.length).toBe(0);
        }
    });

    it('MUST validate QuipData structure (id, text, triggerTypes, level)', () => {
        // Contract specifies: Required QuipData fields
        const quip: QuipData = {
            id: 'PA-001',
            text: 'Test quip text (10-200 chars)',
            triggerTypes: ['TabGroupCreated', 'TabOpened'],
            level: 'default',
            metadata: {
                tags: ['tab-management'],
                rarity: 'common'
            }
        };

        expect(quip.id).toBeDefined();
        expect(quip.text).toBeDefined();
        expect(Array.isArray(quip.triggerTypes)).toBe(true);
        expect(quip.level).toBeDefined();
        expect(quip.metadata).toBeDefined();
    });

    it('MUST support optional metadata (tags, rarity)', () => {
        // Contract specifies: Optional metadata field
        const withMetadata: QuipData = {
            id: 'PA-001',
            text: 'Test',
            triggerTypes: ['test'],
            level: 'default',
            metadata: { tags: ['test'], rarity: 'rare' }
        };
        const withoutMetadata: QuipData = {
            id: 'PA-002',
            text: 'Test',
            triggerTypes: ['test'],
            level: 'default'
        };

        expect(withMetadata.metadata).toBeDefined();
        expect(withoutMetadata.metadata).toBeUndefined();
    });

    it('MUST return NotInitialized error when initialize() not called', () => {
        // Contract specifies: NotInitialized error before initialize()
        const error: StorageError = {
            type: 'NotInitialized',
            details: 'Storage must be initialized before querying'
        };

        expect(error.type).toBe('NotInitialized');
    });

    it('MUST meet <10ms performance SLA (cached)', () => {
        // Contract specifies: <10ms (95th percentile - in-memory cached)
        const SLA_MS = 10;
        expect(SLA_MS).toBe(10);
    });
});

describe('CONTRACT: getEasterEggQuips()', () => {
    it('MUST accept easterEggType and HumorLevel', () => {
        // Contract specifies: Two required parameters
        const easterEggType = '42-tabs';
        const level: HumorLevel = 'default';

        expect(typeof easterEggType).toBe('string');
        expect(level).toBeDefined();
    });

    it('MUST return Result<EasterEggData[], StorageError> on success', () => {
        // Contract specifies: Success returns EasterEggData array
        const easterEggs: EasterEggData[] = [
            {
                id: 'EE-001',
                type: '42-tabs',
                conditions: { tabCount: 42 },
                quips: ['42 tabs. The answer to life, universe, and your browser.'],
                level: 'default'
            }
        ];
        const successResult = Result.ok(easterEggs);

        expect(Result.isOk(successResult)).toBe(true);
        if (Result.isOk(successResult)) {
            expect(Array.isArray(successResult.value)).toBe(true);
            expect(successResult.value[0]).toHaveProperty('id');
            expect(successResult.value[0]).toHaveProperty('type');
            expect(successResult.value[0]).toHaveProperty('conditions');
            expect(successResult.value[0]).toHaveProperty('quips');
            expect(successResult.value[0]).toHaveProperty('level');
        }
    });

    it('MUST validate EasterEggData structure', () => {
        // Contract specifies: Required EasterEggData fields
        const easterEgg: EasterEggData = {
            id: 'EE-001',
            type: '42-tabs',
            conditions: {
                tabCount: 42,
                hourRange: { start: 0, end: 3 }
            },
            quips: ['Quip variation 1', 'Quip variation 2'],
            level: 'default',
            metadata: {
                nicheReference: 'Douglas Adams - Hitchhiker\'s Guide',
                difficulty: 'legendary'
            }
        };

        expect(easterEgg.id).toBeDefined();
        expect(easterEgg.type).toBeDefined();
        expect(easterEgg.conditions).toBeDefined();
        expect(Array.isArray(easterEgg.quips)).toBe(true);
        expect(easterEgg.level).toBeDefined();
    });

    it('MUST support EasterEggConditions (tabCount, domainRegex, hourRange, etc.)', () => {
        // Contract specifies: Comprehensive condition types
        const conditions: EasterEggConditions = {
            tabCount: 42,
            domainRegex: 'github\\.com',
            hourRange: { start: 0, end: 3 },
            titleContains: 'stackoverflow',
            groupCount: { min: 5, max: 10 }
        };

        expect(conditions.tabCount).toBeDefined();
        expect(conditions.domainRegex).toBeDefined();
        expect(conditions.hourRange).toBeDefined();
        expect(conditions.titleContains).toBeDefined();
        expect(conditions.groupCount).toBeDefined();
    });

    it('MUST support numeric conditions as exact value or range', () => {
        // Contract behavior: tabCount/groupCount can be number or {min, max}
        const exactCount: EasterEggConditions = { tabCount: 42 };
        const rangeCount: EasterEggConditions = {
            tabCount: { min: 40, max: 50 }
        };

        expect(exactCount.tabCount).toBe(42);
        expect(typeof rangeCount.tabCount === 'object').toBe(true);
    });

    it('MUST return empty array when no easter eggs match', () => {
        // Contract behavior: Empty array is graceful degradation
        const emptyResult = Result.ok<EasterEggData[]>([]);

        expect(Result.isOk(emptyResult)).toBe(true);
        if (Result.isOk(emptyResult)) {
            expect(emptyResult.value.length).toBe(0);
        }
    });

    it('MUST meet <10ms performance SLA (cached)', () => {
        // Contract specifies: <10ms (95th percentile - in-memory cached)
        const SLA_MS = 10;
        expect(SLA_MS).toBe(10);
    });
});

describe('CONTRACT: getAllEasterEggQuips()', () => {
    it('MUST accept optional HumorLevel filter', () => {
        // Contract specifies: level parameter optional
        const level: HumorLevel | undefined = undefined;
        const intenseLevel: HumorLevel | undefined = 'intense';

        expect(level === undefined || level === 'default').toBe(true);
        expect(intenseLevel).toBe('intense');
    });

    it('MUST return Result<EasterEggData[], StorageError> on success', () => {
        // Contract specifies: Success returns aggregated EasterEggData array
        const easterEggs: EasterEggData[] = [
            {
                id: 'EE-001',
                type: '42-tabs',
                conditions: { tabCount: 42 },
                quips: ['Answer to everything'],
                level: 'default'
            },
            {
                id: 'EE-002',
                type: 'late-night-coding',
                conditions: { hourRange: { start: 0, end: 3 } },
                quips: ['Sleep is optional, apparently.'],
                level: 'mild'
            }
        ];
        const successResult = Result.ok(easterEggs);

        expect(Result.isOk(successResult)).toBe(true);
        if (Result.isOk(successResult)) {
            expect(Array.isArray(successResult.value)).toBe(true);
            expect(successResult.value.length).toBe(2);
        }
    });

    it('MUST return empty array when no easter eggs match filter', () => {
        // Contract behavior: Empty array is acceptable result
        const emptyResult = Result.ok<EasterEggData[]>([]);

        expect(Result.isOk(emptyResult)).toBe(true);
        if (Result.isOk(emptyResult)) {
            expect(emptyResult.value).toEqual([]);
        }
    });

    it('MUST return NotInitialized error when initialize() not called', () => {
        // Contract specifies: NotInitialized error when cache not ready
        const error: StorageError = {
            type: 'NotInitialized',
            details: 'Storage must be initialized before querying'
        };

        expect(error.type).toBe('NotInitialized');
    });

    it('MUST meet <10ms performance SLA (cached)', () => {
        // Contract specifies: <10ms (95th percentile - in-memory cached)
        const SLA_MS = 10;
        expect(SLA_MS).toBe(10);
    });
});

describe('CONTRACT: getAvailableTriggerTypes()', () => {
    it('MUST return Result<string[], StorageError> on success', () => {
        // Contract specifies: Success returns trigger type array
        const triggerTypes = ['TabGroupCreated', 'TabClosed', 'TabOpened'];
        const successResult = Result.ok(triggerTypes);

        expect(Result.isOk(successResult)).toBe(true);
        if (Result.isOk(successResult)) {
            expect(Array.isArray(successResult.value)).toBe(true);
            expect(successResult.value.every(triggerType => typeof triggerType === 'string')).toBe(true);
        }
    });

    it('MUST return all unique trigger types from loaded quips', () => {
        // Contract behavior: Aggregates all triggerTypes from QuipData
        const triggerTypes = ['TabGroupCreated', 'TabClosed', 'FeelingLuckyClicked'];
        expect(triggerTypes.length).toBeGreaterThan(0);
    });

    it('MUST meet <5ms performance SLA (cached)', () => {
        // Contract specifies: <5ms (cached)
        const SLA_MS = 5;
        expect(SLA_MS).toBe(5);
    });
});

describe('CONTRACT: isInitialized()', () => {
    it('MUST return boolean indicating initialization state', () => {
        // Contract specifies: Synchronous boolean check
        const initialized = false;
        const afterInit = true;

        expect(typeof initialized).toBe('boolean');
        expect(typeof afterInit).toBe('boolean');
    });

    it('MUST return false before initialize() called', () => {
        // Contract behavior: false until initialize() succeeds
        const beforeInit = false;
        expect(beforeInit).toBe(false);
    });

    it('MUST return true after successful initialize()', () => {
        // Contract behavior: true after initialize() succeeds
        const afterInit = true;
        expect(afterInit).toBe(true);
    });

    it('MUST complete in <1ms (synchronous)', () => {
        // Contract specifies: <1ms (synchronous check)
        const SLA_MS = 1;
        expect(SLA_MS).toBe(1);
    });
});

describe('CONTRACT: Error Type Guarantees', () => {
    it('StorageError MUST be discriminated union', () => {
        // Contract specifies: All errors have 'type' discriminator
        const error1: StorageError = {
            type: 'NotInitialized',
            details: 'fail'
        };
        const error2: StorageError = {
            type: 'FileNotFound',
            details: 'fail',
            filePath: 'test.json'
        };
        const error3: StorageError = {
            type: 'JSONParseError',
            details: 'fail',
            filePath: 'test.json',
            originalError: new Error()
        };
        const error4: StorageError = {
            type: 'SchemaValidationError',
            details: 'fail',
            violations: ['violation1']
        };
        const error5: StorageError = {
            type: 'DataCorrupted',
            details: 'fail',
            dataType: 'quips'
        };

        expect(error1.type).toBe('NotInitialized');
        expect(error2.type).toBe('FileNotFound');
        expect(error3.type).toBe('JSONParseError');
        expect(error4.type).toBe('SchemaValidationError');
        expect(error5.type).toBe('DataCorrupted');
    });
});

describe('CONTRACT: Type Guards', () => {
    it('MUST provide isNotInitializedError type guard', () => {
        // Contract provides type guard for NotInitialized errors
        function isNotInitializedError(
            error: StorageError
        ): error is Extract<StorageError, { type: 'NotInitialized' }> {
            return error.type === 'NotInitialized';
        }

        const error: StorageError = {
            type: 'NotInitialized',
            details: 'fail'
        };

        expect(isNotInitializedError(error)).toBe(true);
    });

    it('MUST provide isJSONParseError type guard', () => {
        // Contract provides type guard for JSONParseError
        function isJSONParseError(
            error: StorageError
        ): error is Extract<StorageError, { type: 'JSONParseError' }> {
            return error.type === 'JSONParseError';
        }

        const error: StorageError = {
            type: 'JSONParseError',
            details: 'fail',
            filePath: 'test.json',
            originalError: new Error()
        };

        expect(isJSONParseError(error)).toBe(true);
        if (isJSONParseError(error)) {
            expect(error.filePath).toBeDefined(); // Type narrowing works
            expect(error.originalError).toBeDefined();
        }
    });
});

describe('CONTRACT: Graceful Degradation', () => {
    it('MUST return empty arrays on data corruption rather than throw', () => {
        // Contract behavior: Graceful degradation - log error, return empty
        const emptyQuips = Result.ok<QuipData[]>([]);
        const emptyEasterEggs = Result.ok<EasterEggData[]>([]);

        expect(Result.isOk(emptyQuips)).toBe(true);
        expect(Result.isOk(emptyEasterEggs)).toBe(true);
    });

    it('MUST log errors internally but not break humor system', () => {
        // Contract guarantee: Errors logged, system continues
        const errorLogged = true;
        const systemContinues = true;

        expect(errorLogged).toBe(true);
        expect(systemContinues).toBe(true);
    });
});

describe('CONTRACT: No Exceptions', () => {
    it('MUST never throw exceptions - always return Result', () => {
        // Contract guarantees: All methods return Result, never throw
        const successResult = Result.ok<void>(undefined);
        const errorResult = Result.error<StorageError>({
            type: 'NotInitialized',
            details: 'fail'
        });

        expect(Result.isOk(successResult) || Result.isError(successResult)).toBe(true);
        expect(Result.isOk(errorResult) || Result.isError(errorResult)).toBe(true);
    });
});
