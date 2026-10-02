// Guard dark reading surfaces and readable text across daily and companion routes.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BRIEF_URL || 'http://127.0.0.1:8766/';
const concepts = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/concepts.json'), 'utf8')).concepts;

(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage();
    const routes = ['?date=2026-10-01', '?date=2026-09-30', '?date=2026-09-24', '?date=2026-09-02',
      'archive.html?', 'concepts.html?', `concept.html?id=${concepts.at(-1).id}`, 'weekly/?'];
    for (const route of routes) {
      for (const language of ['de', 'en']) {
        for (const width of [1440, 320]) {
          await page.setViewportSize({width, height:1000});
          await page.goto(`${base}${route}${route.endsWith('?') ? '' : '&'}lang=${language}`);
          await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'));
          await page.evaluate(() => document.fonts.ready);
          const result = await page.evaluate(() => {
            const rgba = value => value.match(/[\d.]+/g).map(Number);
            const over = (front, back) => front.slice(0,3).map((x,i) => x * (front[3] ?? 1) + back[i] * (1 - (front[3] ?? 1)));
            const luminance = color => color.slice(0,3).map(x => {x /= 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;})
              .reduce((sum,x,i) => sum + x * [.2126,.7152,.0722][i], 0);
            const checks = [...document.querySelectorAll('h1,h2,h3,h4,.chapter-title,.cover-kicker,.cover-action,.cover-action span,.brand,nav>a,button,.sources a,.signal-grid p,.story p,.story-meta,.source-tag,.signal-confidence,.why>strong,.changed>strong,.engineering>strong,.signal-hype>strong,.outlook-title,.outlook-body,.outlook-deadline,.visual-label,.visual-source,figcaption,.library-page p,.archive-card strong,.archive-action,.meta,.tag,.count,.empty')]
              .filter(el => el.textContent.trim() && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
              .map(el => {
                const ancestors = []; for (let parent = el; parent; parent = parent.parentElement) ancestors.unshift(parent);
                const background = ancestors.reduce((color,parent) => over(rgba(getComputedStyle(parent).backgroundColor),color), [0,0,0]);
                const foreground = over(rgba(getComputedStyle(el).color),background);
                const a = luminance(foreground), b = luminance(background);
                return {text:el.textContent.trim().replace(/\s+/g,' ').slice(0,60), ratio:(Math.max(a,b) + .05) / (Math.min(a,b) + .05)};
              });
            return {
              dark: getComputedStyle(document.documentElement).colorScheme === 'dark' && luminance(rgba(getComputedStyle(document.body).backgroundColor)) < .05,
              lowContrast: checks.filter(check => check.ratio < 4.5),
              fonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family),
              overflow: document.documentElement.scrollWidth > innerWidth + 1
            };
          });
          const context = `${route}/${language}/${width}`;
          assert.ok(result.dark, context);
          assert.deepEqual(result.lowContrast, [], context);
          assert.ok(result.fonts.includes('Space Grotesk') && result.fonts.includes('Inter'), context);
          assert.equal(result.overflow, false, context);
        }
      }
      console.log(`${route}: dark surfaces, loaded fonts, text contrast >=4.5:1 and responsive layout OK`);
    }
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exit(1);});
