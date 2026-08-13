# TabbyMcTabface User Guide

TabbyMcTabface helps organize the tabs in your current Chrome window and adds locally selected commentary from the Skeptical Wombat.

## Open the popup

Pin TabbyMcTabface from Chrome's extension menu, then select its toolbar icon. The popup shows the current window's tab count, group count, and number of quips delivered.

The suggested popup shortcut is **Ctrl+Shift+Y** on Windows/Linux or **Command+Shift+Y** on macOS. Chrome may decline or change a suggested shortcut when another command owns it. Review assignments at `chrome://extensions/shortcuts`.

Feeling Lucky is intentionally available only in the popup, where it always requires a second confirming click.

## Create a tab group

1. Open the popup and choose **Create tab group**.
2. Select one or more tabs. Each checkbox has the tab's title as its accessible label.
3. Enter a group name between 1 and 50 characters.
4. Choose **Create group**.

Only tabs from the current window are shown. Chrome creates and names the group, the statistics refresh immediately, and TabbyMcTabface may display a local notification.

If naming the group fails after Chrome has created it, the extension attempts to roll the selected tabs back out of the incomplete group and reports the failure.

## Use I'm Feeling Lucky

The Lucky action chooses from tabs in the current window only. Active and pinned tabs are excluded.

1. Choose **I'm Feeling Lucky**.
2. Review the confirmation state.
3. Confirm before its short timeout expires, or cancel by moving to another action.

After confirmation, one eligible tab closes, the result names the closed tab, and the local counters refresh. If no eligible tab exists, nothing closes.

Chrome can normally restore the most recently closed tab with **Ctrl+Shift+T** or **Command+Shift+T**. TabbyMcTabface deliberately does not claim that browser shortcut.

## Quips and easter eggs

The extension contains 75 general quips and 204 contextual easter eggs. Rules can consider the current window's tab and group counts, local time, and the active tab's domain, title, or URL. Some event-based rules also use a short in-memory list of recent extension/browser events.

This context is evaluated on your device and is not uploaded or saved as browsing history. An egg is selected by how specifically its conditions match; rarity only influences selection among equally specific matches. Unsupported or incomplete conditions fail closed.

The collection intentionally ranges from mainstream references to obscure technical and cultural history. Twenty of the 100 newest entries are EverQuest references.

One hint: try exactly 42 tabs.

## Statistics

The popup reports:

- open tabs in the current window;
- tab groups in the current window; and
- quips delivered across extension sessions.

Small action and quip counters are stored in `chrome.storage.local`. URLs, titles, browsing history, and page contents are not stored.

## Notifications

Chrome or the operating system may suppress extension notifications. If actions work but quips are invisible, check Chrome and system notification settings. TabbyMcTabface does not bypass Do Not Disturb or operating-system focus modes.

## Keyboard and screen-reader use

- Use **Tab** and **Shift+Tab** to move through controls.
- Use **Space** to toggle a selected tab checkbox.
- Status changes are announced through a live region.
- Motion is reduced when the operating system's reduced-motion preference is enabled.

## Privacy

TabbyMcTabface has no account, analytics, advertising, telemetry, external service, host permissions, or content scripts. It cannot read page contents. See [PRIVACY.md](../PRIVACY.md) for the exact permission and data-use disclosures.

## Troubleshooting

### The popup reports an initialization error

Reload the extension at `chrome://extensions`, then reopen the popup. The Manifest V3 worker initializes on every cold start; a persistent error is useful to report.

### A shortcut does not work

Open `chrome://extensions/shortcuts` and check for a conflict or an unassigned command.

### Grouping fails

Confirm that every selected tab still exists in the current window and that the group name is non-empty and at most 50 characters. Chrome internal pages may impose browser restrictions.

### Lucky closes nothing

You need at least one non-active, non-pinned tab in the current window.

### Report a bug

Follow [SUPPORT.md](../SUPPORT.md). Remove private URLs and tab titles from screenshots or console output before posting them publicly.
