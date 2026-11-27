/*
  WHAT: Click-through check for the fridge site (site/). Serves it locally, drives it in
        Chromium at laptop and phone size, and fails loudly if anything is off.
  WHY: The site has no unit tests and no build, so this is its regression test.
       It checks the rules the site copies from the extension, too.
  HOW DATA FLOWS: site/ -> local HTTP server -> Playwright Chromium -> assertions -> exit code.
  SEAMS: Exercises SITE-02 (window.TABBY_QUIPS -> fridge.js), including when it's missing.
  Run: npm run site:check   (needs Playwright: `npm i -D playwright` or a global install)
*/
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', 'site');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2' };
const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log((ok ? '  ok   ' : '  FAIL ') + msg); };

// Only files that exist under site/ when the check starts can be served. Request paths are
// looked up in this map and never joined onto the filesystem.
function listFiles(dir, prefix = '') {
  const out = new Map();
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix + '/' + e.name;
    if (e.isDirectory()) for (const [k, v] of listFiles(path.join(dir, e.name), rel)) out.set(k, v);
    else out.set(rel, path.join(dir, e.name));
  }
  return out;
}

function serve() {
  const files = listFiles(ROOT);
  const notFound = files.get('/404.html');
  const server = http.createServer((req, res) => {
    let p = req.url.split('?')[0];
    if (p.endsWith('/')) p += 'index.html';
    const f = files.get(p);
    if (f) {
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
      return fs.createReadStream(f).pipe(res);
    }
    res.writeHead(404, { 'content-type': 'text/html' });
    fs.createReadStream(notFound).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

(async () => {
  const server = await serve();
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch();
  try {
    for (const [label, viewport] of [['laptop', { width: 1280, height: 800 }], ['tablet', { width: 768, height: 1024 }], ['phone', { width: 390, height: 844 }]]) {
      console.log(label);
      const ctx = await browser.newContext({ viewport });
      const page = await ctx.newPage();
      const errors = [];
      const offsite = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
      page.on('request', r => { if (!r.url().startsWith(base)) offsite.push(r.url()); });

      for (const p of ['/', '/privacy.html']) {
        const res = await page.goto(base + p, { waitUntil: 'networkidle' });
        check(res.status() === 200, `${p} loads`);
        const [sw, w] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        check(sw <= w, `${p} has no sideways scroll (${sw} <= ${w})`);
      }
      const missing = await page.goto(base + '/nope', { waitUntil: 'networkidle' });
      check(missing.status() === 404 && /ate this page/.test(await page.title()), '404 page shows');

      await page.goto(base + '/', { waitUntil: 'networkidle' });
      // Trash day: the flashing must end on the tab that closes, and safe tabs never close.
      for (let i = 0; i < 6; i++) {
        let lastSpot = null;
        const watcher = setInterval(async () => {
          lastSpot = await page.$eval('#tabs li.spot', el => el.textContent).catch(() => lastSpot);
        }, 20);
        await page.click('#lucky');
        await page.waitForFunction(() => !document.getElementById('lucky').disabled, null, { timeout: 8000 });
        clearInterval(watcher);
        const status = await page.textContent('#lucky-status');
        if (lastSpot) check(status.includes(lastSpot.trim()), `spin landed on the closed tab ("${lastSpot.trim()}")`);
      }
      check(await page.$$eval('#tabs li[data-pinned].gone, #tabs li[data-active].gone', l => l.length) === 0, 'pinned and current tabs survive');
      await page.click('#lucky');
      check(/Nothing left/.test(await page.textContent('#lucky-status')), '"nothing left" message');
      check(await page.isVisible('#restock'), 'restock button appears');
      await page.click('#restock');
      check(await page.$$eval('#tabs li.gone', l => l.length) === 0, 'restock reopens tabs');

      // Grouping
      await page.click('#group-form button[type=submit]');
      check(/at least one/.test(await page.textContent('#group-status')), 'group needs a tab');
      await page.check('#group-form input[value="Salary negotiation tips"]');
      await page.click('#group-form button[type=submit]');
      check(/Name it/.test(await page.textContent('#group-status')), 'group needs a name');
      await page.fill('#group-name', 'money');
      await page.click('#group-form button[type=submit]');
      check((await page.textContent('#banded')).includes('money'), 'group band appears');

      // Notes and envelope
      const before = Number(await page.textContent('#count'));
      await page.click('#more');
      check(Number(await page.textContent('#count')) === before + 1, 'note counter goes up');
      await page.click('#envelope');
      check((await page.textContent('#egg-when')).startsWith('When'), 'envelope shows an easter egg');

      check(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
      check(offsite.length === 0, 'no requests leave the site' + (offsite.length ? ': ' + offsite.join(' ') : ''));
      await ctx.close();
    }

    // SITE-02 broken: quips.js missing. The fridge should say so and not half-work.
    console.log('quips missing');
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.route('**/quips.js', r => r.fulfill({ status: 404, body: '' }));
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    check(/marker ran out/.test(await page.textContent('#lucky-status')), 'in-world error shows');
    check(await page.isDisabled('#group-form button[type=submit]'), 'group button is disabled');
    await ctx.close();
  } finally {
    await browser.close();
    server.close();
  }
  if (failures.length) { console.error(`\n${failures.length} check(s) failed`); process.exit(1); }
  console.log('\nall site checks passed');
})();
