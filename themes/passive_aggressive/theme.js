import { ITheme } from '../../modules/ITheme';
import humorData from './humor.json';
import styles from './styles.css';

const passiveAggressiveTheme: ITheme = {
  id: 'passive_aggressive',
  name: 'Passive-Aggressive',
  intensityLevelNames: {
    level1: "It's fine.",
    level2: "Sure, go ahead."
  },

  getQuip(triggerType: string, triggerData: any, intensityLevel: 'level1' | 'level2'): string | null {
    const quips = humorData.quips[triggerType];
    if (quips) {
      const quip = quips.find((q: any) => q.level === intensityLevel);
      return quip ? quip.text : null;
    }
    return null;
  },

  getEasterEggQuip(easterEggType: string, triggerData: any): string | null {
    const easterEggs = humorData.easterEggs[easterEggType];
    if (easterEggs) {
      const easterEgg = easterEggs[0]; // Assuming only one quip per easter egg type
      return easterEgg ? easterEgg.text : null;
    }
    return null;
  },

  getErrorQuip(errorType: string, errorDetails: any): string | null {
    const errors = humorData.errors[errorType];
    if (errors) {
      const error = errors[0]; // Assuming only one quip per error type
      return error ? error.text : null;
    }
    return null;
  },

  getStyling(): { cssPath?: string; variables?: Record<string, string> } {
    return {
      cssPath: styles,
      variables: {}
    };
  }
};

export default passiveAggressiveTheme;
