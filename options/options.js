document.addEventListener('DOMContentLoaded', function () {
    const themeDropdown = document.getElementById('theme-dropdown');
    const intensityRadios = document.getElementsByName('intensity');
    const urlInput = document.getElementById('url-input');
    const categoryInput = document.getElementById('category-input');
    const categoryCorrectionForm = document.getElementById('category-correction-form');
    const statusMessage = document.getElementById('status-message');

    // Load user preferences from storage
    chrome.storage.local.get(['userPrefs'], function (result) {
        const userPrefs = result.userPrefs || {};
        const selectedThemeId = userPrefs.selectedThemeId || 'passive_aggressive';
        const selectedIntensity = userPrefs.selectedIntensity || 'level1';

        // Set the theme dropdown value
        themeDropdown.value = selectedThemeId;

        // Set the intensity radio button value
        for (const radio of intensityRadios) {
            if (radio.value === selectedIntensity) {
                radio.checked = true;
                break;
            }
        }
    });

    // Save user preferences to storage
    function saveUserPrefs() {
        const selectedThemeId = themeDropdown.value;
        let selectedIntensity = 'level1';
        for (const radio of intensityRadios) {
            if (radio.checked) {
                selectedIntensity = radio.value;
                break;
            }
        }

        chrome.storage.local.set({
            userPrefs: {
                selectedThemeId,
                selectedIntensity
            }
        });
    }

    // Handle theme dropdown change
    themeDropdown.addEventListener('change', saveUserPrefs);

    // Handle intensity radio button change
    for (const radio of intensityRadios) {
        radio.addEventListener('change', saveUserPrefs);
    }

    // Handle category correction form submission
    categoryCorrectionForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const url = urlInput.value.trim();
        const category = categoryInput.value.trim();

        if (!url || !category) {
            statusMessage.textContent = 'Both URL and Category are required.';
            return;
        }

        const suggestion = {
            url,
            category,
            timestamp: Date.now()
        };

        chrome.storage.local.get(['userCategorySuggestions'], function (result) {
            const userCategorySuggestions = result.userCategorySuggestions || [];
            userCategorySuggestions.push(suggestion);

            chrome.storage.local.set({ userCategorySuggestions }, function () {
                statusMessage.textContent = 'Category correction submitted successfully.';
                urlInput.value = '';
                categoryInput.value = '';
            });
        });
    });
});
