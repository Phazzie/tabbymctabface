/**
 * FILE: IHumorPersonality.ts
 * 
 * WHAT: Contract for pluggable humor personality implementations (passive-aggressive quip generation)
 * 
 * WHY: Defines interface for humor personality strategies, enabling TabbyMcTabface to support
 *      different humor styles/intensities without changing core humor system logic.
 * 
 * HOW DATA FLOWS:
 *   1. HumorSystem calls personality methods with trigger context (SEAM-12, 18)
 *   2. Personality queries IQuipStorage for available quips (SEAM-13, 17)
 *   3. Personality selects appropriate quip based on context and level
 *   4. Personality returns quip text or null to HumorSystem
 *   5. HumorSystem delivers quip via notifications
 * 
 * SEAMS:
 *   IN:  HumorSystem → Personality (SEAM-12, SEAM-18)
 *   OUT: Personality → QuipStorage (SEAM-13, SEAM-17)
 * 
 * CONTRACT: IHumorPersonality v1.0.0
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';

/**
 * CONTRACT: IHumorPersonality
 * VERSION: 1.0.0
 * 
 * Pluggable humor personality interface providing:
 * - Passive-aggressive quip selection
 * - Easter egg quip selection
 * - Context-aware humor matching
 * - Personality metadata (name, description, level)
 * 
 * V1 Implementation: Single "TabbyMcTabface" personality
 * Future: Multiple personalities (Mild, Intense, Sarcastic, etc.) - drop-in replacements
 * 
 * PERFORMANCE:
 * - getPassiveAggressiveQuip: <30ms (95th percentile)
 * - getEasterEggQuip: <30ms (95th percentile)
 * - getMetadata: <1ms (synchronous)
 */
export interface IHumorPersonality {
  /**
   * Get a passive-aggressive quip for the given trigger
   * 
   * SEAM: SEAM-12 (HumorSystem → Personality)
   * 
   * INPUT:
   *   - triggerType: string (e.g., 'TabGroupCreated', 'TabClosed', 'FeelingLucky')
   *   - triggerData: any (context data from trigger event)
   *   - level: HumorLevel (intensity level - V1 always uses 'default')
   * 
   * OUTPUT:
   *   - Success: string (quip text) | null (no appropriate quip found)
   *   - Error: PersonalityError
   * 
   * ERRORS:
   *   - StorageFailure: Failed to access quip storage
   *   - InvalidTriggerType: Trigger type not recognized
   * 
   * PERFORMANCE: <30ms (95th percentile)
   * 
   * SIDE EFFECTS:
   *   - Queries IQuipStorage via SEAM-13
   *   - MAY track recently used quips for deduplication
   * 
   * @param triggerType - Type of event that triggered humor
   * @param triggerData - Context data associated with trigger
   * @param level - Humor intensity level
   * @returns Promise resolving to quip text or null
   */
  getPassiveAggressiveQuip(
    triggerType: string,
    triggerData: any,
    level: HumorLevel
  ): Promise<Result<string | null, PersonalityError>>;

  /**
   * Get an easter egg quip for the given context match
   * 
   * SEAM: SEAM-18 (Personality → EasterEggFramework interaction)
   * 
   * INPUT:
   *   - easterEggMatch: EasterEggMatch (matched easter egg details)
   *   - context: BrowserContext (current browser state)
   * 
   * OUTPUT:
   *   - Success: string (easter egg quip text) | null (no quip available)
   *   - Error: PersonalityError
   * 
   * ERRORS:
   *   - StorageFailure: Failed to access easter egg storage
   *   - InvalidEasterEggType: Easter egg type not recognized
   * 
   * PERFORMANCE: <30ms (95th percentile)
   * 
   * SIDE EFFECTS:
   *   - Queries IQuipStorage via SEAM-17
   * 
   * @param easterEggMatch - Matched easter egg details
   * @param context - Current browser context
   * @returns Promise resolving to easter egg quip or null
   */
  getEasterEggQuip(
    easterEggMatch: EasterEggMatch,
    context: BrowserContext
  ): Promise<Result<string | null, PersonalityError>>;

  /**
   * Get personality metadata (name, description, level)
   * 
   * INPUT: void
   * 
   * OUTPUT: PersonalityMetadata
   * 
   * PERFORMANCE: <1ms (synchronous getter)
   * 
   * @returns Personality metadata
   */
  getMetadata(): PersonalityMetadata;

  /**
   * Check if this personality should be used for given humor level
   * 
   * INPUT: level: HumorLevel
   * OUTPUT: boolean
   * 
   * Enables personality selection based on user preferences in future versions
   * 
   * @param level - Requested humor level
   * @returns true if this personality handles the level
   */
  supportsLevel(level: HumorLevel): boolean;
}

/**
 * Humor intensity levels
 * V1: Only 'default' is used
 * Future: 'mild', 'intense', 'savage', etc.
 */
export type HumorLevel = 'default' | 'mild' | 'intense';

/**
 * Personality metadata
 */
export interface PersonalityMetadata {
  name: string; // e.g., "TabbyMcTabface"
  description: string; // e.g., "Passive-aggressive tab management humor"
  level: HumorLevel; // Which level this personality is designed for
  version: string; // Personality version (for future updates)
}

/**
 * Easter egg match details
 * (Re-exported from IHumorSystem for convenience)
 */
export interface EasterEggMatch {
  easterEggId: string;
  easterEggType: string;
  matchedConditions: string[];
  priority: number;
}

/**
 * Browser context
 * (Re-exported from IHumorSystem/ITabManager for convenience)
 */
export interface BrowserContext {
  tabCount: number;
  activeTab: {
    url: string;
    title: string;
    domain: string;
  } | null;
  currentHour: number;
  recentEvents: string[];
  groupCount: number;
}

/**
 * Personality error types
 */
export type PersonalityError =
  | { type: 'StorageFailure'; details: string; originalError: unknown }
  | { type: 'InvalidTriggerType'; details: string; triggerType: string }
  | { type: 'InvalidEasterEggType'; details: string; easterEggType: string }
  | { type: 'QuipSelectionFailed'; details: string };

/**
 * Type guard for storage failures
 */
export function isStorageFailureError(
  error: PersonalityError
): error is Extract<PersonalityError, { type: 'StorageFailure' }> {
  return error.type === 'StorageFailure';
}
