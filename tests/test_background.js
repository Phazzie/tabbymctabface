import { jest } from '@jest/globals';
import { createNewGroup } from '../modules/tabGrouper';
import timeTracker from '../modules/timeTracker';
import { categorizeWebsite, saveUserCategorySuggestion } from '../modules/websiteCategorizer';
import themeEngine from '../modules/themeEngine';

jest.mock('../modules/tabGrouper');
jest.mock('../modules/timeTracker');
jest.mock('../modules/websiteCategorizer');
jest.mock('../modules/themeEngine');

describe('background.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize user preferences on installation', () => {
    const setMock = jest.spyOn(chrome.storage.local, 'set');
    chrome.runtime.onInstalled.dispatch();
    expect(setMock).toHaveBeenCalledWith({
      userPrefs: { selectedThemeId: 'passive_aggressive', selectedIntensity: 'level1' }
    });
  });

  test('should handle tab creation', () => {
    const tab = { id: 1 };
    chrome.tabs.onCreated.dispatch(tab);
    // Add assertions for tab creation logic
  });

  test('should handle tab removal', () => {
    const tabId = 1;
    const removeInfo = {};
    chrome.tabs.onRemoved.dispatch(tabId, removeInfo);
    // Add assertions for tab removal logic
  });

  test('should handle tab activation', () => {
    const activeInfo = { tabId: 1 };
    chrome.tabs.onActivated.dispatch(activeInfo);
    // Add assertions for tab activation logic
  });

  test('should handle tab update', () => {
    const tabId = 1;
    const changeInfo = {};
    const tab = {};
    chrome.tabs.onUpdated.dispatch(tabId, changeInfo, tab);
    // Add assertions for tab update logic
  });

  test('should start tracking tab time', () => {
    const tabId = 1;
    timeTracker.startTracking(tabId);
    expect(timeTracker.startTracking).toHaveBeenCalledWith(tabId);
  });

  test('should stop tracking tab time', () => {
    const tabId = 1;
    timeTracker.stopTracking(tabId);
    expect(timeTracker.stopTracking).toHaveBeenCalledWith(tabId);
  });

  test('should get elapsed time for a tab', async () => {
    const tabId = 1;
    const elapsedTime = 1000;
    timeTracker.getElapsedTime.mockResolvedValue(elapsedTime);
    const result = await timeTracker.getElapsedTime(tabId);
    expect(result).toBe(elapsedTime);
  });

  test('should categorize website', async () => {
    const url = 'https://www.example.com';
    const category = 'Other';
    categorizeWebsite.mockResolvedValue(category);
    const result = await categorizeWebsite(url);
    expect(result).toBe(category);
  });

  test('should save user category suggestion', () => {
    const url = 'https://www.example.com';
    const category = 'News';
    saveUserCategorySuggestion(url, category);
    expect(saveUserCategorySuggestion).toHaveBeenCalledWith(url, category);
  });

  test('should create a new tab group', async () => {
    const tabIds = [1, 2, 3];
    const groupId = 1;
    createNewGroup.mockResolvedValue(groupId);
    const result = await createNewGroup(tabIds);
    expect(result).toBe(groupId);
  });

  test('should get quip from theme engine', () => {
    const triggerType = 'highTabCount';
    const triggerData = { count: 20 };
    const quip = 'Quite the collection you\'re curating.';
    themeEngine.getQuip.mockReturnValue(quip);
    const result = themeEngine.getQuip(triggerType, triggerData);
    expect(result).toBe(quip);
  });

  test('should get Easter Egg quip from theme engine', () => {
    const easterEggType = 'answerToEverything';
    const triggerData = {};
    const quip = '42 tabs. Deeply meaningful, I\'m sure.';
    themeEngine.getEasterEggQuip.mockReturnValue(quip);
    const result = themeEngine.getEasterEggQuip(easterEggType, triggerData);
    expect(result).toBe(quip);
  });

  test('should get error quip from theme engine', () => {
    const errorType = 'storage_fail';
    const errorDetails = {};
    const quip = 'Remembering your preferences seems to be... challenging right now.';
    themeEngine.getErrorQuip.mockReturnValue(quip);
    const result = themeEngine.getErrorQuip(errorType, errorDetails);
    expect(result).toBe(quip);
  });
});
