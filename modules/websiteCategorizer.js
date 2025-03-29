const websiteCategories = {
  "Social Media": ["facebook.com", "twitter.com", "linkedin.com"],
  "News": ["nytimes.com", "bbc.com", "theguardian.com"],
  "Shopping": ["amazon.", "ebay.", "etsy.com"],
  "Work/Productivity": ["docs.google.com", "mail.google.com", "github.com", "stackoverflow.com"],
  "Entertainment": ["youtube.com", "netflix.com", "spotify.com"]
};

function categorizeWebsite(url) {
  for (const [category, sites] of Object.entries(websiteCategories)) {
    if (sites.some((site) => url.includes(site))) {
      return category;
    }
  }
  return "Other";
}

function saveUserCategorySuggestion(url, category) {
  const suggestion = {
    url,
    category,
    timestamp: Date.now()
  };

  chrome.storage.local.get(['userCategorySuggestions'], function (result) {
    const userCategorySuggestions = result.userCategorySuggestions || [];
    userCategorySuggestions.push(suggestion);

    chrome.storage.local.set({ userCategorySuggestions }, function () {
      console.log('Category correction submitted successfully.');
    });
  });
}

export { categorizeWebsite, saveUserCategorySuggestion };
