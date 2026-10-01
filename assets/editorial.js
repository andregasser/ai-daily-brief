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
  normalizeConceptMarkup(article, retag);
  normalizeOutlookMarkup(article);
  normalizeEvidenceMarkup(article);
  normalizePriorityMarkup(article);
  decorateEditorialMarkup(article);
  article.querySelectorAll('.chapter').forEach(heading => {
    if (heading.querySelector(':scope > .chapter-title')) return;
    const title = editorialNode('span', 'chapter-title');
    [...heading.childNodes].filter(node => !node.classList?.contains('editorial-icon')).forEach(node => title.append(node));
    heading.append(title);
  });
}

function normalizePriorityMarkup(article) {
  const icons = {HIGH:'⭐', MEDIUM:'🔭', LOW:'📝', CRITICAL:'⚡'};
  article.querySelectorAll('.story').forEach(story => {
    const title = story.querySelector(':scope > h3');
    const meta = story.querySelector(':scope > .story-meta');
    if (!title || !meta) return;
    const priority = meta.querySelector('.priority');
    const level = priority?.dataset.displayLabel;
    if (icons[level]) {
      const row = editorialNode('div', 'story-priority');
      priority.dataset.priorityLevel = level.toLowerCase();
      const label = priority.textContent;
      const icon = editorialNode('span', 'editorial-icon', icons[level]);
      icon.setAttribute('aria-hidden', 'true');
      priority.replaceChildren(icon, document.createTextNode(label));
      row.append(priority);
      title.before(row);
    }
    // Keep the evidence buttons and their explanation in the same container.
    if (meta.textContent.trim()) {
      title.after(meta);
      story.classList.add('with-source-meta');
    } else {
      meta.remove();
    }
  });
}

