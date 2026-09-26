// Dedicated concept routes reuse only the authored concept, never the full edition.
(() => {
  const params = new URLSearchParams(location.search);
  let stored;
  try { stored = localStorage.getItem('lang'); } catch { /* Optional storage. */ }
  let lang = params.get('lang') || stored;
  if (!['de', 'en'].includes(lang)) lang = 'de';
  let request = 0;
  const detail = document.body.classList.contains('concept-page');
  const root = document.getElementById(detail ? 'concept-content' : 'concepts');
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const data = fetch('data/concepts.json').then(response => {
    if (!response.ok) throw new Error('Concept data unavailable');
    return response.json();
  });
  function chrome() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-de]').forEach(el => el.textContent = el.dataset[lang]);
    document.querySelectorAll('[data-lang]').forEach(button => {
      button.classList.toggle('active', button.dataset.lang === lang);
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    });
    document.querySelectorAll('a[href]').forEach(a => {
      const url = new URL(a.href);
      if (url.origin === location.origin) { url.searchParams.set('lang', lang); a.href = url.href; }
    });
  }
  async function render() {
    const current = ++request, language = lang, de = language === 'de';
    const txt = value => typeof value === 'string' ? value : value?.[language] || value?.en || value?.de || '';
    chrome();
    root.setAttribute('aria-busy', 'true');
    root.replaceChildren();
    if (detail) {
      document.getElementById('concept-summary').textContent = '';
      document.getElementById('concept-meta').textContent = '';
    }
    try {
      const { concepts = [] } = await data;
      if (current !== request) return;
      if (!detail) {
        document.getElementById('count').textContent = `${concepts.length} ${de ? 'Konzepte' : 'concepts'}`;
        const cards = [...concepts].sort((a,b) => String(b.first_seen || '').localeCompare(String(a.first_seen || ''))).map(c => {
          const card = node('article', 'card'), h2 = node('h2');
          const href = `concept.html?id=${encodeURIComponent(c.id)}&lang=${language}`;
          const title = node('a', '', txt(c.title) || c.id); title.href = href; h2.append(title);
          const read = node('a', 'read', de ? 'Konzept verstehen →' : 'Explore concept →'); read.href = href;
          const tags = node('div', 'tags'); tags.append(...(c.tags || []).map(tag => node('span','tag',tag)));
          card.append(node('div','meta',c.first_seen || ''), h2, node('p','summary',txt(c.summary)), read, tags);
          return card;
        });
        root.replaceChildren(...(cards.length ? cards : [node('p','empty',de ? 'Noch keine Konzepte vorhanden.' : 'No concepts yet.')]));
        return;
      }
      const concept = concepts.find(c => c.id === params.get('id'));
      if (!concept) {
        document.getElementById('concept-title').textContent = de ? 'Konzept nicht gefunden.' : 'Concept not found.';
        document.title = `${de ? 'Konzept nicht gefunden' : 'Concept not found'} — AI Daily Brief`;
        root.append(node('p','empty',de ? 'Dieses Konzept gibt es noch nicht. Wähle ein Konzept aus der Concept Library.' : 'This concept does not exist yet. Choose a concept from the Concept Library.'));
        return;
      }
      const title = txt(concept.title) || concept.id;
      document.getElementById('concept-title').textContent = title;
      document.getElementById('concept-summary').textContent = txt(concept.summary);
      document.title = `${title} — Concept Library`;
      document.querySelector('meta[name="description"]').content = txt(concept.summary);
      const path = concept.briefing?.[language];
      if (!path) throw new Error('Explanation unavailable');
      const response = await fetch(path);
      if (!response.ok) throw new Error('Explanation unavailable');
      const html = await response.text();
      if (current !== request) return;
      const source = new DOMParser().parseFromString(html, 'text/html');
      const explanation = source.querySelector('.concept, .concept-story');
      if (!explanation) throw new Error('Explanation unavailable');
      const legacyStory = explanation.classList.contains('concept-story');
      explanation.classList.remove('story', 'concept-story', 'lead-story', 'brief-story');
      explanation.classList.add('concept');
      // Older concepts were stories with an h3 title and h4 subheadings.
      // Keep every explanatory paragraph, code block, diagram and source link.
      explanation.querySelectorAll(':scope > .concept-head, :scope > .section-kicker, :scope > .story-meta').forEach(el => el.remove());
      explanation.querySelector(legacyStory ? ':scope > h3' : ':scope > h2')?.remove();
      explanation.querySelectorAll(legacyStory ? ':scope > h4' : ':scope > h3').forEach(heading => {
        const h2 = source.createElement('h2');
        for (const attribute of heading.attributes) h2.setAttribute(attribute.name, attribute.value);
        h2.append(...heading.childNodes); heading.replaceWith(h2);
      });
      explanation.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href.startsWith('?date=')) return;
        const date = new URLSearchParams(href.split('#')[0]).get('date');
        const related = concepts.find(item => item.first_seen === date);
        link.href = related
          ? `concept.html?id=${encodeURIComponent(related.id)}&lang=${language}`
          : `./?date=${encodeURIComponent(date)}&lang=${language}#brief`;
      });
      root.append(document.importNode(explanation, true));
      document.getElementById('concept-meta').textContent = `${de ? 'Stand' : 'Updated'}: ${concept.last_seen || concept.first_seen || ''}`;
    } catch {
      if (current !== request) return;
      if (detail) document.getElementById('concept-title').textContent = de ? 'Erklärung momentan nicht verfügbar.' : 'Explanation currently unavailable.';
      const box = node('div', 'load-error'); box.setAttribute('role','alert');
      box.append(node('p','',de ? 'Die Inhalte konnten nicht geladen werden. Bitte versuche es erneut.' : 'The content could not be loaded. Please try again.'));
      const retry = node('button','',de ? 'Erneut laden' : 'Try again'); retry.type = 'button'; retry.onclick = () => location.reload(); box.append(retry); root.append(box);
    } finally {
      if (current === request) root.setAttribute('aria-busy', 'false');
    }
  }
  document.querySelectorAll('[data-lang]').forEach(button => button.onclick = () => {
    lang = button.dataset.lang;
    try { localStorage.setItem('lang', lang); } catch { /* URL retains language. */ }
    const url = new URL(location.href); url.searchParams.set('lang', lang); history.replaceState({}, '', url);
    render();
  });
  render();
})();
