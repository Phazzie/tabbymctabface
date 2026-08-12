/**
 * FILE: QuipStorage.ts
 *
 * WHAT: Validated, in-memory access to canonical packaged quip JSON.
 *
 * WHY: Implements IQuipStorage while keeping one content source and rejecting malformed releases.
 *
 * HOW DATA FLOWS:
 *   1. Canonical JSON crosses SEAM-14 through quip-data.
 *   2. initialize validates every record before publishing an immutable cache snapshot.
 *   3. Personality and EasterEggFramework query defensive copies through SEAM-13/17.
 *
 * SEAMS:
 *   IN: Personality/EasterEggFramework → QuipStorage (SEAM-13, SEAM-17)
 *   OUT: QuipStorage → Packaged JSON (SEAM-14)
 *
 * CONTRACT: IQuipStorage v1.1.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import type { IChromeStorageAPI } from '../contracts/IChromeStorageAPI';
import { SUPPORTED_EASTER_EGG_CUSTOM_CHECKS } from '../contracts/IEasterEggFramework';
import type {
  EasterEggConditions,
  EasterEggData,
  HumorLevel,
  IQuipStorage,
  QuipData,
  StorageError
} from '../contracts/IQuipStorage';
import { Result } from '../utils/Result';
import { EASTER_EGGS, PASSIVE_AGGRESSIVE_QUIPS } from './quip-data';

const HUMOR_LEVELS = new Set<HumorLevel>(['default', 'mild', 'intense']);
const DIFFICULTIES = new Set(['common', 'uncommon', 'rare', 'legendary']);
const CUSTOM_CHECKS = new Set<string>(SUPPORTED_EASTER_EGG_CUSTOM_CHECKS);
const CONDITION_KEYS = new Set<keyof EasterEggConditions>([
  'tabCount',
  'domainRegex',
  'hourRange',
  'titleContains',
  'urlContains',
  'groupCount',
  'customCheck'
]);

const EXPANSION_CATEGORY_POLICY = [
  { start: 161, end: 180, category: 'everquest' },
  { start: 181, end: 190, category: 'mainstream-pop-culture' },
  { start: 191, end: 200, category: 'computing-folklore' },
  { start: 201, end: 210, category: 'math-science' },
  { start: 211, end: 220, category: 'history-material-culture' },
  { start: 221, end: 230, category: 'music-acoustics' },
  { start: 231, end: 240, category: 'deep-games-rules' },
  { start: 241, end: 250, category: 'digital-archaeology' },
  { start: 251, end: 260, category: 'mundane-anthropology' }
] as const;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateCountCondition(
  value: unknown,
  label: 'tabCount' | 'groupCount',
  eggId: string
): string[] {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0
      ? []
      : [`${eggId}: ${label} must be a non-negative integer`];
  }

  if (!isRecord(value)) return [`${eggId}: ${label} must be a number or range`];

  const violations: string[] = [];
  const min = value.min;
  const max = value.max;
  if (min === undefined && max === undefined) {
    violations.push(`${eggId}: ${label} range must define min or max`);
  }
  if (min !== undefined && (!Number.isInteger(min) || (min as number) < 0)) {
    violations.push(`${eggId}: ${label} min must be a non-negative integer`);
  }
  if (max !== undefined && (!Number.isInteger(max) || (max as number) < 0)) {
    violations.push(`${eggId}: ${label} max must be a non-negative integer`);
  }
  if (typeof min === 'number' && typeof max === 'number' && min > max) {
    violations.push(`${eggId}: ${label} min must be <= max`);
  }
  return violations;
}

function validateConditions(value: unknown, eggId: string): string[] {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return [`${eggId}: conditions must be a non-empty object`];
  }

  const violations: string[] = [];
  for (const key of Object.keys(value)) {
    if (!CONDITION_KEYS.has(key as keyof EasterEggConditions)) {
      violations.push(`${eggId}: Unknown condition key: ${key}`);
    }
  }

  if (value.tabCount !== undefined) {
    violations.push(...validateCountCondition(value.tabCount, 'tabCount', eggId));
  }
  if (value.groupCount !== undefined) {
    violations.push(...validateCountCondition(value.groupCount, 'groupCount', eggId));
  }

  if (value.domainRegex !== undefined) {
    if (typeof value.domainRegex !== 'string' || value.domainRegex.length === 0) {
      violations.push(`${eggId}: domainRegex must be a non-empty string`);
    } else {
      try {
        new RegExp(value.domainRegex, 'i');
      } catch {
        violations.push(`${eggId}: Invalid domainRegex`);
      }
    }
  }

  for (const field of ['titleContains', 'urlContains', 'customCheck'] as const) {
    const condition = value[field];
    if (condition !== undefined && (typeof condition !== 'string' || condition.trim().length === 0)) {
      violations.push(`${eggId}: ${field} must be a non-empty string`);
    }
  }
  if (
    typeof value.customCheck === 'string'
    && !CUSTOM_CHECKS.has(value.customCheck)
  ) {
    violations.push(`${eggId}: Unsupported customCheck: ${value.customCheck}`);
  }

  if (value.hourRange !== undefined) {
    if (!isRecord(value.hourRange)) {
      violations.push(`${eggId}: hourRange must be an object`);
    } else {
      for (const endpoint of ['start', 'end'] as const) {
        const hour = value.hourRange[endpoint];
        if (!Number.isInteger(hour) || (hour as number) < 0 || (hour as number) > 23) {
          violations.push(`${eggId}: hourRange.${endpoint} must be an integer from 0 to 23`);
        }
      }
    }
  }

  return violations;
}

/**
 * Validate a complete Easter-egg collection at the packaged-data seam.
 * Returns all violations so release failures are actionable in one run.
 */
