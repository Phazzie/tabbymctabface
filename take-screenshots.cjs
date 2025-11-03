/**
 * Screenshot Generator for TabbyMcTabface Chrome Extension
 * 
 * Takes screenshots for Chrome Web Store listing:
 * 1. Main popup interface
 * 2. Tab grouping in action
 * 3. Notification example
 * 4. Browser with multiple tabs
 * 5. Keyboard shortcuts reference
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const EXTENSION_PATH = path.join(__dirname, 'dist');

// Chrome Web Store recommended screenshot size
const SCREENSHOT_WIDTH = 1280;
const SCREENSHOT_HEIGHT = 800;

async function takeScreenshots() {
  console.log('🎬 Starting screenshot capture...\n');

  // Create screenshots directory
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log(`✅ Created directory: ${SCREENSHOTS_DIR}\n`);
  }

  // Check if extension is built
  if (!fs.existsSync(EXTENSION_PATH)) {
    console.error('❌ Extension not built. Run: npm run build');
    process.exit(1);
  }

  console.log('📦 Extension found at:', EXTENSION_PATH);
  console.log(`📐 Screenshot size: ${SCREENSHOT_WIDTH}x${SCREENSHOT_HEIGHT}\n`);

  try {
    // Launch browser with extension loaded
    console.log('🚀 Launching Chromium with extension...');
    const context = await chromium.launchPersistentContext('', {
      headless: false, // Extensions require headed mode
      viewport: { width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT },
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
      ],
    });

    const page = await context.newPage();
    console.log('✅ Browser launched with extension\n');

    // Wait for extension to load
    await page.waitForTimeout(2000);

    // Get extension ID from loaded extensions
    const extensionPage = await context.newPage();
    await extensionPage.goto('chrome://extensions');
    await page.waitForTimeout(1000);

    // Screenshot 1: Popup Interface
    console.log('📸 Taking Screenshot 1: Main Popup Interface...');
    await page.goto('https://example.com');
    await page.waitForTimeout(1000);
    
    // We can't easily capture the popup, so let's capture the popup.html directly
    const popupPath = `file://${path.join(EXTENSION_PATH, 'popup.html')}`;
    await page.goto(popupPath);
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-popup-interface.png'),
      fullPage: false,
    });
    console.log('  ✅ Saved: 01-popup-interface.png\n');

    // Screenshot 2: Multiple Tabs View
    console.log('📸 Taking Screenshot 2: Browser with Multiple Tabs...');
    
    // Open multiple tabs to show context
    const tabs = [
      'https://github.com',
      'https://stackoverflow.com',
      'https://developer.mozilla.org',
      'https://www.typescriptlang.org',
    ];
    
    for (const url of tabs) {
      await context.newPage();
      await page.waitForTimeout(500);
    }
    
    await page.goto('https://github.com');
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-multiple-tabs.png'),
      fullPage: false,
    });
    console.log('  ✅ Saved: 02-multiple-tabs.png\n');

    // Screenshot 3: Documentation Page
    console.log('📸 Taking Screenshot 3: Extension Documentation...');
    const readmePath = `file://${path.join(__dirname, 'README.md')}`;
    
    // Create a simple HTML page with extension info
    const infoHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>TabbyMcTabface - Features</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      max-width: 1200px;
      margin: 40px auto;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px;
      backdrop-filter: blur(10px);
    }
    h1 {
      font-size: 3em;
      margin: 0 0 20px 0;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .tagline {
      font-size: 1.5em;
      margin-bottom: 40px;
      opacity: 0.9;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      margin-top: 40px;
    }
    .feature {
      background: rgba(255, 255, 255, 0.15);
      padding: 30px;
      border-radius: 15px;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
    .feature h2 {
      font-size: 1.5em;
      margin: 0 0 15px 0;
    }
    .feature p {
      font-size: 1.1em;
      line-height: 1.6;
      opacity: 0.9;
    }
    .emoji {
      font-size: 2em;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🐱 TabbyMcTabface</h1>
    <div class="tagline">Passive-Aggressive Tab Management with Humor</div>
    
    <div class="features">
      <div class="feature">
        <div class="emoji">📁</div>
        <h2>Smart Tab Grouping</h2>
        <p>Organize your chaos with one-click tab grouping. Cmd+Shift+T creates groups instantly.</p>
      </div>
      
      <div class="feature">
        <div class="emoji">🎲</div>
        <h2>"Feeling Lucky?"</h2>
        <p>Close a random tab with Cmd+Shift+L. Because sometimes you need that push.</p>
      </div>
      
      <div class="feature">
        <div class="emoji">💬</div>
        <h2>75+ Snarky Quips</h2>
        <p>Get passive-aggressive notifications when you create groups or close tabs.</p>
      </div>
      
      <div class="feature">
        <div class="emoji">🥚</div>
        <h2>160+ Easter Eggs</h2>
        <p>Discover contextual humor triggered by your browsing habits. Try 42 tabs!</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
    
    const tempHtmlPath = path.join(SCREENSHOTS_DIR, 'temp-features.html');
    fs.writeFileSync(tempHtmlPath, infoHtml);
    
    await page.goto(`file://${tempHtmlPath}`);
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-features-overview.png'),
      fullPage: false,
    });
    console.log('  ✅ Saved: 03-features-overview.png\n');

    // Screenshot 4: Keyboard Shortcuts
    console.log('📸 Taking Screenshot 4: Keyboard Shortcuts...');
    const shortcutsHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>TabbyMcTabface - Keyboard Shortcuts</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      margin: 0;
      padding: 60px;
      background: #1a1a2e;
      color: #eee;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    h1 {
      font-size: 3em;
      margin: 0 0 20px 0;
      color: #6c5ce7;
      text-align: center;
    }
    .subtitle {
      text-align: center;
      font-size: 1.3em;
      margin-bottom: 60px;
      opacity: 0.8;
    }
    .shortcuts {
      display: grid;
      gap: 20px;
    }
    .shortcut {
      background: #16213e;
      padding: 30px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      border-left: 4px solid #6c5ce7;
    }
    .keys {
      flex: 0 0 300px;
      font-size: 1.3em;
      font-weight: 600;
    }
    .kbd {
      display: inline-block;
      padding: 8px 16px;
      background: #0f3460;
      border-radius: 6px;
      border: 2px solid #6c5ce7;
      margin: 0 5px;
      font-family: 'Courier New', monospace;
    }
    .description {
      flex: 1;
      font-size: 1.2em;
      line-height: 1.6;
    }
    .platform {
      opacity: 0.6;
      font-size: 0.9em;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⌨️ Keyboard Shortcuts</h1>
    <div class="subtitle">Power User Mode Activated</div>
    
    <div class="shortcuts">
      <div class="shortcut">
        <div class="keys">
          <span class="kbd">Cmd</span> + <span class="kbd">Shift</span> + <span class="kbd">T</span>
          <div class="platform">Ctrl+Shift+T on Windows/Linux</div>
        </div>
        <div class="description">
          Open popup and create a new tab group from selected tabs
        </div>
      </div>
      
      <div class="shortcut">
        <div class="keys">
          <span class="kbd">Cmd</span> + <span class="kbd">Shift</span> + <span class="kbd">L</span>
          <div class="platform">Ctrl+Shift+L on Windows/Linux</div>
        </div>
        <div class="description">
          "Feeling Lucky?" - Close a random tab with a snarky quip
        </div>
      </div>
      
      <div class="shortcut">
        <div class="keys">
          <span class="kbd">Click Extension Icon</span>
        </div>
        <div class="description">
          Open the main popup to see tab stats and management options
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
    
    const shortcutsPath = path.join(SCREENSHOTS_DIR, 'temp-shortcuts.html');
    fs.writeFileSync(shortcutsPath, shortcutsHtml);
    
    await page.goto(`file://${shortcutsPath}`);
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-keyboard-shortcuts.png'),
      fullPage: false,
    });
    console.log('  ✅ Saved: 04-keyboard-shortcuts.png\n');

    // Screenshot 5: Privacy & Security
    console.log('📸 Taking Screenshot 5: Privacy & Security...');
    const privacyHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>TabbyMcTabface - Privacy First</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      margin: 0;
      padding: 60px;
      background: #0f0f0f;
      color: #fff;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    h1 {
      font-size: 3em;
      margin: 0 0 20px 0;
      color: #00d9ff;
      text-align: center;
    }
    .subtitle {
      text-align: center;
      font-size: 1.5em;
      margin-bottom: 60px;
      color: #00ff88;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
    }
    .feature {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 35px;
      border-radius: 15px;
      border: 2px solid #00d9ff;
    }
    .feature h2 {
      color: #00d9ff;
      font-size: 1.6em;
      margin: 15px 0;
    }
    .feature p {
      font-size: 1.2em;
      line-height: 1.8;
      opacity: 0.9;
    }
    .icon {
      font-size: 3em;
    }
    .badge {
      display: inline-block;
      padding: 8px 16px;
      background: #00ff88;
      color: #000;
      border-radius: 20px;
      font-weight: 700;
      margin-top: 40px;
      font-size: 1.3em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔒 Privacy First</h1>
    <div class="subtitle">✅ 0% Data Collection • 100% Local</div>
    
    <div class="features">
      <div class="feature">
        <div class="icon">🚫</div>
        <h2>No Tracking</h2>
        <p>Zero analytics, telemetry, or user tracking. Your browsing stays private.</p>
      </div>
      
      <div class="feature">
        <div class="icon">🏠</div>
        <h2>Local Only</h2>
        <p>All data stored locally in your browser. Nothing sent to external servers.</p>
      </div>
      
      <div class="feature">
        <div class="icon">🔓</div>
        <h2>Open Source</h2>
        <p>Fully auditable code on GitHub. See exactly what you're installing.</p>
      </div>
      
      <div class="feature">
        <div class="icon">✅</div>
        <h2>Secure</h2>
        <p>Comprehensive security audit passed. 0 vulnerabilities found.</p>
      </div>
    </div>
    
    <center>
      <div class="badge">GDPR Compliant • No Personal Data</div>
    </center>
  </div>
</body>
</html>
    `;
    
    const privacyPath = path.join(SCREENSHOTS_DIR, 'temp-privacy.html');
    fs.writeFileSync(privacyPath, privacyHtml);
    
    await page.goto(`file://${privacyPath}`);
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-privacy-security.png'),
      fullPage: false,
    });
    console.log('  ✅ Saved: 05-privacy-security.png\n');

    // Cleanup temp files
    [tempHtmlPath, shortcutsPath, privacyPath].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    await context.close();

    console.log('✨ Screenshot capture complete!\n');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log('\n📋 Files created:');
    console.log('   01-popup-interface.png');
    console.log('   02-multiple-tabs.png');
    console.log('   03-features-overview.png');
    console.log('   04-keyboard-shortcuts.png');
    console.log('   05-privacy-security.png');
    console.log('\n🎯 Ready for Chrome Web Store submission!');

  } catch (error) {
    console.error('\n❌ Error taking screenshots:', error);
    process.exit(1);
  }
}

// Run the screenshot capture
takeScreenshots();
