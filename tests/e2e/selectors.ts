/**
 * Stable selector seam for popup E2E tests.
 * Update only this adapter when popup markup changes without changing behavior.
 */
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
