/**
 * FILE: MockChromeStorageAPI.ts
 * 
 * WHAT: Mock implementation of IChromeStorageAPI - simulates Chrome storage without browser
 * 
 * WHY: Enables development and testing without browser environment. Proves IChromeStorageAPI
 *      contract is implementable. Provides test double for unit testing persistence layers.
 * 
 * HOW DATA FLOWS:
 *   1. TabManager/HumorSystem calls storage methods (SEAM-05, SEAM-27)
 *   2. Mock stores data in-memory (storage: Record<string, any>)
 *   3. Mock returns fake storage results
 *   4. Caller receives valid contract responses
 *   5. NO actual Chrome storage calls made
 * 
 * SEAMS:
 *   IN:  TabManager/HumorSystem → ChromeStorageAPI (SEAM-05, SEAM-27)
 *   OUT: None (mock terminates seam with fake data)
 * 
 * CONTRACT: IChromeStorageAPI v1.0.0
 * GENERATED: 2025-10-12
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import type {
  IChromeStorageAPI,
  StorageAPIError,
} from '../contracts/IChromeStorageAPI';

/**
 * Mock implementation of IChromeStorageAPI
 * 
 * Provides fake Chrome Storage API responses for testing and development.
 * Stores data in-memory, supports seeding and inspection.
 * 
 * MOCK BEHAVIOR:
 * - Returns fake storage data
 * - Stores data in plain object
 * - Calculates fake byte usage (JSON length)
 * - Validates inputs per contract
 * - Tracks call history for test assertions
 */
export class MockChromeStorageAPI implements IChromeStorageAPI {
  private storage: Record<string, any> = {};
  private callHistory: MockCallRecord[] = [];
  private quotaLimit = 10485760; // 10MB (Chrome default)

  /**
   * Get value(s) from storage
   * 
   * DATA IN: keys: string | string[] | null
   * DATA OUT: Result<Record<string, any>, StorageAPIError>
   * 
   * SEAM: SEAM-27 (various modules → ChromeStorageAPI)
   * 
   * FLOW:
   *   1. If keys is null, return all storage
   *   2. Convert keys to array
   *   3. Build result object with requested keys
   *   4. Return result (missing keys omitted)
   * 
   * PERFORMANCE: <5ms (mock, in-memory)
   */
  async get(keys: string | string[] | null): Promise<Result<Record<string, any>, StorageAPIError>> {
    this.callHistory.push({ method: 'get', args: [keys], timestamp: Date.now() });

    // Return all storage if keys is null
    if (keys === null) {
      return Result.ok({ ...this.storage });
    }

    // Convert to array
    const keysArray = Array.isArray(keys) ? keys : [keys];

    // Build result with requested keys
    const result: Record<string, any> = {};
    keysArray.forEach(key => {
      if (key in this.storage) {
        result[key] = this.storage[key];
      }
    });

    return Result.ok(result);
  }

  /**
   * Set value(s) in storage
   * 
   * DATA IN: items: Record<string, any>
   * DATA OUT: Result<void, StorageAPIError>
   * 
   * SEAM: SEAM-05, SEAM-27 (various modules → ChromeStorageAPI)
   * 
   * FLOW:
   *   1. Validate data is serializable
   *   2. Check quota limits
   *   3. Merge items into storage
   *   4. Return success
   * 
   * ERRORS:
   *   - InvalidData: Data contains functions or circular refs
   *   - QuotaExceeded: Would exceed 10MB limit
   * 
   * PERFORMANCE: <5ms (mock, in-memory)
   */
  async set(items: Record<string, any>): Promise<Result<void, StorageAPIError>> {
    this.callHistory.push({ method: 'set', args: [items], timestamp: Date.now() });

    // Validate data is serializable
    try {
      JSON.stringify(items);
    } catch (err) {
      const firstKey = Object.keys(items)[0];
      return Result.error({
        type: 'InvalidData',
        details: 'Data contains non-serializable values (functions, circular refs, etc.)',
        key: firstKey,
      });
    }

    // Check quota
    const newStorage = { ...this.storage, ...items };
    const bytesUsed = JSON.stringify(newStorage).length;

    if (bytesUsed > this.quotaLimit) {
      return Result.error({
        type: 'QuotaExceeded',
        details: `Storage quota exceeded: ${bytesUsed} bytes > ${this.quotaLimit} bytes`,
        bytesUsed,
        quotaLimit: this.quotaLimit,
      });
    }

    // Store data
    Object.assign(this.storage, items);
    return Result.ok(undefined);
  }

