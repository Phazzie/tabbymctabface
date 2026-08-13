/**
 * FILE: easter-eggs.data.test.ts
 *
 * WHAT: Contract tests for the canonical Easter-egg content collection.
 *
 * WHY: Prevents invalid or duplicate content from crossing the packaged-JSON seam.
 *
 * HOW DATA FLOWS:
 *   1. Tests import the same JSON-backed exports used by QuipStorage.
 *   2. Every record and condition is checked against the content contract.
 *   3. Release-count and category policies guard the requested 100-entry expansion.
 *
 * SEAMS:
 *   IN: Packaged JSON → QuipStorage (SEAM-14)
 *   OUT: None
 *
 * CONTRACT: IQuipStorage v1.1.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

// === SEAM-14: Packaged JSON → QuipStorage ===

import { describe, expect, it } from 'vitest';
import { EASTER_EGGS, PASSIVE_AGGRESSIVE_QUIPS } from '../../../impl/quip-data';

const ALLOWED_LEVELS = new Set(['default', 'mild', 'intense']);
const ALLOWED_DIFFICULTIES = new Set(['common', 'uncommon', 'rare', 'legendary']);
const ALLOWED_CONDITION_KEYS = new Set([
  'tabCount',
  'domainRegex',
  'hourRange',
  'titleContains',
  'urlContains',
  'groupCount',
  'customCheck'
]);

describe('canonical Easter-egg data contract', () => {
  it('contains the 104 existing entries plus exactly 100 new entries', () => {
    expect(EASTER_EGGS).toHaveLength(204);

    const addedIds = EASTER_EGGS
      .map(egg => egg.id)
      .filter(id => Number(id.slice(3)) >= 161);

    expect(addedIds).toHaveLength(100);
    expect(addedIds).toEqual(
      Array.from({ length: 100 }, (_, index) => `EE-${String(index + 161).padStart(3, '0')}`)
    );
  });

  it('has unique IDs and unique type identifiers', () => {
    const ids = EASTER_EGGS.map(egg => egg.id);
    const types = EASTER_EGGS.map(egg => egg.type);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(types).size).toBe(types.length);
  });

  it('uses only valid fields, levels, difficulties, ranges, and regular expressions', () => {
    for (const egg of EASTER_EGGS) {
      expect(egg.id).toMatch(/^EE-\d{3}$/);
      expect(egg.type.trim().length).toBeGreaterThan(0);
      expect(Object.keys(egg.conditions).length).toBeGreaterThan(0);
      expect(Object.keys(egg.conditions).every(key => ALLOWED_CONDITION_KEYS.has(key))).toBe(true);
      expect(ALLOWED_LEVELS.has(egg.level)).toBe(true);
      expect(egg.quips.length).toBeGreaterThan(0);
      expect(egg.quips.every(quip => quip.trim().length >= 10 && quip.length <= 200)).toBe(true);

      if (egg.metadata?.difficulty) {
        expect(ALLOWED_DIFFICULTIES.has(egg.metadata.difficulty)).toBe(true);
      }

      if (egg.conditions.domainRegex) {
        expect(() => new RegExp(egg.conditions.domainRegex as string, 'i')).not.toThrow();
      }

      if (egg.conditions.hourRange) {
        expect(egg.conditions.hourRange.start).toBeGreaterThanOrEqual(0);
        expect(egg.conditions.hourRange.start).toBeLessThanOrEqual(23);
        expect(egg.conditions.hourRange.end).toBeGreaterThanOrEqual(0);
        expect(egg.conditions.hourRange.end).toBeLessThanOrEqual(23);
      }

      for (const condition of [egg.conditions.tabCount, egg.conditions.groupCount]) {
        if (condition && typeof condition === 'object') {
          expect(condition.min !== undefined || condition.max !== undefined).toBe(true);
          if (condition.min !== undefined && condition.max !== undefined) {
            expect(condition.min).toBeLessThanOrEqual(condition.max);
          }
        }
      }
    }
  });

  it('keeps exactly 75 unique, release-safe passive-aggressive quips', () => {
    expect(PASSIVE_AGGRESSIVE_QUIPS).toHaveLength(75);
    expect(new Set(PASSIVE_AGGRESSIVE_QUIPS.map(quip => quip.id)).size).toBe(75);
    expect(new Set(PASSIVE_AGGRESSIVE_QUIPS.map(quip => quip.text)).size).toBe(75);
    expect(
      PASSIVE_AGGRESSIVE_QUIPS.every(quip => (
        quip.text.trim().length >= 10 && quip.text.length <= 200
      ))
    ).toBe(true);
  });

  it('adds twenty EverQuest eggs and eight ten-entry spectrum categories', () => {
    const categoryRanges = [
      { start: 161, end: 180, category: 'everquest' },
      { start: 181, end: 190, category: 'mainstream-pop-culture' },
      { start: 191, end: 200, category: 'computing-folklore' },
      { start: 201, end: 210, category: 'math-science' },
      { start: 211, end: 220, category: 'history-material-culture' },
      { start: 221, end: 230, category: 'music-acoustics' },
      { start: 231, end: 240, category: 'deep-games-rules' },
      { start: 241, end: 250, category: 'digital-archaeology' },
      { start: 251, end: 260, category: 'mundane-anthropology' }
    ];

    for (const category of categoryRanges) {
      const eggs = EASTER_EGGS.filter(egg => {
        const numericId = Number(egg.id.slice(3));
        return numericId >= category.start && numericId <= category.end;
      });

      expect(eggs).toHaveLength(category.end - category.start + 1);
      expect(eggs.every(egg => egg.metadata?.category === category.category)).toBe(true);
      expect(eggs.every(egg => (egg.metadata?.nicheReference ?? '').length > 0)).toBe(true);
    }
  });

  it('keeps corrected EverQuest and cricket metadata internally consistent', () => {
    const planeOfFear = EASTER_EGGS.find(egg => egg.id === 'EE-051');
    const cricket = EASTER_EGGS.find(egg => egg.id === 'EE-087');

    expect(planeOfFear?.metadata?.nicheReference).toContain('Original EverQuest');
    expect(planeOfFear?.metadata?.nicheReference).not.toContain('Kunark');
    expect(cricket?.type).toBe('cricket-dls');
    expect(cricket?.metadata?.nicheReference).toContain('Cricket');
  });
});
