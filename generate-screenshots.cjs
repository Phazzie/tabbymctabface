/**
 * Simple Screenshot Generator for TabbyMcTabface
 * Creates promotional screenshots without needing the full extension loaded
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const WIDTH = 1280;
const HEIGHT = 800;

async function generateScreenshots() {
  console.log('🎬 Generating Chrome Web Store screenshots...\n');

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT }
  });

  // Screenshot 1: Features Overview
  console.log('📸 Screenshot 1: Features Overview...');
  const featuresHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TabbyMcTabface Features</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 60px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 24px;
      padding: 60px;
      max-width: 1100px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      font-size: 3.5em;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .tagline {
      font-size: 1.5em;
      color: #666;
      margin-bottom: 50px;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
    }
    .feature {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 16px;
      border: 2px solid #e9ecef;
    }
    .feature h2 {
      font-size: 1.6em;
      margin: 15px 0;
      color: #333;
    }
    .feature p {
      font-size: 1.1em;
      line-height: 1.7;
      color: #666;
    }
    .emoji {
      font-size: 3em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🐱 TabbyMcTabface</h1>
    <p class="tagline">Passive-Aggressive Tab Management with Humor</p>
    
    <div class="features">
      <div class="feature">
        <div class="emoji">📁</div>
        <h2>Smart Tab Grouping</h2>
        <p>Organize your chaos with one-click tab grouping. Keyboard shortcuts make it instant.</p>
      </div>
      
      <div class="feature">
        <div class="emoji">🎲</div>
        <h2>"Feeling Lucky?"</h2>
        <p>Close a random tab with Cmd+Shift+L. Sometimes you need that push to let go.</p>
      </div>
      
      <div class="feature">
        <div class="emoji">💬</div>
        <h2>75+ Snarky Quips</h2>
        <p>Get passive-aggressive notifications that actually make you smile.</p>
      </div>
      
      <div class="feature">
        <div class="emoji">🥚</div>
        <h2>160+ Easter Eggs</h2>
        <p>Discover contextual humor triggered by your browsing habits. Try 42 tabs!</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  await page.setContent(featuresHtml);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-features.png') });
  console.log('  ✅ 01-features.png\n');

  // Screenshot 2: Keyboard Shortcuts
  console.log('📸 Screenshot 2: Keyboard Shortcuts...');
  const shortcutsHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Keyboard Shortcuts</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eee;
      padding: 80px 60px;
      min-height: 100vh;
    }
    h1 {
      font-size: 3.5em;
      margin-bottom: 20px;
      color: #6c5ce7;
      text-align: center;
    }
    .subtitle {
      text-align: center;
      font-size: 1.5em;
      margin-bottom: 70px;
      opacity: 0.8;
    }
    .shortcuts {
      max-width: 1000px;
      margin: 0 auto;
      display: grid;
      gap: 25px;
    }
    .shortcut {
      background: #16213e;
      padding: 35px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      border-left: 5px solid #6c5ce7;
    }
    .keys {
      flex: 0 0 350px;
      font-size: 1.4em;
      font-weight: 600;
    }
    .kbd {
      display: inline-block;
      padding: 10px 18px;
      background: #0f3460;
      border-radius: 8px;
      border: 2px solid #6c5ce7;
      margin: 0 6px;
      font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
    }
    .description {
      flex: 1;
      font-size: 1.3em;
      line-height: 1.6;
    }
    .platform {
      opacity: 0.6;
      font-size: 0.9em;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <h1>⌨️ Keyboard Shortcuts</h1>
  <div class="subtitle">Power User Mode Activated</div>
  
  <div class="shortcuts">
    <div class="shortcut">
      <div class="keys">
        <span class="kbd">Cmd</span> + <span class="kbd">Shift</span> + <span class="kbd">T</span>
        <div class="platform">Ctrl+Shift+T on Windows/Linux</div>
      </div>
      <div class="description">
        Open popup to create tab groups from selected tabs
      </div>
    </div>
    
    <div class="shortcut">
      <div class="keys">
        <span class="kbd">Cmd</span> + <span class="kbd">Shift</span> + <span class="kbd">L</span>
        <div class="platform">Ctrl+Shift+L on Windows/Linux</div>
      </div>
      <div class="description">
        "Feeling Lucky?" - Close a random tab with snarky commentary
      </div>
    </div>
    
    <div class="shortcut">
      <div class="keys">
        <span class="kbd">Click Extension Icon</span>
      </div>
      <div class="description">
        View tab statistics and access all management features
      </div>
    </div>
  </div>
</body>
</html>`;

  await page.setContent(shortcutsHtml);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-shortcuts.png') });
  console.log('  ✅ 02-shortcuts.png\n');

  // Screenshot 3: Privacy & Security
  console.log('📸 Screenshot 3: Privacy & Security...');
  const privacyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Privacy First</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f0f;
      color: #fff;
      padding: 70px 60px;
      min-height: 100vh;
    }
    h1 {
      font-size: 3.8em;
      margin-bottom: 20px;
      color: #00d9ff;
      text-align: center;
    }
    .subtitle {
      text-align: center;
      font-size: 1.8em;
      margin-bottom: 70px;
      color: #00ff88;
    }
    .features {
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 35px;
    }
    .feature {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 40px;
      border-radius: 20px;
      border: 3px solid #00d9ff;
    }
    .feature h2 {
      color: #00d9ff;
      font-size: 1.8em;
      margin: 20px 0 15px 0;
    }
    .feature p {
      font-size: 1.3em;
      line-height: 1.8;
      opacity: 0.9;
    }
    .icon {
      font-size: 3.5em;
    }
    .badge {
      display: inline-block;
      padding: 15px 30px;
      background: #00ff88;
      color: #000;
      border-radius: 30px;
      font-weight: 700;
      margin-top: 60px;
      font-size: 1.4em;
      text-align: center;
      width: 100%;
    }
  </style>
</head>
<body>
  <h1>🔒 Privacy First</h1>
  <div class="subtitle">✅ 0% Data Collection • 100% Local</div>
  
  <div class="features">
    <div class="feature">
      <div class="icon">🚫</div>
      <h2>No Tracking</h2>
      <p>Zero analytics, telemetry, or user tracking. Your browsing stays completely private.</p>
    </div>
    
    <div class="feature">
      <div class="icon">🏠</div>
      <h2>Local Only</h2>
      <p>All data stored locally in your browser. Nothing sent to external servers ever.</p>
    </div>
    
    <div class="feature">
      <div class="icon">🔓</div>
      <h2>Open Source</h2>
      <p>Fully auditable code on GitHub. See exactly what you're installing and running.</p>
    </div>
    
    <div class="feature">
      <div class="icon">✅</div>
      <h2>Secure</h2>
      <p>Comprehensive security audit passed with flying colors. 0 vulnerabilities found.</p>
    </div>
  </div>
  
  <div class="badge">GDPR Compliant • No Personal Data</div>
</body>
</html>`;

  await page.setContent(privacyHtml);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-privacy.png') });
  console.log('  ✅ 03-privacy.png\n');

  // Screenshot 4: Example Quips
  console.log('📸 Screenshot 4: Example Quips...');
  const quipsHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Passive-Aggressive Quips</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 70px 60px;
      min-height: 100vh;
    }
    h1 {
      font-size: 3.5em;
      margin-bottom: 20px;
      color: white;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .subtitle {
      text-align: center;
      font-size: 1.6em;
      margin-bottom: 60px;
      color: rgba(255,255,255,0.9);
    }
    .quips {
      max-width: 1000px;
      margin: 0 auto;
      display: grid;
      gap: 25px;
    }
    .quip {
      background: rgba(255,255,255,0.95);
      padding: 35px;
      border-radius: 16px;
      font-size: 1.4em;
      line-height: 1.6;
      color: #333;
      border-left: 6px solid #f5576c;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .quip::before {
      content: '"';
      font-size: 2em;
      color: #f5576c;
      font-weight: bold;
      margin-right: 10px;
    }
    .quip::after {
      content: '"';
      font-size: 2em;
      color: #f5576c;
      font-weight: bold;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <h1>💬 Passive-Aggressive Quips</h1>
  <div class="subtitle">Because tab management should have personality</div>
  
  <div class="quips">
    <div class="quip">
      Oh look, another group. I'm sure you'll find it in a week.
    </div>
    
    <div class="quip">
      Feeling lucky? More like feeling overwhelmed by 47 tabs.
    </div>
    
    <div class="quip">
      42 tabs! Ah, I see you've discovered the meaning of life... and chaos.
    </div>
    
    <div class="quip">
      Creating a group called 'Work'? Let me know how that works out.
    </div>
  </div>
</body>
</html>`;

  await page.setContent(quipsHtml);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-quips.png') });
  console.log('  ✅ 04-quips.png\n');

  // Screenshot 5: Tech Stack
  console.log('📸 Screenshot 5: Built for Developers...');
  const techHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Built for Developers</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #282c34;
      color: #abb2bf;
      padding: 70px 60px;
      min-height: 100vh;
    }
    h1 {
      font-size: 3.5em;
      margin-bottom: 20px;
      color: #61dafb;
      text-align: center;
    }
    .subtitle {
      text-align: center;
      font-size: 1.5em;
      margin-bottom: 60px;
      color: #98c379;
    }
    .grid {
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
    }
    .item {
      background: #21252b;
      padding: 35px;
      border-radius: 16px;
      border: 2px solid #3e4451;
      text-align: center;
    }
    .item h2 {
      color: #61dafb;
      font-size: 1.6em;
      margin: 20px 0 15px 0;
    }
    .item p {
      font-size: 1.2em;
      line-height: 1.6;
    }
    .icon {
      font-size: 3em;
    }
    .stats {
      margin-top: 60px;
      text-align: center;
      font-size: 1.3em;
      color: #98c379;
    }
    .stat {
      display: inline-block;
      margin: 0 40px;
    }
    .stat strong {
      font-size: 2em;
      color: #61dafb;
      display: block;
    }
  </style>
</head>
<body>
  <h1>💻 Built for Developers</h1>
  <div class="subtitle">Test-Driven, Type-Safe, Production-Ready</div>
  
  <div class="grid">
    <div class="item">
      <div class="icon">📘</div>
      <h2>TypeScript</h2>
      <p>Strict mode enabled for maximum type safety</p>
    </div>
    
    <div class="item">
      <div class="icon">✅</div>
      <h2>384 Tests</h2>
      <p>Comprehensive test coverage (99.7%)</p>
    </div>
    
    <div class="item">
      <div class="icon">🏗️</div>
      <h2>SDD Architecture</h2>
      <p>Seam-Driven Development principles</p>
    </div>
    
    <div class="item">
      <div class="icon">🔒</div>
      <h2>Secure</h2>
      <p>0 vulnerabilities, CSP enforced</p>
    </div>
    
    <div class="item">
      <div class="icon">📦</div>
      <h2>Clean Code</h2>
      <p>Result<T,E> pattern, no exceptions</p>
    </div>
    
    <div class="item">
      <div class="icon">🎯</div>
      <h2>Manifest V3</h2>
      <p>Latest Chrome extension standard</p>
    </div>
  </div>
  
  <div class="stats">
    <div class="stat">
      <strong>17K+</strong>
      Lines of Code
    </div>
    <div class="stat">
      <strong>32</strong>
      Seams Documented
    </div>
    <div class="stat">
      <strong>9</strong>
      Contracts Defined
    </div>
  </div>
</body>
</html>`;

  await page.setContent(techHtml);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-tech.png') });
  console.log('  ✅ 05-tech.png\n');

  await browser.close();

  console.log('✨ All screenshots generated!\n');
  console.log(`📁 Location: ${SCREENSHOTS_DIR}`);
  console.log('\n📋 Files created (1280x800 PNG):');
  console.log('   01-features.png - Feature overview');
  console.log('   02-shortcuts.png - Keyboard shortcuts');
  console.log('   03-privacy.png - Privacy & security');
  console.log('   04-quips.png - Example quips');
  console.log('   05-tech.png - Tech stack\n');
  console.log('🎯 Ready for Chrome Web Store!');
}

generateScreenshots().catch(console.error);
