# 🐱 TabbyMcTabface

> **Passive-aggressive tab management with humor.**  
> A Chrome extension built using Seam-Driven Development (SDD) that organizes your browser chaos while delivering snarky quips and clever easter eggs.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-40%2B-green)](./src/impl/__tests__)

---

## ✨ Features

- 🎲 **I'm Feeling Lucky**: Close random tabs with passive-aggressive commentary
- 📁 **Smart Tab Grouping**: Organize tabs with custom names and colors
- 🥚 **105 Hidden Easter Eggs**: Context-aware surprises that unlock based on your browsing patterns (good luck finding them all!)
- 💬 ### Content

**75 Passive-Aggressive Quips**: Passive-aggressive humor for every action
- ⌨️ **Keyboard Shortcuts**: Quick access to all features
- 📊 **Stats Dashboard**: Track tabs, groups, and quips delivered
- 🎨 **Beautiful UI**: Dark theme with smooth animations
- 🏆 **Discovery System**: No achievement tracker - just mysteries to uncover

---

## 🚀 Quick Start

### For Users

1. **Install from Chrome Web Store** (coming soon)
2. Click the TabbyMcTabface icon in your toolbar
3. Try "I'm Feeling Lucky" or create your first tab group
4. Enjoy the passive-aggressive humor!

[📖 Full User Guide](./docs/USER_GUIDE.md)

### For Developers

```bash
# Clone the repository
git clone https://github.com/yourusername/tabbymctabface.git
cd tabbymctabface

# Install dependencies
npm install

# Run tests
npm test

# Build the extension
npm run build

# Load into Chrome
# 1. Go to chrome://extensions
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select the `dist` folder
```

---

## 🏗️ Architecture

TabbyMcTabface is built using **Seam-Driven Development (SDD)**, a methodology that prioritizes:

1. **Seams First** - Identify all data boundaries before coding
2. **Contracts from Seams** - Every seam gets an explicit TypeScript interface
3. **Tests from Contracts** - Write contract tests BEFORE implementation
4. **Implementation from Tests** - Generate code to pass the contract tests
5. **Mock First** - Build mock implementations, prove flows work, then swap to real

### Component Architecture

```
User Interface (Popup)
      ↓
Background Service Worker
      ↓
Bootstrap (Dependency Injection)
      ↓
┌─────────────────────────────────┐
│        TabManager               │ ← Main Entry Point
│  (Tab operations + Humor)       │
└─────────────────────────────────┘
      ↓                    ↓
Chrome Tabs API      HumorSystem
                           ↓
                   EasterEggFramework
                           ↓
                      QuipStorage
                           ↓
                   Chrome Storage API
```

### Key Components

| Component | Purpose | Lines | Tests |
|-----------|---------|-------|-------|
| **TabManager** | Core tab operations | 686 | ✅ 25 |
| **HumorSystem** | Humor orchestration | 413 | ✅ 15 |
| **EasterEggFramework** | Context-based detection | 465 | ✅ 12 |
| **QuipStorage** | Persistent storage | 365 | ✅ 8 |
| **Chrome APIs** | Browser integration | 730 | ✅ 18 |

---

## 📊 Project Stats

**Total Lines of Code**: ~6,800  
**Real Implementations**: 2,659 lines (7 files)  
**Integration Tests**: 728 lines (40+ test cases)  
**Test Coverage**: All contracts validated  
**Contracts Defined**: 9 TypeScript interfaces  
**Seams Identified**: 32 documented boundaries  

---

## 🎯 SDD Validation

This project serves as a **real-world validation of Seam-Driven Development**:

✅ **Seam Discovery**: All 32 seams identified before coding  
✅ **Contract-First**: 9 comprehensive TypeScript interfaces  
✅ **Mock-First**: Mock implementations enabled rapid prototyping  
✅ **Test-First**: 40+ tests written for contracts  
✅ **Result<T, E>**: No exceptions, all errors explicit  
✅ **Documentation**: Every file has WHAT/WHY/HOW headers  

**Key Learning**: Identifying seams upfront prevented architectural rework and enabled parallel development.

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# UI mode
npm run test:ui
```

### Test Structure

- **Contract Tests**: Validate all interface guarantees
- **Integration Tests**: Test full component flows
- **Mock Implementations**: Simulate Chrome APIs

```typescript
// Example: Contract test
describe('ITabManager.createGroup CONTRACT', () => {
  it('accepts valid group names 1-50 chars', ...);
  it('rejects empty group name with error', ...);
  it('returns GroupCreationSuccess on success', ...);
});
```

---

## 🛠️ Development

### Project Structure

```
tabby/
├── manifest.json              # Chrome extension manifest
├── popup.html/css/js          # UI layer
├── src/
│   ├── bootstrap.ts           # Dependency injection
│   ├── background.ts          # Service worker
│   ├── contracts/             # TypeScript interfaces
│   │   ├── ITabManager.ts
│   │   ├── IHumorSystem.ts
│   │   └── ...
│   ├── impl/                  # Real implementations
│   │   ├── TabManager.ts
│   │   ├── HumorSystem.ts
│   │   ├── quip-data.ts       # 50 quips + 105 easter eggs
│   │   └── __tests__/         # Integration tests
│   └── utils/
│       └── Result.ts          # Result<T, E> type
├── docs/                      # Documentation
└── sdd-agents/                # SDD tooling
```

### Key Scripts

```bash
npm run build          # Build for production
npm run build:watch    # Watch mode
npm run lint           # Type checking
npm run package        # Create .zip for Chrome Web Store
npm run dev            # Development mode
```

### Adding New Features

1. **Identify Seams**: What data boundaries are crossed?
2. **Define Contract**: Create TypeScript interface
3. **Write Tests**: Contract tests BEFORE implementation
4. **Implement**: Generate code to pass tests
5. **Document**: Add WHAT/WHY/HOW headers

Example:
```typescript
// 1. Seam: UI → TabSearch
// 2. Contract
interface ITabSearch {
  search(query: string): Promise<Result<ChromeTab[], SearchError>>;
}

