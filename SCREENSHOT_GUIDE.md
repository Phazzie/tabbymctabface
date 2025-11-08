# 📸 Screenshot Guide for Chrome Web Store

**Chrome Web Store requires high-quality screenshots for your extension listing.**

---

## 🎯 Required Sizes

Chrome Web Store recommends these sizes:

1. **Small tile**: 440x280 pixels
2. **Large tile**: 1280x800 pixels
3. **Marquee promo** (optional): 1400x560 pixels

**You need at least 1 screenshot, maximum 5 screenshots.**

---

## 🚀 Method 1: Automated Screenshots (Recommended)

### Prerequisites
```bash
npm install  # Install dependencies including Playwright
```

### Run the script
```bash
npm run screenshot
```

Or directly:
```bash
node scripts/take-screenshots.mjs
```

This will automatically generate **all required screenshots**:
- `screenshots/popup-main.png` - Full popup screenshot (400x611)
- `screenshots/popup-wide-1280x800.png` - Chrome Web Store large tile ✓
- `screenshots/popup-small-440x280.png` - Chrome Web Store small tile ✓

**The script uses aggressive Chrome flags to work in restricted environments.**

If you need to customize the content shown in screenshots, edit `popup-screenshot.html`.

---

## 🖱️ Method 2: Manual Screenshots

### Step 1: Load Extension in Chrome

1. Build the extension:
   ```bash
   npm run build
   ```

2. Open Chrome and go to `chrome://extensions`

3. Enable "Developer mode" (toggle in top-right)

4. Click "Load unpacked"

5. Select the `dist` folder

### Step 2: Take Screenshots

1. **Click the extension icon** in your toolbar (or click the puzzle piece icon and pin TabbyMcTabface)

2. **Open the popup** - you should see the TabbyMcTabface interface

3. **Take a screenshot** of the popup:
   - Mac: `Cmd+Shift+4` then spacebar, click the popup window
   - Windows: Use Snipping Tool or `Win+Shift+S`
   - Linux: Use Screenshot tool or `gnome-screenshot -a`

4. **Resize to required dimensions**:
   - Use an image editor (Preview, GIMP, Photoshop, etc.)
   - Export as PNG
   - Target sizes: 1280x800 (primary) and 440x280 (tile)

---

## 📐 Method 3: Browser DevTools

### For Precise Dimensions

1. Load extension in Chrome (see Method 2, Step 1)

2. **Right-click the popup** → "Inspect"

3. **Open Device Toolbar**: Click the phone/tablet icon (or `Cmd+Shift+M` / `Ctrl+Shift+M`)

4. **Set custom dimensions**:
   - Width: 1280px
   - Height: 800px

5. **Take screenshot**:
   - Open Command Menu: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "screenshot"
   - Select "Capture screenshot"
   - Saves automatically to Downloads

6. **Repeat for other sizes** (440x280, etc.)

---

## 🎨 Screenshot Tips

### Show the Extension in Action

**Good screenshots show**:
- ✅ A quip being displayed ("One down, forty-seven to go...")
- ✅ Stats populated (42 tabs, 8 groups, 127 quips)
- ✅ Buttons clearly visible
- ✅ Clean, uncluttered background

**Bad screenshots show**:
- ❌ Blank/default state
- ❌ Developer console open
- ❌ Error messages
- ❌ Blurry or pixelated images

### Use the Screenshot-Friendly HTML

Open `popup-screenshot.html` in your browser for a pre-populated view:

1. Open Chrome
2. Press `Cmd+O` (Mac) or `Ctrl+O` (Windows/Linux)
3. Navigate to `popup-screenshot.html`
4. Take screenshot using Method 3 (DevTools)

This shows:
- A sample quip: "One down, forty-seven to go..."
- Realistic stats: 42 tabs, 8 groups, 127 quips
- All UI elements visible

---

## 📦 Chrome Web Store Upload Guide

1. **Go to**: [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

2. **Click**: "New Item"

3. **Upload**: Your extension `.zip` file (run `npm run package` first)

4. **Store Listing Tab**:
   - **Screenshots**: Upload 1-5 PNG images
     - Recommended: 1280x800 (primary)
     - Optional: 440x280 (tile), 1400x560 (marquee)
   - **Promotional tiles**: Upload 440x280 small tile
   - **Description**: Use text from README.md
   - **Category**: Productivity

5. **Review and Publish**

---

## 🎬 Optional: Create an Animated GIF

Show the extension in action with an animated demo:

### Tools
- Mac: [Kap](https://getkap.co/) (free, open-source)
- Windows: [ScreenToGif](https://www.screentogif.com/) (free)
- Linux: [Peek](https://github.com/phw/peek) (free)
- Cross-platform: [LICEcap](https://www.cockos.com/licecap/) (free)

### What to Record
1. Click "I'm Feeling Lucky"
2. Tab closes
3. Quip appears: "Tab closed. Your RAM breathes a tiny sigh of relief."
4. Stats update

**Max duration**: 10-15 seconds
**Size**: <5MB (Chrome Web Store limit for GIFs)

---

## 📝 Screenshot Checklist

Before uploading to Chrome Web Store:

- [ ] At least 1 screenshot (1280x800 PNG)
- [ ] Screenshot shows extension popup with content
- [ ] Image is clear and high-quality (not blurry)
- [ ] No developer tools visible
- [ ] Shows a quip or interesting UI state
- [ ] File size <5MB per image
- [ ] PNG format (not JPG)
- [ ] Correct dimensions (1280x800 or 440x280)

---

## 🚨 Troubleshooting

### "Screenshot script doesn't work"
- **Solution**: Use Method 2 (Manual) or Method 3 (DevTools) instead
- The automated script requires system dependencies that may not be available in all environments

### "Extension popup is blank"
- **Solution**: Open `popup-screenshot.html` directly in browser (doesn't require extension to be loaded)
- Use this for screenshots to avoid blank state

### "Image is too small/large"
- **Solution**: Use an image editor to resize:
  - Mac: Preview → Tools → Adjust Size
  - Windows: Paint → Resize
  - Cross-platform: [GIMP](https://www.gimp.org/) (free)

---

## 📞 Need Help?

- **Chrome Web Store Image Guidelines**: https://developer.chrome.com/docs/webstore/images/
- **Extension Developer FAQ**: https://developer.chrome.com/docs/webstore/faq/

---

**Once you have screenshots, you're ready to publish to the Chrome Web Store! 🎉**
