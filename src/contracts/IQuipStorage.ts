/**
 * FILE: IQuipStorage.ts
 * 
 * WHAT: Contract for quip and easter egg data storage access (JSON-based)
 * 
 * WHY: Abstracts data access layer for humor content, enabling DRY data access patterns
 *      and allowing storage implementation changes without affecting personality logic.
 * 
 * HOW DATA FLOWS:
 *   1. Personality calls storage methods to fetch quips (SEAM-13, 17)
 *   2. Storage reads from JSON files (SEAM-14 - internal)
 *   3. Storage validates and caches data in memory
 *   4. Storage returns typed quip/easter egg arrays
 *   5. Personality selects appropriate content (individual type or aggregated)
 * 
 * SEAMS:
 *   IN:  Personality → QuipStorage (SEAM-13, SEAM-17)
 *   OUT: QuipStorage → JSON Files (SEAM-14 - internal file I/O)
 * 
 * CONTRACT: IQuipStorage v1.0.0
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';

/**
 * CONTRACT: IQuipStorage
 * VERSION: 1.0.0
 * 
 * Quip storage interface providing:
 * - Passive-aggressive quip retrieval
 * - Easter egg quip retrieval
 * - In-memory caching (after initial load)
 * - JSON schema validation
 * - Graceful error handling (returns empty arrays on corruption)
 * 
 * PERFORMANCE:
 * - getPassiveAggressiveQuips: <10ms (95th percentile - cached)
 * - getEasterEggQuips: <10ms (95th percentile - cached)
 * - initialize: <50ms (one-time load on extension startup)
 * 
 * DATA SOURCE: JSON files in extension package
 * - quips/passive-aggressive.json
 * - easter-eggs/definitions.json
 */
export interface IQuipStorage {
  /**
   * Initialize storage (load and cache JSON data)
   * 
   * SEAM: Internal initialization (called once on extension startup)
   * 
   * INPUT: void
   * 
   * OUTPUT:
   *   - Success: void (data loaded and cached)
   *   - Error: StorageError
   * 
   * ERRORS:
   *   - FileNotFound: JSON file not found in extension package
   *   - JSONParseError: Invalid JSON format
   *   - SchemaValidationError: JSON doesn't match expected schema
   * 
   * PERFORMANCE: <50ms (one-time initialization)
   * 
   * SIDE EFFECTS:
   *   - Reads JSON files from disk (SEAM-14)
   *   - Populates in-memory cache
   *   - Validates data against schema
   * 
   * @returns Promise resolving to success or error
   */
  initialize(): Promise<Result<void, StorageError>>;

  /**
   * Get passive-aggressive quips for given level and optional trigger filter
   * 
   * SEAM: SEAM-13 (Personality → QuipStorage)
   * 
   * INPUT:
   *   - level: HumorLevel (intensity level)
   *   - triggerType?: string (optional filter by trigger type)
   * 
   * OUTPUT:
   *   - Success: QuipData[] (array of matching quips)
   *   - Error: StorageError
   * 
   * ERRORS:
   *   - NotInitialized: initialize() not called yet
   *   - DataCorrupted: Cached data is corrupted (rare)
   * 
   * PERFORMANCE: <10ms (95th percentile - in-memory cached)
   * 
   * GRACEFUL DEGRADATION:
   *   - Returns empty array if no quips match criteria
   *   - Returns empty array if data corrupted (logs error, doesn't throw)
   * 
   * @param level - Humor intensity level
   * @param triggerType - Optional trigger type filter
   * @returns Promise resolving to quip array
   */
  getPassiveAggressiveQuips(
    level: HumorLevel,
    triggerType?: string
  ): Promise<Result<QuipData[], StorageError>>;

  /**
   * Get easter egg quips for given type and level
   * 
   * SEAM: SEAM-17 (EasterEggFramework/Personality → QuipStorage)
   * 
   * INPUT:
   *   - easterEggType: string (e.g., '42-tabs', 'late-night-coding')
   *   - level: HumorLevel (intensity level)
   * 
   * OUTPUT:
   *   - Success: EasterEggData[] (array of matching easter eggs)
   *   - Error: StorageError
   * 
   * ERRORS:
   *   - NotInitialized: initialize() not called yet
   *   - DataCorrupted: Cached data is corrupted (rare)
   * 
   * PERFORMANCE: <10ms (95th percentile - in-memory cached)
   * 
   * GRACEFUL DEGRADATION:
   *   - Returns empty array if no easter eggs match
   *   - Returns empty array if data corrupted (logs error, doesn't throw)
   * 
   * @param easterEggType - Easter egg type identifier
   * @param level - Humor intensity level
   * @returns Promise resolving to easter egg array
   */
  getEasterEggQuips(
    easterEggType: string,
    level: HumorLevel
  ): Promise<Result<EasterEggData[], StorageError>>;

