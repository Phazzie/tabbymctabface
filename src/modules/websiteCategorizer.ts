interface WebsiteCategories {
  [category: string]: string[];
}

interface UserSuggestion {
  url: string;
  category: string;
  timestamp: number;
}

let categories: WebsiteCategories = {};

/**
 * Loads the website categories from the JSON file.
 * This should be called once when the extension starts.
 */
export async function loadCategories(): Promise<void> {
  try {
    const response = await fetch(chrome.runtime.getURL('data/websiteCategories.json'));
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }
    categories = await response.json();
  } catch (error) {
    console.error('Error loading website categories:', error);
    // Fallback to empty categories if loading fails
    categories = {};
  }
}

/**
 * Categorizes a website based on its URL.
 * @param url The URL of the website to categorize.
 * @returns The category string, or "Other" if no match is found.
 */
export function categorizeWebsite(url: string): string {
  if (!url) return 'Other';

  try {
    const urlObject = new URL(url);
    const hostname = urlObject.hostname.replace(/^www\./, ''); // Remove 'www.'

    for (const [category, sites] of Object.entries(categories)) {
      if (sites.some((site) => hostname.includes(site))) {
        return category;
      }
    }
  } catch (error) {
    // If URL is invalid, we can't categorize it.
    console.error(`Could not parse URL for categorization: ${url}`, error);
    return 'Other';
  }

  return 'Other';
}

/**
 * Saves a user's suggestion for a website category.
 * @param url The URL of the website.
 * @param category The category suggested by the user.
 */
export async function saveUserCategorySuggestion(url: string, category: string): Promise<void> {
  const newSuggestion: UserSuggestion = {
    url,
    category,
    timestamp: Date.now(),
  };

  // This get-then-set pattern is safe here because we are always just adding to the array,
  // not modifying existing entries. For a more complex scenario, a manager class like in
  // timeTracker.ts would be better.
  const result = await chrome.storage.local.get('userCategorySuggestions');
  const suggestions: UserSuggestion[] = result.userCategorySuggestions || [];
  suggestions.push(newSuggestion);
  await chrome.storage.local.set({ userCategorySuggestions: suggestions });
}