export function validateEasterEggCollection(collection: readonly unknown[]): string[] {
  const violations: string[] = [];
  const ids = new Set<string>();
  const types = new Set<string>();

  if (collection.length !== 204) {
    violations.push(`Easter-egg collection must contain exactly 204 entries; got ${collection.length}`);
  }

  for (const [index, value] of collection.entries()) {
    const fallbackId = `record ${index}`;
    if (!isRecord(value)) {
      violations.push(`${fallbackId}: Easter egg must be an object`);
      continue;
    }

    const id = typeof value.id === 'string' ? value.id : fallbackId;
    if (typeof value.id !== 'string' || !/^EE-\d{3}$/.test(value.id)) {
      violations.push(`${id}: Invalid Easter egg ID`);
    } else if (ids.has(value.id)) {
      violations.push(`Duplicate Easter egg ID: ${value.id}`);
    } else {
      ids.add(value.id);
    }

    if (typeof value.type !== 'string' || value.type.trim().length === 0) {
      violations.push(`${id}: type must be a non-empty string`);
    } else if (types.has(value.type)) {
      violations.push(`Duplicate Easter egg type: ${value.type}`);
    } else {
      types.add(value.type);
    }

    violations.push(...validateConditions(value.conditions, id));

    if (
      !Array.isArray(value.quips)
      || value.quips.length === 0
      || !value.quips.every(quip => (
        typeof quip === 'string'
        && quip.trim().length >= 10
        && quip.length <= 200
      ))
    ) {
      violations.push(`${id}: Easter egg must have at least one quip from 10 to 200 characters`);
    }

    if (typeof value.level !== 'string' || !HUMOR_LEVELS.has(value.level as HumorLevel)) {
      violations.push(`${id}: Invalid humor level`);
    }

    if (value.metadata !== undefined) {
      if (!isRecord(value.metadata)) {
        violations.push(`${id}: metadata must be an object`);
      } else {
        if (
          value.metadata.difficulty !== undefined
          && (
            typeof value.metadata.difficulty !== 'string'
            || !DIFFICULTIES.has(value.metadata.difficulty)
          )
        ) {
          violations.push(`${id}: Invalid difficulty`);
        }
        if (
          value.metadata.category !== undefined
          && (typeof value.metadata.category !== 'string' || value.metadata.category.length === 0)
        ) {
          violations.push(`${id}: category must be a non-empty string`);
        }
      }
    }
  }

  for (const policy of EXPANSION_CATEGORY_POLICY) {
    const expectedCount = policy.end - policy.start + 1;
    const categoryRecords = collection.filter((value): value is UnknownRecord => {
      if (!isRecord(value) || typeof value.id !== 'string') return false;
      const numericId = Number(value.id.slice(3));
      return numericId >= policy.start && numericId <= policy.end;
    });
    if (categoryRecords.length !== expectedCount) {
      violations.push(
        `Expansion IDs EE-${policy.start}..EE-${policy.end} must contain ${expectedCount} entries`
      );
      continue;
    }
    for (const record of categoryRecords) {
      const metadata = isRecord(record.metadata) ? record.metadata : {};
      if (metadata.category !== policy.category) {
        violations.push(`${String(record.id)}: category must be ${policy.category}`);
      }
    }
  }

  return violations;
}

