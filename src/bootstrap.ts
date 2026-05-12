/**
 * FILE: bootstrap.ts
 *
 * WHAT: Extension initialization and dependency injection wiring
 *
 * WHY: Sets up all components with proper dependencies when extension loads.
 *      Creates the object graph: Chrome APIs -> Storage -> Humor System -> Tab Manager
 *
 * GENERATED: 2025-10-13
 */

import { ChromeTabsAPI } from './impl/ChromeTabsAPI';
import { ChromeNotificationsAPI } from './impl/ChromeNotificationsAPI';
import { ChromeStorageAPI } from './impl/ChromeStorageAPI';
import { QuipStorage } from './impl/QuipStorage';
import { EasterEggFramework } from './impl/EasterEggFramework';
import { HumorSystem } from './impl/HumorSystem';
import { TabManager } from './impl/TabManager';
import { Result } from './utils/Result';

let extensionContext: ExtensionContext | null = null;

export interface ExtensionContext {
  tabManager: TabManager;
  humorSystem: HumorSystem;
  easterEggFramework: EasterEggFramework;
  quipStorage: QuipStorage;
  chromeTabsAPI: ChromeTabsAPI;
  chromeNotificationsAPI: ChromeNotificationsAPI;
  chromeStorageAPI: ChromeStorageAPI;
}

export type InitializationResult = Result<ExtensionContext, InitializationError>;

export type InitializationError =
  | { type: 'StorageInitFailed'; details: string; originalError: unknown }
  | { type: 'EasterEggInitFailed'; details: string; originalError: unknown }
  | { type: 'AlreadyInitialized'; details: string };

export async function initializeExtension(): Promise<InitializationResult> {
  // Return existing context if already initialized - safe to call from both onStartup and onInstalled
  if (extensionContext !== null) {
    return Result.ok(extensionContext);
  }

  try {
    const chromeTabsAPI = new ChromeTabsAPI();
    const chromeNotificationsAPI = new ChromeNotificationsAPI();
    const chromeStorageAPI = new ChromeStorageAPI();

    const quipStorage = new QuipStorage(chromeStorageAPI);
    const initStorageResult = await quipStorage.initialize();

    if (initStorageResult.isError()) {
      return Result.error({ type: 'StorageInitFailed', details: 'Failed to initialize QuipStorage', originalError: initStorageResult.error });
    }

    const easterEggFramework = new EasterEggFramework(quipStorage);
    const initEggResult = await easterEggFramework.initialize();

    if (initEggResult.isError()) {
      return Result.error({ type: 'EasterEggInitFailed', details: 'Failed to initialize EasterEggFramework', originalError: initEggResult.error });
    }

    const humorSystem = new HumorSystem(easterEggFramework, quipStorage, chromeNotificationsAPI);
    const tabManager = new TabManager(chromeTabsAPI, humorSystem);

    extensionContext = { tabManager, humorSystem, easterEggFramework, quipStorage, chromeTabsAPI, chromeNotificationsAPI, chromeStorageAPI };

    console.log('[TabbyMcTabface] Extension initialized successfully');
    return Result.ok(extensionContext);

  } catch (error) {
    console.error('[TabbyMcTabface] Initialization failed', error);
    return Result.error({ type: 'StorageInitFailed', details: 'Unexpected error during initialization', originalError: error });
  }
}

export function getExtensionContext(): ExtensionContext | null {
  return extensionContext;
}

export function cleanupExtension(): void {
  extensionContext = null;
  console.log('[TabbyMcTabface] Extension context cleaned up');
}

export function isInitialized(): boolean {
  return extensionContext !== null;
}
