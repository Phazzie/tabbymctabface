import { categorizeWebsite, saveUserCategorySuggestion } from '../../modules/websiteCategorizer';

describe('categorizeWebsite', () => {
  test('should categorize social media websites correctly', () => {
    expect(categorizeWebsite('https://www.facebook.com')).toBe('Social Media');
    expect(categorizeWebsite('https://twitter.com')).toBe('Social Media');
    expect(categorizeWebsite('https://linkedin.com')).toBe('Social Media');
  });

  test('should categorize news websites correctly', () => {
    expect(categorizeWebsite('https://www.nytimes.com')).toBe('News');
    expect(categorizeWebsite('https://bbc.com')).toBe('News');
    expect(categorizeWebsite('https://theguardian.com')).toBe('News');
  });

  test('should categorize shopping websites correctly', () => {
    expect(categorizeWebsite('https://www.amazon.com')).toBe('Shopping');
    expect(categorizeWebsite('https://ebay.com')).toBe('Shopping');
    expect(categorizeWebsite('https://etsy.com')).toBe('Shopping');
  });

  test('should categorize work/productivity websites correctly', () => {
    expect(categorizeWebsite('https://docs.google.com')).toBe('Work/Productivity');
    expect(categorizeWebsite('https://mail.google.com')).toBe('Work/Productivity');
    expect(categorizeWebsite('https://github.com')).toBe('Work/Productivity');
    expect(categorizeWebsite('https://stackoverflow.com')).toBe('Work/Productivity');
  });

  test('should categorize entertainment websites correctly', () => {
    expect(categorizeWebsite('https://www.youtube.com')).toBe('Entertainment');
    expect(categorizeWebsite('https://netflix.com')).toBe('Entertainment');
    expect(categorizeWebsite('https://spotify.com')).toBe('Entertainment');
  });

  test('should return "Other" for uncategorized websites', () => {
    expect(categorizeWebsite('https://example.com')).toBe('Other');
    expect(categorizeWebsite('https://unknownwebsite.com')).toBe('Other');
  });
});

describe('saveUserCategorySuggestion', () => {
  beforeEach(() => {
    chrome.storage.local.get = jest.fn();
    chrome.storage.local.set = jest.fn();
  });

  test('should save user category suggestion', () => {
    const url = 'https://example.com';
    const category = 'News';

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ userCategorySuggestions: [] });
    });

    saveUserCategorySuggestion(url, category);

    expect(chrome.storage.local.get).toHaveBeenCalledWith(['userCategorySuggestions'], expect.any(Function));
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      userCategorySuggestions: [
        { url, category, timestamp: expect.any(Number) }
      ]
    });
  });
});
