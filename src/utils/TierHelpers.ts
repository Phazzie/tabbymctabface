/**
 * FILE: TierHelpers.ts
 *
 * WHAT: Helper utilities for quip/easter egg tier management
 *
 * WHY: Provides backward-compatible tier inference from existing metadata.
 *      Centralizes tier logic for consistency across codebase.
 *
 * HOW DATA FLOWS:
 *   1. QuipStorage reads quip with no tier field
 *   2. Calls inferTierFromMetadata(quip)
 *   3. Helper maps rarity/difficulty → tier
 *   4. Returns inferred tier
 *   5. QuipStorage uses tier for access control
 *
 * GENERATED: 2025-11-08
 */

import { QuipData, EasterEggData, QuipTier } from '../contracts/IQuipStorage';

/**
 * Infer tier from quip metadata
 *
 * Maps existing rarity field to tier for backward compatibility.
 * Default strategy (can be customized later):
 * - rarity: 'rare' → tier: 'premium'
 * - rarity: 'uncommon' → tier: 'free' (you can change this)
 * - rarity: 'common' → tier: 'free'
 * - no rarity → tier: 'free'
 *
 * @param quip - Quip data with optional tier
 * @returns Effective tier (either explicit tier or inferred)
 */
export function getQuipTier(quip: QuipData): QuipTier {
  // If tier is explicitly set, use it
  if (quip.tier) {
    return quip.tier;
  }

  // Otherwise, infer from rarity
  const rarity = quip.metadata?.rarity;

  switch (rarity) {
    case 'rare':
      return 'premium'; // Rare quips require premium
    case 'uncommon':
      return 'free'; // Uncommon quips are free (you can change this later)
    case 'common':
    default:
      return 'free'; // Common or unspecified = free
  }
}

/**
 * Infer tier from easter egg metadata
 *
 * Maps existing difficulty field to tier for backward compatibility.
 * Default strategy (you can customize):
 * - difficulty: 'legendary' → tier: 'legendary'
 * - difficulty: 'rare' → tier: 'premium'
 * - difficulty: 'uncommon' → tier: 'free'
 * - difficulty: 'common' → tier: 'free'
 * - no difficulty → tier: 'free'
 *
 * @param egg - Easter egg data with optional tier
 * @returns Effective tier (either explicit tier or inferred)
 */
export function getEasterEggTier(egg: EasterEggData): QuipTier {
  // If tier is explicitly set, use it
  if (egg.tier) {
    return egg.tier;
  }

  // Otherwise, infer from difficulty
  const difficulty = egg.metadata?.difficulty;

  switch (difficulty) {
    case 'legendary':
      return 'legendary'; // Legendary eggs require lifetime tier
    case 'rare':
      return 'premium'; // Rare eggs require premium
    case 'uncommon':
      return 'free'; // Uncommon eggs are free (most users should find these)
    case 'common':
    default:
      return 'free'; // Common or unspecified = free
  }
}

/**
 * Filter quips by user tier
 *
 * Returns only quips the user can access based on their tier.
 *
 * @param quips - Array of quip data
 * @param userTier - User's subscription tier
 * @returns Filtered array of accessible quips
 */
export function filterQuipsByTier(quips: QuipData[], userTier: 'free' | 'premium' | 'lifetime'): QuipData[] {
  return quips.filter(quip => {
    const quipTier = getQuipTier(quip);
    return canAccessTier(userTier, quipTier);
  });
}

/**
 * Filter easter eggs by user tier
 *
 * Returns only easter eggs the user can access based on their tier.
 *
 * @param eggs - Array of easter egg data
 * @param userTier - User's subscription tier
 * @returns Filtered array of accessible easter eggs
 */
export function filterEasterEggsByTier(
  eggs: EasterEggData[],
  userTier: 'free' | 'premium' | 'lifetime'
): EasterEggData[] {
  return eggs.filter(egg => {
    const eggTier = getEasterEggTier(egg);
    return canAccessTier(userTier, eggTier);
  });
}

/**
 * Check if user tier can access content tier
 *
 * Access matrix:
 * - Free user: Can access 'free' content only
 * - Premium user: Can access 'free' + 'premium' content
 * - Lifetime user: Can access all content ('free' + 'premium' + 'legendary')
 *
 * @param userTier - User's subscription tier
 * @param contentTier - Content's access tier
 * @returns true if user can access content
 */
export function canAccessTier(
  userTier: 'free' | 'premium' | 'lifetime',
  contentTier: QuipTier
): boolean {
  if (contentTier === 'free') return true;
  if (contentTier === 'premium' && (userTier === 'premium' || userTier === 'lifetime')) return true;
  if (contentTier === 'legendary' && userTier === 'lifetime') return true;
  return false;
}

/**
 * Count quips by tier
 *
 * Returns breakdown of how many quips are in each tier.
 * Useful for UI: "Unlock 45 premium quips"
 *
 * @param quips - Array of quip data
 * @returns Object with counts per tier
 */
export function countQuipsByTier(quips: QuipData[]): { free: number; premium: number; legendary: number } {
  const counts = { free: 0, premium: 0, legendary: 0 };

  for (const quip of quips) {
    const tier = getQuipTier(quip);
    counts[tier]++;
  }

  return counts;
}

/**
 * Count easter eggs by tier
 *
 * Returns breakdown of how many easter eggs are in each tier.
 *
 * @param eggs - Array of easter egg data
 * @returns Object with counts per tier
 */
export function countEasterEggsByTier(eggs: EasterEggData[]): { free: number; premium: number; legendary: number } {
  const counts = { free: 0, premium: 0, legendary: 0 };

  for (const egg of eggs) {
    const tier = getEasterEggTier(egg);
    counts[tier]++;
  }

  return counts;
}
