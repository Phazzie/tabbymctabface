# TabbyMcTabface

## Introduction

### Purpose
This document outlines the Product Requirements (PRD) and Technical Design for the Minimum Viable Product (MVP) of the TabbyMcTabface Chrome Extension. It serves as a guide for development, ensuring alignment on goals, features, architecture, and implementation details. The target audience includes AI coding assistants requiring technical specifics and future human developers needing project context.

### App Overview
TabbyMcTabface is a Chrome browser extension functioning as a tab manager while injecting personality through themeable, witty commentary based on user browse habits. It aims to blend practical tab management with an engaging user experience. The MVP focuses on core functionality and the theme system.

### Goals (MVP)
- Provide basic manual tab grouping functionality.
- Implement a themeable system affecting commentary text and basic UI styling.
- Deliver contextual commentary based on user actions/state via themes.
- Include an Easter Egg system using niche/nostalgic triggers.
- Offer user configuration for theme selection and commentary intensity.
- Establish a robust, testable, and extensible foundation.

### Target Audience
Intelligent, tech-savvy individuals often experiencing tab overload (professionals, students, researchers). Users likely appreciate subtle, witty, or niche humor and a personality-driven approach to productivity tools. May include users with attention differences who rely heavily on tabs.

### Guiding Principles
- KISS (Keep It Simple, Stupid) & YAGNI (You Ain't Gonna Need It): Focus on essential MVP features. Defer complexity like advanced grouping or the 'Feeling Lucky?' concept to ensure faster validation and iteration.
- Modularity: Design with clear separation of concerns. Use distinct modules for functionalities like time tracking, categorization, theme management, and UI components to improve maintainability and testability.
- Extensibility: Architect the system, especially the theme engine and ITheme interface, to easily accommodate new themes, features, triggers, and Easter Eggs in future versions without major structural changes.
- DRY (Don't Repeat Yourself): Utilize shared utilities and common patterns where practical to reduce code redundancy and improve consistency.
- Test-Driven Development (TDD): Define and write tests alongside implementation, guided by detailed test case descriptions. This ensures correctness, facilitates safe refactoring, and maintains overall code quality.
- Dry/Witty Tone: Ensure commentary aligns with the selected theme's personality. The default theme and future witty themes should aim for clever, observational humor, potentially jaded but not cynical.

## MVP Functional Requirements

### Core Tab Management

#### Manual Tab Grouping (MVP Scope)
- Create Group: User can initiate group creation via a UI element (e.g., popup button) triggering the chrome.tabGroups.update API.
- Name/Rename Group: User utilizes Chrome's native UI for assigning and modifying group names.
- Add/Remove Tabs: Users primarily use native Chrome drag-and-drop functionality to move tabs into and out of groups.

#### Time Tracking
- Track tab activation (startTime) and deactivation/closure (lastActiveTime) using Date.now() timestamps.
- Store tracking data ({ startTime: number, lastActiveTime: number }) per tabId in chrome.storage.local.
- Provide an accessible function getElapsedTime(tabId) that returns the duration in milliseconds, calculating accurately based on the tab's current active state versus stored times.

#### Website Categorization (MVP Scope)
- Implement categorizeWebsite(url) function performing basic, case-insensitive string/domain matching against a predefined list (websiteCategories.json). Handle basic subdomains (e.g., sub.example.com matches example.com). Return "Other" on no match or error.
- Implement storage for user-submitted category corrections ({ url: string, category: string, timestamp: number }[]) in chrome.storage.local. The MVP categorization logic will not use these corrections.

#### User Feedback UI (Options Page)
- Provide UI elements: Input field for URL, input/dropdown for category selection, a submit button, and a status message area.
- Implement basic client-side validation (e.g., URL field cannot be empty).
- On submission, save the suggestion object to the userCategorySuggestions array in storage and display a confirmation message.

### Theme System

#### Theming Application
- The system applies the active theme's specified commentary text (quips, Easter Eggs, errors) and basic UI styling (via CSS file or variables) to the popup and options page.

#### Default Theme
- The "Passive-Aggressive" theme is loaded by default upon installation.

#### Theme Selection
- The Options page MUST provide a UI control (e.g., dropdown) enabling users to select the active theme. The selectedThemeId is persisted in chrome.storage.local.

#### Intensity Levels
- The Options page MUST provide a UI control (e.g., radio buttons) for selecting one of two intensity levels.
- The labels for these levels MUST be dynamically loaded from the active theme's definition (e.g., "It's fine.", "Sure, go ahead.").
- The selection (selectedIntensity representing level1 or level2) is persisted in chrome.storage.local.
- Commentary retrieval logic must filter quips based on the selected intensity level.

#### Architecture
- Managed via the ThemeEngine module utilizing the ITheme interface.

### Commentary & Triggers

#### Triggers
- The system must detect the following conditions and provide relevant context data:
  - highTabCount: Open tab count exceeds a defined threshold (e.g., 15). Data: { count: number }.
  - oldTab: getElapsedTime exceeds a threshold (e.g., 24 hours). Data: { elapsedTimeMs: number, url: string }.
  - rapidSwitching: Multiple tab activations occur within a short window (e.g., 3 in 5s). Data: { timeSinceLastSwitchMs: number }.
  - categoryVisit: Triggered on tab activation/update. Data: { category: string, url: string }.

#### Themed Error Handling
- For defined internal errorType strings (e.g., storage_fail), the system retrieves and displays a theme-appropriate error message.

### Easter Egg System

#### Triggers
- Implement logic (primarily in background.js) to detect predefined niche/nostalgic conditions (e.g., specific tab counts like 42, visits to specific URLs like archive.org or game wikis, activation at specific times like midnight, specific keyboard sequences in options inputs).

#### Delivery
- On trigger detection, identify the easterEggType string. Request the corresponding quip via ITheme.getEasterEggQuip(easterEggType, triggerData). Display the returned message in the popup UI.

### User Interface

#### Popup (popup.html/.js)
- Displays the current contextual message (quip/Easter Egg/error) provided by the ThemeEngine.
- Includes a UI element (e.g., button) to initiate the MVP "Create New Group" action.
- Applies base CSS and theme-specific style overrides.
- Handles potentially long URLs gracefully in the display area.

#### Options (options.html/.js)
- Provides controls for Theme Selection and Intensity Level Selection (with dynamic labels based on the selected theme).
- Contains the form for submitting Website Category Corrections.
- Loads and saves userPrefs (theme/intensity) to/from chrome.storage.local upon user interaction.
- Applies base CSS and theme-specific style overrides.

## Architecture & Technical Design

### Overall Architecture
- Chrome Extension using Manifest V3 specifications.
- Core logic resides within a non-persistent Service Worker (background.js).
- Standard Chrome runtime messaging (chrome.runtime.sendMessage, onMessage) facilitates communication between the service worker, popup, and options page.
- Follows a modular design pattern for separation of concerns.

### Modules & File Structure (Enumerated)
- /manifest.json: Core extension configuration; defines permissions (tabs, storage, notifications, tabGroups), scripts (service worker), and UI pages (popup, options). Test: Validated by Chrome during extension loading.
- /background.js: Service Worker script; listens for browser events (tabs, storage), manages core state (tab counts, timers), detects triggers, coordinates module calls. Test (tests/test_background.js): Integration tests verifying event handling, trigger detection, state management, and module coordination using mocked APIs/modules.
- /popup/
  - /popup/popup.html: Defines HTML structure for the popup window. Test: Manual inspection; potentially E2E tests.
  - /popup/popup.js: Handles popup logic: requests/displays current commentary from background, manages popup UI events. Test (tests/popup/test_popup.js): Unit/Integration tests verifying message handling, DOM updates using mocked runtime/DOM.
  - /popup/popup.css: Base CSS styles for the popup. Test: Manual inspection.
- /options/
  - /options/options.html: Defines HTML structure for the options page. Test: Manual inspection.
  - /options/options.js: Handles options page logic: loads/saves user preferences, handles category correction form. Test (tests/options/test_options.js): Unit/Integration tests verifying storage interaction, form handling, UI updates using mocked storage/DOM.
  - /options/options.css: Base CSS styles for the options page. Test: Manual inspection.
- /modules/
  - /modules/timeTracker.js: Contains and exports time tracking logic (startTracking, stopTracking, getElapsedTime). Test (tests/modules/test_timeTracker.js): Unit tests verifying time calculations and storage interactions using mocked storage/Date.
  - /modules/websiteCategorizer.js: Contains and exports categorizeWebsite(url) logic. Handles loading/parsing of category data. Test (tests/modules/test_websiteCategorizer.js): Unit tests verifying categorization results for various URLs using mocked data.
  - /modules/tabGrouper.js: Contains and exports wrapper functions for MVP tab grouping actions (e.g., createNewGroup). Test (tests/modules/test_tabGrouper.js): Unit tests verifying correct Chrome Tab Group API calls using mocks.
  - /modules/themeEngine.js: Manages theme loading and application; provides functions to get themed content (quips, errors, EEs) based on current state and settings. Test (tests/modules/test_themeEngine.js): Unit tests verifying theme loading, correct content retrieval based on triggers/intensity using mocked storage/themes.
- /themes/ (Directory containing theme subdirectories). Test: N/A (Organizational).
  - /themes/passive_aggressive/ (Directory for the default theme). Test: N/A (Organizational).
    - /themes/passive_aggressive/theme.js (or similar entry point, e.g., theme manifest): Implements the ITheme interface for this theme; loads associated data/styles. Test (tests/themes/test_passive_aggressive.js): Unit tests verifying correct ITheme implementation and data access.
    - /themes/passive_aggressive/humor.json: Data file containing theme name, intensity level names, quips, Easter Eggs, errors, with intensity tags. Test: JSON schema validation.
    - /themes/passive_aggressive/styles.css: CSS file defining specific styles for this theme. Test: Manual inspection; potential visual regression tests.
- /data/
  - /data/websiteCategories.json: JSON file mapping categories to site identifiers. Test: JSON schema validation.
- /utils/ (Optional Directory)
  - /utils/helpers.js: Contains any shared helper functions (e.g., debouncing utility). Test (tests/utils/test_helpers.js): Unit tests for each utility.
- /tests/ (Directory containing test files mirroring source structure). Test: N/A (Organizational).

### Theme Interface (ITheme)
(Conceptual definition)

```typescript
interface ITheme {
  id: string; // e.g., "passive_aggressive"
  name: string; // e.g., "Passive-Aggressive"
  intensityLevelNames: { level1: string; level2: string; }; // e.g., { level1: "It's fine.", level2: "Sure, go ahead." }

  getQuip(triggerType: string, triggerData: any, intensityLevel: "level1" | "level2"): string | null;
  getEasterEggQuip(easterEggType: string, triggerData: any): string | null;
  getErrorQuip(errorType: string, errorDetails: any): string | null;
  getStyling(): { cssPath?: string; variables?: Record<string, string> }; // Provides path to CSS and/or CSS variables
}
```

### Data Structures

#### chrome.storage.local Schema
```json
{
  "userPrefs": {
    "selectedThemeId": "passive_aggressive",
    "selectedIntensity": "level1"
  },
  "tabData": {
    "123": { "startTime": 1678886400000, "lastActiveTime": 1678886500000, "category": "Social Media" }
  },
  "userCategorySuggestions": [
    { "url": "example.com", "category": "News", "timestamp": 1678890000000 }
  ]
}
```

#### websiteCategories.json Example
```json
{
  "Social Media": ["facebook.com", "twitter.com", "linkedin.com"],
  "News": ["nytimes.com", "bbc.com", "theguardian.com"],
  "Shopping": ["amazon.", "ebay.", "etsy.com"],
  "Work/Productivity": ["docs.google.com", "mail.google.com", "github.com", "stackoverflow.com"],
  "Entertainment": ["youtube.com", "netflix.com", "spotify.com"]
}
```

#### Theme Data File Example (themes/passive_aggressive/humor.json)
```json
{
  "themeId": "passive_aggressive",
  "themeName": "Passive-Aggressive",
  "intensityLevels": { "level1": "It's fine.", "level2": "Sure, go ahead." },
  "quips": {
    "highTabCount": [
      { "level": "level1", "text": "Quite the collection you're curating." },
      { "level": "level2", "text": "Is the goal to eventually use *all* the RAM?" }
    ],
    "oldTab": [
      { "level": "level1", "text": "This one's still here. Waiting." },
      { "level": "level2", "text": "Did you perhaps mean to close this last Tuesday?" }
    ]
    // ... other triggers like rapidSwitching, categoryVisit:Social Media etc.
  },
  "easterEggs": {
    "answerToEverything": [ { "text": "42 tabs. Deeply meaningful, I'm sure." } ],
    "archiveVisit": [ { "text": "Visiting the past? How... retrospective." } ]
    // ... other easter eggs
  },
  "errors": {
    "storage_fail": [ { "text": "Remembering your preferences seems to be... challenging right now." } ],
    "api_unavailable": [ { "text": "That function appears to be taking an unscheduled break." } ]
    // ... other error types
  }
}
```

## Error Handling
- Wrap Chrome API calls and potentially sensitive operations (like JSON parsing) in try...catch blocks or check chrome.runtime.lastError where appropriate.
- Log detailed technical error information (error object, context) to the developer console using console.error.
- For errors requiring user notification, determine a relevant errorType string. Request a themed message using ITheme.getErrorQuip(errorType, errorDetails).
- Display the returned themed message clearly in the relevant UI section (popup status area, options page feedback area).

## Testing Strategy
- Employ TDD principles: Write tests before or alongside implementation code.
- Organize tests within a /tests directory mirroring the source structure.
- Utilize a suitable JavaScript testing framework (e.g., Jest) and mocking libraries to isolate units and mock Chrome APIs and browser environment specifics.
- Develop comprehensive unit tests for individual modules (timeTracker, websiteCategorizer, themeEngine, theme implementations, utils) covering logic, edge cases, and error handling.
- Implement integration tests for background.js to verify event handling and inter-module communication using simulated events and mocked dependencies.
- Ensure tests cover all specified functional requirements and edge cases identified in detailed test case descriptions generated earlier.

## Deferred Features (Post-MVP)
- Advanced Tab Grouping features (e.g., automatic grouping by domain/category, saving/restoring group sessions).
- 'Feeling Lucky?' random tab closing feature.
- Advanced Website Categorization (using stored user corrections, potentially integrating external APIs, user-defined rules).
- Development and packaging of additional themes (e.g., "Field Biologist", "Inner Monologue Critic").
- More sophisticated theme styling options beyond basic CSS overrides/variables.
- Internationalization (i18n) and Localization (L10n) support.
- Performance optimizations based on profiling results after initial launch.
