# Chrome Web Store Listing

## Listing fields

**Name:** TabbyMcTabface

**Summary (115 characters):**

> Tame tab chaos with groups, safer random cleanup, skeptical quips, and 204 context-aware easter eggs—all on-device.

**Category:** Functionality & UI

**Language:** English

## Description

Your tabs have questions. TabbyMcTabface has judgments.

TabbyMcTabface is a privacy-first Chrome tab manager with a skeptical sense of humor. Select tabs and put them into a named group, or use I'm Feeling Lucky when you want the extension to choose an eligible tab for cleanup. The popup asks for confirmation before it closes anything, and active and pinned tabs stay protected by default.

What you get:

- fast, named tab grouping in the current window;
- a safer, confirmed random-tab cleanup action;
- live current-window tab and group counts;
- persisted local quip and action statistics;
- 75 passive-aggressive base quips; and
- 204 context-aware easter eggs, from familiar pop culture to EverQuest, protocol folklore, mathematical oddities, acoustic history, lost-web archaeology, regional rituals, and deeply niche games.

The Skeptical Wombat does all of this locally. There are no accounts, ads, analytics, trackers, host permissions, or content scripts. Tab metadata is used only while the extension performs an action or selects a relevant quip; it is never uploaded.

One hint for egg hunters: 42 is still a very good answer.

## Permission justifications

**Single purpose:** Organize and safely reduce the user's open Chrome tabs while providing local contextual feedback.

**`tabs`:** Required to list tabs in the current window, display the selection UI, protect active and pinned tabs, group selected tabs, close the user-confirmed eligible tab, and evaluate local tab context for humor.

**`tabGroups`:** Required to create and name Chrome tab groups and report the current-window group count.

**`notifications`:** Required to show the quip or completion message after an explicit action.

**`storage`:** Required to persist non-identifying local counters and preferences. Browsing history, tab URLs, and tab titles are not stored.

**Remote code:** None. All executable code ships in the extension package.

## Assets

| Slot | File | Dimensions |
| --- | --- | --- |
| Store icon | `icons/icon128.png` | 128×128 PNG |
| Small promo tile | `store-assets/promo-small-440x280.png` | 440×280 PNG |
| Marquee | `store-assets/marquee-1400x560.png` | 1400×560 PNG |
| Screenshot | `store-assets/screenshot-popup-1280x800.png` | 1280×800 PNG |

The privacy-policy URL should point to the published copy of [PRIVACY.md](./PRIVACY.md). The support URL should point to [SUPPORT.md](./SUPPORT.md) or the repository issue tracker.