  /**
   * Remove key(s) from storage
   * 
   * DATA IN: keys: string | string[]
   * DATA OUT: Result<void, StorageAPIError>
   * 
   * FLOW:
   *   1. Convert keys to array
   *   2. Delete each key from storage
   *   3. Return success (even if keys didn't exist)
   * 
   * PERFORMANCE: <5ms (mock, in-memory)
   */
  async remove(keys: string | string[]): Promise<Result<void, StorageAPIError>> {
    this.callHistory.push({ method: 'remove', args: [keys], timestamp: Date.now() });

    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach(key => delete this.storage[key]);

    return Result.ok(undefined);
  }

  /**
   * Clear all storage
   * 
   * DATA IN: void
   * DATA OUT: Result<void, StorageAPIError>
   * 
   * FLOW:
   *   1. Reset storage to empty object
   *   2. Return success
   * 
   * PERFORMANCE: <5ms (mock, in-memory)
   */
  async clear(): Promise<Result<void, StorageAPIError>> {
    this.callHistory.push({ method: 'clear', args: [], timestamp: Date.now() });

    this.storage = {};
    return Result.ok(undefined);
  }

  /**
   * Get bytes in use (quota management)
   * 
   * DATA IN: keys: string | string[] | null
   * DATA OUT: Result<number, StorageAPIError> (bytes used)
   * 
   * FLOW:
   *   1. If keys is null, calculate total storage size
   *   2. Otherwise, calculate size of requested keys
   *   3. Return byte count (JSON.stringify length)
   * 
   * PERFORMANCE: <5ms (mock, in-memory)
   */
  async getBytesInUse(keys: string | string[] | null): Promise<Result<number, StorageAPIError>> {
    this.callHistory.push({ method: 'getBytesInUse', args: [keys], timestamp: Date.now() });

    let dataToMeasure: Record<string, any>;

    if (keys === null) {
      // Measure entire storage
      dataToMeasure = this.storage;
    } else {
      // Measure specific keys
      const keysArray = Array.isArray(keys) ? keys : [keys];
      dataToMeasure = {};
      keysArray.forEach(key => {
        if (key in this.storage) {
          dataToMeasure[key] = this.storage[key];
        }
      });
    }

    const bytesUsed = JSON.stringify(dataToMeasure).length;
    return Result.ok(bytesUsed);
  }

  // ========================================
  // MOCK HELPER METHODS
  // ========================================

  /**
   * Seed storage with initial data
   * 
   * Used by tests to set up specific scenarios
   */
  seedStorage(data: Record<string, any>): void {
    this.storage = { ...data };
  }

  /**
   * Get current storage contents
   * 
   * Used by tests to inspect state
   */
  getMockStorage(): Record<string, any> {
    return { ...this.storage };
  }

  /**
   * Set quota limit for testing
   * 
   * Used by tests to simulate quota exceeded errors
   */
  setQuotaLimit(bytes: number): void {
    this.quotaLimit = bytes;
  }

  /**
   * Reset mock to initial state
   * 
   * Call between tests to ensure isolation
   */
  reset(): void {
    this.storage = {};
    this.callHistory = [];
    this.quotaLimit = 10485760; // Reset to default 10MB
  }

  /**
   * Get call history for test assertions
   * 
   * Enables verifying mock was called with expected arguments
   */
  getCallHistory(): MockCallRecord[] {
    return [...this.callHistory];
  }
}

/**
 * Record of mock method calls
 * 
 * Used for test assertions - verify mock was called correctly
 */
export interface MockCallRecord {
  method: string;
  args: any[];
  timestamp: number;
}
