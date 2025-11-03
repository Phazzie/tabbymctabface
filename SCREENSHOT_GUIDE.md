# TabbyMcTabface - Screenshot Guide

## Chrome Web Store Screenshots

This directory contains promotional materials for the Chrome Web Store listing.

### Requirements
- **Size**: 1280x800 or 640x400 pixels
- **Format**: PNG or JPEG
- **Quantity**: 1-5 screenshots (5 recommended)

### Quick Start

Since Playwright browser installation has issues in this environment, follow these steps to capture screenshots manually:

#### Option 1: Use the Generated HTML Files (Recommended)

1. Open the HTML files in the `screenshots/templates/` directory in your browser
2. Set browser window to 1280x800 (use browser DevTools Device Mode)
3. Take screenshots using:
   - Mac: Cmd+Shift+4, then Space, then click window
   - Windows: Snipping Tool or Win+Shift+S
   - Linux: Screenshot tool or browser extension

#### Option 2: Load Extension and Capture

1. Build the extension:
   ```bash
   npm run build
   ```

2. Load in Chrome:
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

3. Capture screenshots:
   - Open popup (click extension icon)
   - Open multiple tabs
   - Create tab groups
   - Trigger notifications
   - Use DevTools to resize to 1280x800

### Screenshot Descriptions

Use these captions in the Chrome Web Store listing:

#### 1. Features Overview (`01-features.png`)
**Caption**: "Passive-aggressive tab management with humor. Smart grouping, random closure, snarky quips, and 160+ easter eggs."

**What to Show**:
- Feature grid showing 4 main features
- Clean, professional design
- TabbyMcTabface branding

#### 2. Keyboard Shortcuts (`02-shortcuts.png`)
**Caption**: "Power user ready: Cmd+Shift+T for grouping, Cmd+Shift+L for random closure. Full keyboard navigation."

**What to Show**:
- List of keyboard shortcuts
- Visual representation of key combinations
- Clear descriptions

#### 3. Privacy & Security (`03-privacy.png`)
**Caption**: "Privacy-first: 0% data collection, 100% local. No tracking, no external servers, fully open source."

**What to Show**:
- Privacy guarantees
- Security features
- GDPR compliance badge
- Open source transparency

#### 4. Example Quips (`04-quips.png`)
**Caption**: "Get snarky notifications when you create groups or close tabs. 75+ unique quips keep things interesting."

**What to Show**:
- 3-4 example quips from the extension
- Notification-style design
- Humorous, passive-aggressive tone

#### 5. Technical Excellence (`05-tech.png`)
**Caption**: "Built for developers: TypeScript strict mode, 384 comprehensive tests, Seam-Driven Development, 0 vulnerabilities."

**What to Show**:
- Tech stack highlights
- Test coverage stats
- Code quality metrics
- Developer-friendly features

### Automated Generation (When Playwright Works)

If Playwright browser installation works, you can generate screenshots automatically:

```bash
npm run screenshots
```

This will create all 5 screenshots in the `screenshots/` directory.

### Manual Steps (Current Workaround)

1. Open `screenshots/templates/` HTML files
2. Open each file in a browser
3. Set window size to 1280x800
4. Take screenshots
5. Save as PNG files:
   - 01-features.png
   - 02-shortcuts.png
   - 03-privacy.png
   - 04-quips.png
   - 05-tech.png

### Chrome Web Store Upload

1. Go to Chrome Web Store Developer Dashboard
2. Click your extension listing
3. Go to "Store listing" tab
4. Scroll to "Screenshots" section
5. Upload 1-5 screenshots
6. Add captions for each
7. Save draft

### Tips for Great Screenshots

- **Consistency**: Use same dimensions for all screenshots
- **Quality**: Use PNG for sharp text
- **Content**: Show actual features, not just marketing
- **Clarity**: Make text readable at store thumbnail size
- **Professional**: Clean, polished appearance
- **Authentic**: Real extension UI preferred over mockups

---

## Files in This Directory

- `SCREENSHOT_GUIDE.md` - This file
- `templates/` - HTML files for generating screenshots
- `*.png` - Generated screenshots (not committed to git)

---

**Need Help?**

If automatic screenshot generation fails:
1. Use the HTML templates in `templates/`
2. Or load the extension and capture manually
3. Or use design tools (Figma, Photoshop) with the template designs

**Chrome Web Store Screenshot Requirements**: https://developer.chrome.com/docs/webstore/images/
