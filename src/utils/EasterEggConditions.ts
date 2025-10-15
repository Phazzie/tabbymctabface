/**
 * FILE: EasterEggConditions.ts
 *
 * WHAT: Helper factories for creating easter egg condition objects
 *
 * WHY: Reduces code duplication and errors when defining easter egg conditions.
 *      Provides type-safe, self-documenting API for condition creation.
 *
 * HOW DATA FLOWS:
 *   1. Import Conditions helper in quip data definitions
 *   2. Use factory methods like Conditions.tabCount(42)
 *   3. Helper generates properly-typed EasterEggConditions object
 *   4. Reduces regex escaping errors and typos
 *   5. Enables composition via Conditions.combine()
 *
 * SEAMS:
 *   IN: quip-data.ts or JSON loaders (definition time)
 *   OUT: EasterEggConditions objects (data structure)
 *
 * CONTRACT: Utility for IQuipStorage.EasterEggConditions v1.0.0
 * GENERATED: 2025-10-15
 * CUSTOM SECTIONS: None
 */

import { EasterEggConditions as EasterEggConditionsType } from '../contracts/IQuipStorage';

/**
 * Helper namespace for creating EasterEggConditions objects
 *
 * Provides type-safe factories for all condition types.
 * Auto-escapes regex patterns to prevent common errors.
 * Supports composition via combine() for complex conditions.
 */
export namespace Conditions {
  /**
   * Tab count condition (exact match)
   *
   * @param count - Exact number of tabs required
   * @returns Condition object
   *
   * @example
   * Conditions.tabCount(42) // Matches exactly 42 tabs
   */
  export function tabCount(count: number): EasterEggConditionsType {
    return { tabCount: count };
  }

  /**
   * Tab count range condition
   *
   * @param min - Minimum tab count (inclusive)
   * @param max - Optional maximum tab count (inclusive)
   * @returns Condition object
   *
   * @example
   * Conditions.tabCountRange(10) // 10+ tabs
   * Conditions.tabCountRange(10, 20) // 10-20 tabs
   */
  export function tabCountRange(min: number, max?: number): EasterEggConditionsType {
    return { tabCount: { min, ...(max !== undefined && { max }) } };
  }

  /**
   * Domain condition (auto-escapes dots)
   *
   * @param domain - Domain pattern (dots auto-escaped for regex)
   * @returns Condition object
   *
   * @example
   * Conditions.domain('stackoverflow.com') // Matches stackoverflow\.com
   */
  export function domain(domain: string): EasterEggConditionsType {
    return { domainRegex: escapeDomain(domain) };
  }

  /**
   * Multiple domains (OR condition)
   *
   * @param domains - Array of domain patterns
   * @returns Condition object with OR'd domain regex
   *
   * @example
   * Conditions.domains('github.com', 'gitlab.com') // Matches either
   */
  export function domains(...domains: string[]): EasterEggConditionsType {
    const escaped = domains.map(escapeDomain);
    return { domainRegex: escaped.join('|') };
  }

  /**
   * Hour range condition (24-hour format)
   *
   * @param start - Start hour (0-23)
   * @param end - End hour (0-23)
   * @returns Condition object
   *
   * @example
   * Conditions.timeRange(2, 5) // 2 AM - 5 AM (late night)
   */
  export function timeRange(start: number, end: number): EasterEggConditionsType {
    if (start < 0 || start > 23 || end < 0 || end > 23) {
      throw new Error('Hour must be between 0 and 23');
    }
    return { hourRange: { start, end } };
  }

  /**
   * Title contains text condition
   *
   * @param text - Text to search for in tab title
   * @returns Condition object
   *
   * @example
   * Conditions.titleContains('Stack Overflow') // Tab title contains text
   */
  export function titleContains(text: string): EasterEggConditionsType {
    return { titleContains: text };
  }

  /**
   * URL contains text condition
   *
   * @param text - Text to search for in tab URL
   * @returns Condition object
   *
   * @example
   * Conditions.urlContains('reddit.com/r/programming') // URL contains text
   */
  export function urlContains(text: string): EasterEggConditionsType {
    return { urlContains: text };
  }

  /**
   * Group count condition (exact match)
   *
   * @param count - Exact number of tab groups required
   * @returns Condition object
   *
   * @example
   * Conditions.groupCount(5) // Exactly 5 groups
   */
  export function groupCount(count: number): EasterEggConditionsType {
    return { groupCount: count };
  }

  /**
   * Group count range condition
   *
   * @param min - Minimum group count (inclusive)
   * @param max - Optional maximum group count (inclusive)
   * @returns Condition object
   *
   * @example
   * Conditions.groupCountRange(3) // 3+ groups
   * Conditions.groupCountRange(3, 10) // 3-10 groups
   */
  export function groupCountRange(min: number, max?: number): EasterEggConditionsType {
    return { groupCount: { min, ...(max !== undefined && { max }) } };
  }

  /**
   * Custom check condition (for special logic)
   *
   * @param checkName - Identifier for custom condition
   * @returns Condition object
   *
   * @example
   * Conditions.custom('all-tabs-youtube') // Custom logic ID
   */
  export function custom(checkName: string): EasterEggConditionsType {
    return { customCheck: checkName };
  }

  /**
   * Combine multiple conditions (AND logic)
   *
   * All conditions must be true for match.
   *
   * @param conditions - Spread of partial condition objects
   * @returns Combined condition object
   *
   * @example
   * Conditions.combine(
   *   Conditions.domain('reddit.com'),
   *   Conditions.tabCountRange(10)
   * ) // Reddit AND 10+ tabs
   */
  export function combine(...conditions: Partial<EasterEggConditionsType>[]): EasterEggConditionsType {
    return Object.assign({}, ...conditions);
  }

  /**
   * Helper: Escape domain for regex matching
   *
   * @private
   */
  function escapeDomain(domain: string): string {
    return domain.replace(/\./g, '\\.');
  }
}

/**
 * Usage Examples:
 *
 * ```typescript
 * import { Conditions as C } from './utils/EasterEggConditions';
 *
 * // Simple conditions
 * C.tabCount(42)
 * C.domain('stackoverflow.com')
 * C.timeRange(2, 5)
 *
 * // Complex conditions (AND)
 * C.combine(
 *   C.domain('reddit.com'),
 *   C.tabCountRange(10),
 *   C.timeRange(2, 5)
 * )
 *
 * // Multiple domains (OR)
 * C.domains('github.com', 'gitlab.com', 'bitbucket.org')
 * ```
 */
