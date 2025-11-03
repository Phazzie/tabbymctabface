# Chrome Web Store Listing Content

## Name
TabbyMcTabface

## Tagline (132 chars max)
Passive-aggressive tab management with humor. Organizes chaos while delivering snarky quips and clever easter eggs.

## Detailed Description

TabbyMcTabface brings personality to tab management. Organize your chaos with tab groups, close random tabs with "I'm Feeling Lucky", and enjoy passive-aggressive quips tailored to your browsing habits.

**Features:**
• Smart tab grouping (Cmd+Shift+T / Ctrl+Shift+T)
• "Feeling Lucky" random tab closure (Cmd+Shift+L / Ctrl+Shift+L)
• 75+ passive-aggressive quips delivered via notifications
• 160+ contextual easter eggs (try opening 42 tabs!)
• Privacy-first: no data collection, everything stored locally
• Keyboard shortcuts for power users
• Built with Seam-Driven Development architecture
• 384 comprehensive tests ensuring reliability

**Perfect for:**
- Developers juggling documentation, Stack Overflow, and GitHub
- Researchers with 50+ tabs across multiple papers
- Anyone who appreciates technical humor with their productivity tools
- Tab hoarders ready to embrace their chaos

**Privacy & Open Source:**
- Zero data collection or tracking
- All data stays local in your browser
- Fully open source on GitHub
- No external servers or analytics

**Easter Eggs:**
Discover hidden quips triggered by:
- Having exactly 42 tabs (Douglas Adams tribute)
- Late-night coding sessions (2-5 AM browsing)
- Reddit procrastination with multiple tabs
- Domain-specific humor for developers

Built by developers, for developers. Because your tabs deserve management with attitude.

## Category
Productivity

## Language
English

## Privacy Policy URL
https://github.com/Phazzie/tabbymctabface/blob/main/PRIVACY_POLICY.md
*(Host as HTML before publishing)*

## Homepage URL
https://github.com/Phazzie/tabbymctabface

## Support URL
https://github.com/Phazzie/tabbymctabface/issues

## Tags (keywords for search)
- tab management
- tab groups
- productivity
- browser tabs
- organization
- humor
- easter eggs
- keyboard shortcuts
- developer tools
- open source

## Promotional Text (short pitch)
Organize tabs with attitude. TabbyMcTabface delivers tab management, passive-aggressive humor, and 160+ easter eggs. Privacy-first, keyboard-driven, built for developers who appreciate sarcasm with their productivity.

## Screenshot Descriptions

### Screenshot 1: Main Popup Interface
**Caption**: "Tab management with personality - create groups, close random tabs, and manage your chaos"

### Screenshot 2: Tab Grouping in Action
**Caption**: "One-click tab grouping with customizable names and colors. Organize your research, documentation, and browsing."

### Screenshot 3: Passive-Aggressive Quip
**Caption**: "Get snarky notifications when you create groups or close tabs. 75+ unique quips keep things interesting."

### Screenshot 4: Easter Egg Example
**Caption**: "Discover 160+ contextual easter eggs triggered by your browsing habits. Exactly 42 tabs? We noticed."

### Screenshot 5: Keyboard Shortcuts
**Caption**: "Power user ready: Cmd+Shift+T for grouping, Cmd+Shift+L for random closure. Full keyboard navigation."

## Permissions Justification

**Required Permissions:**

1. **tabs** - Read tab information (titles, URLs) to display your tabs and manage tab groups. Core functionality.

2. **tabGroups** - Create, update, and manage tab groups. Essential for the extension's primary purpose.

3. **notifications** - Display passive-aggressive quips and easter egg messages when you perform actions.

4. **storage** - Store your preferences and recent quip history locally to avoid repetition.

5. **<all_urls>** - Read tab URLs to trigger contextual easter eggs (e.g., showing developer-specific humor on GitHub). Does NOT modify page content or send data anywhere.

**Privacy Guarantee**: All data stays local. No external servers, no tracking, no data collection. Open source for transparency.

## Developer Notes

- Built with TypeScript in strict mode
- Manifest V3 compliant
- 384 comprehensive tests (99.7% passing)
- Seam-Driven Development architecture
- Zero external dependencies at runtime
- No minification obfuscation - readable code

## Version 1.0.0 Release Notes

Initial release of TabbyMcTabface:
- Tab grouping with keyboard shortcuts
- Random tab closure ("Feeling Lucky")
- 75 passive-aggressive quips
- 160 contextual easter eggs
- Privacy-first local storage
- Full keyboard navigation
- Comprehensive test coverage

---

## Pre-Publishing Checklist

- [ ] Create extension icons (16, 32, 48, 128px)
- [ ] Take 5 screenshots (1280x800px)
- [ ] Convert PRIVACY_POLICY.md to hosted HTML
- [ ] Create promotional images (optional)
- [ ] Test extension in Chrome as unpacked
- [ ] Run `npm run package` to create .zip
- [ ] Register Chrome Web Store developer account ($5)
- [ ] Submit for review

**Estimated time**: 3-5 hours + 1-3 days review
