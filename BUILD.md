# TabbyMcTabface - Build Instructions

## 📦 Building the Extension

Since Node.js is not installed, here are instructions for when you set it up:

### Prerequisites
```bash
# Install Node.js (v18 or later recommended)
# macOS: brew install node
# Or download from https://nodejs.org
```

### Install Dependencies
```bash
npm install
```

### Build for Production
```bash
npm run build
```

This will:
1. Compile TypeScript files to JavaScript
2. Bundle the extension using your build tool
3. Output to `dist/` directory

### Development Build
```bash
npm run dev
```

This will watch for changes and rebuild automatically.

### Run Tests
```bash
npm test
```

Runs all integration tests with Vitest.

---

## 🔧 Loading into Chrome (Development)

### Option 1: Load Unpacked Extension

1. **Build the extension** (or use source files directly if no build needed)
2. **Open Chrome** and navigate to `chrome://extensions`
3. **Enable Developer Mode** (toggle in top-right)
4. **Click "Load unpacked"**
5. **Select the extension directory** (the folder containing `manifest.json`)

### Option 2: Quick Test Without Build

If your source TypeScript can run directly:
1. Update `manifest.json` to point to source files instead of `dist/`
2. Load unpacked as above

---

## 📁 Project Structure

```
tabby/
├── manifest.json              # Chrome extension manifest
├── popup.html                 # Popup UI
├── popup.css                  # Popup styles
├── popup.js                   # Popup logic
├── src/
│   ├── bootstrap.ts           # Dependency injection setup
│   ├── background.ts          # Background service worker
│   ├── contracts/             # TypeScript interfaces
│   ├── impl/                  # Real implementations
│   │   ├── ChromeTabsAPI.ts
│   │   ├── ChromeNotificationsAPI.ts
│   │   ├── ChromeStorageAPI.ts
│   │   ├── QuipStorage.ts
│   │   ├── EasterEggFramework.ts
│   │   ├── HumorSystem.ts
│   │   ├── TabManager.ts
│   │   └── __tests__/         # Integration tests
│   └── utils/
│       └── Result.ts          # Result type utility
└── icons/                     # Extension icons (you'll need to create these)
```

---

## 🎨 Creating Icons

You'll need to create icon files at these sizes:
- `icons/icon16.png` (16x16)
- `icons/icon32.png` (32x32)
- `icons/icon48.png` (48x48)
- `icons/icon128.png` (128x128)

**Icon Theme**: Tabby cat with a sarcastic/sassy expression

**Tools**:
- Design in Figma/Sketch/Photoshop
- Or use AI image generation (DALL-E, Midjourney)
- Export at required sizes

---

## 🚀 Usage

### Keyboard Shortcuts
- **Cmd+Shift+L** (Mac) / **Ctrl+Shift+L** (Windows): I'm Feeling Lucky (close random tab)
- **Cmd+Shift+T** (Mac) / **Ctrl+Shift+T** (Windows): Open TabbyMcTabface popup

### Features
1. **Create Tab Group**: Select tabs and group them with a custom name
2. **I'm Feeling Lucky**: Close a random tab (with passive-aggressive humor)
3. **Easter Eggs**: Discover context-aware humor (42 tabs, late night coding, etc.)
4. **Stats**: View tab count, group count, and quips delivered

---

## 🧪 Testing

### Run Integration Tests
```bash
npm test
```

### Test Coverage
- ✅ Humor delivery flow (15+ tests)
- ✅ Tab management flow (20+ tests)
- ✅ Easter egg detection
- ✅ Chrome API wrappers
- ✅ Error handling

---

## 📝 Development Notes

### SDD Compliance
This project follows **Seam-Driven Development** methodology:
1. Seams identified first
2. Contracts defined (TypeScript interfaces)
3. Tests written before implementation
4. Code generated from contracts
5. Result<T, E> for all error handling

### Key Components
- **TabManager**: Core tab operations
- **HumorSystem**: Orchestrates quip delivery
- **EasterEggFramework**: Context-based easter egg detection
- **QuipStorage**: Persistent quip and easter egg storage

### Performance SLAs
- Tab operations: <50ms
- Humor delivery: <100ms
- Storage operations: <30ms

---

## 🐛 Troubleshooting

### Extension won't load
- Check that all file paths in `manifest.json` are correct
- Ensure `dist/` folder exists if using build output
- Check Chrome DevTools > Extensions page for errors

### Permissions errors
- Ensure all permissions in `manifest.json` are listed
- Required: `tabs`, `tabGroups`, `notifications`, `storage`

### TypeScript errors
- Run `npm install` to ensure dependencies are installed
- Check TypeScript version compatibility

---

## 📦 Distribution

### Package for Chrome Web Store
```bash
npm run build
zip -r TabbyMcTabface.zip dist/ manifest.json popup.html popup.css popup.js icons/
```

### Publish
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Upload `TabbyMcTabface.zip`
3. Fill in store listing details
4. Submit for review

---

## 🎯 Next Steps

1. **Install Node.js** if not already installed
2. **Run `npm install`** to install dependencies
3. **Run `npm test`** to verify everything works
4. **Create icons** for the extension
5. **Build and load** into Chrome for testing
6. **Test all features** (create group, feeling lucky, easter eggs)
7. **Polish and publish** to Chrome Web Store

---

## 📄 License

MIT License - see LICENSE file for details
