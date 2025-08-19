import { ITheme, IntensityLevel } from '../themes/ITheme';

interface UserPrefs {
  selectedThemeId: string;
  selectedIntensity: IntensityLevel;
}

class ThemeEngine {
  private activeTheme: ITheme | null = null;
  private userPrefs: UserPrefs = {
    selectedThemeId: 'passive_aggressive',
    selectedIntensity: 'level1',
  };

  constructor() {
    this.loadUserPreferences().then(() => this.loadTheme());
  }

  public async loadUserPreferences(): Promise<void> {
    const result = await chrome.storage.local.get('userPrefs');
    if (result.userPrefs) {
      this.userPrefs = result.userPrefs;
    }
  }

  public async saveUserPreferences(prefs: UserPrefs): Promise<void> {
    this.userPrefs = prefs;
    await chrome.storage.local.set({ userPrefs: this.userPrefs });
    // Reload the theme in case it changed
    await this.loadTheme();
  }

  public getUserPreferences(): UserPrefs {
    return this.userPrefs;
  }

  private async loadTheme(): Promise<void> {
    try {
      // The `chrome.runtime.getURL` is handled by webpack at build time
      const themePath = `themes/${this.userPrefs.selectedThemeId}/theme.js`;
      const themeModule = await import(chrome.runtime.getURL(themePath));

      if (!themeModule.default) {
        throw new Error('Theme module does not have a default export.');
      }
      this.activeTheme = themeModule.default;
    } catch (error) {
      console.error(`Failed to load theme "${this.userPrefs.selectedThemeId}":`, error);
      this.activeTheme = null; // Fallback to no theme
    }
  }

  public getQuip(triggerType: string, triggerData: any): string | null {
    if (!this.activeTheme) return null;
    return this.activeTheme.getQuip(triggerType, triggerData, this.userPrefs.selectedIntensity);
  }

  public getEasterEggQuip(easterEggType: string, triggerData: any): string | null {
    if (!this.activeTheme) return null;
    return this.activeTheme.getEasterEggQuip(easterEggType, triggerData);
  }

  public getErrorQuip(errorType: string, errorDetails: any): string | null {
    if (!this.activeTheme) return null;
    return this.activeTheme.getErrorQuip(errorType, errorDetails);
  }

  public getStyling() {
    if (!this.activeTheme) return { cssPath: undefined, variables: {} };
    return this.activeTheme.getStyling();
  }

  public getActiveThemeInfo() {
      if (!this.activeTheme) return null;
      return {
          id: this.activeTheme.id,
          name: this.activeTheme.name,
          intensityLevelNames: this.activeTheme.intensityLevelNames
      }
  }
}

// Export a singleton instance
const themeEngine = new ThemeEngine();
export default themeEngine;
