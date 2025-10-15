/**
 * FILE: Result.ts
 * 
 * WHAT: Result type for explicit error handling without exceptions
 * 
 * WHY: Provides type-safe error handling foundation for all TabbyMcTabface contracts.
 *      Eliminates throw/catch patterns in favor of explicit Result<Success, Error> returns.
 * 
 * HOW DATA FLOWS:
 *   1. Methods return Result.ok(value) on success
 *   2. Methods return Result.error(error) on failure
 *   3. Callers check isOk() or isError() to handle both paths
 *   4. Type system enforces error handling at compile time
 * 
 * SEAMS:
 *   IN: All modules (used as return type)
 *   OUT: None (utility type)
 * 
 * CONTRACT: Result<T, E> utility type v1.0.0
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

/**
 * Success variant of Result
 */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
  isError(): this is Err<never>;
}

/**
 * Error variant of Result
 */
export interface Err<E> {
  readonly ok: false;
  readonly error: E;
  isError(): this is Err<E>;
}

/**
 * Result type representing either success (Ok) or failure (Error)
 * 
 * Replaces throw/catch with explicit error handling
 * Forces callers to handle both success and error cases
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Result utility namespace with factory methods and helpers
 */
export namespace Result {
  /**
   * Create a successful Result
   * 
   * @param value - Success value of type T
   * @returns Ok<T> result
   */
  export function ok<T>(value: T): Ok<T> {
    const result: Ok<T> = { 
      ok: true, 
      value,
      isError(): result is Err<never> { return false; }
    };
    return result;
  }  /**
   * Create a failed Result
   * 
   * @param error - Error value of type E
   * @returns Err<E> result
   */
  export function error<E>(error: E): Err<E> {
    const result: Err<E> = { 
      ok: false, 
      error,
      isError(): result is Err<E> { return true; }
    };
    return result;
  }  /**
   * Type guard to check if Result is Ok
   */
  export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
    return result.ok === true;
  }

  /**
   * Type guard to check if Result is Error
   */
  export function isError<T, E>(result: Result<T, E>): result is Err<E> {
    return result.ok === false;
  }

  /**
   * Unwrap Ok value or throw if Error
   * USE SPARINGLY - defeats purpose of Result type
   */
  export function unwrap<T, E>(result: Result<T, E>): T {
    if (result.ok) {
      return result.value;
    }
    throw new Error(`Unwrapped Error result: ${JSON.stringify((result as Err<E>).error)}`);
  }

  /**
   * Get value or default if Error
   */
  export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.ok ? result.value : defaultValue;
  }

  /**
   * Map success value, passthrough errors
   */
  export function map<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => U
  ): Result<U, E> {
    return result.ok ? ok(fn(result.value)) : (result as Err<E>);
  }

  /**
   * Map error value, passthrough successes
   */
  export function mapError<T, E, F>(
    result: Result<T, E>,
    fn: (error: E) => F
  ): Result<T, F> {
    return result.ok ? (result as Ok<T>) : error(fn((result as Err<E>).error));
  }
}

/**
 * Helper to extract success value with type narrowing
 * 
 * Usage:
 *   const result = await tabManager.createGroup(name, ids);
 *   if (result.ok) {
 *     const { groupId } = result.value; // Type is GroupCreationSuccess
 *   } else {
 *     const { type, details } = result.error; // Type is TabManagerError
 *   }
 */
