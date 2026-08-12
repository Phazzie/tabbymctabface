# The Skeptical Wombat's Easter-Egg Field Guide

TabbyMcTabface contains 204 context-aware easter eggs. They are not achievements, and there is intentionally no checklist in the popup. A specific quip should feel like the browser noticed something improbable at exactly the right moment.

## The one public hint

Try exactly 42 tabs. Douglas Adams already did the difficult research.

## What can matter

An egg may consider one or more of these local signals:

- the number of tabs or groups in the current window;
- the local hour or calendar date;
- the active tab's domain, title, or URL; and
- a short-lived browser or extension event, such as opening or closing a tab.

All listed conditions use AND semantics. A domain-and-title egg requires both. More specific matches outrank broad milestones; authored rarity is used only among otherwise equivalent matches. Unknown conditions do not match.

## The collection

The first 104 entries range across tab milestones, browser habits, domains, time, and pop/technical references. The 100-entry expansion deliberately widens the spectrum:

| Expansion category | New eggs |
| --- | ---: |
| EverQuest | 20 |
| Mainstream pop culture | 10 |
| Protocols and computing folklore | 10 |
| Mathematics and science | 10 |
| Unlikely history and material culture | 10 |
| Music and acoustic oddities | 10 |
| Deep games and rule systems | 10 |
| Lost internet and digital archaeology | 10 |
| Mundane anthropology and regional rituals | 10 |
| **Expansion total** | **100** |

The source remains public, so anyone can spoil the rules for themselves. The intended experience is to browse normally, notice unusually specific commentary, and enjoy the occasional deep cut.

## For contributors

New entries belong in the canonical `src/data/quips/easter-eggs.json` file. Every change must pass the data-validation suite, which checks:

- the exact schema and supported condition keys;
- unique IDs and types;
- valid humor levels and difficulty values;
- non-empty, bounded quip text;
- valid numeric and hour ranges; and
- compilable regular expressions.

Add a selection test for a new condition or collision class. A content entry that exists but can never be selected is not complete.

See [ADDING_QUIPS.md](./ADDING_QUIPS.md) for the contributor workflow.