export function validatePassiveAggressiveCollection(collection: readonly unknown[]): string[] {
  const violations: string[] = [];
  const ids = new Set<string>();
  const texts = new Set<string>();

  if (collection.length !== 75) {
    violations.push(`Passive-aggressive collection must contain exactly 75 quips; got ${collection.length}`);
  }

  for (const [index, value] of collection.entries()) {
    const fallbackId = `passive record ${index}`;
    if (!isRecord(value)) {
      violations.push(`${fallbackId}: quip must be an object`);
      continue;
    }
    const id = typeof value.id === 'string' ? value.id : fallbackId;
    if (typeof value.id !== 'string' || !/^PA-\d{3}$/.test(value.id)) {
      violations.push(`${id}: Invalid passive-aggressive quip ID`);
    } else if (ids.has(value.id)) {
      violations.push(`Duplicate passive-aggressive quip ID: ${value.id}`);
    } else {
      ids.add(value.id);
    }
    if (
      typeof value.text !== 'string'
      || value.text.trim().length < 10
      || value.text.length > 200
    ) {
      violations.push(`${id}: text must be from 10 to 200 characters`);
    } else if (texts.has(value.text)) {
      violations.push(`Duplicate passive-aggressive quip text: ${value.text}`);
    } else {
      texts.add(value.text);
    }
    if (
      !Array.isArray(value.triggerTypes)
      || value.triggerTypes.length === 0
      || !value.triggerTypes.every(trigger => typeof trigger === 'string' && trigger.length > 0)
    ) {
      violations.push(`${id}: triggerTypes must contain non-empty strings`);
    }
    if (typeof value.level !== 'string' || !HUMOR_LEVELS.has(value.level as HumorLevel)) {
      violations.push(`${id}: Invalid humor level`);
    }
  }

  return violations;
}

function cloneQuip(quip: QuipData): QuipData {
  return {
    ...quip,
    triggerTypes: [...quip.triggerTypes],
    metadata: quip.metadata
      ? { ...quip.metadata, tags: quip.metadata.tags ? [...quip.metadata.tags] : undefined }
      : undefined
  };
}

function cloneCountCondition(
  condition: number | { min?: number; max?: number } | undefined
): number | { min?: number; max?: number } | undefined {
  return typeof condition === 'object' && condition !== null ? { ...condition } : condition;
}

function cloneEasterEgg(egg: EasterEggData): EasterEggData {
  return {
    ...egg,
    conditions: {
      ...egg.conditions,
      tabCount: cloneCountCondition(egg.conditions.tabCount),
      groupCount: cloneCountCondition(egg.conditions.groupCount),
      hourRange: egg.conditions.hourRange ? { ...egg.conditions.hourRange } : undefined
    },
    quips: [...egg.quips],
    metadata: egg.metadata ? { ...egg.metadata } : undefined
  };
}

