# Privacy Policy

Effective: August 12, 2026

TabbyMcTabface has one purpose: help you organize and reduce browser tabs while adding local, context-aware humor.

## Data handling

TabbyMcTabface does not collect, transmit, sell, or share personal data. It has no analytics, advertising, remote API, account system, or telemetry. All processing happens inside the extension on your device.

The extension temporarily reads open-tab metadata—such as title, URL, active state, pinned state, window, and group—to show the current-window tab picker, protect active and pinned tabs, calculate local statistics, and choose context-aware quips. This metadata is not persisted or sent anywhere.

The extension stores small local counters and preferences, such as the number of quips delivered and actions completed, in `chrome.storage.local`. It does not store browsing history or the titles and URLs of your tabs. Removing the extension deletes this local extension storage through Chrome.

## Permission use

| Permission | Why it is required |
| --- | --- |
| `tabs` | List the current window's tabs, group selected tabs, close the confirmed eligible tab, and evaluate on-device context for quips. |
| `tabGroups` | Create, name, inspect, and count Chrome tab groups. |
| `notifications` | Display the quip or result of a completed tab action. |
| `storage` | Keep local, non-identifying usage counters and preferences between browser sessions. |

TabbyMcTabface requests no host permissions, injects no content scripts, and cannot read page contents.

## Security and changes

Only the minimum data required for an action is processed. If this policy changes, the effective date and repository history will show the revision. A future feature that changes data handling will require an updated disclosure before release.

Privacy questions can be opened through [GitHub Issues](https://github.com/Phazzie/tabbymctabface/issues). Security-sensitive reports should follow [SECURITY.md](./SECURITY.md).
