# TabbyMcTabface Privacy Policy

**Last Updated**: November 3, 2025

## Overview

TabbyMcTabface is a Chrome extension that helps you manage browser tabs with humor. We are committed to protecting your privacy.

## Data Collection

**We collect NO personal data.** TabbyMcTabface operates entirely locally in your browser.

### What We Access:
- **Tabs Information** (`tabs` permission): Required to read tab titles, URLs, and manage tab groups. Used to display your tabs and perform tab management operations.
- **Tab Groups** (`tabGroups` permission): Required to create, update, and manage tab groups.
- **Notifications** (`notifications` permission): Required to display passive-aggressive quips and easter egg messages.
- **Local Storage** (`storage` permission): Used to store your extension preferences and quip history locally in your browser.

### What We DO NOT Do:
- ❌ We do NOT send your data to any external servers
- ❌ We do NOT track your browsing history
- ❌ We do NOT collect analytics or telemetry
- ❌ We do NOT share data with third parties
- ❌ We do NOT use cookies or tracking mechanisms

## Data Storage

All data is stored locally in your browser using Chrome's `chrome.storage.local` API:
- Tab group preferences
- Recent quips history (to avoid repetition)
- User settings

This data never leaves your device and is only accessible to the TabbyMcTabface extension.

## Permissions Explanation

### Required Permissions:

1. **`tabs`**: Allows us to read tab information (title, URL) and manipulate tabs (close, group). This is the core functionality of TabbyMcTabface.

2. **`tabGroups`**: Allows us to create and manage tab groups, which is essential for organizing your tabs.

3. **`notifications`**: Allows us to show you humorous quips and easter egg notifications when you perform actions.

4. **`storage`**: Allows us to save your preferences and quip history locally in your browser.

5. **`<all_urls>` (host permissions)**: Required to read tab URLs for easter egg matching (e.g., showing a special quip when you have 42 tabs open on Stack Overflow). This does NOT allow us to modify page content or send data anywhere.

## Data Deletion

To delete all data stored by TabbyMcTabface:
1. Right-click the extension icon
2. Select "Remove from Chrome"
3. All locally stored data will be automatically deleted

Alternatively, clear Chrome's extension storage:
1. Go to `chrome://settings/clearBrowserData`
2. Select "Advanced" → "All time"
3. Check "Site settings" or use Chrome's developer tools to clear `chrome.storage.local`

## Changes to Privacy Policy

We may update this privacy policy from time to time. Changes will be reflected in the extension's repository and Chrome Web Store listing.

## Open Source

TabbyMcTabface is open source. You can review the complete source code at:
https://github.com/Phazzie/tabbymctabface

## Contact

For privacy concerns or questions:
- Open an issue: https://github.com/Phazzie/tabbymctabface/issues
- Email: [Your contact email]

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- Google's Limited Use disclosure requirements
- GDPR principles (no personal data collected)

---

**Summary**: TabbyMcTabface is privacy-first. We collect nothing, track nothing, and your data never leaves your browser.
