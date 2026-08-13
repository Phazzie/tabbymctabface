/**
 * FILE: quip-data.ts
 *
 * WHAT: Typed exports for the extension's canonical packaged JSON content.
 *
 * WHY: Keeps a single authoring/runtime source instead of duplicating 2,000+ lines in TypeScript.
 *
 * HOW DATA FLOWS:
 *   1. The bundler imports packaged JSON at the content boundary (SEAM-14).
 *   2. This module attaches IQuipStorage contract types without transforming records.
 *   3. QuipStorage validates and defensively copies the collections before use.
 *
 * SEAMS:
 *   IN: Packaged JSON → Typed content adapter (SEAM-14)
 *   OUT: Typed content adapter → QuipStorage (SEAM-14)
 *
 * CONTRACT: IQuipStorage v1.1.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import type { EasterEggData, QuipData } from '../contracts/IQuipStorage';
import easterEggsJson from '../data/quips/easter-eggs.json';
import passiveAggressiveQuipsJson from '../data/quips/passive-aggressive.json';

/** Canonical passive-aggressive content, authored in JSON. */
export const PASSIVE_AGGRESSIVE_QUIPS = passiveAggressiveQuipsJson as unknown as QuipData[];

/** Canonical Easter-egg content, authored in JSON. */
export const EASTER_EGGS = easterEggsJson as unknown as EasterEggData[];
