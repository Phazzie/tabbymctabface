export type IntensityLevel = 'level1' | 'level2';

export interface ITheme {
  id: string;
  name: string;
  intensityLevelNames: {
    level1: string;
    level2: string;
  };

  getQuip(triggerType: string, triggerData: any, intensityLevel: IntensityLevel): string | null;
  getEasterEggQuip(easterEggType: string, triggerData: any): string | null;
  getErrorQuip(errorType: string, errorDetails: any): string | null;
  getStyling(): { cssPath?: string; variables?: Record<string, string> };
}
