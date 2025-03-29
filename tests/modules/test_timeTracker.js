import { jest } from '@jest/globals';
import timeTracker from '../../modules/timeTracker';

describe('timeTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chrome.storage.local.get = jest.fn();
    chrome.storage.local.set = jest.fn();
  });

  test('startTracking should set startTime and lastActiveTime', () => {
    const tabId = 1;
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1000);

    timeTracker.startTracking(tabId);

    expect(chrome.storage.local.get).toHaveBeenCalledWith(['tabData'], expect.any(Function));
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      tabData: {
        [tabId]: { startTime: 1000, lastActiveTime: 1000 }
      }
    });

    mockDateNow.mockRestore();
  });

  test('stopTracking should update lastActiveTime', () => {
    const tabId = 1;
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(2000);

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        tabData: {
          [tabId]: { startTime: 1000, lastActiveTime: 1000 }
        }
      });
    });

    timeTracker.stopTracking(tabId);

    expect(chrome.storage.local.get).toHaveBeenCalledWith(['tabData'], expect.any(Function));
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      tabData: {
        [tabId]: { startTime: 1000, lastActiveTime: 2000 }
      }
    });

    mockDateNow.mockRestore();
  });

  test('getElapsedTime should return the correct elapsed time', async () => {
    const tabId = 1;

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        tabData: {
          [tabId]: { startTime: 1000, lastActiveTime: 2000 }
        }
      });
    });

    const elapsedTime = await timeTracker.getElapsedTime(tabId);

    expect(chrome.storage.local.get).toHaveBeenCalledWith(['tabData'], expect.any(Function));
    expect(elapsedTime).toBe(1000);
  });

  test('getElapsedTime should reject if tab data is not found', async () => {
    const tabId = 1;

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ tabData: {} });
    });

    await expect(timeTracker.getElapsedTime(tabId)).rejects.toThrow('Tab data not found');
  });
});
