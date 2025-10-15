/**
 * FILE: bootstrap.ts
 *
 * WHAT: Extension initialization and dependency injection wiring
 *
 * WHY: Sets up all components with proper dependencies when extension loads.
 *      Creates the object graph: Chrome APIs → Storage → Humor System → Tab Manager
 *
 * HOW DATA FLOWS:
 *   1. Extension loads, calls initializeExtension()
 *   2. Creates Chrome API wrappers (tabs, notifications, storage)
 *   3. Initializes data layer (QuipStorage, EasterEggFramework)
 *   4. Initializes orchestration layer (HumorSystem)
 *   5. Creates TabManager with all dependencies
 *   6. Returns TabManager instance for UI to use
 *
 * SEAMS:
 *   OUT: Bootstrap → All Components (initialization)
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

/**
 * Extension context - singleton instance
 */
let extensionContext: ExtensionContext | null = null;

/**
 * Extension context containing all initialized components
 */
export interface ExtensionContext {
  tabManager: TabManager;
  humorSystem: HumorSystem;
  easterEggFramework: EasterEggFramework;
  quipStorage: QuipStorage;
  chromeTabsAPI: ChromeTabsAPI;
  chromeNotificationsAPI: ChromeNotificationsAPI;
  chromeStorageAPI: ChromeStorageAPI;
}

/**
 * Initialization result
 */
export type InitializationResult = Result<ExtensionContext, InitializationError>;

export type InitializationError =
  | { type: 'StorageInitFailed'; details: string; originalError: unknown }
  | { type: 'EasterEggInitFailed'; details: string; originalError: unknown }
  | { type: 'AlreadyInitialized'; details: string };

/**
 * Initialize the extension and wire up all dependencies
 *
 * DATA FLOW:
 *   1. Check if already initialized (return existing context)
 *   2. Create Chrome API wrappers (lowest layer)
 *   3. Initialize QuipStorage with ChromeStorageAPI
 *   4. Initialize EasterEggFramework with QuipStorage
 *   5. Create HumorSystem with dependencies
 *   6. Create TabManager with dependencies
 *   7. Store and return context
 *
 * SEAMS CROSSED:
 *   - Chrome APIs wrapper creation
 *   - Storage initialization (SEAM-27)
 *   - Component wiring
 *
 * ERRORS:
 *   - AlreadyInitialized: Called twice without cleanup
 *   - StorageInitFailed: QuipStorage failed to load data
 *   - EasterEggInitFailed: EasterEggFramework failed to load eggs
 *
 * PERFORMANCE: <200ms (includes storage load)
 *
 * @returns Result with ExtensionContext or initialization error
 */
export async function initializeExtension(): Promise<InitializationResult> {
  // Prevent double initialization
  if (extensionContext !== null) {
    return Result.error({
      type: 'AlreadyInitialized',
      details: 'Extension already initialized. Call cleanup() first if re-initialization needed.'
    });
  }

  try {
    // === LAYER 1: Chrome API Wrappers ===
    const chromeTabsAPI = new ChromeTabsAPI();
    const chromeNotificationsAPI = new ChromeNotificationsAPI();
    const chromeStorageAPI = new ChromeStorageAPI();

    // === LAYER 2: Data Layer ===
    const quipStorage = new QuipStorage(chromeStorageAPI);
    const initStorageResult = await quipStorage.initialize();

    if (initStorageResult.isError()) {
      return Result.error({
        type: 'StorageInitFailed',
        details: 'Failed to initialize QuipStorage',
        originalError: initStorageResult.error
      });
    }

    // === LAYER 3: Easter Egg Framework ===
    const easterEggFramework = new EasterEggFramework(quipStorage);
    const initEggResult = await easterEggFramework.initialize();

    if (initEggResult.isError()) {
      return Result.error({
        type: 'EasterEggInitFailed',
        details: 'Failed to initialize EasterEggFramework',
        originalError: initEggResult.error
      });
    }

    // === LAYER 4: Humor Orchestration ===
    const humorSystem = new HumorSystem(
      easterEggFramework,
      quipStorage,
      chromeNotificationsAPI
    );

    // === LAYER 5: Core Tab Management ===
    const tabManager = new TabManager(chromeTabsAPI, humorSystem);

    // Store context
    extensionContext = {
      tabManager,
      humorSystem,
      easterEggFramework,
      quipStorage,
      chromeTabsAPI,
      chromeNotificationsAPI,
      chromeStorageAPI
    };

    console.log('[TabbyMcTabface] Extension initialized successfully');
    return Result.ok(extensionContext);

  } catch (error) {
    console.error('[TabbyMcTabface] Initialization failed', error);
    return Result.error({
      type: 'StorageInitFailed',
      details: 'Unexpected error during initialization',
      originalError: error
    });
  }
}

/**
 * Get the current extension context
 *
 * Use this to access TabManager and other components after initialization.
 *
 * @returns ExtensionContext or null if not initialized
 */
export function getExtensionContext(): ExtensionContext | null {
  return extensionContext;
}

/**
 * Cleanup extension context (for testing or re-initialization)
 *
 * Resets the singleton to allow re-initialization.
 * Useful for tests that need fresh instances.
 */
export function cleanupExtension(): void {
  extensionContext = null;
  console.log('[TabbyMcTabface] Extension context cleaned up');
}

/**
 * Check if extension is initialized
 *
 * @returns true if initialized, false otherwise
 */
export function isInitialized(): boolean {
  return extensionContext !== null;
}