// 3. Tests
describe('ITabSearch CONTRACT', () => {
  it('returns matching tabs', ...);
});

// 4. Implementation
export class TabSearch implements ITabSearch { ... }
```

---

## 🎨 UI Design

### Color Palette

```css
--color-primary: #4a90e2;    /* Blue */
--color-secondary: #7b68ee;  /* Purple */
--color-success: #2ecc71;    /* Green */
--color-danger: #e74c3c;     /* Red */
--color-bg: #1e1e2e;         /* Dark background */
```

### Animations

- **Fade In**: Popup entrance
- **Slide In**: Section reveals
- **Pulse**: Button icons
- **Shimmer**: Button hover effect
- **Smooth Transitions**: All interactions <200ms

---

## 📝 Content

### Quips (50 total)

**Categories**:
- Tab closure comments (15)
- Group creation remarks (12)
- General tab management (23)

**Tone**: Passive-aggressive, technically clever, subtly sarcastic

**Examples**:
- _"One down, forty-seven to go. We're making progress. Sort of."_
- _"Tab closed. Your RAM breathes a tiny sigh of relief."_
- _"Grouped 8 tabs. Now you can ignore them more efficiently."_

### Easter Eggs (105 total)

**The Mystery**: We have 160 hidden easter eggs. We're only telling you about one:

**What We'll Say**:
- 105 hidden easter eggs waiting to be discovered
- Context-aware (time, tabs, domains, patterns)
- Some are easy to find accidentally, others require... creativity
- One hint: Try exactly 42 tabs (Douglas Adams fans will understand)
- The rest? Experiment and enjoy the surprises

**Discovery Philosophy**: No achievement tracker. No spoilers. Just natural browsing and unexpected delight.

**All graded 8/10+** for cleverness and relevance

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Follow SDD methodology**:
   - Identify seams first
   - Define contracts
   - Write tests before implementation
   - Use Result<T, E> for error handling

2. **Code Style**:
   - TypeScript strict mode
   - WHAT/WHY/HOW file headers
   - Method-level documentation
   - No exceptions (use Result types)

3. **Testing**:
   - Write contract tests
   - Maintain test coverage
   - All tests must pass

4. **Pull Requests**:
   - One feature per PR
   - Include tests
   - Update documentation

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 🙏 Acknowledgments

- **Seam-Driven Development**: Methodology that made this possible
- **Chrome Extension APIs**: For browser integration
- **TypeScript**: For type safety and contracts
- **Vitest**: For fast, modern testing

---

## 🗺️ Roadmap

**v1.1** (Q1 2026)
- [ ] Custom quip collections
- [ ] Configurable easter egg frequency
- [ ] Tab search functionality
- [ ] Export/import tab groups

**v1.2** (Q2 2026)
- [ ] Cloud sync for settings
- [ ] Tab history viewer
- [ ] More easter eggs (50+ new)
- [ ] Theme customization

**v2.0** (Q3 2026)
- [ ] AI-powered tab suggestions
- [ ] Smart auto-grouping
- [ ] Cross-browser support (Firefox, Edge)

---

## 📞 Support

- **Bug Reports**: [GitHub Issues](https://github.com/yourusername/tabbymctabface/issues)
- **Feature Requests**: [Discussions](https://github.com/yourusername/tabbymctabface/discussions)
- **Documentation**: [User Guide](./docs/USER_GUIDE.md) | [Build Guide](./BUILD.md)

---

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/tabbymctabface)
![GitHub forks](https://img.shields.io/github/forks/yourusername/tabbymctabface)
![GitHub issues](https://img.shields.io/github/issues/yourusername/tabbymctabface)

---

**Made with ❤️ and passive-aggression**

_"May your tabs be organized and your quips be savage."_

---

## 🔗 Links

- [Chrome Web Store](#) (coming soon)
- [User Guide](./docs/USER_GUIDE.md)
- [Build Instructions](./BUILD.md)
- [SDD Methodology](./agents.md)
- [Contract Documentation](./docs/contract-summary.md)
- [Seam Catalog](./docs/seam-catalog.md)