  /**
   * Get all easter egg quips, optionally filtered by humor level
   * 
   * SEAM: SEAM-17 (EasterEggFramework/Personality → QuipStorage)
   * 
   * INPUT:
   *   - level?: HumorLevel (optional filter; when omitted, returns all)
   * 
   * OUTPUT:
   *   - Success: EasterEggData[] (array of all matching easter eggs)
   *   - Error: StorageError
   * 
   * ERRORS:
   *   - NotInitialized: initialize() not called yet
   *   - DataCorrupted: Cached data is corrupted (rare)
   * 
   * PERFORMANCE: <10ms (95th percentile - in-memory cached)
   * 
   * GRACEFUL DEGRADATION:
   *   - Returns empty array if no easter eggs match filter
   * 
   * @param level - Optional humor intensity level filter
   * @returns Promise resolving to easter egg array
   */
  getAllEasterEggQuips(
    level?: HumorLevel
  ): Promise<Result<EasterEggData[], StorageError>>;

  /**
   * Get all available trigger types (for debugging/validation)
   * 
   * INPUT: void
   * 
   * OUTPUT:
   *   - Success: string[] (array of trigger type strings)
   *   - Error: StorageError
   * 
   * PERFORMANCE: <5ms (cached)
   * 
   * @returns Promise resolving to trigger type array
   */
  getAvailableTriggerTypes(): Promise<Result<string[], StorageError>>;

  /**
   * Check if storage is initialized
   * 
   * INPUT: void
   * OUTPUT: boolean
   * 
   * PERFORMANCE: <1ms (synchronous check)
   * 
   * @returns true if initialized, false otherwise
   */
  isInitialized(): boolean;
}

/**
 * Humor level type (re-exported from IHumorPersonality)
 */
export type HumorLevel = 'default' | 'mild' | 'intense';

/**
 * Quip data structure (from passive-aggressive.json)
 */
export interface QuipData {
  id: string; // e.g., "PA-001"
  text: string; // Quip text (10-200 chars)
  triggerTypes: string[]; // Which triggers this quip applies to
  level: HumorLevel; // Intensity level
  metadata?: {
    tags?: string[]; // e.g., ['tab-management', 'procrastination']
    rarity?: 'common' | 'uncommon' | 'rare'; // How often to show
  };
}

/**
 * Easter egg data structure (from easter-eggs/definitions.json)
 */
export interface EasterEggData {
  id: string; // e.g., "EE-001"
  type: string; // e.g., "42-tabs", "late-night-coding"
  conditions: EasterEggConditions; // Trigger conditions (AND-combined)
  quips: string[]; // Array of quip variations for this easter egg
  level: HumorLevel; // Intensity level
  metadata?: {
    nicheReference?: string; // e.g., "Douglas Adams - Hitchhiker's Guide"
    difficulty?: 'common' | 'uncommon' | 'rare' | 'legendary';
  };
}

/**
 * Easter egg trigger conditions (all must be true - AND logic)
 */
export interface EasterEggConditions {
  tabCount?: number | { min?: number; max?: number }; // Exact count or range
  domainRegex?: string; // Active tab domain pattern
  hourRange?: { start: number; end: number }; // Hour range (0-23)
  titleContains?: string; // Active tab title contains text
  urlContains?: string; // Active tab URL contains text
  groupCount?: number | { min?: number; max?: number }; // Group count
  customCheck?: string; // Custom condition ID (for complex logic)
}

/**
 * JSON data schema versions (for validation)
 */
export interface DataSchemaVersion {
  version: string; // Semantic version (e.g., "1.0.0")
  schemaType: 'passive-aggressive-quips' | 'easter-eggs';
}

/**
 * Storage error types
 */
export type StorageError =
  | { type: 'NotInitialized'; details: string }
  | { type: 'FileNotFound'; details: string; filePath: string }
  | { type: 'JSONParseError'; details: string; filePath: string; originalError: unknown }
  | { type: 'SchemaValidationError'; details: string; violations: string[] }
  | { type: 'DataCorrupted'; details: string; dataType: string };

/**
 * Type guard for not initialized errors
 */
export function isNotInitializedError(
  error: StorageError
): error is Extract<StorageError, { type: 'NotInitialized' }> {
  return error.type === 'NotInitialized';
}

/**
 * Type guard for JSON parse errors
 */
export function isJSONParseError(
  error: StorageError
): error is Extract<StorageError, { type: 'JSONParseError' }> {
  return error.type === 'JSONParseError';
}
