import { createNewGroup } from '../../modules/tabGrouper';

describe('tabGrouper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a new tab group', async () => {
    const tabIds = [1, 2, 3];
    const groupId = 1;
    chrome.tabs.group = jest.fn((options, callback) => callback(groupId));
    const result = await createNewGroup(tabIds);
    expect(result).toBe(groupId);
    expect(chrome.tabs.group).toHaveBeenCalledWith({ tabIds }, expect.any(Function));
  });

  test('should handle error when creating a new tab group', async () => {
    const tabIds = [1, 2, 3];
    const errorMessage = 'Error creating tab group';
    chrome.tabs.group = jest.fn((options, callback) => {
      chrome.runtime.lastError = new Error(errorMessage);
      callback();
    });
    await expect(createNewGroup(tabIds)).rejects.toThrow(errorMessage);
    expect(chrome.tabs.group).toHaveBeenCalledWith({ tabIds }, expect.any(Function));
  });
});
