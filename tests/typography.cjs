// Run with Playwright installed: node tests/typography.cjs
// Serve the repository first; BRIEF_URL can override the local preview URL.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BRIEF_URL || 'http://127.0.0.1:8766/';
const archive = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/archive.json'), 'utf8'));
const dates = process.env.BRIEF_DATES?.split(',') || archive.map(edition => edition.date);
const widths = process.env.BRIEF_WIDTHS?.split(',').map(Number) || [1440, 768, 390, 320];

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const date of dates) {
      for (const language of ['de', 'en']) {
        const source = fs.readFileSync(path.join(__dirname, `../briefings/${date}-${language}.html`), 'utf8');
        for (const width of widths) {
          await page.setViewportSize({ width, height: 1000 });
          await page.goto(`${base}?date=${date}&lang=${language}`);
          await page.waitForSelector('#brief-content[aria-busy="false"] .story');
          await page.evaluate(() => document.fonts.ready);
          const result = await page.evaluate(source => {
            const original = new DOMParser().parseFromString(source, 'text/html');
            const rendered = document.querySelector('#brief-content');
            const text = value => value.replace(/\s+/g, ' ').trim();
            const stories = [...original.querySelectorAll('.story')];
            const current = [...rendered.querySelectorAll('.story')];
            return {
              sourceStories: stories.length,
              renderedStories: current.length,
              // A chapter must retain every original paragraph, code block and source link.
              missingText: [...original.querySelectorAll('.story p, .concept p, pre')]
                .filter(node => !text(rendered.textContent).includes(text(node.textContent)))
                .map(node => text(node.textContent).slice(0, 80)),
              missingLinks: [...original.querySelectorAll('a[href]')]
                .filter(a => ![...rendered.querySelectorAll('a[href]')].some(b => b.getAttribute('href') === a.getAttribute('href')))
                .map(a => a.getAttribute('href')),
              headings: current.every((story, i) => !stories[i].querySelector(':scope > h2, :scope > h3') || story.querySelector(':scope > h3')),
              bodyFonts: current.every(story => [...story.querySelectorAll('p:not(.sources)')].every(p => {
                const style = getComputedStyle(p);
                return style.fontFamily.includes('DM Sans') && style.textTransform === 'none';
              })),
              titleFont: getComputedStyle(current[0].querySelector('h3')).fontFamily,
              coverTitle: document.querySelector('#cover-title').textContent,
              sourceTitle: original.querySelector('.briefing-intro h1, .briefing-intro h2').textContent,
              navigation: [...document.querySelectorAll('#chapter-links a')].map(a => a.textContent.length),
              chapterCount: rendered.querySelectorAll('h2.chapter, h3.chapter').length,
              invalidChapters: rendered.querySelectorAll('.chapter:not(h2):not(h3)').length,
              overflow: document.documentElement.scrollWidth > innerWidth + 1,
              outside: [...document.querySelectorAll('main *')].filter(el => !el.closest('pre') && el.getBoundingClientRect().right > innerWidth + 1)
                .slice(0, 5).map(el => `${el.tagName}.${el.className}`),
              cardBodies: [...rendered.querySelectorAll('.signal-grid > div > p')].every(p => getComputedStyle(p).fontFamily.includes('DM Sans')),
              cardTitles: [...rendered.querySelectorAll('.signal-title')].every(h => getComputedStyle(h).fontFamily.includes('DM Sans')),
              aligned: current.every(story => [...story.querySelectorAll(':scope > p, :scope > .sources')].every(el => Math.abs(el.getBoundingClientRect().left - story.getBoundingClientRect().left) < 1)),
              summaryFirst: rendered.firstElementChild?.classList.contains('executive'),
              summaryHeadingSize: parseFloat(getComputedStyle(rendered.querySelector('.executive h2')).fontSize),
              archiveLabel: document.querySelector('.topbar a[href="#archive"]').textContent,
              coverRows: [...document.querySelectorAll('.cover-story-row strong')].map(el => el.textContent),
              signalTitles: [...rendered.querySelectorAll('.executive .signal-title')].slice(0, 3).map(el => el.textContent)
            };
          }, source);
          const context = `${date}/${language}/${width}px`;
          assert.equal(result.renderedStories, result.sourceStories, context);
          assert.deepEqual(result.missingText, [], context);
          assert.deepEqual(result.missingLinks, [], context);
          assert.ok(result.headings && result.bodyFonts && result.cardBodies && result.cardTitles, context);
          assert.match(result.titleFont, /DM Sans/, context);
          assert.equal(result.invalidChapters, 0, context);
          assert.equal(result.navigation.length, result.chapterCount, context);
          assert.ok(result.navigation.every(length => length < 100), context);
          assert.equal(result.overflow, false, context);
          assert.deepEqual(result.outside, [], context);
          assert.ok(result.aligned && result.summaryFirst && result.summaryHeadingSize >= 30, context);
          assert.equal(result.archiveLabel, language === 'de' ? 'Archiv' : 'Archive', context);
          if (date >= '2026-09-23') {
            assert.equal(result.coverTitle, result.sourceTitle, context);

          }
          if (date === '2026-09-24' && language === 'de' && [1440, 320].includes(width)) {
            await page.screenshot({ path: `/tmp/ai-brief-type-cover-${width}.png` });
            await page.locator('.executive').screenshot({ path: `/tmp/ai-brief-type-signals-${width}.png`, style: '.topbar,.skip-link,.progress{visibility:hidden}' });
            await page.locator('.story').first().screenshot({ path: `/tmp/ai-brief-type-story-${width}.png`, style: '.topbar,.skip-link,.progress{visibility:hidden}' });
          }
          console.log(`${context}: content, links, hierarchy, fonts and layout OK`);
        }
      }
    }
    // Reprocessing must be safe and preserve nested emphasis/links in card copy.
    const preserved = await page.evaluate(() => {
      const fragment = document.createElement('article');
      fragment.innerHTML = '<section class="chapter"><div class="section-kicker">Chapter <em>one</em></div><article class="story"><h2>Title</h2><p>Keep <strong>bold</strong> and <a href="#source">link</a>.</p></article></section><div class="signal-grid"><div><strong>Card title</strong><br>Read <strong>carefully</strong> and <a href="#source">follow</a>.</div></div>';
      normalizeEditorialMarkup(fragment);
      const first = fragment.innerHTML;
      normalizeEditorialMarkup(fragment);
      return first === fragment.innerHTML && !!fragment.querySelector('.signal-grid p strong') && !!fragment.querySelector('.signal-grid p a') && !!fragment.querySelector('h2.chapter em');
    });
    assert.ok(preserved);
    await page.goto(`${base}?date=2026-09-01&lang=en`);
    await page.waitForSelector('#brief-content[aria-busy="false"] .story');
    await page.locator('[data-lang="de"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'de' && document.querySelector('#brief-content[aria-busy="false"] .story h3')?.textContent.includes('Claude-Vorfälle'));
    assert.deepEqual(errors, []);
    console.log('Idempotence, nested markup and language switching OK; no browser errors.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
