interface UserPrefs {
  selectedThemeId: string;
  selectedIntensity: 'level1' | 'level2';
}

// In a real app, this might be fetched from a manifest or the filesystem.
const AVAILABLE_THEMES = [
  { id: 'passive_aggressive', name: 'Passive-Aggressive' },
  // Add other themes here as they are created
];

let currentPrefs: UserPrefs;
let themeCssLink: HTMLLinkElement | null = null;

const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
const intensityControls = document.getElementById('intensity-controls');
const categoryForm = document.getElementById('category-form') as HTMLFormElement;
const urlInput = document.getElementById('url-input') as HTMLInputElement;
const categoryInput = document.getElementById('category-input') as HTMLInputElement;
const statusMessage = document.getElementById('status-message');

function renderThemeSelector() {
  AVAILABLE_THEMES.forEach(theme => {
    const option = document.createElement('option');
    option.value = theme.id;
    option.textContent = theme.name;
    themeSelect.appendChild(option);
  });
}

async function renderIntensityControls() {
  if (!intensityControls) return;
  intensityControls.innerHTML = ''; // Clear existing controls

  const themeInfo = await chrome.runtime.sendMessage({ action: 'getActiveThemeInfo' });

  if (themeInfo?.intensityLevelNames) {
    Object.entries(themeInfo.intensityLevelNames).forEach(([level, label]) => {
      const labelEl = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'intensity';
      radio.value = level;
      radio.checked = currentPrefs.selectedIntensity === level;

      radio.addEventListener('change', handlePreferenceChange);

      labelEl.appendChild(radio);
      labelEl.appendChild(document.createTextNode(label as string));
      intensityControls.appendChild(labelEl);
    });
  }
}

function applyThemeStyles() {
  const themeCssPath = `themes/${currentPrefs.selectedThemeId}/styles.css`;

  if (themeCssLink) {
    themeCssLink.href = themeCssPath;
  } else {
    themeCssLink = document.createElement('link');
    themeCssLink.rel = 'stylesheet';
    themeCssLink.href = themeCssPath;
    document.head.appendChild(themeCssLink);
  }
}

async function handlePreferenceChange() {
  const newIntensity = (document.querySelector('input[name="intensity"]:checked') as HTMLInputElement)?.value || 'level1';

  currentPrefs = {
    selectedThemeId: themeSelect.value,
    selectedIntensity: newIntensity as 'level1' | 'level2',
  };

  await chrome.runtime.sendMessage({ action: 'saveUserPreferences', prefs: currentPrefs });

  // Re-render controls and styles based on new theme
  await renderIntensityControls();
  applyThemeStyles();
}

async function loadAndApplyPreferences() {
  const prefs = await chrome.runtime.sendMessage({ action: 'getUserPreferences' });
  if (prefs) {
    currentPrefs = prefs;
    themeSelect.value = currentPrefs.selectedThemeId;
    await renderIntensityControls();
    applyThemeStyles();
  }
}

async function handleFormSubmit(event: SubmitEvent) {
  event.preventDefault();
  if (!statusMessage) return;

  const url = urlInput.value.trim();
  const category = categoryInput.value.trim();

  if (!url || !category) {
    statusMessage.textContent = 'URL and Category are required.';
    return;
  }

  // This could be expanded to use the saveUserCategorySuggestion module if it were part of the background script's API
  statusMessage.textContent = 'Suggestion submitted! (Note: This is a demo and does not yet save).';
  categoryForm.reset();
  setTimeout(() => { statusMessage.textContent = '' }, 3000);
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  if (!themeSelect || !intensityControls || !categoryForm) {
      console.error('Options page UI elements not found');
      return;
  }

  renderThemeSelector();
  loadAndApplyPreferences();

  themeSelect.addEventListener('change', handlePreferenceChange);
  categoryForm.addEventListener('submit', handleFormSubmit);
});
