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
            const removeConfidenceLabels = node => {
              node.querySelectorAll('.signal-confidence, strong').forEach(label => {
                if (label.matches('.signal-confidence') || /^(?:(Analyse|Analysis),\s*)?Confidence:\s*[a-z_-]+\.?$/i.test(label.textContent.trim())) label.remove();
              });
            };
            // Compare analysis prose independently of its localized metadata label.
            const readingCopy = rendered.cloneNode(true);
            removeConfidenceLabels(readingCopy);
            const readingText = text(readingCopy.textContent);
            const paragraphText = node => {
              const copy = node.cloneNode(true);
              removeConfidenceLabels(copy);
              const label = copy.querySelector(':scope > strong:first-child');
              if (node.closest('.concept, .concept-story') && label &&
                /^(?:intuition|intuitiv|technische tiefe|technical depth|konkretes beispiel|concrete example|practical relevance(?: for software engineers)?|praktische relevanz(?: für software engineers)?)\s*:?$/i.test(label.textContent.trim())) {
                label.remove();
              }
              return text(copy.textContent);
            };
            const stories = [...original.querySelectorAll('.story')];
            const current = [...rendered.querySelectorAll('.story')];
            return {
              sourceStories: stories.length,
              renderedStories: current.length,
              // A chapter must retain every original paragraph, code block and source link.
              missingText: [...original.querySelectorAll('.story p, .concept p, .signal-box p, pre')]
                .filter(node => !readingText.includes(paragraphText(node)))
                .map(node => text(node.textContent).slice(0, 80)),
              missingLinks: [...original.querySelectorAll('a[href]')]
                .filter(a => ![...rendered.querySelectorAll('a[href]')].some(b => b.getAttribute('href') === a.getAttribute('href')))
                .map(a => a.getAttribute('href')),
              headings: current.every((story, i) => !stories[i].querySelector(':scope > h2, :scope > h3') || story.querySelector(':scope > h3')),
              bodyFonts: current.every(story => [...story.querySelectorAll('p:not(.sources)')].every(p => {
                const style = getComputedStyle(p);
                return style.fontFamily.includes('IBM Plex Sans') && style.textTransform === 'none';
              })),
              titleFont: getComputedStyle(current[0].querySelector('h3')).fontFamily,
              coverTitle: document.querySelector('#cover-title').textContent,
              sourceTitle: original.querySelector('.briefing-intro h1, .briefing-intro h2').textContent,
              hasStoryPriority: !!rendered.querySelector('.story .priority, .story-priority'),
              hasEditionNavigation: !!document.querySelector('#edition-navigation, #chapter-links'),
              chaptersUnnumbered: [...rendered.querySelectorAll('h2.chapter, h3.chapter')].every(h => ['none', 'normal'].includes(getComputedStyle(h, '::before').content)),
              headingRoles: ['section', 'topic', 'subtitle', 'card', 'label'].map(role => ({
                role,
                headings: [...rendered.querySelectorAll(`.brief-${role === 'subtitle' ? 'subtitle' : role + '-title'}`)].map(h => ({
                  tag: h.tagName, size: parseFloat(getComputedStyle(h).fontSize),
                  font: getComputedStyle(h).fontFamily, weight: getComputedStyle(h).fontWeight
                }))
              })),
              featureHeadingsOutside: [...rendered.querySelectorAll('.emerging-feature')].every(box => box.previousElementSibling?.matches('h2.chapter.emerging-section-title')),
              invalidChapters: rendered.querySelectorAll('.chapter:not(h2):not(h3)').length,
              overflow: document.documentElement.scrollWidth > innerWidth + 1,
              outside: [...document.querySelectorAll('main *')].filter(el => !el.closest('pre') && el.getBoundingClientRect().right > innerWidth + 1)
                .slice(0, 5).map(el => `${el.tagName}.${el.className}`),
              cardBodies: [...rendered.querySelectorAll('.signal-grid > div > p')].every(p => getComputedStyle(p).fontFamily.includes('IBM Plex Sans')),
              cardTitles: [...rendered.querySelectorAll('.signal-title')].every(h => getComputedStyle(h).fontFamily.includes('Barlow Condensed')),
              callouts: [...rendered.querySelectorAll('.changed, .why')].every(block => {
                const style = getComputedStyle(block);
                return style.backgroundColor !== 'rgba(0, 0, 0, 0)' && parseFloat(style.borderLeftWidth) >= 4 &&
                  !!block.querySelector(':scope > strong > .editorial-icon[aria-hidden="true"]');
              }),
              aligned: current.every(story => [...story.querySelectorAll(':scope > p, :scope > .sources')].every(el => {
                const style = getComputedStyle(story);
                const left = story.getBoundingClientRect().left + parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth);
                return Math.abs(el.getBoundingClientRect().left - left) < 1;
              })),
              summaryFirst: rendered.firstElementChild?.classList.contains('executive'),
              summaryHeadingSize: parseFloat(getComputedStyle(rendered.querySelector('.executive h2')).fontSize),
              archiveLabel: document.querySelector('.topbar a[href*="archive.html"]').textContent,
              coverRows: [...document.querySelectorAll('.cover-story-row strong')].map(el => el.textContent),
              signalTitles: [...rendered.querySelectorAll('.executive .signal-title')].slice(0, 3).map(el => el.textContent)
            };
          }, source);
          const context = `${date}/${language}/${width}px`;
          assert.equal(result.renderedStories, result.sourceStories, context);
          assert.deepEqual(result.missingText, [], context);
          assert.deepEqual(result.missingLinks, [], context);
          assert.ok(result.headings && result.bodyFonts && result.cardBodies && result.cardTitles, context);
          assert.match(result.titleFont, /Barlow Condensed/, context);
          assert.equal(result.invalidChapters, 0, context);
          assert.equal(result.hasStoryPriority, false, context);
          assert.equal(result.hasEditionNavigation, false, context);
          assert.ok(result.chaptersUnnumbered, context);
          const sizes = width <= 760 ? {section:26, topic:24, subtitle:18, card:18, label:15} : {section:32, topic:28, subtitle:20, card:20, label:16};
          for (const {role, headings} of result.headingRoles) {
            for (const h of headings) {
              assert.equal(h.size, sizes[role], `${context}/${role}`);
              assert.match(h.font, ['section', 'topic', 'card'].includes(role) ? /Barlow Condensed/ : /IBM Plex Sans/, context);
              assert.equal(h.weight, '700', context);
              if (role === 'section') assert.equal(h.tag, 'H2', context);
              if (role === 'topic') assert.equal(h.tag, 'H3', context);
              if (role === 'subtitle') assert.equal(h.tag, 'H4', context);
            }
          }
          assert.ok(result.featureHeadingsOutside, context);
          assert.equal(result.overflow, false, context);
          assert.deepEqual(result.outside, [], context);
          assert.ok(result.aligned && result.summaryFirst, context);
          assert.equal(result.summaryHeadingSize, sizes.section, context);
          assert.ok(result.callouts, context);
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
    // Historical formats and long titles must retain copy/links when processed again.
    const headingNormalization = await page.evaluate(() => {
      const fragment = document.createElement('article');
      fragment.innerHTML = '<section class="executive"><span class="section-kicker">IN 60 SECONDS</span><h2>The strongest signals</h2><div class="signal-grid"><div><strong>Card title</strong><br>Card body</div></div></section>' +
        '<h2 class="chapter" id="chapter-1">Business &amp; Strategy</h2><section class="story"><div class="story-meta"><span class="priority">HIGH</span><span class="evidence">CONFIRMED_PRIMARY</span></div><h3>A long title about verified architecture — Keep <em>every limitation</em> and <a href="#evidence">the linked evidence</a> in the smaller subtitle without losing words.</h3><p>Original analysis remains.</p></section>' +
        '<section class="signal-box"><strong>Emerging Signal · Keep <em>the emerging thesis</em> and <a href="#signal">its evidence</a></strong><p><strong>Confidence: early_signal.</strong> Original emerging analysis.</p></section>' +
        '<section class="concept"><div class="section-kicker">Concept of the Day</div><h2>Concept topic</h2><p><strong>Intuition:</strong> Keep <em>this explanation</em> and <a href="#concept">this source</a>.</p><h3>Technical depth</h3><p>Original technical detail.</p></section>' +
        '<h2 class="chapter">What to Watch Next</h2><section class="watch"><h2>One specific follow-up</h2><ol><li><strong>Follow-up:</strong> Watch the original evidence.</li></ol></section>';
      normalizeEditorialMarkup(fragment);
      const first = fragment.innerHTML;
      normalizeEditorialMarkup(fragment);
      const topic = fragment.querySelector('[data-original-title]');
      return {
        stable: first === fragment.innerHTML,
        completeTitle: topic.textContent + topic.nextElementSibling.textContent === topic.dataset.originalTitle,
        preservedLinks: ['#evidence', '#signal', '#concept'].every(href => fragment.querySelector(`a[href="${href}"]`)),
        preservedEmphasis: fragment.querySelectorAll('em').length === 3,
        preservedAnchor: fragment.querySelector('#chapter-1')?.textContent.includes('Business & Strategy'),
        subsection: fragment.querySelector('.concept h4')?.textContent === 'Intuition',
        outside: fragment.querySelector('.emerging-feature')?.previousElementSibling.matches('h2.chapter'),
        headingTags: [...fragment.querySelectorAll('.chapter')].every(h => h.tagName === 'H2')
      };
    });
    for (const [check, passed] of Object.entries(headingNormalization)) assert.ok(passed, check);
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
