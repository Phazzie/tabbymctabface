/**
 * FILE: IAccessControl.ts
 *
 * WHAT: Contract for user access control and tier management
 *
 * WHY: Abstracts user subscription/payment status for monetization.
 *      Enables feature gating without coupling to specific payment platform.
 *
 * HOW DATA FLOWS:
 *   1. QuipStorage calls accessControl.getUserTier() (SEAM-28)
 *   2. AccessControl reads from chrome.storage.sync (license key, subscription status)
 *   3. AccessControl verifies license/subscription validity
 *   4. Returns user tier: 'free' | 'premium' | 'lifetime'
 *   5. QuipStorage filters quips/easter eggs by tier
 *
 * SEAMS:
 *   IN:  QuipStorage → AccessControl (SEAM-28)
 *   OUT: AccessControl → ChromeStorageAPI (SEAM-29)
 *
 * CONTRACT: IAccessControl v1.0.0
 * GENERATED: 2025-11-08
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import { QuipTier } from './IQuipStorage';

/**
 * CONTRACT: IAccessControl
 * VERSION: 1.0.0
 *
 * Access control interface providing:
 * - User tier management (free/premium/lifetime)
 * - Quip/easter egg access verification
 * - Feature flag checks (for A/B testing)
 * - Quip pack purchase verification
 *
 * PERFORMANCE:
 * - getUserTier: <5ms (cached in memory)
 * - canAccessQuip: <5ms (tier-based check)
 * - verifyLicense: <50ms (server check, cached daily)
 */
export interface IAccessControl {
  /**
   * Get current user's subscription tier
   *
   * SEAM: SEAM-28 (QuipStorage → AccessControl)
   *
   * INPUT: void
   *
   * OUTPUT:
   *   - Success: 'free' | 'premium' | 'lifetime'
   *   - Error: AccessControlError
   *
   * TIERS:
   *   - 'free': No payment, access to free-tier content only
   *   - 'premium': Active subscription ($2.99/month or $19.99/year)
   *   - 'lifetime': One-time payment ($49.99), permanent access
   *
   * PERFORMANCE: <5ms (cached in memory)
   *
   * @returns Promise resolving to user tier
   */
  getUserTier(): Promise<Result<UserTier, AccessControlError>>;

  /**
   * Check if user can access a specific quip
   *
   * INPUT:
   *   - quipId: string (e.g., "PA-001")
   *
   * OUTPUT:
   *   - Success: boolean (true if accessible)
   *   - Error: AccessControlError
   *
   * LOGIC:
   *   - Free tier: Access only quips with tier='free' or undefined
   *   - Premium tier: Access free + premium quips
   *   - Lifetime tier: Access all quips (free + premium + legendary)
   *
   * PERFORMANCE: <5ms (tier check)
   *
   * @param quipId - Quip identifier
   * @returns Promise resolving to access boolean
   */
  canAccessQuip(quipId: string, quipTier?: QuipTier): Promise<Result<boolean, AccessControlError>>;

  /**
   * Check if user can access a specific easter egg
   *
   * INPUT:
   *   - eggId: string (e.g., "EE-001")
   *
   * OUTPUT:
   *   - Success: boolean (true if accessible)
   *   - Error: AccessControlError
   *
   * LOGIC: Same as canAccessQuip
   *
   * PERFORMANCE: <5ms (tier check)
   *
   * @param eggId - Easter egg identifier
   * @returns Promise resolving to access boolean
   */
  canAccessEasterEgg(eggId: string, eggTier?: QuipTier): Promise<Result<boolean, AccessControlError>>;

  /**
   * Check if user has a specific feature flag enabled
   *
   * INPUT:
   *   - featureFlag: string (e.g., "beta-quips", "new-sarcastic-quips")
   *
   * OUTPUT:
   *   - Success: boolean (true if feature enabled)
   *   - Error: AccessControlError
   *
   * USE CASES:
   *   - A/B testing: Show new quips to 10% of users
   *   - Beta features: Enable experimental features for testers
   *   - Regional variants: Different humor for different locales
   *
   * PERFORMANCE: <5ms (local check)
   *
   * @param featureFlag - Feature flag identifier
   * @returns Promise resolving to feature enabled boolean
   */
  hasFeature(featureFlag: string): Promise<Result<boolean, AccessControlError>>;

  /**
   * Check if user has purchased a specific quip pack
   *
   * INPUT:
   *   - packId: string (e.g., "pack-pirate-mode")
   *
   * OUTPUT:
   *   - Success: boolean (true if purchased)
   *   - Error: AccessControlError
   *
   * PERFORMANCE: <5ms (cached)
   *
   * @param packId - Quip pack identifier
   * @returns Promise resolving to purchase boolean
   */
  isPurchased(packId: string): Promise<Result<boolean, AccessControlError>>;

  /**
   * Activate a license key
   *
   * INPUT:
   *   - licenseKey: string (e.g., "TABBY-XXXX-XXXX-XXXX-XXXX")
   *
   * OUTPUT:
   *   - Success: void (license activated)
   *   - Error: AccessControlError
   *
   * FLOW:
   *   1. Validate license key format
   *   2. Verify with server (or payment platform)
   *   3. Store license key in chrome.storage.sync
   *   4. Update user tier in memory cache
   *
   * PERFORMANCE: <100ms (server verification)
   *
   * @param licenseKey - License key to activate
   * @returns Promise resolving to success or error
   */
  activateLicense(licenseKey: string): Promise<Result<void, AccessControlError>>;

  /**
   * Get user's purchased quip packs
   *
   * INPUT: void
   *
   * OUTPUT:
   *   - Success: string[] (array of purchased pack IDs)
   *   - Error: AccessControlError
   *
   * PERFORMANCE: <5ms (cached)
   *
   * @returns Promise resolving to purchased pack IDs
   */
  getPurchasedPacks(): Promise<Result<string[], AccessControlError>>;
}

/**
 * User subscription tier
 */
export type UserTier = 'free' | 'premium' | 'lifetime';

/**
 * Access control error types
 */
export type AccessControlError =
  | { type: 'LicenseInvalid'; details: string; licenseKey?: string }
  | { type: 'LicenseExpired'; details: string; expiresAt: string }
  | { type: 'VerificationFailed'; details: string; originalError: unknown }
  | { type: 'StorageError'; details: string; originalError: unknown }
  | { type: 'NetworkError'; details: string; originalError: unknown };
