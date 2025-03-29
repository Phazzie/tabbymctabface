import { ITheme } from './ITheme';

class ThemeEngine {
  private activeTheme: ITheme | null = null;
  private selectedThemeId: string = 'passive_aggressive';
  private selectedIntensity: 'level1' | 'level2' = 'level1';

  constructor() {
    this.loadUserPreferences();
  }

  private loadUserPreferences() {
    chrome.storage.local.get(['userPrefs'], (result) => {
      const userPrefs = result.userPrefs || {};
      this.selectedThemeId = userPrefs.selectedThemeId || 'passive_aggressive';
      this.selectedIntensity = userPrefs.selectedIntensity || 'level1';
      this.loadTheme();
    });
  }

  private loadTheme() {
    const themePath = `themes/${this.selectedThemeId}/theme.js`;
    import(chrome.runtime.getURL(themePath))
      .then((module) => {
        this.activeTheme = module.default;
      })
      .catch((error) => {
        console.error(`Failed to load theme: ${error}`);
      });
  }

  public getQuip(triggerType: string, triggerData: any): string | null {
    if (this.activeTheme) {
      return this.activeTheme.getQuip(triggerType, triggerData, this.selectedIntensity);
    }
    return null;
  }

  public getEasterEggQuip(easterEggType: string, triggerData: any): string | null {
    if (this.activeTheme) {
      return this.activeTheme.getEasterEggQuip(easterEggType, triggerData);
    }
    return null;
  }

  public getErrorQuip(errorType: string, errorDetails: any): string | null {
    if (this.activeTheme) {
      return this.activeTheme.getErrorQuip(errorType, errorDetails);
    }
    return null;
  }

  public getStyling(): { cssPath?: string; variables?: Record<string, string> } {
    if (this.activeTheme) {
      return this.activeTheme.getStyling();
    }
    return {};
  }
}

export default new ThemeEngine();
