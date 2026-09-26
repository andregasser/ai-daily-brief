const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const params = new URLSearchParams(location.search), requestedDate = params.get('date');
let storedLanguage;
try { storedLanguage = localStorage.getItem('lang'); } catch { /* Storage is optional. */ }
const initialLanguage = params.get('lang') || storedLanguage;
let lang = ['de', 'en'].includes(initialLanguage) ? initialLanguage : 'de';
let briefRequest = 0;
function translate() {
  document.documentElement.lang = lang;
  $$('[data-de]').forEach(el => el.textContent = el.dataset[lang]);
  $$('[data-lang]').forEach(button => {
    button.classList.toggle('active', button.dataset.lang === lang);
    button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
  });
  document.querySelectorAll('a[href]').forEach(a => {
    const url = new URL(a.href);
    if (url.origin === location.origin && /\/(concepts\.html|weekly\/)$/.test(url.pathname)) {
      url.searchParams.set('lang', lang); a.href = url.href;
    }
  });
  loadBrief(); loadArchive(); loadTrends();
}
$$('[data-lang]').forEach(button => button.onclick = () => {
  lang = button.dataset.lang;
  try { localStorage.setItem('lang', lang); } catch { /* The URL still preserves the choice. */ }
  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  history.replaceState({}, '', url);
  translate();
});
const sectionIntros={'business':{de:'Die wichtigsten Unternehmens-, Markt- und Strategieentwicklungen – mit Fokus darauf, was Geschäftsmodelle, Wettbewerb und den Aufbau von AI-Produkten tatsächlich verändert.',en:'The most important company, market and strategy developments — focused on what actually changes business models, competition and the building of AI products.'},'strategie':{de:'Die wichtigsten Unternehmens-, Markt- und Strategieentwicklungen – mit Fokus darauf, was Geschäftsmodelle, Wettbewerb und den Aufbau von AI-Produkten tatsächlich verändert.',en:'The most important company, market and strategy developments — focused on what actually changes business models, competition and the building of AI products.'},'modelle':{de:'Neue Modelle, Agents, Inference-Stacks und Developer-Tools – technisch eingeordnet nach praktischer Relevanz, Reifegrad, Kosten und Einsatzmöglichkeiten.',en:'New models, agents, inference stacks and developer tools — assessed by practical relevance, maturity, cost and deployment implications.'},'agents':{de:'Neue Modelle, Agents, Inference-Stacks und Developer-Tools – technisch eingeordnet nach praktischer Relevanz, Reifegrad, Kosten und Einsatzmöglichkeiten.',en:'New models, agents, inference stacks and developer tools — assessed by practical relevance, maturity, cost and deployment implications.'},'engineering':{de:'Neue Modelle, Agents, Inference-Stacks und Developer-Tools – technisch eingeordnet nach praktischer Relevanz, Reifegrad, Kosten und Einsatzmöglichkeiten.',en:'New models, agents, inference stacks and developer tools — assessed by practical relevance, maturity, cost and deployment implications.'},'builder radar':{de:'Konkrete Technologien, Tools oder Methoden, die für AI- und Software-Engineers einen eigenen Test wert sind – inklusive Blick auf Reifegrad und sinnvolle Evaluationskriterien.',en:'Concrete technologies, tools or methods worth testing for AI and software engineers — including maturity and useful evaluation criteria.'},'research digest':{de:'Ausgewählte Forschung mit möglicher praktischer oder architektonischer Bedeutung. Kein Paper-Feed: nur Arbeiten, die einen relevanten neuen Ansatz, Befund oder Builder-Impuls liefern.',en:'Selected research with potential practical or architectural significance. Not a paper feed: only work that offers a relevant new approach, finding or builder signal.'},'open source radar':{de:'Open-Source-Projekte und Releases, die über kurzfristigen Hype hinaus technisch interessant werden könnten – bewertet nach Reife, Wartung, Reproduzierbarkeit und Produktionsnähe.',en:'Open-source projects and releases that may matter beyond short-term hype — assessed by maturity, maintenance, reproducibility and production readiness.'},'konzept des tages':{de:'Ein technisches Konzept hinter den aktuellen Entwicklungen – von der Intuition über die Architektur bis zur konkreten Bedeutung für AI-Systeme und Software Engineering.',en:'A technical concept behind current developments — from intuition and architecture to concrete implications for AI systems and software engineering.'},'concept of the day':{de:'Ein technisches Konzept hinter den aktuellen Entwicklungen – von der Intuition über die Architektur bis zur konkreten Bedeutung für AI-Systeme und Software Engineering.',en:'A technical concept behind current developments — from intuition and architecture to concrete implications for AI systems and software engineering.'},'was als nächstes':{de:'Konkrete Entwicklungen, die wir als Nächstes beobachten. Diese Punkte werden in späteren Ausgaben wieder aufgegriffen, sobald neue Evidenz vorliegt.',en:'Concrete developments we are watching next. These items are revisited in later editions when new evidence emerges.'},'what to watch':{de:'Konkrete Entwicklungen, die wir als Nächstes beobachten. Diese Punkte werden in späteren Ausgaben wieder aufgegriffen, sobald neue Evidenz vorliegt.',en:'Concrete developments we are watching next. These items are revisited in later editions when new evidence emerges.'}};
function addSectionIntro(h){if(h.nextElementSibling?.classList.contains('section-intro'))return;const t=h.textContent.toLowerCase(),key=Object.keys(sectionIntros).find(k=>t.includes(k));if(key)h.insertAdjacentHTML('afterend',`<p class="section-intro">${sectionIntros[key][lang]}</p>`)}
function enhanceEditorial(article){const stories=[...article.querySelectorAll('.story')];stories.forEach((s,i)=>{const meta=(s.querySelector('.story-meta')?.textContent||'').toLowerCase();if(i===0&&!s.classList.contains('lead-story'))s.classList.add('lead-story');if(i>2&&!s.classList.contains('lead-story'))s.classList.add('brief-story');if(meta.includes('emerging signal'))s.classList.add('emerging-story');if(meta.includes('red-team'))s.classList.add('qa-story');if(meta.includes('agent memory security')||meta.includes('agent monitoring'))s.classList.add('research-story')});article.querySelectorAll('.evidence').forEach(e=>{const t=e.textContent.toLowerCase();if(t.includes('reported')||t.includes('vendor')||t.includes('early'))e.classList.add('attention')});article.querySelectorAll('.signal-hype').forEach(x=>x.classList.add('contrarian'));article.querySelectorAll('.signal-box').forEach(x=>x.classList.add('intelligence-callout','emerging-callout'));article.querySelectorAll('.builder-action').forEach(x=>x.classList.add('intelligence-callout'));article.querySelectorAll('.digest').forEach(x=>x.classList.add('research-tone'));article.querySelectorAll('.oss-radar').forEach(x=>x.classList.add('builder-tone'));[...article.querySelectorAll('.chapter')].forEach(h=>{const t=h.textContent.toLowerCase();if(t.includes('builder radar')){h.classList.add('builder-heading');const grid=h.nextElementSibling;if(grid?.classList.contains('signal-grid'))grid.classList.add('builder-radar-grid')}if(t.includes('research digest'))h.classList.add('research-heading');if(t.includes('konzept')||t.includes('concept of the day'))h.classList.add('concept-heading');addSectionIntro(h)});const concept=article.querySelector('.concept');if(concept&&!concept.querySelector('.concept-related'))concept.insertAdjacentHTML('beforeend',`<div class="concept-related"><span>${lang==='de'?'WEITERLERNEN':'KEEP LEARNING'}</span><a href="concepts.html?lang=${lang}">${lang==='de'?'Concept Library öffnen →':'Open Concept Library →'}</a></div>`);hydrateBriefVisuals(article)}
async function hydrateBriefVisuals(article){
  const visualLang=lang;
  const localized=value=>typeof value==='string'?value:value?.[visualLang]||value?.en||'';
  const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node};
  const heatmaps=[...article.querySelectorAll('[data-visual="trend-heatmap"]')];
  if(heatmaps.length){
    try{
      const response=await fetch('data/trends.json?'+Date.now());
      if(!response.ok)throw new Error('Trend data unavailable');
      const data=await response.json(),trends=Array.isArray(data)?data:(data?.topics||data?.trends||[]);
      if(!Array.isArray(trends))throw new Error('Invalid trend data');
      heatmaps.forEach(box=>{
        const limit=Math.max(1,Math.min(8,Number(box.dataset.limit)||6));
        const scoreOf=t=>Math.max(0,Math.min(10,Number(t.score)||0));
        const rows=trends.slice().sort((a,b)=>scoreOf(b)-scoreOf(a)).slice(0,limit).map(t=>{
          const state=t.state||t.direction||t.momentum||'stable',arrow=/rising|up/i.test(state)?'↑':/falling|down/i.test(state)?'↓':/emerging/i.test(state)?'↗':'→';
          const name=localized(t.title)||localized(t.name)||t.id||'',score=scoreOf(t);
          const row=element('div','trend-row'),label=element('span','',name),bar=element('div','trend-bar'),fill=element('i'),value=element('small','',`${score}/10 `);
          label.title=name;fill.style.width=`${score*10}%`;bar.setAttribute('role','meter');bar.setAttribute('aria-label',name);bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','10');bar.setAttribute('aria-valuenow',String(score));bar.append(fill);
          const direction=element('b','',arrow);direction.title=state;direction.setAttribute('aria-label',state);value.append(direction);row.append(label,bar,value);return row;
        });
        box.replaceChildren(...(rows.length?rows:[element('p','muted',visualLang==='de'?'Keine Trenddaten verfügbar.':'No trend data available.')]));
        if(rows.length)box.append(element('p','visual-source',`${visualLang==='de'?'Aktueller Datenstand':'Current data'}${data.updated_at?' · '+data.updated_at.slice(0,10):''} · AI Daily Brief · ${visualLang==='de'?'Eigene Grafik':'Original graphic'} · data/trends.json`));
      });
    }catch(e){heatmaps.forEach(box=>box.replaceChildren(element('p','muted',visualLang==='de'?'Trenddaten momentan nicht verfügbar.':'Trend data currently unavailable.')))}
  }
  const cards=[...article.querySelectorAll('[data-visual="builder-radar"]')];
  if(cards.length){
    try{
      const response=await fetch('data/builder_radar.json?'+Date.now());
      if(!response.ok)return;
      const data=await response.json(),items=data?.items||[];
      if(!Array.isArray(items))return;
      cards.forEach(box=>{
        const wanted=box.dataset.item,entry=wanted?items.find(x=>x.id===wanted):items[0];
        if(!entry)return;
        // Keep the edition's translated copy when the dataset only provides English.
        const title=typeof entry.title==='object'?entry.title?.[visualLang]:visualLang==='en'?entry.title:null;
        const plan=entry.test_plan||entry.why_now;
        const description=typeof plan==='object'?plan?.[visualLang]:visualLang==='en'?plan:null;
        if(title&&box.querySelector('strong'))box.querySelector('strong').textContent=title;
        if(description&&box.querySelector('p'))box.querySelector('p').textContent=description;
        if(entry.state&&box.querySelector('em'))box.querySelector('em').textContent=entry.state;
      });
    }catch(e){/* The authored card remains readable when the data cannot load. */}
  }
}
async function fetchJSON(path) {
  const response = await fetch(path + '?' + Date.now());
  if (!response.ok) throw new Error('Data unavailable');
  return response.json();
}
async function resolveBrief() {
  if (!requestedDate) return fetchJSON('data/latest.json');
  const archive = await fetchJSON('data/archive.json');
  return archive.find(item => item.date === requestedDate) || null;
}
async function loadBrief() {
  const request = ++briefRequest, language = lang, article = $('#brief-content');
  article.setAttribute('aria-busy', 'true');
  document.querySelector('.edition-cover').setAttribute('aria-busy', 'true');
  try {
    const meta = await resolveBrief();
    if (!meta?.[language]) throw new Error('Edition not found');
    const response = await fetch(meta[language] + '?' + Date.now());
    if (!response.ok) throw new Error('Brief unavailable');
    const [html, covers] = await Promise.all([response.text(), editionCovers]);
    if (request !== briefRequest) return;
    article.innerHTML = html;
    normalizeEditorialMarkup(article);
    $('#brief-date').textContent = meta.date;
    $('#brief-date').dateTime = meta.date;
    $('#hero-date').textContent = new Intl.DateTimeFormat(language === 'de' ? 'de-CH' : 'en-GB', {day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(meta.date + 'T12:00:00Z'));
    $('#hero-date').dateTime = meta.date;
    $('#brief-title').textContent = requestedDate ? (language === 'de' ? 'Aus dem Archiv.' : 'From the archive.') : (language === 'de' ? 'Was heute zählt.' : 'What matters today.');
    enhanceEditorial(article);
    renderEditionCover(article, meta, language, covers);
    // Deep links may target chapter IDs created after the briefing arrives.
    if (location.hash && location.hash !== '#top') {
      const target = document.getElementById(location.hash.slice(1));
      if (target) requestAnimationFrame(() => target.scrollIntoView({behavior:'instant'}));
    }
  } catch (error) {
    if (request !== briefRequest) return;
    const box = editorialNode('div', 'load-error');
    box.setAttribute('role', 'alert');
    box.append(editorialNode('p', '', language === 'de' ? 'Diese Ausgabe ist momentan nicht verfügbar.' : 'This edition is currently unavailable.'));
    const retry = editorialNode('button', '', language === 'de' ? 'Erneut laden' : 'Try again');
    retry.type = 'button'; retry.onclick = loadBrief; box.append(retry);
    article.replaceChildren(box);
    $('#cover-title').textContent = language === 'de' ? 'Kurz offline.' : 'Briefly offline.';
    $('#cover-title').classList.add('long-title');
    $('#cover-deck').textContent = language === 'de' ? 'Die Ausgabe konnte nicht geladen werden. Bitte versuche es erneut oder wähle eine Ausgabe im Archiv.' : 'The edition could not be loaded. Try again or choose an edition from the archive.';
    $('#back-to-cover').hidden = true;
    document.querySelector('.lead-illustration')?.remove();
    document.querySelector('.edition-cover').classList.remove('with-illustration');
    $('#cover-kicker').textContent = 'AI DAILY BRIEF';
    $('#hero-date').textContent = requestedDate || '—';
    $('#brief-date').textContent = requestedDate || '—';
    $('#edition-navigation').hidden = true;
    document.title = 'AI Daily Brief';
  } finally {
    if (request === briefRequest) {
      article.setAttribute('aria-busy', 'false');
      document.querySelector('.edition-cover').setAttribute('aria-busy', 'false');
    }
  }
}
async function loadArchive() {
  const language = lang;
  try {
    const items = await fetchJSON('data/archive.json');
    if (language !== lang) return;
    const rows = items.map((item, index) => {
      const link = editorialNode('a', 'archive-card');
      link.href = `./?date=${encodeURIComponent(item.date)}&lang=${language}#edition`;
      link.append(editorialNode('span', 'archive-num', String(index + 1).padStart(2, '0')));
      link.append(editorialNode('span', 'archive-date', item.date));
      link.append(editorialNode('strong', '', item.headline?.[language] || 'AI Daily Brief'));
      const concept = item.concept?.[language];
      link.append(editorialNode('span', 'archive-action', [(item.tags || []).slice(0,3).join(' · '), concept ? (language === 'de' ? 'Konzept: ' : 'Concept: ') + concept : '', language === 'de' ? 'Ausgabe lesen ↗' : 'Read edition ↗'].filter(Boolean).join(' · ')));
      return link;
    });
    $('#archive-list').replaceChildren(...(rows.length ? rows : [editorialNode('p','muted',language === 'de' ? 'Noch keine archivierten Ausgaben.' : 'No archived editions yet.')]));
  } catch {
    if (language === lang) $('#archive-list').replaceChildren(editorialNode('p','muted',language === 'de' ? 'Archiv momentan nicht verfügbar.' : 'Archive currently unavailable.'));
  }
}
async function loadTrends() {
  const language = lang;
  try {
    const data = await fetchJSON('data/trends.json');
    if (language !== lang) return;
    const trends = Array.isArray(data) ? data : data.topics || data.trends || [];
    const rows = trends.slice(0,4).map(trend => {
      const state = trend.state || trend.direction || trend.momentum || trend.status || 'stable';
      const arrow = /rising|up/i.test(state) ? '↑' : /falling|down/i.test(state) ? '↓' : /emerging/i.test(state) ? '↗' : '→';
      const title = typeof trend.title === 'object' ? trend.title[language] || trend.title.en : trend.title;
      const row = editorialNode('div');
      row.append(editorialNode('span','',title || trend.name || trend.id));
      const status = editorialNode('span','trend-state');
      if (trend.score != null) status.append(editorialNode('small','',`${trend.score}/10`));
      status.append(editorialNode('b','',arrow)); row.append(status);
      return row;
    });
    $('#trend-preview').replaceChildren(...rows);
  } catch {
    if (language === lang) $('#trend-preview').textContent = language === 'de' ? 'Trenddaten momentan nicht verfügbar.' : 'Trend data currently unavailable.';
  }
}
window.addEventListener('scroll', () => {
  const doc = document.documentElement, max = doc.scrollHeight - doc.clientHeight;
  $('#progress').style.width = (max ? doc.scrollTop / max * 100 : 0) + '%';
}, {passive:true});
translate();
