import passiveAggressiveTheme from '../../themes/passive_aggressive/theme';

describe('Passive-Aggressive Theme', () => {
  test('should return correct quip for highTabCount trigger at level1', () => {
    const quip = passiveAggressiveTheme.getQuip('highTabCount', {}, 'level1');
    expect(quip).toBe("Quite the collection you're curating.");
  });

  test('should return correct quip for highTabCount trigger at level2', () => {
    const quip = passiveAggressiveTheme.getQuip('highTabCount', {}, 'level2');
    expect(quip).toBe("Is the goal to eventually use *all* the RAM?");
  });

  test('should return correct quip for oldTab trigger at level1', () => {
    const quip = passiveAggressiveTheme.getQuip('oldTab', {}, 'level1');
    expect(quip).toBe("This one's still here. Waiting.");
  });

  test('should return correct quip for oldTab trigger at level2', () => {
    const quip = passiveAggressiveTheme.getQuip('oldTab', {}, 'level2');
    expect(quip).toBe("Did you perhaps mean to close this last Tuesday?");
  });

  test('should return correct easter egg quip for answerToEverything', () => {
    const quip = passiveAggressiveTheme.getEasterEggQuip('answerToEverything', {});
    expect(quip).toBe("42 tabs. Deeply meaningful, I'm sure.");
  });

  test('should return correct easter egg quip for archiveVisit', () => {
    const quip = passiveAggressiveTheme.getEasterEggQuip('archiveVisit', {});
    expect(quip).toBe("Visiting the past? How... retrospective.");
  });

  test('should return correct error quip for storage_fail', () => {
    const quip = passiveAggressiveTheme.getErrorQuip('storage_fail', {});
    expect(quip).toBe("Remembering your preferences seems to be... challenging right now.");
  });

  test('should return correct error quip for api_unavailable', () => {
    const quip = passiveAggressiveTheme.getErrorQuip('api_unavailable', {});
    expect(quip).toBe("That function appears to be taking an unscheduled break.");
  });

  test('should return correct styling', () => {
    const styling = passiveAggressiveTheme.getStyling();
    expect(styling.cssPath).toBeDefined();
    expect(styling.variables).toEqual({});
  });
});
