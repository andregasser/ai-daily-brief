/* Optional art direction is keyed by edition date; future editions use their own content. */
const editionCovers = fetch('data/covers.json', {cache: 'no-store'}).then(r => r.ok ? r.json() : {}).catch(() => ({}));

function editorialNode(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Daily fragments use both standalone chapter headings and chapter containers.
// Normalize their roles before styling or building the cover/navigation. Never
// replace a container's textContent: that would destroy its articles and links.
function normalizeEditorialMarkup(article) {
  const retag = (node, tag) => {
    const replacement = document.createElement(tag);
    for (const attr of node.attributes) replacement.setAttribute(attr.name, attr.value);
    replacement.append(...node.childNodes);
    node.replaceWith(replacement);
    return replacement;
  };
  article.querySelectorAll('.chapter:not(h2):not(h3)').forEach(section => {
    section.classList.replace('chapter', 'brief-chapter');
    const label = section.querySelector(':scope > .section-kicker, :scope > h2, :scope > h3');
    if (!label) return;
    const heading = label.tagName === 'H2' ? label : retag(label, 'h2');
    heading.classList.remove('section-kicker');
    heading.classList.add('chapter');
  });
  article.querySelectorAll('.executive > .section-kicker').forEach(h => {
    const heading = retag(h, 'h2');
    heading.classList.remove('section-kicker');
  });
  const executive = article.querySelector('.executive');
  if (executive) article.prepend(executive);
  article.querySelectorAll('.briefing-intro > h1').forEach(h => retag(h, 'h2'));
  article.querySelectorAll('.story > h2').forEach(h => retag(h, 'h3'));
  article.querySelectorAll('.signal-grid > div').forEach(card => {
    if (card.querySelector(':scope > .signal-title')) return;
    const label = card.querySelector(':scope > strong');
    const legacyTitle = card.querySelector(':scope > span');
    const title = legacyTitle || label;
    if (!title) return;
    if (legacyTitle && label) label.classList.add('signal-label');
    const heading = retag(title, 'h3');
    heading.classList.add('signal-title');
    // Older editions already have paragraphs; newer ones use strong + br + text.
    if (!legacyTitle && !card.querySelector(':scope > p')) {
      const body = editorialNode('p');
      while (heading.nextSibling) body.append(heading.nextSibling);
      while (body.firstChild && (body.firstChild.nodeName === 'BR' ||
        (body.firstChild.nodeType === Node.TEXT_NODE && !body.firstChild.textContent.trim()))) {
        body.firstChild.remove();
      }
      if (body.hasChildNodes()) card.append(body);
    }
  });
}

function cleanEditorialLabel(label) {
  const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    walker.currentNode.textContent = walker.currentNode.textContent.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '');
  }
}

function renderEditionCover(article, meta, language, covers) {
  const de = language === 'de';
  const cover = covers?.[meta.date];
  const title = document.getElementById('cover-title');
  const intro = article.querySelector('.briefing-intro');
  const heading = intro?.querySelector('h2')?.textContent || meta.headline?.[language] || 'AI Daily Brief';
  title.classList.add('long-title');
  title.textContent = heading;
  document.getElementById('cover-kicker').textContent = cover?.kicker?.[language] || (de ? 'Die Leitgeschichte / ' : 'The lead story / ') + meta.date;
  const text = intro?.querySelector('p')?.textContent || '';
  const excerpt = text.length > 230 ? text.slice(0, 230).replace(/\s+\S*$/, '') + ' …' : text;
  document.getElementById('cover-deck').textContent = cover?.deck?.[language] || excerpt;
  document.getElementById('edition-label').textContent = new URLSearchParams(location.search).has('date') ? (de ? 'Aus dem Archiv' : 'From the archive') : (de ? 'Die tägliche Dosis Klarheit' : 'Your daily dose of clarity');
  document.title = `${heading} — AI Daily Brief`;

  const coverElement = document.querySelector('.edition-cover');
  coverElement.querySelector('.lead-illustration')?.remove();
  const illustration = cover?.illustration;
  coverElement.classList.toggle('with-illustration', !!illustration);
  document.getElementById('back-to-cover').hidden = !illustration;
  if (illustration) {
    const figure = editorialNode('figure', 'lead-illustration visual-explanatory-diagram');
    const img = document.createElement('img');
    img.src = illustration.src;
    img.alt = illustration.alt?.[language] || '';
    img.width = 620; img.height = 500;
    const caption = editorialNode('figcaption');
    caption.append(editorialNode('strong', '', illustration.caption?.[language] || ''));
    caption.append(editorialNode('span', '', de ? 'AI Daily Brief · Eigene Grafik · Erklärdiagramm' : 'AI Daily Brief · Original graphic · Explanatory diagram'));
    const sources = editorialNode('span', 'illustration-sources', de ? 'Grundlage: ' : 'Based on: ');
    (illustration.sources || []).forEach((source, i) => {
      if (i) sources.append(document.createTextNode(' / '));
      const link = editorialNode('a', '', source.label); link.href = source.href; sources.append(link);
    });
    caption.append(sources); figure.append(img, caption); coverElement.append(figure);
  }
  coverElement.setAttribute('aria-busy', 'false');

  const navigation = document.getElementById('chapter-links');
  navigation.replaceChildren();
  article.querySelectorAll('.executive .signal-label').forEach(cleanEditorialLabel);
  const chapters = [...article.querySelectorAll('h2.chapter, h3.chapter')];
  chapters.forEach((chapter, index) => {
    if (!chapter.id) chapter.id = `chapter-${index + 1}`;
    chapter.dataset.number = String(index + 1).padStart(2, '0');
    cleanEditorialLabel(chapter);
    const link = editorialNode('a', '', `${chapter.dataset.number} / ${chapter.textContent}`);
    link.href = `#${chapter.id}`;
    navigation.append(link);
  });
  document.getElementById('edition-navigation').hidden = !chapters.length;
  // Keep the complete editorial introduction, but the cover already displays its headline.
  if (intro) intro.classList.add('cover-introduction');
}
