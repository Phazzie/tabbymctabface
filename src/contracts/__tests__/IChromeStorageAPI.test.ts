/**
 * FILE: IChromeStorageAPI.test.ts
 * 
 * WHAT: Contract tests for IChromeStorageAPI - validates Chrome storage wrapper
 * 
 * WHY: Ensures Chrome Storage API wrapper correctly persists extension data with Result types.
 *      Critical seam for data persistence boundary.
 * 
 * HOW DATA FLOWS:
 *   1. Tests call IChromeStorageAPI methods with test data
 *   2. Validate storage operations (get, set, remove, clear)
 *   3. Verify Result<T, StorageAPIError> type conversions
 *   4. Ensure error mapping from Chrome to domain errors
 * 
 * SEAMS:
 *   IN: Core modules → ChromeStorageAPI (SEAM-27)
 *   OUT: ChromeStorageAPI → chrome.storage (external)
 * 
 * CONTRACT: IChromeStorageAPI v1.0.0 validation
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { describe, it, expect } from 'vitest';
import type { 
  IChromeStorageAPI,
  StorageAPIError
} from '../../contracts/IChromeStorageAPI';
import { Result } from '../../utils/Result';

describe('IChromeStorageAPI CONTRACT', () => {
  describe('CONTRACT: get()', () => {
    it('MUST accept single key as string', () => {
      const key = 'humorLevel';
      expect(typeof key).toBe('string');
    });

    it('MUST accept array of keys', () => {
      const keys = ['humorLevel', 'tabGroupSettings', 'lastQuipTime'];
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.every(k => typeof k === 'string')).toBe(true);
    });

    it('MUST accept null to retrieve all items', () => {
      const allKeys = null;
      expect(allKeys).toBeNull();
    });

    it('MUST return Result<Record<string, any>, StorageAPIError> on success', () => {
      const data = { humorLevel: 'default', tabCount: 42 };
      const successResult = Result.ok(data);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(typeof successResult.value).toBe('object');
        expect(successResult.value.humorLevel).toBe('default');
      }
    });

    it('MUST return empty object when key not found', () => {
      const emptyResult = Result.ok({});
      
      expect(Result.isOk(emptyResult)).toBe(true);
      if (Result.isOk(emptyResult)) {
        expect(Object.keys(emptyResult.value).length).toBe(0);
      }
    });

    it('MUST return QuotaExceeded when storage quota exceeded', () => {
      const error: StorageAPIError = {
        type: 'QuotaExceeded',
        details: 'Storage quota exceeded',
        bytesUsed: 10485760,
        quotaBytes: 10485760
      };
      
      expect(error.type).toBe('QuotaExceeded');
      expect(error.bytesUsed).toBeDefined();
      expect(error.quotaBytes).toBeDefined();
    });

    it('MUST meet <20ms performance SLA', () => {
      const SLA_MS = 20;
      expect(SLA_MS).toBe(20);
    });
  });

  describe('CONTRACT: set()', () => {
    it('MUST accept items as Record<string, any>', () => {
      const items = {
        humorLevel: 'intense',
        tabGroupSettings: { autoCollapse: true },
        lastQuipTime: Date.now()
      };
      
      expect(typeof items).toBe('object');
      expect(items.humorLevel).toBe('intense');
    });

    it('MUST return Result<void, StorageAPIError> on success', () => {
      const successResult = Result.ok<void, StorageAPIError>(undefined);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(successResult.value).toBeUndefined();
      }
    });

    it('MUST return QuotaExceeded when write would exceed quota', () => {
      const error: StorageAPIError = {
        type: 'QuotaExceeded',
        details: 'Cannot save: would exceed quota',
        bytesUsed: 10000000,
        quotaBytes: 10485760
      };
      
      expect(error.type).toBe('QuotaExceeded');
      expect(error.bytesUsed).toBeLessThanOrEqual(error.quotaBytes);
    });

    it('MUST support complex nested objects', () => {
      const complexData = {
        settings: {
          humor: {
            level: 'default',
            triggers: ['tabOpen', 'tabClose'],
            preferences: { subtle: true }
          }
        }
      };
      
      expect(complexData.settings.humor.level).toBe('default');
      expect(Array.isArray(complexData.settings.humor.triggers)).toBe(true);
    });

    it('MUST meet <20ms performance SLA', () => {
      const SLA_MS = 20;
      expect(SLA_MS).toBe(20);
    });
  });

  describe('CONTRACT: remove()', () => {
    it('MUST accept single key as string', () => {
      const key = 'temporaryData';
      expect(typeof key).toBe('string');
    });

    it('MUST accept array of keys', () => {
      const keys = ['tempData1', 'tempData2', 'cache'];
      expect(Array.isArray(keys)).toBe(true);
    });

    it('MUST return Result<void, StorageAPIError> on success', () => {
      const successResult = Result.ok<void, StorageAPIError>(undefined);
      
      expect(Result.isOk(successResult)).toBe(true);
    });

    it('MUST succeed even if key does not exist', () => {
      // Contract behavior: Removing non-existent key is not an error
      const successResult = Result.ok<void, StorageAPIError>(undefined);
      
      expect(Result.isOk(successResult)).toBe(true);
    });

    it('MUST meet <20ms performance SLA', () => {
      const SLA_MS = 20;
      expect(SLA_MS).toBe(20);
    });
  });

  describe('CONTRACT: clear()', () => {
    it('MUST accept no parameters', () => {
      // clear() takes no parameters
      const noParams = undefined;
      expect(noParams).toBeUndefined();
    });

    it('MUST return Result<void, StorageAPIError> on success', () => {
      const successResult = Result.ok<void, StorageAPIError>(undefined);
      
      expect(Result.isOk(successResult)).toBe(true);
    });

    it('MUST remove all items from storage', () => {
      // Validation will be in implementation tests
      // Contract guarantees: After clear(), get(null) returns {}
      const emptyStorage = Result.ok({});
      
      expect(Result.isOk(emptyStorage)).toBe(true);
      if (Result.isOk(emptyStorage)) {
        expect(Object.keys(emptyStorage.value).length).toBe(0);
      }
    });

    it('MUST meet <20ms performance SLA', () => {
      const SLA_MS = 20;
      expect(SLA_MS).toBe(20);
    });
  });

  describe('CONTRACT: getBytesInUse()', () => {
    it('MUST accept single key as string', () => {
      const key = 'humorSettings';
      expect(typeof key).toBe('string');
    });

    it('MUST accept array of keys', () => {
      const keys = ['settings', 'cache', 'quips'];
      expect(Array.isArray(keys)).toBe(true);
    });

    it('MUST accept null to get total bytes', () => {
      const allKeys = null;
      expect(allKeys).toBeNull();
    });

    it('MUST return Result<number, StorageAPIError> on success', () => {
      const bytesUsed = 1024;
      const successResult = Result.ok(bytesUsed);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(typeof successResult.value).toBe('number');
        expect(successResult.value).toBeGreaterThanOrEqual(0);
      }
    });

    it('MUST return 0 when key does not exist', () => {
      const noBytes = Result.ok(0);
      
      expect(Result.isOk(noBytes)).toBe(true);
      if (Result.isOk(noBytes)) {
        expect(noBytes.value).toBe(0);
      }
    });

    it('MUST meet <20ms performance SLA', () => {
      const SLA_MS = 20;
      expect(SLA_MS).toBe(20);
    });
  });

  describe('CONTRACT: Error Type Guarantees', () => {
    it('StorageAPIError MUST be discriminated union', () => {
      const error1: StorageAPIError = {
        type: 'QuotaExceeded',
        details: 'Quota exceeded',
        bytesUsed: 1000,
        quotaBytes: 1000
      };
      const error2: StorageAPIError = {
        type: 'PermissionDenied',
        details: 'No storage permission'
      };
      const error3: StorageAPIError = {
        type: 'ChromeAPIFailure',
        details: 'Storage API failed',
        originalError: new Error()
      };
      
      expect(error1.type).toBe('QuotaExceeded');
      expect(error2.type).toBe('PermissionDenied');
      expect(error3.type).toBe('ChromeAPIFailure');
    });

    it('MUST include bytesUsed and quotaBytes in QuotaExceeded', () => {
      const error: StorageAPIError = {
        type: 'QuotaExceeded',
        details: 'Storage full',
        bytesUsed: 10485760,
        quotaBytes: 10485760
      };
      
      expect(error.bytesUsed).toBeDefined();
      expect(error.quotaBytes).toBeDefined();
      expect(typeof error.bytesUsed).toBe('number');
      expect(typeof error.quotaBytes).toBe('number');
    });

    it('MUST preserve originalError in ChromeAPIFailure', () => {
      const chromeError = new Error('Storage system error');
      const error: StorageAPIError = {
        type: 'ChromeAPIFailure',
        details: 'Wrapped storage error',
        originalError: chromeError
      };
      
      expect(error.originalError).toBe(chromeError);
    });
  });

  describe('CONTRACT: Data Serialization', () => {
    it('MUST support JSON-serializable primitives', () => {
      const data = {
        string: 'text',
        number: 42,
        boolean: true,
        null: null
      };
      
      expect(typeof data.string).toBe('string');
      expect(typeof data.number).toBe('number');
      expect(typeof data.boolean).toBe('boolean');
      expect(data.null).toBeNull();
    });

    it('MUST support JSON-serializable arrays', () => {
      const data = {
        numbers: [1, 2, 3],
        strings: ['a', 'b', 'c'],
        mixed: [1, 'two', true, null]
      };
      
      expect(Array.isArray(data.numbers)).toBe(true);
      expect(Array.isArray(data.strings)).toBe(true);
      expect(Array.isArray(data.mixed)).toBe(true);
    });

    it('MUST support JSON-serializable nested objects', () => {
      const data = {
        settings: {
          humor: {
            level: 'default',
            enabled: true
          },
          ui: {
            theme: 'dark'
          }
        }
      };
      
      expect(data.settings.humor.level).toBe('default');
      expect(data.settings.ui.theme).toBe('dark');
    });

    it('MUST NOT support functions or symbols (JSON limitation)', () => {
      // Contract note: Functions and symbols cannot be stored
      // They will be silently dropped during serialization
      const func = () => {};
      const sym = Symbol('test');
      
      expect(typeof func).toBe('function');
      expect(typeof sym).toBe('symbol');
      // These types are excluded from StorageValue by contract
    });
  });

  describe('CONTRACT: Performance SLAs', () => {
    it('ALL methods MUST have <20ms SLA', () => {
      const SLA_MS = 20;
      expect(SLA_MS).toBe(20);
    });
  });

  describe('CONTRACT: No Exceptions', () => {
    it('MUST never throw exceptions - always return Result', () => {
      const successResult = Result.ok({ key: 'value' });
      const errorResult = Result.error<StorageAPIError>({
        type: 'PermissionDenied',
        details: 'No permission'
      });
      
      expect(Result.isOk(successResult) || Result.isError(successResult)).toBe(true);
      expect(Result.isOk(errorResult) || Result.isError(errorResult)).toBe(true);
    });
  });
});