/** JSON-backed IQuipStorage implementation. */
export class QuipStorage implements IQuipStorage {
  private initialized = false;
  private passiveAggressiveQuips: QuipData[] = [];
  private easterEggQuips: EasterEggData[] = [];
  private availableTriggerTypes: string[] = [];

  /**
   * Retains the historical injected wrapper parameter for source compatibility.
   * Content is packaged read-only JSON and is deliberately not copied into user storage.
   */
  constructor(storageAPI: IChromeStorageAPI) {
    void storageAPI;
  }

  /** Validate canonical data and atomically publish the cache. */
  async initialize(): Promise<Result<void, StorageError>> {
    const violations = [
      ...validatePassiveAggressiveCollection(PASSIVE_AGGRESSIVE_QUIPS),
      ...validateEasterEggCollection(EASTER_EGGS)
    ];

    if (violations.length > 0) {
      return Result.error({
        type: 'SchemaValidationError',
        details: 'Packaged quip data does not match the storage contract',
        violations
      });
    }

    this.passiveAggressiveQuips = PASSIVE_AGGRESSIVE_QUIPS.map(cloneQuip);
    this.easterEggQuips = EASTER_EGGS.map(cloneEasterEgg);
    this.availableTriggerTypes = [
      ...new Set(this.passiveAggressiveQuips.flatMap(quip => quip.triggerTypes))
    ].sort();
    this.initialized = true;
    return Result.ok(undefined);
  }

  /** Retrieve level/trigger-filtered passive-aggressive quips. */
  async getPassiveAggressiveQuips(
    level: HumorLevel,
    triggerType?: string
  ): Promise<Result<QuipData[], StorageError>> {
    const ready = this.requireInitialized();
    if (!ready.ok) return ready;

    const matches = this.passiveAggressiveQuips.filter(quip => (
      quip.level === level
      && (triggerType === undefined || quip.triggerTypes.includes(triggerType))
    ));
    return Result.ok(matches.map(cloneQuip));
  }

  /** Retrieve a unique Easter-egg type, with authored-level fallback. */
  async getEasterEggQuips(
    easterEggType: string,
    level: HumorLevel
  ): Promise<Result<EasterEggData[], StorageError>> {
    const ready = this.requireInitialized();
    if (!ready.ok) return ready;

    const typeMatches = this.easterEggQuips.filter(egg => egg.type === easterEggType);
    const preferred = typeMatches.filter(egg => egg.level === level);
    return Result.ok((preferred.length > 0 ? preferred : typeMatches).map(cloneEasterEgg));
  }

  /** Retrieve every Easter egg, optionally filtered by authored humor level. */
  async getAllEasterEggQuips(
    level?: HumorLevel
  ): Promise<Result<EasterEggData[], StorageError>> {
    const ready = this.requireInitialized();
    if (!ready.ok) return ready;

    const matches = level
      ? this.easterEggQuips.filter(egg => egg.level === level)
      : this.easterEggQuips;
    return Result.ok(matches.map(cloneEasterEgg));
  }

  /** Retrieve all passive-aggressive trigger names in stable order. */
  async getAvailableTriggerTypes(): Promise<Result<string[], StorageError>> {
    const ready = this.requireInitialized();
    if (!ready.ok) return ready;
    return Result.ok([...this.availableTriggerTypes]);
  }

  /** Report whether canonical data passed validation. */
  isInitialized(): boolean {
    return this.initialized;
  }

  private requireInitialized(): Result<void, StorageError> {
    return this.initialized
      ? Result.ok(undefined)
      : Result.error({
        type: 'NotInitialized',
        details: 'QuipStorage not initialized. Call initialize() first.'
      });
  }
}
