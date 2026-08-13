/**
 * FILE: selectors.ts
 *
 * WHAT: Centralizes stable popup selectors for browser tests.
 * WHY: Markup-only changes should update one adapter instead of every E2E scenario.
 * HOW DATA FLOWS:
 *   1. Popup markup identifiers enter this adapter through SEAM-E2E-01.
 *   2. Typed selectors flow into all Playwright popup scenarios.
 * SEAMS:
 *   IN: Popup markup -> selector adapter (SEAM-E2E-01)
 *   OUT: Selector adapter -> Playwright scenarios (SEAM-E2E-01)
 * CONTRACT: PopupSelectorMap v1.0.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

// === SEAM-E2E-01: Popup markup -> Playwright selector adapter ===
export const popupSelectors = {
  root: '.container',
  title: 'h1.title',
  feelingLuckyButton: '#feelingLuckyBtn',
  createGroupButton: '#createGroupBtn',
  groupCreator: '#groupCreator',
  groupNameInput: '#groupNameInput',
  tabCheckboxes: '#tabList input.tab-checkbox',
  confirmGroupButton: '#confirmGroupBtn',
  cancelGroupButton: '#cancelGroupBtn',
  statusText: '#statusMessage .status-text',
  tabCount: '#tabCount',
  groupCount: '#groupCount',
  quipCount: '#quipCount',
} as const;