function normalizeEvidenceMarkup(article) {
  const de = document.documentElement.lang === 'de';
  const types = {
    primary: ['📄', de ? 'Originalquelle' : 'Primary source', de ? 'Die Meldung ist durch eine Originalquelle belegt. Leistungsversprechen sind damit nicht unabhängig geprüft.' : 'The story is supported by an original source. This does not independently verify performance claims.'],
    vendor: ['📣', de ? 'Anbieterangabe' : 'Vendor claim', de ? 'Diese Aussage stammt vom Anbieter und ist nicht unabhängig bestätigt.' : 'This claim comes from the vendor and has not been independently confirmed.'],
    vendor_reported: ['📣', de ? 'Anbieterangabe' : 'Vendor claim', de ? 'Die Anbieterangabe wurde über Berichterstattung übernommen; sie ist nicht unabhängig bestätigt.' : 'The vendor claim was relayed through reporting; it has not been independently confirmed.'],
    independent: ['📰', de ? 'Unabhängig berichtet' : 'Independent reporting', de ? 'Die Meldung wird durch unabhängige Berichterstattung gestützt. Das ist kein unabhängiger Leistungstest.' : 'The story is supported by independent reporting. This is not an independent performance test.'],
    evaluation: ['🧪', de ? 'Unabhängiger Testbericht' : 'Independent evaluation', de ? 'Es liegt eine externe Bewertung vor. Ihre Aussagekraft gilt für die beschriebenen Tests und Bedingungen.' : 'An external evaluation is available. Its conclusions apply to the tests and conditions described.'],
    multiple: ['📰', de ? 'Mehrfach belegt' : 'Multiple sources', de ? 'Mehrere Quellen stützen die Meldung; einzelne Leistungsangaben können weiterhin Anbieterangaben sein.' : 'Multiple sources support the story; individual performance claims may still come from vendors.'],
    reported: ['📰', de ? 'Berichtet' : 'Reported', de ? 'Diese Einordnung beruht auf Berichterstattung; die Einschränkungen stehen im Artikel.' : 'This assessment is based on reporting; limitations are described in the article.'],
    early: ['🔭', de ? 'Frühes Signal' : 'Early signal', de ? 'Vorläufige Evidenz: Reifegrad und unabhängige Bestätigung sind noch offen.' : 'Preliminary evidence: maturity and independent confirmation remain open.']
  };
  const codes = {
    CONFIRMED_PRIMARY: ['primary'], PRIMARY: ['primary'], CONFIRMED_PRIMARY_SOURCES: ['primary'],
    VENDOR_CLAIM: ['vendor'], INDEPENDENT_REPORTING: ['independent'], INDEPENDENT: ['independent'],
    INDEPENDENT_EVALUATION: ['evaluation'], VENDOR_CLAIM_VIA_REPORTING: ['vendor_reported'],
    CONFIRMED_MULTIPLE: ['multiple'], MULTIPLE_REPORTING: ['multiple'], REPORTED: ['reported'],
    EARLY_SIGNAL: ['early'], EARLY_SIGNAL_PREPRINT: ['early'],
    CONFIRMED_PRIMARY_AND_INDEPENDENT_REPORTING: ['primary', 'independent'],
    CONFIRMED_PRIMARY_WITH_VENDOR_EVALUATION: ['primary', 'vendor'],
    CONFIRMED_PRIMARY_WITH_VENDOR_RESEARCH_CLAIM: ['primary', 'vendor']
  };
  article.querySelectorAll('.story-meta').forEach((meta, index) => {
    const priority = meta.querySelector('.priority:not([data-display-label])');
    const priorities = de ? {HIGH:'Fokus', MEDIUM:'Im Blick', LOW:'Kurz notiert', CRITICAL:'Besonders wichtig'}
      : {HIGH:'Focus', MEDIUM:'On the radar', LOW:'In brief', CRITICAL:'High priority'};
    if (priority && priorities[priority.textContent.trim()]) {
      priority.dataset.displayLabel = priority.textContent.trim();
      priority.textContent = priorities[priority.dataset.displayLabel];
    }
    const original = [...meta.querySelectorAll('.evidence')];
    if (!original.length) return;
    const help = editorialNode('span', 'evidence-explainer');
    help.id = `evidence-explanation-${index + 1}`;
    help.hidden = true;
    help.setAttribute('role', 'status');
    original.forEach(source => {
      const group = editorialNode('span', 'evidence-tags');
      const raw = source.textContent.trim();
      const parts = /^[A-Z_]+(?:\s*[\/+]\s*[A-Z_]+)+$/.test(raw) ? raw.split(/\s*[\/+]\s*/)
        : raw.split(/\s+[\/+]+\s+/);
      parts.forEach(part => {
        const code = part.trim().toUpperCase().replace(/[·\s-]+/g, '_');
        const keys = codes[code] || [null];
        keys.forEach(key => {
          const readable = part.trim().replace(/_/g, ' ');
          const label = readable === readable.toUpperCase() ? readable.charAt(0) + readable.slice(1).toLowerCase() : readable;
          const [symbol, text, description] = types[key] || ['🏷️', label, `${de ? 'Evidenzhinweis' : 'Evidence note'}: ${label}`];
          const badge = editorialNode('button', `source-tag source-${key || 'other'}`);
          badge.type = 'button';
          badge.dataset.evidenceCode = code;
          badge.title = description;
          badge.setAttribute('aria-expanded', 'false');
          badge.setAttribute('aria-controls', help.id);
          const icon = editorialNode('span', 'editorial-icon', symbol);
          icon.setAttribute('aria-hidden', 'true');
          badge.append(icon, document.createTextNode(text));
          badge.addEventListener('click', () => {
            const expanded = badge.getAttribute('aria-expanded') === 'true';
            meta.querySelectorAll('.source-tag').forEach(tag => tag.setAttribute('aria-expanded', 'false'));
            badge.setAttribute('aria-expanded', String(!expanded));
            help.textContent = description;
            help.hidden = expanded;
          });
          group.append(badge);
        });
      });
      source.replaceWith(group);
    });
    meta.append(help);
  });
}

