// Serve the repository first. Run with Playwright installed.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.BRIEF_URL || 'http://127.0.0.1:8766/';
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({reducedMotion:'reduce'});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({width,height:1000});
      for (const lang of ['de','en']) {
        await page.goto(`${base}?date=2026-09-24&lang=${lang}#brief`);
        await page.waitForSelector('#brief-content[aria-busy="false"] .story');
        await page.waitForFunction(() => document.querySelector('.lead-illustration img')?.naturalWidth > 0);
        assert.ok(await page.locator('#back-to-cover').isVisible());
        await page.locator('#back-to-cover').click();
        await page.waitForFunction(() => {
          const rect = document.querySelector('.lead-illustration img').getBoundingClientRect();
          return location.hash === '#edition' && rect.top < innerHeight && rect.bottom > 0;
        });
        await page.locator('.cover-action').click();
        assert.equal(new URL(page.url()).hash, '#brief');
        await page.locator('.topbar a[href="#edition"]').click();
        await page.waitForFunction(() => location.hash === '#edition' && document.querySelector('#edition').getBoundingClientRect().top >= 0);
        const archiveLink = page.locator('.archive-card').filter({has:page.locator('.archive-date', {hasText:'2026-09-24'})}).first();
        assert.equal(new URL(await archiveLink.getAttribute('href'),base).hash, '#edition');
        await archiveLink.click();
        await page.waitForSelector('#brief-content[aria-busy="false"] .story');
        await page.waitForFunction(() => document.querySelector('.lead-illustration img')?.naturalWidth > 0 && document.querySelector('#edition').getBoundingClientRect().top >= 0);
        if(width === 1280 && lang === 'de') await page.screenshot({path:'/tmp/ai-brief-cover-visible.png'});
        console.log(`${lang}/${width}: image loads; overview return, edition menu and archive open the cover.`);
      }
    }
    await page.goto(`${base}?date=2026-09-10&lang=de#edition`);
    await page.waitForSelector('#brief-content[aria-busy="false"] .story');
    assert.equal(await page.locator('.lead-illustration').count(),0);
    assert.equal(await page.locator('#back-to-cover').isVisible(),false);
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exit(1)});
