import { jest } from '@jest/globals';

describe('Options Page', () => {
    let themeDropdown, intensityRadios, urlInput, categoryInput, categoryCorrectionForm, statusMessage;

    beforeEach(() => {
        document.body.innerHTML = `
            <select id="theme-dropdown"></select>
            <input type="radio" name="intensity" value="level1">
            <input type="radio" name="intensity" value="level2">
            <input type="text" id="url-input">
            <input type="text" id="category-input">
            <form id="category-correction-form"></form>
            <p id="status-message"></p>
        `;

        themeDropdown = document.getElementById('theme-dropdown');
        intensityRadios = document.getElementsByName('intensity');
        urlInput = document.getElementById('url-input');
        categoryInput = document.getElementById('category-input');
        categoryCorrectionForm = document.getElementById('category-correction-form');
        statusMessage = document.getElementById('status-message');

        require('../../options/options.js');
    });

    test('loads user preferences from storage', () => {
        chrome.storage.local.get = jest.fn((keys, callback) => {
            callback({
                userPrefs: {
                    selectedThemeId: 'passive_aggressive',
                    selectedIntensity: 'level1'
                }
            });
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));

        expect(themeDropdown.value).toBe('passive_aggressive');
        expect(intensityRadios[0].checked).toBe(true);
    });

    test('saves user preferences to storage', () => {
        chrome.storage.local.set = jest.fn();

        themeDropdown.value = 'new_theme';
        intensityRadios[1].checked = true;

        themeDropdown.dispatchEvent(new Event('change'));
        intensityRadios[1].dispatchEvent(new Event('change'));

        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            userPrefs: {
                selectedThemeId: 'new_theme',
                selectedIntensity: 'level2'
            }
        });
    });

    test('handles category correction form submission', () => {
        chrome.storage.local.get = jest.fn((keys, callback) => {
            callback({ userCategorySuggestions: [] });
        });
        chrome.storage.local.set = jest.fn();

        urlInput.value = 'example.com';
        categoryInput.value = 'News';

        categoryCorrectionForm.dispatchEvent(new Event('submit'));

        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            userCategorySuggestions: [
                {
                    url: 'example.com',
                    category: 'News',
                    timestamp: expect.any(Number)
                }
            ]
        });
        expect(statusMessage.textContent).toBe('Category correction submitted successfully.');
    });
});
