/**
 * FILE: bootstrap.ts
 *
 * WHAT: Idempotent MV3 dependency graph initialization and context access.
 *
 * WHY: A suspended service worker loses module state, while simultaneous wake events can race initialization.
 *
 * HOW DATA FLOWS:
 *   1. Background events call ensureInitialized (SEAM-32).
 *   2. One in-flight promise constructs Chrome wrappers, content stores, humor, stats, and TabManager.
 *   3. HumorSystem receives a provider that reads context from the constructed TabManager (SEAM-19).
 *
 * SEAMS:
 *   IN: Background lifecycle/message/command events -> bootstrap (SEAM-32)
 *   OUT: Bootstrap -> Chrome wrappers/core modules (SEAM-25, 26, 27)
 *
 * CONTRACT: Extension bootstrap v1.1.0
 * GENERATED: 2026-08-12
 */

import { ChromeTabsAPI } from './impl/ChromeTabsAPI';
import { ChromeNotificationsAPI } from './impl/ChromeNotificationsAPI';
import { ChromeStorageAPI, ChromeUsageStatsStore } from './impl/ChromeStorageAPI';
import { QuipStorage } from './impl/QuipStorage';
import { EasterEggFramework } from './impl/EasterEggFramework';
import { HumorSystem } from './impl/HumorSystem';
import { TabManager } from './impl/TabManager';
import { Result } from './utils/Result';

let extensionContext: ExtensionContext | null = null;
let initializationPromise: Promise<InitializationResult> | null = null;

export interface ExtensionContext {
  tabManager: TabManager;
  humorSystem: HumorSystem;
  easterEggFramework: EasterEggFramework;
  quipStorage: QuipStorage;
  chromeTabsAPI: ChromeTabsAPI;
  chromeNotificationsAPI: ChromeNotificationsAPI;
  chromeStorageAPI: ChromeStorageAPI;
  usageStats: ChromeUsageStatsStore;
}

export type InitializationResult = Result<ExtensionContext, InitializationError>;

export type InitializationError =
  | { type: 'StorageInitFailed'; details: string; originalError: unknown }
  | { type: 'EasterEggInitFailed'; details: string; originalError: unknown };

export type InitializationFactory = () => Promise<InitializationResult>;

export function ensureInitialized(factory: InitializationFactory = initializeExtension): Promise<InitializationResult> {
  if (extensionContext) return Promise.resolve(Result.ok(extensionContext));
  if (initializationPromise) return initializationPromise;

  initializationPromise = factory()
    .then(result => {
      if (result.ok) extensionContext = result.value;
      else initializationPromise = null;
      return result;
    })
    .catch(error => {
      initializationPromise = null;
      return Result.error({
        type: 'StorageInitFailed',
        details: 'Unexpected error during initialization',
        originalError: error
      });
    });
  return initializationPromise;
}

export async function initializeExtension(): Promise<InitializationResult> {
  if (extensionContext) return Result.ok(extensionContext);

  try {
    const chromeTabsAPI = new ChromeTabsAPI();
    const chromeNotificationsAPI = new ChromeNotificationsAPI();
    const chromeStorageAPI = new ChromeStorageAPI();
    const usageStats = new ChromeUsageStatsStore(chromeStorageAPI);
    const quipStorage = new QuipStorage(chromeStorageAPI);
    const storageResult = await quipStorage.initialize();
    if (!storageResult.ok) {
      return Result.error({
        type: 'StorageInitFailed',
        details: 'Failed to initialize quip storage',
        originalError: storageResult.error
      });
    }

    const easterEggFramework = new EasterEggFramework(quipStorage);
    const eggResult = await easterEggFramework.initialize();
    if (!eggResult.ok) {
      return Result.error({
        type: 'EasterEggInitFailed',
        details: 'Failed to initialize Easter egg framework',
        originalError: eggResult.error
      });
    }

    const humorSystem = new HumorSystem(
      easterEggFramework,
      quipStorage,
      chromeNotificationsAPI,
      undefined,
      usageStats
    );
    const tabManager = new TabManager(chromeTabsAPI, humorSystem, usageStats);
    humorSystem.setBrowserContextProvider(() => tabManager.getBrowserContext());

    const context: ExtensionContext = {
      tabManager,
      humorSystem,
      easterEggFramework,
      quipStorage,
      chromeTabsAPI,
      chromeNotificationsAPI,
      chromeStorageAPI,
      usageStats
    };
    extensionContext = context;
    return Result.ok(context);
  } catch (error) {
    return Result.error({
      type: 'StorageInitFailed',
      details: 'Unexpected error during initialization',
      originalError: error
    });
  }
}

export function getExtensionContext(): ExtensionContext | null {
  return extensionContext;
}

export function cleanupExtension(): void {
  extensionContext = null;
  initializationPromise = null;
}

export function isInitialized(): boolean {
  return extensionContext !== null;
}
