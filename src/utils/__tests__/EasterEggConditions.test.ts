/**
 * FILE: EasterEggConditions.test.ts
 *
 * WHAT: Tests for EasterEggConditions factory utilities
 *
 * WHY: Validates that condition factories create correct condition objects.
 *      Ensures type safety, proper escaping, and error handling.
 *
 * COVERAGE:
 *   - All Conditions.* factory functions
 *   - Domain escaping logic
 *   - Hour range validation
 *   - Condition composition
 *
 * GENERATED: 2025-11-03
 */

import { describe, it, expect } from 'vitest';
import { Conditions } from '../EasterEggConditions';

describe('EasterEggConditions Factory', () => {
  describe('tabCount', () => {
    it('creates condition with exact count', () => {
      const condition = Conditions.tabCount(42);

      expect(condition).toEqual({ tabCount: 42 });
    });

    it('works with zero tabs', () => {
      const condition = Conditions.tabCount(0);

      expect(condition).toEqual({ tabCount: 0 });
    });

    it('works with large numbers', () => {
      const condition = Conditions.tabCount(999);

      expect(condition).toEqual({ tabCount: 999 });
    });
  });

  describe('tabCountRange', () => {
    it('creates range condition with min only', () => {
      const condition = Conditions.tabCountRange(10);

      expect(condition).toEqual({
        tabCount: { min: 10 }
      });
    });

    it('creates range condition with min and max', () => {
      const condition = Conditions.tabCountRange(10, 20);

      expect(condition).toEqual({
        tabCount: { min: 10, max: 20 }
      });
    });

    it('handles min equal to max', () => {
      const condition = Conditions.tabCountRange(5, 5);

      expect(condition).toEqual({
        tabCount: { min: 5, max: 5 }
      });
    });

    it('does not add max property when undefined', () => {
      const condition = Conditions.tabCountRange(5, undefined);

      expect(condition).toEqual({
        tabCount: { min: 5 }
      });
      expect(condition.tabCount).not.toHaveProperty('max');
    });
  });

  describe('domain', () => {
    it('creates condition with escaped domain', () => {
      const condition = Conditions.domain('stackoverflow.com');

      expect(condition).toEqual({
        domainRegex: 'stackoverflow\\.com'
      });
    });

    it('escapes multiple dots', () => {
      const condition = Conditions.domain('docs.google.com');

      expect(condition).toEqual({
        domainRegex: 'docs\\.google\\.com'
      });
    });

    it('handles domain without dots', () => {
      const condition = Conditions.domain('localhost');

      expect(condition).toEqual({
        domainRegex: 'localhost'
      });
    });

    it('handles domain with subdomain', () => {
      const condition = Conditions.domain('api.github.com');

      expect(condition).toEqual({
        domainRegex: 'api\\.github\\.com'
      });
    });
  });

  describe('domains', () => {
    it('creates OR condition for multiple domains', () => {
      const condition = Conditions.domains('github.com', 'gitlab.com');

      expect(condition).toEqual({
        domainRegex: 'github\\.com|gitlab\\.com'
      });
    });

    it('escapes dots in all domains', () => {
      const condition = Conditions.domains('api.github.com', 'docs.gitlab.com', 'bitbucket.org');

      expect(condition).toEqual({
        domainRegex: 'api\\.github\\.com|docs\\.gitlab\\.com|bitbucket\\.org'
      });
    });

    it('handles single domain', () => {
      const condition = Conditions.domains('reddit.com');

      expect(condition).toEqual({
        domainRegex: 'reddit\\.com'
      });
    });

    it('handles empty domain list', () => {
      const condition = Conditions.domains();

      expect(condition).toEqual({
        domainRegex: ''
      });
    });
  });

  describe('timeRange', () => {
    it('creates time range condition', () => {
      const condition = Conditions.timeRange(9, 17);

      expect(condition).toEqual({
        hourRange: { start: 9, end: 17 }
      });
    });

    it('handles midnight hour (0)', () => {
      const condition = Conditions.timeRange(0, 5);

      expect(condition).toEqual({
        hourRange: { start: 0, end: 5 }
      });
    });

    it('handles 23:00 hour', () => {
      const condition = Conditions.timeRange(20, 23);

      expect(condition).toEqual({
        hourRange: { start: 20, end: 23 }
      });
    });

    it('handles overnight range (wrapping)', () => {
      const condition = Conditions.timeRange(22, 2);

      expect(condition).toEqual({
        hourRange: { start: 22, end: 2 }
      });
    });

    it('throws error for start hour < 0', () => {
      expect(() => Conditions.timeRange(-1, 5)).toThrow('Hour must be between 0 and 23');
    });

    it('throws error for start hour > 23', () => {
      expect(() => Conditions.timeRange(24, 5)).toThrow('Hour must be between 0 and 23');
    });

    it('throws error for end hour < 0', () => {
      expect(() => Conditions.timeRange(0, -1)).toThrow('Hour must be between 0 and 23');
    });

    it('throws error for end hour > 23', () => {
      expect(() => Conditions.timeRange(0, 24)).toThrow('Hour must be between 0 and 23');
    });

    it('throws error for both hours invalid', () => {
      expect(() => Conditions.timeRange(-5, 25)).toThrow('Hour must be between 0 and 23');
    });
  });

  describe('titleContains', () => {
    it('creates title condition', () => {
      const condition = Conditions.titleContains('Stack Overflow');

      expect(condition).toEqual({
        titleContains: 'Stack Overflow'
      });
    });

    it('handles special characters', () => {
      const condition = Conditions.titleContains('(GitHub)');

      expect(condition).toEqual({
        titleContains: '(GitHub)'
      });
    });

    it('handles empty string', () => {
      const condition = Conditions.titleContains('');

      expect(condition).toEqual({
        titleContains: ''
      });
    });
  });

  describe('urlContains', () => {
    it('creates URL condition', () => {
      const condition = Conditions.urlContains('reddit.com/r/programming');

      expect(condition).toEqual({
        urlContains: 'reddit.com/r/programming'
      });
    });

    it('handles URL with protocol', () => {
      const condition = Conditions.urlContains('https://example.com');

      expect(condition).toEqual({
        urlContains: 'https://example.com'
      });
    });

    it('handles query parameters', () => {
      const condition = Conditions.urlContains('search?q=test');

      expect(condition).toEqual({
        urlContains: 'search?q=test'
      });
    });
  });

  describe('groupCount', () => {
    it('creates group count condition', () => {
      const condition = Conditions.groupCount(5);

      expect(condition).toEqual({ groupCount: 5 });
    });

    it('works with zero groups', () => {
      const condition = Conditions.groupCount(0);

      expect(condition).toEqual({ groupCount: 0 });
    });

    it('works with large numbers', () => {
      const condition = Conditions.groupCount(50);

      expect(condition).toEqual({ groupCount: 50 });
    });
  });

  describe('groupCountRange', () => {
    it('creates range condition with min only', () => {
      const condition = Conditions.groupCountRange(3);

      expect(condition).toEqual({
        groupCount: { min: 3 }
      });
    });

    it('creates range condition with min and max', () => {
      const condition = Conditions.groupCountRange(3, 10);

      expect(condition).toEqual({
        groupCount: { min: 3, max: 10 }
      });
    });

    it('handles min equal to max', () => {
      const condition = Conditions.groupCountRange(5, 5);

      expect(condition).toEqual({
        groupCount: { min: 5, max: 5 }
      });
    });

    it('does not add max property when undefined', () => {
      const condition = Conditions.groupCountRange(2, undefined);

      expect(condition).toEqual({
        groupCount: { min: 2 }
      });
      expect(condition.groupCount).not.toHaveProperty('max');
    });
  });

  describe('custom', () => {
    it('creates custom check condition', () => {
      const condition = Conditions.custom('all-tabs-youtube');

      expect(condition).toEqual({
        customCheck: 'all-tabs-youtube'
      });
    });

    it('handles various custom check names', () => {
      const condition1 = Conditions.custom('developer-tools-open');
      const condition2 = Conditions.custom('high-memory-usage');
      const condition3 = Conditions.custom('long-session');

      expect(condition1).toEqual({ customCheck: 'developer-tools-open' });
      expect(condition2).toEqual({ customCheck: 'high-memory-usage' });
      expect(condition3).toEqual({ customCheck: 'long-session' });
    });
  });

  describe('combine', () => {
    it('combines multiple conditions', () => {
      const condition = Conditions.combine(
        Conditions.domain('reddit.com'),
        Conditions.tabCountRange(10)
      );

      expect(condition).toEqual({
        domainRegex: 'reddit\\.com',
        tabCount: { min: 10 }
      });
    });

    it('combines three conditions', () => {
      const condition = Conditions.combine(
        Conditions.domain('stackoverflow.com'),
        Conditions.tabCountRange(5, 20),
        Conditions.timeRange(2, 5)
      );

      expect(condition).toEqual({
        domainRegex: 'stackoverflow\\.com',
        tabCount: { min: 5, max: 20 },
        hourRange: { start: 2, end: 5 }
      });
    });

    it('handles overlapping conditions (last wins)', () => {
      const condition = Conditions.combine(
        Conditions.tabCount(42),
        Conditions.tabCountRange(10, 50)
      );

      // Last condition wins for tabCount
      expect(condition).toEqual({
        tabCount: { min: 10, max: 50 }
      });
    });

    it('handles empty combination', () => {
      const condition = Conditions.combine();

      expect(condition).toEqual({});
    });

    it('handles single condition', () => {
      const condition = Conditions.combine(
        Conditions.domain('github.com')
      );

      expect(condition).toEqual({
        domainRegex: 'github\\.com'
      });
    });

    it('combines all condition types', () => {
      const condition = Conditions.combine(
        Conditions.domain('reddit.com'),
        Conditions.tabCountRange(10, 50),
        Conditions.groupCountRange(2),
        Conditions.timeRange(14, 16),
        Conditions.titleContains('programming'),
        Conditions.urlContains('/r/javascript'),
        Conditions.custom('high-activity')
      );

      expect(condition).toEqual({
        domainRegex: 'reddit\\.com',
        tabCount: { min: 10, max: 50 },
        groupCount: { min: 2 },
        hourRange: { start: 14, end: 16 },
        titleContains: 'programming',
        urlContains: '/r/javascript',
        customCheck: 'high-activity'
      });
    });
  });

  describe('Real-world Easter Egg Examples', () => {
    it('creates Douglas Adams easter egg (42 tabs)', () => {
      const condition = Conditions.tabCount(42);

      expect(condition).toEqual({ tabCount: 42 });
    });

    it('creates late night coding easter egg', () => {
      const condition = Conditions.combine(
        Conditions.timeRange(2, 5),
        Conditions.domains('stackoverflow.com', 'github.com'),
        Conditions.tabCountRange(10)
      );

      expect(condition).toMatchObject({
        hourRange: { start: 2, end: 5 },
        domainRegex: expect.stringContaining('stackoverflow'),
        tabCount: { min: 10 }
      });
    });

    it('creates Reddit procrastination easter egg', () => {
      const condition = Conditions.combine(
        Conditions.domain('reddit.com'),
        Conditions.tabCountRange(5),
        Conditions.urlContains('/r/')
      );

      expect(condition).toEqual({
        domainRegex: 'reddit\\.com',
        tabCount: { min: 5 },
        urlContains: '/r/'
      });
    });

    it('creates tab hoarder easter egg', () => {
      const condition = Conditions.combine(
        Conditions.tabCountRange(100),
        Conditions.groupCountRange(5)
      );

      expect(condition).toEqual({
        tabCount: { min: 100 },
        groupCount: { min: 5 }
      });
    });
  });

  describe('Type Safety', () => {
    it('returns correct type for all factories', () => {
      const condition1 = Conditions.tabCount(1);
      const condition2 = Conditions.domain('example.com');
      const condition3 = Conditions.timeRange(1, 2);
      const condition4 = Conditions.combine(condition1, condition2);

      // TypeScript should infer EasterEggConditionsType for all
      expect(typeof condition1).toBe('object');
      expect(typeof condition2).toBe('object');
      expect(typeof condition3).toBe('object');
      expect(typeof condition4).toBe('object');
    });
  });
});
