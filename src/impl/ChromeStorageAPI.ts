/**
 * FILE: ChromeStorageAPI.ts
 *
 * WHAT: Real Chrome Storage API wrapper implementation
 *
 * WHY: Provides actual chrome.storage.local.* API calls with Result-type error handling.
 *      Satisfies IChromeStorageAPI contract, enables production data persistence.
 *
 * HOW DATA FLOWS:
 *   1. TabManager/HumorSystem calls storage methods (SEAM-05, 27)
 *   2. This implementation calls chrome.storage.local.*
 *   3. Chrome API persists/retrieves data to/from local storage
 *   4. Errors mapped to Result<T, StorageAPIError> types
 *   5. Caller receives typed Result for error handling
 *
 * SEAMS:
 *   IN:  TabManager/HumorSystem → ChromeStorageAPI (SEAM-05, SEAM-27)
 *   OUT: ChromeStorageAPI → chrome.storage (external browser API)
 *
 * CONTRACT: IChromeStorageAPI v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
 */

import {
  IChromeStorageAPI,
  StorageAPIError
} from '../contracts/IChromeStorageAPI';
import { Result } from '../utils/Result';

/**
 * Real Chrome Storage API implementation
 *
 * Wraps chrome.storage.local calls with Result-type error handling.
 * Maps Chrome runtime errors to domain-specific StorageAPIError types.
 * All methods are async and non-blocking.
 */
export class ChromeStorageAPI implements IChromeStorageAPI {
  /**
   * Get value(s) from storage
   *
   * DATA IN: keys (string/string[]/null for all keys)
   * DATA OUT: Result<Record<string, any>, StorageAPIError>
   *
   * SEAM: SEAM-27 (various modules → ChromeStorageAPI)
   *
   * FLOW:
   *   1. Call chrome.storage.local.get() with keys
   *   2. Chrome API returns stored values object
   *   3. Map Chrome errors to StorageAPIError types
   *   4. Return Result with values or error
   *
   * ERRORS:
   *   - PermissionDenied: Extension lacks storage permission
   *   - QuotaExceeded: Storage quota exceeded (shouldn't happen on get)
   *   - ChromeAPIFailure: Unexpected Chrome API error
   *
   * PERFORMANCE: <30ms (95th percentile)
   */
  async get(keys: string | string[] | null): Promise<Result<Record<string, any>, StorageAPIError>> {
    try {
      // Call Chrome API
      const result = await chrome.storage.local.get(keys);

      return Result.ok(result);
    } catch (error) {
      return this.mapChromeError(error, 'get');
    }
  }

  /**
   * Set value(s) in storage
   *
   * DATA IN: items (Record<string, any> key-value pairs)
   * DATA OUT: Result<void, StorageAPIError>
   *
   * SEAM: SEAM-05, SEAM-27 (various modules → ChromeStorageAPI)
   *
   * FLOW:
   *   1. Validate items can be serialized
   *   2. Call chrome.storage.local.set() with items
   *   3. Chrome API persists data
   *   4. Map Chrome errors to StorageAPIError types
   *   5. Return Result success or error
   *
   * ERRORS:
   *   - PermissionDenied: Extension lacks storage permission
   *   - QuotaExceeded: Storage quota exceeded
   *   - InvalidData: Data cannot be serialized
   *   - ChromeAPIFailure: Unexpected Chrome API error
   *
   * PERFORMANCE: <30ms (95th percentile)
   */
  async set(items: Record<string, any>): Promise<Result<void, StorageAPIError>> {
    try {
      // Basic validation - check serializability
      for (const [key, value] of Object.entries(items)) {
        try {
          JSON.stringify(value);
        } catch {
          return Result.error({
            type: 'InvalidData',
            details: 'Value cannot be serialized to JSON',
            key
          });
        }
      }

      // Call Chrome API
      await chrome.storage.local.set(items);

      return Result.ok(undefined);
    } catch (error) {
      return this.mapChromeError(error, 'set');
    }
  }

  /**
   * Remove key(s) from storage
   *
   * DATA IN: keys (string | string[] to remove)
   * DATA OUT: Result<void, StorageAPIError>
   *
   * FLOW:
   *   1. Call chrome.storage.local.remove() with keys
   *   2. Chrome API deletes specified keys
   *   3. Map Chrome errors to StorageAPIError types
   *   4. Return Result success or error
   *
   * ERRORS:
   *   - PermissionDenied: Extension lacks storage permission
   *   - ChromeAPIFailure: Unexpected Chrome API error
   *
   * PERFORMANCE: <20ms (95th percentile)
   */
  async remove(keys: string | string[]): Promise<Result<void, StorageAPIError>> {
    try {
      // Call Chrome API
      await chrome.storage.local.remove(keys);

      return Result.ok(undefined);
    } catch (error) {
      return this.mapChromeError(error, 'remove');
    }
  }

  /**
   * Clear all storage
   *
   * DATA IN: void
   * DATA OUT: Result<void, StorageAPIError>
   *
   * FLOW:
   *   1. Call chrome.storage.local.clear()
   *   2. Chrome API removes all stored data
   *   3. Map Chrome errors to StorageAPIError types
   *   4. Return Result success or error
   *
   * ERRORS:
   *   - PermissionDenied: Extension lacks storage permission
   *   - ChromeAPIFailure: Unexpected Chrome API error
   *
   * PERFORMANCE: <20ms (95th percentile)
   */
  async clear(): Promise<Result<void, StorageAPIError>> {
    try {
      // Call Chrome API
      await chrome.storage.local.clear();

      return Result.ok(undefined);
    } catch (error) {
      return this.mapChromeError(error, 'clear');
    }
  }

  /**
   * Get bytes in use (quota management)
   *
   * DATA IN: keys (string/string[]/null for total usage)
   * DATA OUT: Result<number, StorageAPIError> (bytes used)
   *
   * FLOW:
   *   1. Call chrome.storage.local.getBytesInUse() with keys
   *   2. Chrome API returns byte count
   *   3. Map Chrome errors to StorageAPIError types
   *   4. Return Result with byte count or error
   *
   * PERFORMANCE: <20ms (95th percentile)
   */
  async getBytesInUse(keys: string | string[] | null): Promise<Result<number, StorageAPIError>> {
    try {
      // Call Chrome API
      const bytesUsed = await chrome.storage.local.getBytesInUse(keys);

      return Result.ok(bytesUsed);
    } catch (error) {
      return this.mapChromeError(error, 'getBytesInUse');
    }
  }

  /**
   * Map Chrome runtime errors to domain-specific StorageAPIError types
   */
  private mapChromeError(
    error: unknown,
    operation: string
  ): Result<never, StorageAPIError> {
    const chromeError = chrome.runtime.lastError || error;

    if (!chromeError) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: `Unknown error in ${operation}`,
        originalError: error
      });
    }

    const errorMessage = chromeError instanceof Error ? chromeError.message : String(chromeError);

    // Map permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('Permission denied')) {
      return Result.error({
        type: 'PermissionDenied',
        details: `Missing storage permission`
      });
    }

    // Map quota exceeded errors
    if (errorMessage.includes('quota') || errorMessage.includes('QUOTA_BYTES')) {
      return Result.error({
        type: 'QuotaExceeded',
        details: `Storage quota exceeded`,
        bytesUsed: -1, // Chrome doesn't provide this in error
        quotaLimit: 1024 * 1024 * 10 // ~10MB
      });
    }

    // Default Chrome API failure
    return Result.error({
      type: 'ChromeAPIFailure',
      details: `Chrome API error in ${operation}`,
      originalError: chromeError
    });
  }
}