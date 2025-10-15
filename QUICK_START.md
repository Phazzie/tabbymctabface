# ⚡ TabbyMcTabface Quick Start (Other Computer)

**When you switch to a computer with Node.js, follow these steps in order.**

---

## 1️⃣ Install Node.js (If Not Already Installed)

### Option A: Direct Download (Recommended)
1. Go to https://nodejs.org/en/download
2. Download macOS Installer (.pkg) - LTS version
3. Run installer
4. Accept defaults

### Option B: Using Homebrew (If It Works)
```bash
brew install node
```

### Verify Installation
```bash
node --version   # Should show v18+ or v20+
npm --version    # Should show v9+ or v10+
```

---

## 2️⃣ Navigate to Project

```bash
cd /Users/hbpheonix/Desktop/tabby
```

---

## 3️⃣ Install Dependencies

```bash
npm install
```

**Expected output**: Creates `node_modules/` directory with ~500+ packages

**If you see errors**: Make sure you're in the `tabby/` directory

---

## 4️⃣ Run Tests

```bash
npm test
```

**Expected**: All tests pass ✅

**If tests fail**: Check error messages - might be missing dependencies

---

## 5️⃣ Build Extension

```bash
npm run build
```

**Expected output**:
```
Building TabbyMcTabface...
✓ TypeScript compilation complete
✓ Assets copied to dist/
✓ Build complete!
```

**Check**: `dist/` directory should now exist

---

## 6️⃣ Verify Build

```bash
ls -la dist/
```

**Should see**:
- `background.js`
- `popup.html`
- `popup.css`  
- `popup.js`
- `icons/` directory with 4 PNG files
- All other compiled TypeScript files

---

## 7️⃣ Load into Chrome

1. Open Chrome
2. Go to `chrome://extensions`
3. Enable "Developer mode" (toggle top-right)
4. Click "Load unpacked"
5. Navigate to `Desktop/tabby/dist`
6. Click "Select"

**Expected**: Extension appears in list, icon in toolbar

---

## 8️⃣ Test Extension

### Basic Test
1. Click extension icon in toolbar
2. Popup should appear (dark theme)
3. Click "I'm Feeling Lucky"
4. A tab should close (if you have multiple tabs)
5. Notification appears with quip

### Easter Egg Test
1. Open exactly 42 tabs
2. Click extension icon
3. Look for Douglas Adams reference quip

### Tab Group Test
1. Select multiple tabs
2. Right-click → "Add to new group"
3. Watch for notification with quip

---

## 9️⃣ Check Console for Errors

1. Right-click extension icon → "Inspect popup"
2. Check Console tab
3. Should see initialization messages, no red errors

---

## 🔟 Package for Chrome Web Store

```bash
npm run package
```

**Expected**: Creates `TabbyMcTabface-v1.0.0.zip`

**Verify ZIP**:
```bash
unzip -l TabbyMcTabface-v1.0.0.zip
```

Should contain entire `dist/` directory

---

## 🚀 Submit to Chrome Web Store

### Prerequisites
- [ ] Chrome Developer account ($5 one-time fee)
- [ ] Icons created (4 sizes)
- [ ] Screenshots ready
- [ ] Promotional images ready
- [ ] Store description written

### Submission Steps
1. Go to https://chrome.google.com/webstore/devconsole
2. Sign in with Google account
3. Pay $5 developer fee (one time, if first extension)
4. Click "New Item"
5. Upload `TabbyMcTabface-v1.0.0.zip`
6. Fill out all fields:
   - Product name: TabbyMcTabface
   - Summary (132 chars)
   - Description (see PRE_DEPLOYMENT_CHECKLIST.md)
   - Category: Productivity
   - Language: English
   - Screenshots (1-5)
   - Promotional images
7. Set pricing: Free
8. Set visibility: Public
9. Submit for review

**Review time**: 1-3 business days

---

## 🐛 Troubleshooting

### "npm install" fails
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules
npm install
```

### "npm run build" fails
```bash
# Check TypeScript installation
npm install --save-dev typescript
npm run build
```

### Extension doesn't load
- Check `dist/` exists
- Check `manifest.json` is in `dist/`
- Check console for specific error
- Verify icons exist in `dist/icons/`

### Quips don't appear
- Check background.js loaded (chrome://extensions → background page)
- Check notification permissions granted
- Check console for errors

### No icon in toolbar
- Icons missing from `dist/icons/`
- manifest.json has wrong icon paths
- Reload extension

---

## 📝 Quick Reference Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for development
npm run dev

# Build for production
npm run build

# Package for Chrome Web Store
npm run package

# Type checking only
npm run compile

# Lint code
npm run lint
```

---

## ✅ Checklist

Before submission:
- [ ] `npm install` completed successfully
- [ ] `npm test` - all tests pass
- [ ] `npm run build` - builds without errors
- [ ] Extension loads in Chrome
- [ ] All features tested manually
- [ ] Icons display correctly
- [ ] No console errors
- [ ] ZIP package created
- [ ] Chrome Web Store account ready
- [ ] All store materials prepared

---

## 🎉 After Submission

### What Happens Next
1. Google reviews your extension (1-3 days)
2. You get email notification
3. If approved: Extension goes live!
4. If rejected: Fix issues and resubmit

### Post-Launch
- Monitor reviews
- Respond to user feedback
- Track installation numbers
- Plan v1.1 features

---

## 📞 Support

If you run into issues:
1. Check build output for specific errors
2. Check Chrome DevTools console
3. Verify all files present in `dist/`
4. Re-run `npm run build`
5. Try `rm -rf dist && npm run build` (clean build)

---

**Good luck! 🚀**
