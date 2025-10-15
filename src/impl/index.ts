/**
 * FILE: index.ts
 *
 * WHAT: Export all real implementations for easy importing
 *
 * WHY: Provides centralized exports for all production implementations.
 *      Enables clean imports in dependency injection setup.
 *
 * CONTRACT: Implementation exports v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
 */

// Chrome API wrappers (external dependencies)
export { ChromeTabsAPI } from './ChromeTabsAPI';
export { ChromeNotificationsAPI } from './ChromeNotificationsAPI';
export { ChromeStorageAPI } from './ChromeStorageAPI';

// Data layer implementations
export { QuipStorage } from './QuipStorage';
export { EasterEggFramework } from './EasterEggFramework';

// Orchestration layer implementations
export { HumorSystem } from './HumorSystem';

// Core functionality
export { TabManager } from './TabManager';