import { jest } from '@jest/globals';

describe('Popup', () => {
  let quipElement;
  let createGroupButton;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="content">
        <p id="quip">Loading...</p>
        <button id="create-group">Create New Group</button>
      </div>
    `;

    quipElement = document.getElementById('quip');
    createGroupButton = document.getElementById('create-group');
  });

  test('should display current commentary', () => {
    const mockSendMessage = jest.fn((message, callback) => {
      callback({ commentary: 'Test commentary' });
    });
    chrome.runtime.sendMessage = mockSendMessage;

    require('../../popup/popup.js');

    expect(mockSendMessage).toHaveBeenCalledWith({ action: 'getCurrentCommentary' }, expect.any(Function));
    expect(quipElement.textContent).toBe('Test commentary');
  });

  test('should handle create group button click', () => {
    const mockSendMessage = jest.fn((message, callback) => {
      callback({ groupId: 1 });
    });
    chrome.runtime.sendMessage = mockSendMessage;

    const mockQuery = jest.fn((queryInfo, callback) => {
      callback([{ id: 1 }]);
    });
    chrome.tabs.query = mockQuery;

    require('../../popup/popup.js');

    createGroupButton.click();

    expect(mockQuery).toHaveBeenCalledWith({ currentWindow: true, active: true }, expect.any(Function));
    expect(mockSendMessage).toHaveBeenCalledWith({ action: 'createNewGroup', tabIds: [1] }, expect.any(Function));
  });

  test('should apply theme-specific styles', () => {
    const mockGet = jest.fn((keys, callback) => {
      callback({ userPrefs: { selectedThemeId: 'passive_aggressive' } });
    });
    chrome.storage.local.get = mockGet;

    require('../../popup/popup.js');

    expect(mockGet).toHaveBeenCalledWith(['userPrefs'], expect.any(Function));
    const linkElement = document.querySelector('link[rel="stylesheet"]');
    expect(linkElement).not.toBeNull();
    expect(linkElement.href).toContain('themes/passive_aggressive/styles.css');
  });
});
