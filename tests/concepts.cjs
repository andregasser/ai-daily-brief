// Serve the repo, then run with Playwright installed: node tests/concepts.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BRIEF_URL || 'http://127.0.0.1:8766/';
const { concepts } = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/concepts.json'), 'utf8'));
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    for (const lang of ['de', 'en']) {
      await page.goto(`${base}concepts.html?lang=${lang}`);
      await page.waitForSelector('#concepts[aria-busy="false"] .card');
      assert.equal(await page.locator('.card').count(), concepts.length);
      assert.ok(await page.locator('.card h2 a').evaluateAll(links => links.every(a => new URL(a.href).pathname.endsWith('/concept.html') && new URL(a.href).searchParams.has('id'))));
      await page.locator('.card h2 a').first().click();
      await page.waitForSelector('#concept-content[aria-busy="false"] .concept');
      assert.ok(new URL(page.url()).pathname.endsWith('/concept.html'));
      for (const concept of concepts) {
        const source = fs.readFileSync(path.join(__dirname, '..', concept.briefing[lang]), 'utf8');
        for (const width of [1440, 320]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.goto(`${base}concept.html?id=${concept.id}&lang=${lang}`);
          await page.waitForSelector('#concept-content[aria-busy="false"] .concept').catch(async error => { console.error(page.url(), await page.locator('#concept-content').textContent()); throw error; });
          const result = await page.evaluate(({source, concepts, lang}) => {
            const original = new DOMParser().parseFromString(source, 'text/html').querySelector('.concept, .concept-story');
            const rendered = document.querySelector('#concept-content');
            const text = value => value.replace(/\s+/g, ' ').trim();
            return {
              missingText: [...original.querySelectorAll('p, pre, h4, :not(.concept-story) > h3')].filter(el => !text(rendered.textContent).includes(text(el.textContent))).map(el => el.textContent.slice(0,80)),
              missingLinks: [...original.querySelectorAll('a[href]')].filter(a => {
                let expected = a.getAttribute('href');
                if (expected.startsWith('?date=')) {
                  const related = concepts.find(c => c.first_seen === new URLSearchParams(expected).get('date'));
                  expected = `concept.html?id=${encodeURIComponent(related.id)}&lang=${lang}`;
                }
                return ![...rendered.querySelectorAll('a[href]')].some(b => expected === b.getAttribute('href'));
              }).map(a => a.getAttribute('href')),
              unrelated: rendered.querySelectorAll('.story, .briefing-intro, .executive').length,
              title: document.querySelector('h1').textContent,
              overflow: document.documentElement.scrollWidth > innerWidth + 1,
              visuals: rendered.querySelectorAll('svg, .concept-visual').length === original.querySelectorAll('svg, .concept-visual').length
            };
          }, {source, concepts, lang});
          const context = `${concept.id}/${lang}/${width}`;
          assert.deepEqual(result.missingText, [], context);
          assert.deepEqual(result.missingLinks, [], context);
          assert.equal(result.unrelated, 0, context);
          assert.equal(result.title, concept.title[lang], context);
          assert.equal(result.overflow, false, context);
          assert.ok(result.visuals, context);
        }
      }
      console.log(`All ${concepts.length} concepts in ${lang}: dedicated route, content, sources, diagrams and desktop/mobile layout OK`);
    }
    const selected = concepts.at(-1);
    await page.goto(`${base}concept.html?id=${selected.id}&lang=de`);
    await page.waitForSelector('#concept-content[aria-busy="false"] .concept');
    await page.locator('[data-lang="en"]').click();
    await page.waitForFunction(title => document.querySelector('#concept-content[aria-busy="false"] .concept') && document.querySelector('h1').textContent === title, selected.title.en);
    assert.equal(new URL(page.url()).searchParams.get('id'), selected.id);
    await page.reload();
    await page.waitForSelector('#concept-content[aria-busy="false"] .concept');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.locator('.breadcrumb a').click();
    await page.waitForSelector('#concepts[aria-busy="false"] .card');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.goto(`${base}concept.html?id=not-a-concept&lang=de`);
    await page.waitForSelector('#concept-content[aria-busy="false"] .empty');
    assert.match(await page.locator('h1').textContent(), /nicht gefunden/);
    await page.route('**/briefings/*', route => route.fulfill({status:503,body:'Unavailable'}));
    await page.goto(`${base}concept.html?id=${selected.id}&lang=de`);
    await page.waitForSelector('[role="alert"]');
    await page.unroute('**/briefings/*');
    await page.locator('[role="alert"] button').click();
    await page.waitForSelector('#concept-content[aria-busy="false"] .concept');
    assert.deepEqual(errors, []);
    console.log('Language switching, reload, library return, unknown IDs and load-error recovery OK.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
