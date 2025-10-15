/**
 * FILE: IChromeStorageAPI.ts
 * 
 * WHAT: Contract for Chrome Storage API wrapper - abstracts chrome.storage.local.* calls
 * 
 * WHY: Wraps Chrome storage APIs behind testable interface with Result-type error handling.
 *      Enables unit testing without browser, provides type-safe persistence layer.
 * 
 * HOW DATA FLOWS:
 *   1. TabManager/HumorSystem calls storage methods (SEAM-05, 27)
 *   2. Implementation calls chrome.storage.local.*
 *   3. Chrome API persists/retrieves data
 *   4. Wrapper maps to Result<T, StorageError>
 *   5. Caller receives typed Result
 * 
 * SEAMS:
 *   IN:  TabManager/HumorSystem → ChromeStorageAPI (SEAM-05, SEAM-27)
 *   OUT: ChromeStorageAPI → chrome.storage (external browser API)
 * 
 * CONTRACT: IChromeStorageAPI v1.0.0
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';

/**
 * CONTRACT: IChromeStorageAPI
 * VERSION: 1.0.0
 * 
 * Chrome Storage API wrapper providing:
 * - Result-type error handling (no exceptions)
 * - Type-safe storage operations
 * - Testable interface (mockable)
 * - Quota management awareness
 * 
 * PERFORMANCE: <30ms per call (95th percentile)
 * All methods are async and non-blocking
 * 
 * STORAGE LIMITS:
 * - chrome.storage.local: ~10MB total
 * - Individual items: No strict limit, but keep reasonable
 */
export interface IChromeStorageAPI {
  /**
   * Get value(s) from storage
   * 
   * SEAM: SEAM-27 (various modules → ChromeStorageAPI)
   * 
   * INPUT:
   *   - keys: string | string[] | null (null = get all)
   * 
   * OUTPUT:
   *   - Success: Record<string, any> (key-value pairs)
   *   - Error: StorageAPIError
   * 
   * ERRORS:
   *   - PermissionDenied: Extension lacks storage permission
   *   - QuotaExceeded: Storage quota exceeded (shouldn't happen on get)
   *   - ChromeAPIFailure: Unexpected Chrome API error
   * 
   * PERFORMANCE: <30ms (95th percentile)
   * 
   * @param keys - Key(s) to retrieve, or null for all
   * @returns Result with stored values or error
   */
  get(keys: string | string[] | null): Promise<Result<Record<string, any>, StorageAPIError>>;

  /**
   * Set value(s) in storage
   * 
   * SEAM: SEAM-05, SEAM-27 (various modules → ChromeStorageAPI)
   * 
   * INPUT:
   *   - items: Record<string, any> (key-value pairs to store)
   * 
   * OUTPUT:
   *   - Success: void
   *   - Error: StorageAPIError
   * 
   * ERRORS:
   *   - PermissionDenied: Extension lacks storage permission
   *   - QuotaExceeded: Storage quota exceeded
   *   - InvalidData: Data cannot be serialized
   *   - ChromeAPIFailure: Unexpected Chrome API error
   * 
   * PERFORMANCE: <30ms (95th percentile)
   * 
   * @param items - Key-value pairs to store
   * @returns Result indicating success or error
   */
  set(items: Record<string, any>): Promise<Result<void, StorageAPIError>>;

  /**
   * Remove key(s) from storage
   * 
   * INPUT:
   *   - keys: string | string[]
   * 
   * OUTPUT:
   *   - Success: void
   *   - Error: StorageAPIError
   * 
   * ERRORS:
   *   - PermissionDenied: Extension lacks storage permission
   *   - ChromeAPIFailure: Unexpected Chrome API error
   * 
   * PERFORMANCE: <20ms (95th percentile)
   * 
   * @param keys - Key(s) to remove
   * @returns Result indicating success or error
   */
  remove(keys: string | string[]): Promise<Result<void, StorageAPIError>>;

  /**
   * Clear all storage
   * 
   * INPUT: void
   * 
   * OUTPUT:
   *   - Success: void
   *   - Error: StorageAPIError
   * 
   * ERRORS:
   *   - PermissionDenied: Extension lacks storage permission
   *   - ChromeAPIFailure: Unexpected Chrome API error
   * 
   * PERFORMANCE: <20ms (95th percentile)
   * 
   * @returns Result indicating success or error
   */
  clear(): Promise<Result<void, StorageAPIError>>;

  /**
   * Get bytes in use (quota management)
   * 
   * INPUT:
   *   - keys: string | string[] | null (null = total usage)
   * 
   * OUTPUT:
   *   - Success: number (bytes in use)
   *   - Error: StorageAPIError
   * 
   * PERFORMANCE: <20ms (95th percentile)
   * 
   * @param keys - Key(s) to check, or null for total
   * @returns Result with bytes used or error
   */
  getBytesInUse(keys: string | string[] | null): Promise<Result<number, StorageAPIError>>;
}

/**
 * Storage API error types
 */
export type StorageAPIError =
  | { type: 'PermissionDenied'; details: string }
  | { type: 'QuotaExceeded'; details: string; bytesUsed: number; quotaLimit: number }
  | { type: 'InvalidData'; details: string; key: string }
  | { type: 'ChromeAPIFailure'; details: string; originalError: unknown };

/**
 * Type guards for error handling
 */
export function isQuotaExceededError(
  error: StorageAPIError
): error is Extract<StorageAPIError, { type: 'QuotaExceeded' }> {
  return error.type === 'QuotaExceeded';
}

export function isInvalidDataError(
  error: StorageAPIError
): error is Extract<StorageAPIError, { type: 'InvalidData' }> {
  return error.type === 'InvalidData';
}