function normalizeConceptMarkup(article, retag) {
  article.querySelectorAll('.concept:not(.concept-feature), .concept-story:not(.concept-feature)').forEach(concept => {
    concept.classList.add('concept-feature');
    let heading = concept.previousElementSibling;
    if (heading?.classList.contains('section-intro')) heading = heading.previousElementSibling;
    if (!heading?.matches('.chapter') || !/konzept des tages|concept of the day/i.test(heading.textContent)) {
      const label = concept.querySelector(':scope > .section-kicker, :scope > .concept-head > span');
      if (label && /konzept des tages|concept of the day/i.test(label.textContent)) {
        const parent = label.parentElement;
        heading = retag(label, 'h2');
        concept.before(heading);
        if (parent !== concept && !parent.textContent.trim()) parent.remove();
      } else {
        heading = editorialNode('h2', '', document.documentElement.lang === 'de' ? 'Konzept des Tages' : 'Concept of the Day');
        concept.before(heading);
      }
    }
    heading.classList.remove('section-kicker');
    heading.classList.add('chapter', 'concept-section-title');
    heading.textContent = /konzept/i.test(heading.textContent) ? 'Konzept des Tages' : 'Concept of the Day';
    const icon = editorialNode('span', 'editorial-icon', '🧠');
    icon.setAttribute('aria-hidden', 'true');
    heading.prepend(icon);
    // The concept topic and its subsections sit beneath the chapter heading.
    const legacy = concept.classList.contains('concept-story');
    const topic = concept.querySelector(legacy ? ':scope > h3' : ':scope > h2');
    if (!legacy) concept.querySelectorAll(':scope > h3').forEach(subheading => retag(subheading, 'h4'));
    if (topic) (topic.tagName === 'H3' ? topic : retag(topic, 'h3')).classList.add('concept-topic-title');
  });
}

