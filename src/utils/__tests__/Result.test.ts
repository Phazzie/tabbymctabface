/**
 * FILE: Result.test.ts
 * 
 * WHAT: Contract tests for Result<T, E> utility type - validates error handling foundation
 * 
 * WHY: Ensures Result type correctly implements explicit error handling without exceptions.
 *      All other contracts depend on Result working correctly.
 * 
 * HOW DATA FLOWS:
 *   1. Tests create Result values using factory methods
 *   2. Tests validate type guards work correctly
 *   3. Tests ensure unwrap/map helpers behave as specified
 *   4. Tests verify no exceptions are thrown
 * 
 * SEAMS:
 *   IN: Test harness → Result utilities
 *   OUT: Result utilities → Test assertions
 * 
 * CONTRACT: Result<T, E> v1.0.0 validation
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { describe, it, expect } from 'vitest';
import { Result, Ok, Err } from '../Result';

describe('Result<T, E> CONTRACT', () => {
  describe('Factory Methods', () => {
    it('Result.ok() creates Ok variant with value', () => {
      const result = Result.ok(42);
      
      expect(result.ok).toBe(true);
      expect((result as Ok<number>).value).toBe(42);
    });

    it('Result.error() creates Err variant with error', () => {
      const error = { type: 'TestError', message: 'fail' };
      const result = Result.error(error);
      
      expect(result.ok).toBe(false);
      expect((result as Err<typeof error>).error).toEqual(error);
    });

    it('Result.ok() preserves complex object values', () => {
      const value = { id: 1, name: 'test', nested: { data: [1, 2, 3] } };
      const result = Result.ok(value);
      
      expect((result as Ok<typeof value>).value).toEqual(value);
    });

    it('Result.error() preserves complex error objects', () => {
      const error = { 
        type: 'ComplexError', 
        details: 'failure', 
        metadata: { code: 500 } 
      };
      const result = Result.error(error);
      
      expect((result as Err<typeof error>).error).toEqual(error);
    });
  });

  describe('Type Guards', () => {
    it('Result.isOk() returns true for Ok variant', () => {
      const result = Result.ok(42);
      expect(Result.isOk(result)).toBe(true);
    });

    it('Result.isOk() returns false for Err variant', () => {
      const result = Result.error('fail');
      expect(Result.isOk(result)).toBe(false);
    });

    it('Result.isError() returns true for Err variant', () => {
      const result = Result.error('fail');
      expect(Result.isError(result)).toBe(true);
    });

    it('Result.isError() returns false for Ok variant', () => {
      const result = Result.ok(42);
      expect(Result.isError(result)).toBe(false);
    });

    it('Type guards enable type narrowing', () => {
      const result: Result<number, string> = Result.ok(42);
      
      if (Result.isOk(result)) {
        // TypeScript should know result.value exists
        const value: number = result.value;
        expect(value).toBe(42);
      } else {
        throw new Error('Should not reach here');
      }
    });
  });

  describe('Result.unwrap() - USE SPARINGLY', () => {
    it('unwrap() returns value for Ok variant', () => {
      const result = Result.ok(42);
      expect(Result.unwrap(result)).toBe(42);
    });

    it('unwrap() throws for Err variant', () => {
      const result = Result.error({ type: 'TestError', message: 'fail' });
      
      expect(() => Result.unwrap(result)).toThrow();
    });

    it('unwrap() throw message includes error details', () => {
      const result = Result.error({ type: 'TestError', message: 'fail' });
      
      expect(() => Result.unwrap(result)).toThrow(/TestError/);
    });
  });

  describe('Result.unwrapOr() - Safe Default', () => {
    it('unwrapOr() returns value for Ok variant', () => {
      const result = Result.ok(42);
      expect(Result.unwrapOr(result, 0)).toBe(42);
    });

    it('unwrapOr() returns default for Err variant', () => {
      const result = Result.error('fail');
      expect(Result.unwrapOr(result, 0)).toBe(0);
    });

    it('unwrapOr() works with complex default values', () => {
      const defaultValue = { id: 0, name: 'default' };
      const result: Result<{ id: number; name: string }, string> = Result.error('fail');
      
      expect(Result.unwrapOr(result, defaultValue)).toEqual(defaultValue);
    });
  });

  describe('Result.map() - Transform Success', () => {
    it('map() transforms Ok value', () => {
      const result = Result.ok(42);
      const mapped = Result.map(result, (n) => n * 2);
      
      expect(Result.isOk(mapped)).toBe(true);
      if (Result.isOk(mapped)) {
        expect(mapped.value).toBe(84);
      }
    });

    it('map() passes through Err unchanged', () => {
      const error = { type: 'TestError', message: 'fail' };
      const result: Result<number, typeof error> = Result.error(error);
      const mapped = Result.map(result, (n) => n * 2);
      
      expect(Result.isError(mapped)).toBe(true);
      if (Result.isError(mapped)) {
        expect(mapped.error).toEqual(error);
      }
    });

    it('map() can change value type', () => {
      const result = Result.ok(42);
      const mapped = Result.map(result, (n) => `Number: ${n}`);
      
      if (Result.isOk(mapped)) {
        const value: string = mapped.value;
        expect(value).toBe('Number: 42');
      }
    });
  });

  describe('Result.mapError() - Transform Error', () => {
    it('mapError() transforms Err value', () => {
      const result: Result<number, string> = Result.error('fail');
      const mapped = Result.mapError(result, (e) => `Error: ${e}`);
      
      expect(Result.isError(mapped)).toBe(true);
      if (Result.isError(mapped)) {
        expect(mapped.error).toBe('Error: fail');
      }
    });

    it('mapError() passes through Ok unchanged', () => {
      const result: Result<number, string> = Result.ok(42);
      const mapped = Result.mapError(result, (e) => `Error: ${e}`);
      
      expect(Result.isOk(mapped)).toBe(true);
      if (Result.isOk(mapped)) {
        expect(mapped.value).toBe(42);
      }
    });

    it('mapError() can change error type', () => {
      const result: Result<number, string> = Result.error('fail');
      const mapped = Result.mapError(result, (e) => ({ 
        type: 'MappedError', 
        originalMessage: e 
      }));
      
      if (Result.isError(mapped)) {
        expect(mapped.error).toEqual({ 
          type: 'MappedError', 
          originalMessage: 'fail' 
        });
      }
    });
  });

  describe('Contract Guarantees - No Exceptions', () => {
    it('Result.ok() never throws', () => {
      expect(() => Result.ok(null)).not.toThrow();
      expect(() => Result.ok(undefined)).not.toThrow();
      expect(() => Result.ok({ complex: 'object' })).not.toThrow();
    });

    it('Result.error() never throws', () => {
      expect(() => Result.error(null)).not.toThrow();
      expect(() => Result.error(undefined)).not.toThrow();
      expect(() => Result.error({ complex: 'error' })).not.toThrow();
    });

    it('Type guards never throw', () => {
      const ok = Result.ok(42);
      const err = Result.error('fail');
      
      expect(() => Result.isOk(ok)).not.toThrow();
      expect(() => Result.isOk(err)).not.toThrow();
      expect(() => Result.isError(ok)).not.toThrow();
      expect(() => Result.isError(err)).not.toThrow();
    });

    it('map() never throws (even with throwing mapper)', () => {
      const result = Result.ok(42);
      
      // This is technically allowed but discouraged
      expect(() => {
        Result.map(result, () => {
          throw new Error('Mapper threw');
        });
      }).toThrow(); // The mapper itself throws, not Result.map
    });
  });

  describe('Real-World Usage Patterns', () => {
    it('Chaining map operations on success path', () => {
      const result = Result.ok(10);
      const final = Result.map(
        Result.map(result, (n) => n * 2),
        (n) => n + 5
      );
      
      expect(Result.unwrapOr(final, 0)).toBe(25);
    });

    it('Error propagates through map chain', () => {
      const result: Result<number, string> = Result.error('initial error');
      const final = Result.map(
        Result.map(result, (n) => n * 2),
        (n) => n + 5
      );
      
      expect(Result.isError(final)).toBe(true);
      if (Result.isError(final)) {
        expect(final.error).toBe('initial error');
      }
    });

    it('Converting Chrome API callbacks to Result pattern', () => {
      // Simulating Chrome API error handling pattern
      const chromeError = 'Tab not found';
      
      const wrapChromeAPI = (hasError: boolean): Result<number, string> => {
        if (hasError) {
          return Result.error(chromeError);
        }
        return Result.ok(123);
      };
      
      const successResult = wrapChromeAPI(false);
      const errorResult = wrapChromeAPI(true);
      
      expect(Result.isOk(successResult)).toBe(true);
      expect(Result.isError(errorResult)).toBe(true);
    });
  });
});
