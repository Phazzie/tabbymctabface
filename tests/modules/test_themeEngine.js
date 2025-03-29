import ThemeEngine from '../../modules/themeEngine';
import { ITheme } from '../../modules/ITheme';

describe('ThemeEngine', () => {
  let mockTheme: ITheme;

  beforeEach(() => {
    mockTheme = {
      id: 'mock_theme',
      name: 'Mock Theme',
      intensityLevelNames: { level1: 'Low', level2: 'High' },
      getQuip: jest.fn(),
      getEasterEggQuip: jest.fn(),
      getErrorQuip: jest.fn(),
      getStyling: jest.fn().mockReturnValue({ cssPath: 'mock.css', variables: {} })
    };

    jest.spyOn(ThemeEngine, 'loadTheme').mockImplementation(() => {
      ThemeEngine['activeTheme'] = mockTheme;
    });

    jest.spyOn(ThemeEngine, 'loadUserPreferences').mockImplementation(() => {
      ThemeEngine['selectedThemeId'] = 'mock_theme';
      ThemeEngine['selectedIntensity'] = 'level1';
      ThemeEngine.loadTheme();
    });

    ThemeEngine.loadUserPreferences();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should load user preferences and theme', () => {
    expect(ThemeEngine['selectedThemeId']).toBe('mock_theme');
    expect(ThemeEngine['selectedIntensity']).toBe('level1');
    expect(ThemeEngine['activeTheme']).toBe(mockTheme);
  });

  it('should get quip from active theme', () => {
    const triggerType = 'highTabCount';
    const triggerData = { count: 20 };
    const intensityLevel = 'level1';

    ThemeEngine.getQuip(triggerType, triggerData);

    expect(mockTheme.getQuip).toHaveBeenCalledWith(triggerType, triggerData, intensityLevel);
  });

  it('should get easter egg quip from active theme', () => {
    const easterEggType = 'answerToEverything';
    const triggerData = {};

    ThemeEngine.getEasterEggQuip(easterEggType, triggerData);

    expect(mockTheme.getEasterEggQuip).toHaveBeenCalledWith(easterEggType, triggerData);
  });

  it('should get error quip from active theme', () => {
    const errorType = 'storage_fail';
    const errorDetails = {};

    ThemeEngine.getErrorQuip(errorType, errorDetails);

    expect(mockTheme.getErrorQuip).toHaveBeenCalledWith(errorType, errorDetails);
  });

  it('should get styling from active theme', () => {
    const styling = ThemeEngine.getStyling();

    expect(styling).toEqual({ cssPath: 'mock.css', variables: {} });
    expect(mockTheme.getStyling).toHaveBeenCalled();
  });
});