function normalizeOutlookMarkup(article) {
  const hosts = new Set(article.querySelectorAll('.next, .watch, .watch-grid'));
  article.querySelectorAll('.chapter, .next > h2, .next > .section-kicker, .watch > .section-kicker').forEach(heading => {
    if (!/was als nächstes wichtig wird|what (?:comes|matters) next/i.test(heading.textContent)) return;
    heading.classList.add('outlook-heading');
    let host = heading.closest('.brief-chapter, .next, .watch') || heading.nextElementSibling;
    if (host?.classList.contains('section-intro')) host = host.nextElementSibling;
    if (host) hosts.add(host);
  });
  hosts.forEach(host => {
    host.classList.add('outlook');
    if (host.classList.contains('story')) host.classList.add('outlook-story');
    host.querySelectorAll(':scope > .story').forEach(story => story.classList.add('outlook-story'));
    const lists = host.classList.contains('watch-grid') ? [host]
      : [...host.querySelectorAll(':scope > ol, :scope > ul, :scope > .story > ol, :scope > .story > ul')];
    lists.forEach(list => {
      list.classList.add('outlook-list');
      // Preserve list semantics when custom cards replace the browser's markers.
      list.setAttribute('role', 'list');
      [...list.children].forEach(item => {
        if (item.classList.contains('outlook-item')) return;
        item.classList.add('outlook-item');
        if (item.tagName !== 'LI') item.setAttribute('role', 'listitem');
        const copy = editorialNode('div', 'outlook-copy');
        copy.append(...item.childNodes);
        let title = copy.querySelector(':scope > strong, :scope > h3');
        if (title && title.tagName !== 'H3') {
          const heading = editorialNode('h3');
          for (const attr of title.attributes) heading.setAttribute(attr.name, attr.value);
          heading.append(...title.childNodes);
          title.replaceWith(heading);
          title = heading;
        }
        if (!title) {
          const opening = [...copy.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
          const split = opening?.textContent.indexOf(':') ?? -1;
          if (split > 0 && split < 140) {
            title = editorialNode('h3', '', opening.textContent.slice(0, split).trim());
            opening.textContent = opening.textContent.slice(split + 1);
            copy.prepend(title);
          }
        }
        if (title) {
          title.classList.add('outlook-title');
          const head = editorialNode('div', 'outlook-item-head');
          head.append(title);
          // Separate only an explicitly written deadline; never infer a date.
          const deadline = !title.children.length && title.textContent.match(/^(.*?)\s+((?:bis|by)\s+(?:\d|January|February|March|April|May|June|July|August|September|October|November|December|Januar|Februar|März|Mai|Juni|Juli|Oktober|Dezember)[^:]*):?$/i);
          if (deadline) {
            title.textContent = deadline[1];
            head.append(document.createTextNode(' '), editorialNode('span', 'outlook-deadline', deadline[2]));
          }
          copy.prepend(head);
        }
        const body = editorialNode('div', 'outlook-body');
        [...copy.childNodes].filter(node => !node.classList?.contains('outlook-item-head')).forEach(node => body.append(node));
        copy.append(body);
        const text = copy.textContent.toLowerCase();
        const symbol = /ftc|regulat|gesetz|court|safety|sicherheit/.test(text) ? '⚖️'
          : /synopsys|harness|werkzeug|sdk/.test(text) ? '🛠️'
          : /synthid|bio|replik|reproduc|benchmark/.test(text) ? '🔬'
          : /argon|model|modell/.test(text) ? '🧠' : '🔭';
        const icon = editorialNode('span', 'editorial-icon outlook-symbol', symbol);
        icon.setAttribute('aria-hidden', 'true');
        item.append(icon, copy);
      });
    });
  });
}

function decorateEditorialMarkup(article) {
  const addIcon = (label, symbol) => {
    if (!label || label.querySelector('.editorial-icon') || /\p{Extended_Pictographic}/u.test(label.textContent)) return;
    const icon = editorialNode('span', 'editorial-icon', symbol);
    icon.setAttribute('aria-hidden', 'true');
    label.prepend(icon);
  };
  const callouts = {changed:'✨', why:'🎯', engineering:'🛠️', 'builder-action':'🛠️', thesis:'💡', 'signal-hype':'⚖️'};
  Object.entries(callouts).forEach(([className, icon]) => {
    article.querySelectorAll('.' + className).forEach(block => {
      block.classList.add('editorial-callout');
      addIcon(block.querySelector(':scope > strong, :scope > h3'), icon);
    });
  });
  article.querySelectorAll('.chapter, .concept > .section-kicker, .executive > h2, .next > .section-kicker, .outlook-heading').forEach(label => {
    const title = label.textContent.toLowerCase();
    const icon = /60/.test(title) ? '⚡' : /business|strategie|strategy/.test(title) ? '💼'
      : /konzept|concept/.test(title) ? '🧠' : /research|forschung/.test(title) ? '🔬'
      : /engineering|builder|modelle|models/.test(title) ? '🛠️' : '🔭';
    addIcon(label, icon);
  });
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
    const visualClass = illustration.visual_class === 'data-visualization' ? 'data-visualization' : 'explanatory-diagram';
    const figure = editorialNode('figure', 'lead-illustration visual-' + visualClass);
    const img = document.createElement('img');
    img.src = typeof illustration.src === 'string' ? illustration.src : illustration.src?.[language];
    img.alt = illustration.alt?.[language] || '';
    img.width = 620; img.height = 500;
    const caption = editorialNode('figcaption');
    caption.append(editorialNode('strong', '', illustration.caption?.[language] || ''));
    caption.append(editorialNode('span', '', de ? 'AI Daily Brief · Eigene Grafik' : 'AI Daily Brief · Original graphic'));
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
  const chapters = [...article.querySelectorAll('h2.chapter, h3.chapter')];
  chapters.forEach((chapter, index) => {
    if (!chapter.id) chapter.id = `chapter-${index + 1}`;
    chapter.dataset.number = String(index + 1).padStart(2, '0');
    const label = chapter.cloneNode(true);
    label.querySelectorAll('.editorial-icon').forEach(icon => icon.remove());
    const link = editorialNode('a', '', `${chapter.dataset.number} / ${label.textContent}`);
    link.href = `#${chapter.id}`;
    navigation.append(link);
  });
  document.getElementById('edition-navigation').hidden = !chapters.length;
  // Keep the complete editorial introduction, but the cover already displays its headline.
  if (intro) intro.classList.add('cover-introduction');
}
