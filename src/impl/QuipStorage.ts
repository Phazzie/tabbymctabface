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

function validateConditionKeys(value: UnknownRecord, eggId: string): string[] {
  const violations: string[] = [];
  for (const key of Object.keys(value)) {
    if (!CONDITION_KEYS.has(key as keyof EasterEggConditions)) {
      violations.push(`${eggId}: Unknown condition key: ${key}`);
    }
  }

  return violations;
}

function validateDomainRegex(value: unknown, eggId: string): string[] {
  if (value === undefined) return [];
  if (typeof value !== 'string' || value.length === 0) {
    return [`${eggId}: domainRegex must be a non-empty string`];
  }
  try {
    new RegExp(value, 'i');
    return [];
  } catch {
    return [`${eggId}: Invalid domainRegex`];
  }
}

function validateTextConditions(value: UnknownRecord, eggId: string): string[] {
  const violations: string[] = [];
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
  return violations;
}

function validateHourRange(value: unknown, eggId: string): string[] {
  if (value === undefined) return [];
  if (!isRecord(value)) return [`${eggId}: hourRange must be an object`];
  const violations: string[] = [];
  for (const endpoint of ['start', 'end'] as const) {
    const hour = value[endpoint];
    if (!Number.isInteger(hour) || (hour as number) < 0 || (hour as number) > 23) {
      violations.push(`${eggId}: hourRange.${endpoint} must be an integer from 0 to 23`);
    }
  }
  return violations;
}

function validateConditions(value: unknown, eggId: string): string[] {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return [`${eggId}: conditions must be a non-empty object`];
  }
  return [
    ...validateConditionKeys(value, eggId),
    ...(value.tabCount === undefined ? [] : validateCountCondition(value.tabCount, 'tabCount', eggId)),
    ...(value.groupCount === undefined ? [] : validateCountCondition(value.groupCount, 'groupCount', eggId)),
    ...validateDomainRegex(value.domainRegex, eggId),
    ...validateTextConditions(value, eggId),
    ...validateHourRange(value.hourRange, eggId)
  ];
}

function validateEasterEggIdentity(
  value: UnknownRecord,
  id: string,
  ids: Set<string>,
  types: Set<string>
): string[] {
  const violations: string[] = [];
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
  return violations;
}

function validateEasterEggQuips(value: unknown, id: string): string[] {
  const valid = Array.isArray(value)
    && value.length > 0
    && value.every(quip => typeof quip === 'string' && quip.trim().length >= 10 && quip.length <= 200);
  return valid ? [] : [`${id}: Easter egg must have at least one quip from 10 to 200 characters`];
}

function validateEasterEggMetadata(value: unknown, id: string): string[] {
  if (value === undefined) return [];
  if (!isRecord(value)) return [`${id}: metadata must be an object`];
  const violations: string[] = [];
  if (
    value.difficulty !== undefined
    && (typeof value.difficulty !== 'string' || !DIFFICULTIES.has(value.difficulty))
  ) {
    violations.push(`${id}: Invalid difficulty`);
  }
  if (
    value.category !== undefined
    && (typeof value.category !== 'string' || value.category.length === 0)
  ) {
    violations.push(`${id}: category must be a non-empty string`);
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

  for (const [index, value] of collection.entries()) {
    const fallbackId = `record ${index}`;
    if (!isRecord(value)) {
      violations.push(`${fallbackId}: Easter egg must be an object`);
      continue;
    }

    const id = typeof value.id === 'string' ? value.id : fallbackId;
    violations.push(...validateEasterEggIdentity(value, id, ids, types));
    violations.push(...validateConditions(value.conditions, id));
    violations.push(...validateEasterEggQuips(value.quips, id));
    if (typeof value.level !== 'string' || !HUMOR_LEVELS.has(value.level as HumorLevel)) {
      violations.push(`${id}: Invalid humor level`);
    }
    violations.push(...validateEasterEggMetadata(value.metadata, id));
  }

  return violations;
}

export function validatePassiveAggressiveCollection(collection: readonly unknown[]): string[] {
  const violations: string[] = [];
  const ids = new Set<string>();
  const texts = new Set<string>();

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
  constructor(_storageAPI?: IChromeStorageAPI) {}

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
