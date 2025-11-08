/**
 * Screenshot generator for Chrome Web Store
 *
 * Creates promotional screenshots of the TabbyMcTabface extension popup
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function takeScreenshots() {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 400, height: 600 },
    deviceScaleFactor: 1 // Standard display (avoid crash)
  });

  const page = await context.newPage();

  // Log console messages for debugging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('📸 Taking screenshot of popup...');

  // Navigate to the screenshot-friendly popup HTML file
  const popupPath = path.join(__dirname, '..', 'test-screenshot.html');
  console.log('Loading:', popupPath);
  await page.goto(`file://${popupPath}`);

  // Wait for any animations or content to load
  await page.waitForTimeout(1000);

  // Take full page screenshot
  const screenshotPath = path.join(screenshotsDir, 'popup-main.png');
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });

  console.log(`✅ Screenshot saved: ${screenshotPath}`);

  // Take a 1280x800 screenshot (Chrome Web Store recommended size)
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(500);

  const wideScreenshotPath = path.join(screenshotsDir, 'popup-wide-1280x800.png');
  await page.screenshot({
    path: wideScreenshotPath
  });

  console.log(`✅ Wide screenshot saved: ${wideScreenshotPath}`);

  // Take a small promotional screenshot (440x280)
  await page.setViewportSize({ width: 440, height: 280 });
  await page.waitForTimeout(500);

  const smallScreenshotPath = path.join(screenshotsDir, 'popup-small-440x280.png');
  await page.screenshot({
    path: smallScreenshotPath
  });

  console.log(`✅ Small screenshot saved: ${smallScreenshotPath}`);

  await browser.close();

  console.log('\n🎉 All screenshots generated successfully!');
  console.log('\nScreenshots saved in:', screenshotsDir);
  console.log('\nChrome Web Store recommended sizes:');
  console.log('  - Small tile: 440x280 ✓');
  console.log('  - Large tile: 1280x800 ✓');
  console.log('  - Marquee: 1400x560 (create manually if needed)');
}

takeScreenshots().catch(error => {
  console.error('❌ Error taking screenshots:', error);
  process.exit(1);
});
