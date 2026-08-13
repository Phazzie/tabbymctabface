/**
 * FILE: QuipStorage.test.ts
 *
 * WHAT: Contract tests for canonical JSON-backed quip storage.
 *
 * WHY: Ensures content is validated once and retrieved without level-induced dead matches.
 *
 * HOW DATA FLOWS:
 *   1. QuipStorage imports packaged JSON through quip-data (SEAM-14).
 *   2. Initialization validates and caches the records.
 *   3. Callers retrieve defensive copies through SEAM-13 and SEAM-17.
 *
 * SEAMS:
 *   IN: Personality/EasterEggFramework → QuipStorage (SEAM-13, SEAM-17)
 *   OUT: QuipStorage → Packaged JSON (SEAM-14)
 *
 * CONTRACT: IQuipStorage v1.1.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { MockChromeStorageAPI } from '../../mocks/MockChromeStorageAPI';
import type { EasterEggData } from '../../contracts/IQuipStorage';
import { PASSIVE_AGGRESSIVE_QUIPS } from '../quip-data';
import {
  QuipStorage,
  validateEasterEggCollection,
  validatePassiveAggressiveCollection
} from '../QuipStorage';

describe('QuipStorage canonical-data implementation', () => {
  let storage: QuipStorage;

  beforeEach(() => {
    storage = new QuipStorage(new MockChromeStorageAPI());
  });

  it('requires initialization before reads', async () => {
    const result = await storage.getAllEasterEggQuips();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe('NotInitialized');
  });

  it('validates and exposes all 204 canonical Easter eggs', async () => {
    expect((await storage.initialize()).ok).toBe(true);

    const result = await storage.getAllEasterEggQuips();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(204);
  });

  it('prefers the requested level but never hides a uniquely matched type', async () => {
    await storage.initialize();

    const authoredLevel = await storage.getEasterEggQuips('42-tabs', 'default');
    const mismatchedLevel = await storage.getEasterEggQuips('42-tabs', 'intense');

    expect(authoredLevel.ok && authoredLevel.value.map(egg => egg.id)).toEqual(['EE-001']);
    expect(mismatchedLevel.ok && mismatchedLevel.value.map(egg => egg.id)).toEqual(['EE-001']);
  });

  it('returns defensive copies of cached content', async () => {
    await storage.initialize();
    const first = await storage.getAllEasterEggQuips();
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    first.value[0].quips[0] = 'mutated';
    const second = await storage.getAllEasterEggQuips();

    expect(second.ok).toBe(true);
    if (second.ok) expect(second.value[0].quips[0]).toBe("Don't Panic.");
  });

  it('reports duplicate IDs and types instead of accepting ambiguous content', () => {
    const base: EasterEggData = {
      id: 'EE-999',
      type: 'duplicate-test',
      conditions: { tabCount: 1 },
      quips: ['A valid test quip.'],
      level: 'default'
    };

    const violations = validateEasterEggCollection([
      base,
      { ...base, quips: ['Still duplicated.'] }
    ]);

    expect(violations).toContain('Duplicate Easter egg ID: EE-999');
    expect(violations).toContain('Duplicate Easter egg type: duplicate-test');
  });

  it('reports unknown condition fields, invalid regexes, ranges, and empty quips', () => {
    const invalid = {
      id: 'EE-998',
      type: 'invalid-test',
      conditions: {
        domainRegex: '[',
        tabCount: { min: 4, max: 2 },
        customCheck: 'made-up-check',
        madeUpCondition: true
      },
      quips: [''],
      level: 'maximum'
    } as unknown as EasterEggData;

    const violations = validateEasterEggCollection([invalid]);

    expect(violations.some(value => value.includes('Unknown condition key'))).toBe(true);
    expect(violations.some(value => value.includes('Invalid domainRegex'))).toBe(true);
    expect(violations.some(value => value.includes('tabCount min must be <= max'))).toBe(true);
    expect(violations.some(value => value.includes('10 to 200 characters'))).toBe(true);
    expect(violations.some(value => value.includes('Invalid humor level'))).toBe(true);
    expect(violations.some(value => value.includes('Unsupported customCheck'))).toBe(true);
  });

  it('enforces unique IDs/text without coupling runtime validation to a release count', () => {
    expect(validatePassiveAggressiveCollection(PASSIVE_AGGRESSIVE_QUIPS)).toEqual([]);

    const duplicateCollection = PASSIVE_AGGRESSIVE_QUIPS.map(quip => ({ ...quip }));
    duplicateCollection[1] = {
      ...duplicateCollection[1],
      id: duplicateCollection[0].id,
      text: duplicateCollection[0].text
    };
    const violations = validatePassiveAggressiveCollection(duplicateCollection);

    expect(violations.some(value => value.includes('Duplicate passive-aggressive quip ID'))).toBe(true);
    expect(violations.some(value => value.includes('Duplicate passive-aggressive quip text'))).toBe(true);
    expect(validatePassiveAggressiveCollection(duplicateCollection.slice(2))).toEqual([]);
  });

  it('keeps exact release counts outside runtime schema validation', () => {
    const oneEgg: EasterEggData = {
      id: 'EE-999',
      type: 'small-valid-runtime-set',
      conditions: { tabCount: 1 },
      quips: ['A structurally valid runtime quip.'],
      level: 'default'
    };

    expect(validateEasterEggCollection([oneEgg])).toEqual([]);
    expect(validatePassiveAggressiveCollection(PASSIVE_AGGRESSIVE_QUIPS.slice(0, 1))).toEqual([]);
  });
});
