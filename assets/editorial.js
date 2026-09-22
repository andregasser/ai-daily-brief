/* Optional art direction is keyed by edition date; future editions use their own content. */
const editionCovers = fetch('data/covers.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));

function editorialNode(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function controlStackVisual(language) {
  const de = language === 'de';
  const figure = editorialNode('figure', 'cover-diagram editorial-visual visual-explanatory-diagram');
  figure.innerHTML = `
    <div class="cover-diagram-label"><span>${de ? 'Die Kontrollschichten' : 'The control layers'}</span><span>System / 01</span></div>
    <svg viewBox="0 0 400 350" role="img" aria-labelledby="stack-title stack-description">
      <title id="stack-title">${de ? 'Kontrolle über den AI-Stack' : 'Control across the AI stack'}</title>
      <desc id="stack-description">${de ? 'Schematische Verbindung von Modellen, Compute und Cloud innerhalb einer Plattform. Keine quantitativen Beziehungen.' : 'A schematic connection between models, compute and cloud within one platform. This is not a quantitative chart.'}</desc>
      <g fill="none" stroke="#606a4d" stroke-width="1"><circle cx="200" cy="180" r="140"/><ellipse cx="200" cy="180" rx="140" ry="51" transform="rotate(55 200 180)"/><ellipse cx="200" cy="180" rx="140" ry="51" transform="rotate(-55 200 180)"/><ellipse cx="200" cy="180" rx="140" ry="51"/><path d="M200 18V343M40 180H360" opacity=".6"/></g>
      <g fill="none" stroke="#d5eb73" stroke-width="2"><path d="M200 57V133M310 244L237 204M89 244L163 204"/></g>
      <circle cx="200" cy="180" r="58" fill="#d5eb73"/>
      <g fill="#252d13" text-anchor="middle" font-family="'Barlow Condensed',sans-serif" font-size="29" font-weight="700"><text x="200" y="175">CONTROL</text><text x="200" y="203">PLANE</text></g>
      <g fill="#171b12" stroke="#d5eb73"><rect x="144" y="20" width="112" height="37"/><rect x="265" y="244" width="114" height="37"/><rect x="23" y="244" width="107" height="37"/></g>
      <g fill="#f3f2de" text-anchor="middle" font-family="monospace" font-size="20"><text x="200" y="45">${de ? 'MODELLE' : 'MODELS'}</text><text x="322" y="269">COMPUTE</text><text x="76" y="269">CLOUD</text></g>
      <circle cx="308" cy="93" r="5" fill="#ff7950"/><circle cx="94" cy="91" r="3" fill="#d5eb73"/>
    </svg>
    <figcaption><span>Alibaba · Full-Stack AI<br>AI Daily Brief · ${de ? 'Eigene Grafik · Erklärdiagramm' : 'Original graphic · Explanatory diagram'}<br><a href="https://www.alibabacloud.com/blog/alibaba-positions-for-accelerated-ai-growth-in-second-half-of-2026_603316">${de ? 'Quelle: Alibaba Cloud ↗' : 'Source: Alibaba Cloud ↗'}</a></span><strong>${de ? 'Roadmap ≠ Leistungsnachweis' : 'Roadmap ≠ verified performance'}</strong></figcaption>`;
  return figure;
}

function renderEditionCover(article, meta, language, covers) {
  const de = language === 'de';
  const cover = covers?.[meta.date];
  const title = document.getElementById('cover-title');
  const intro = article.querySelector('.briefing-intro');
  const heading = intro?.querySelector('h2')?.textContent || meta.headline?.[language] || 'AI Daily Brief';
  const lines = cover?.title?.[language];
  title.classList.toggle('long-title', !lines);
  title.replaceChildren(...(lines ? lines.map((line, i) => editorialNode('span', i === 1 ? 'outline' : '', line)) : [document.createTextNode(heading)]));
  document.getElementById('cover-kicker').textContent = cover?.kicker?.[language] || (de ? 'Die Leitgeschichte / ' : 'The lead story / ') + meta.date;
  const text = intro?.querySelector('p')?.textContent || '';
  const excerpt = text.length > 230 ? text.slice(0, 230).replace(/\s+\S*$/, '') + ' …' : text;
  document.getElementById('cover-deck').textContent = cover?.deck?.[language] || excerpt;
  document.getElementById('edition-label').textContent = new URLSearchParams(location.search).has('date') ? (de ? 'Aus dem Archiv' : 'From the archive') : (de ? 'Die tägliche Dosis Klarheit' : 'Your daily dose of clarity');
  document.title = `${heading} — AI Daily Brief`;

  const visual = document.getElementById('cover-visual');
  visual.replaceChildren();
  if (cover?.visual === 'control-stack') {
    visual.append(controlStackVisual(language));
  } else {
    const list = editorialNode('div', 'cover-story-list');
    list.append(editorialNode('div', 'cover-diagram-label', de ? 'In dieser Ausgabe' : 'Inside this edition'));
    const signals = [...article.querySelectorAll('.executive .signal-grid > div')].slice(0, 3);
    const stories = [...article.querySelectorAll('.story h3')].slice(0, 3);
    (signals.length ? signals : stories).forEach((item, index) => {
      const row = editorialNode('div', 'cover-story-row');
      row.append(editorialNode('span', 'cover-story-number', String(index + 1).padStart(2, '0')));
      row.append(editorialNode('strong', '', item.querySelector('span')?.textContent || item.textContent));
      list.append(row);
    });
    if (!signals.length && !stories.length) list.append(editorialNode('p', '', de ? 'Signal statt Hype.' : 'Signal over hype.'));
    visual.append(list);
  }
  const strip = document.getElementById('edition-signals');
  const signals = cover?.signals?.[language] || [...article.querySelectorAll('.executive .signal-grid > div > strong')].slice(0, 3).map(el => el.textContent.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').trim());
  strip.replaceChildren(...signals.map(signal => editorialNode('span', '', signal)));
  strip.hidden = !signals.length;
  document.querySelector('.edition-cover').setAttribute('aria-busy', 'false');

  const navigation = document.getElementById('chapter-links');
  navigation.replaceChildren();
  article.querySelectorAll('.executive .signal-grid > div > strong').forEach(label => {
    label.textContent = label.textContent.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').trim();
  });
  const chapters = [...article.querySelectorAll('.chapter')];
  chapters.forEach((chapter, index) => {
    if (!chapter.id) chapter.id = `chapter-${index + 1}`;
    chapter.dataset.number = String(index + 1).padStart(2, '0');
    chapter.textContent = chapter.textContent.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').trim();
    const link = editorialNode('a', '', `${chapter.dataset.number} / ${chapter.textContent}`);
    link.href = `#${chapter.id}`;
    navigation.append(link);
  });
  document.getElementById('edition-navigation').hidden = !chapters.length;
  // Keep the complete editorial introduction, but the cover already displays its headline.
  if (intro) intro.classList.add('cover-introduction');
}
