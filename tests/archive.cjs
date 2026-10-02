// Check the separate archive route, edition links, language and recovery behavior.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BRIEF_URL || 'http://127.0.0.1:8766/';
const editions = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/archive.json'), 'utf8'))
  .sort((a, b) => b.date.localeCompare(a.date));

(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    for (const language of ['de', 'en']) {
      for (const width of [1440, 320]) {
        await page.setViewportSize({width, height:1000});
        const archiveRequests = [];
        const track = request => {if (new URL(request.url()).pathname.endsWith('/data/archive.json')) archiveRequests.push(request.url());};
        page.on('request', track);
        await page.goto(`${base}?lang=${language}`);
        await page.waitForSelector('#brief-content[aria-busy="false"] .story');
        page.off('request', track);
        assert.deepEqual(archiveRequests, [], 'The latest brief must not fetch the archive listing');
        assert.equal(await page.locator('#archive, #archive-list, .archive-card').count(), 0);
        await page.locator('.topbar a[href*="archive.html"]').click();
        await page.waitForSelector('#archive-list[aria-busy="false"] .archive-card');
        assert.ok(new URL(page.url()).pathname.endsWith('/archive.html'));
        assert.equal(new URL(page.url()).searchParams.get('lang'), language);
        assert.equal(await page.locator('html').getAttribute('lang'), language);
        assert.equal(await page.locator('h1').textContent(), language === 'de' ? 'Das Archiv.' : 'The archive.');
        assert.match(await page.locator('#archive-count').textContent(), new RegExp(`^${editions.length} `));
        const cards = await page.locator('.archive-card').evaluateAll(links => links.map(a => ({date:a.querySelector('time').dateTime, title:a.querySelector('strong').textContent, href:a.href})));
        assert.deepEqual(cards.map(card => card.date), editions.map(item => item.date));
        for (const [i, card] of cards.entries()) {
          assert.equal(card.title, editions[i].headline?.[language] || 'AI Daily Brief');
          const url = new URL(card.href);
          assert.equal(url.searchParams.get('date'), editions[i].date);
          assert.equal(url.searchParams.get('lang'), language);
          assert.equal(url.hash, '#edition');
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        const first = page.locator('.archive-card').first();
        await first.click();
        await page.waitForSelector('#brief-content[aria-busy="false"] .story');
        assert.equal(new URL(page.url()).searchParams.get('date'), editions[0].date);
        assert.equal(new URL(page.url()).searchParams.get('lang'), language);
        assert.equal(new URL(page.url()).hash, '#edition');
        assert.equal(await page.locator('.archive-card, #archive-list').count(), 0);
        console.log(`${language}/${width}: menu opens separate archive; all editions present; chosen edition opens at cover`);
      }
    }
    await page.goto(`${base}archive.html?lang=de`);
    await page.waitForSelector('#archive-list[aria-busy="false"] .archive-card');
    await page.locator('[data-lang="en"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'en' && document.querySelector('#archive-list[aria-busy="false"] .archive-card'));
    assert.equal(new URL(page.url()).searchParams.get('lang'), 'en');
    assert.equal(await page.locator('.archive-card strong').first().textContent(), editions[0].headline.en);
    await page.reload();
    await page.waitForSelector('#archive-list[aria-busy="false"] .archive-card');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.locator('.topbar a[href*="concepts.html"]').click();
    await page.waitForSelector('#concepts[aria-busy="false"] .card');
    await page.locator('nav a[href*="archive.html"]').click();
    await page.waitForSelector('#archive-list[aria-busy="false"] .archive-card');
    assert.equal(new URL(page.url()).searchParams.get('lang'), 'en');
    await page.goto(`${base}?lang=en#archive`);
    await page.waitForURL('**/archive.html?lang=en');
    await page.waitForSelector('#archive-list[aria-busy="false"] .archive-card');
    await page.route('**/data/archive.json', route => route.fulfill({status:200,contentType:'application/json',body:'[]'}));
    await page.reload();
    await page.waitForSelector('#archive-list[aria-busy="false"] .empty');
    assert.equal(await page.locator('#archive-count').textContent(), '0 editions');
    await page.unroute('**/data/archive.json');
    await page.route('**/data/archive.json', route => route.fulfill({status:503,body:'Unavailable'}));
    await page.reload();
    await page.waitForSelector('#archive-list[aria-busy="false"] [role="alert"]');
    await page.unroute('**/data/archive.json');
    await page.locator('[role="alert"] button').click();
    await page.waitForSelector('#archive-list[aria-busy="false"] .archive-card');
    assert.equal(await page.locator('.archive-card').count(), editions.length);
    assert.deepEqual(errors, []);
    console.log('Language switching, reload, library links, legacy anchors, empty archive and retry OK; no browser errors.');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exit(1);});
