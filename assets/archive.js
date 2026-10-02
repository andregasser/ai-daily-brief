// The archive listing has its own route; daily pages only resolve the selected edition.
(() => {
  const params = new URLSearchParams(location.search);
  let stored;
  try { stored = localStorage.getItem('lang'); } catch { /* Optional storage. */ }
  let lang = params.get('lang') || stored;
  if (!['de', 'en'].includes(lang)) lang = 'de';
  let request = 0;
  const root = document.getElementById('archive-list');
  const count = document.getElementById('archive-count');
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  async function render() {
    const current = ++request, language = lang, de = language === 'de';
    document.documentElement.lang = language;
    document.title = `${de ? 'Archiv' : 'Archive'} — AI Daily Brief`;
    document.querySelector('meta[name="description"]').content = de
      ? 'Alle Ausgaben des AI Daily Brief: Entwicklungen, Quellen und technische Konzepte im Rückblick.'
      : 'Every AI Daily Brief edition: developments, sources and technical concepts in retrospect.';
    document.querySelectorAll('[data-de]').forEach(el => el.textContent = el.dataset[language]);
    document.querySelectorAll('[data-lang]').forEach(button => {
      button.classList.toggle('active', button.dataset.lang === language);
      button.setAttribute('aria-pressed', String(button.dataset.lang === language));
    });
    document.querySelectorAll('a[href]').forEach(a => {
      const url = new URL(a.href);
      if (url.origin === location.origin) { url.searchParams.set('lang', language); a.href = url.href; }
    });
    root.setAttribute('aria-busy', 'true');
    root.replaceChildren(node('p', 'loading', de ? 'Archiv wird geladen …' : 'Loading archive …'));
    count.textContent = '';
    try {
      const response = await fetch('data/archive.json', {cache: 'no-store'});
      if (!response.ok) throw new Error('Archive unavailable');
      const items = await response.json();
      if (!Array.isArray(items)) throw new Error('Invalid archive');
      if (current !== request) return;
      const rows = [...items].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((item, index) => {
        const link = node('a', 'archive-card');
        link.href = `./?date=${encodeURIComponent(item.date)}&lang=${language}#edition`;
        link.append(node('span', 'archive-num', String(index + 1).padStart(2, '0')));
        const date = node('time', 'archive-date', item.date); date.dateTime = item.date;
        link.append(date, node('strong', '', item.headline?.[language] || 'AI Daily Brief'));
        const concept = item.concept?.[language];
        link.append(node('span', 'archive-action', [(item.tags || []).slice(0, 3).join(' · '), concept ? (de ? 'Konzept: ' : 'Concept: ') + concept : '', de ? 'Ausgabe lesen ↗' : 'Read edition ↗'].filter(Boolean).join(' · ')));
        return link;
      });
      count.textContent = `${items.length} ${de ? (items.length === 1 ? 'Ausgabe' : 'Ausgaben') : (items.length === 1 ? 'edition' : 'editions')}`;
      root.replaceChildren(...(rows.length ? rows : [node('p', 'empty', de ? 'Noch keine archivierten Ausgaben.' : 'No archived editions yet.')]));
    } catch {
      if (current !== request) return;
      const box = node('div', 'load-error'); box.setAttribute('role', 'alert');
      box.append(node('p', '', de ? 'Archiv momentan nicht verfügbar. Bitte versuche es erneut.' : 'Archive currently unavailable. Please try again.'));
      const retry = node('button', '', de ? 'Erneut laden' : 'Try again');
      retry.type = 'button'; retry.onclick = render; box.append(retry); root.replaceChildren(box);
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
