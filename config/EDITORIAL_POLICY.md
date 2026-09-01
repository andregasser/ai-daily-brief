# AI Daily Brief — Editorial & Research Policy

This file defines the canonical process for every daily edition. `config/sources.yaml` defines the configurable mandatory source set.

## 1. Coverage window
Cover meaningful developments since the previous published brief. If the previous timestamp cannot be established, use the fallback lookback configured in `sources.yaml`. Older developments may be included only when there is a meaningful new development today.

## 2. Research pipeline
### Phase A — Mandatory source sweep
Explicitly inspect every source configured under `mandatory` in `sources.yaml` carefully enough to identify relevant new items in the coverage window. All mandatory sources are equal in terms of required checking. Being mandatory gives no editorial priority or ranking bonus. Mandatory sources are a coverage floor, not a whitelist.

### Phase B — Open-web discovery
Always run broad, current web discovery beyond the mandatory source set across the configured categories. Discover new labs, startups, repositories, papers, tools and sources. During discovery, evaluate whether newly encountered sources deserve promotion into the permanent source catalog.

### Phase C — Expand and verify
Cluster duplicate coverage. Locate primary sources whenever available. Use reputable independent reporting for context and material/contested claims. Treat newsletters, aggregators, Reddit and social posts primarily as discovery signals. Clearly distinguish vendor claims and benchmarks from independently verified results.

## 3. Source catalog maintenance
Review previously unknown sources that materially helped discovery or verification. Promote sources with credible recurring value: repeated early high-signal discovery, newly important primary sources, unique technical depth or demonstrated reliability. Do not grow the catalog because of one incidental useful link. Reclassify or remove stale, redundant, low-signal or unreliable sources. Commit catalog changes with a short reason. Promotion never gives stories a ranking bonus.

## 4. Ranking
Rank stories using `sources.yaml`: engineering relevance, strategic impact, novelty, evidence quality and durability versus hype. Editorial importance belongs to the story, not the source that surfaced it. Prefer a small number of deeply explained high-signal stories over exhaustive aggregation.

## 5. Editorial format
Every edition is built from one canonical research set and then rendered in German and English. Both editions contain the same facts, prioritization, visuals and sources.

### Fixed editorial pillars — required in every edition
1. **Business & Strategie / Business & Strategy** — separate article group.
2. **Modelle, Agents & Engineering / Models, Agents & Engineering** — separate article group.
3. **🔬 Konzept des Tages / Concept of the Day** — substantial learning section: intuition, technical depth, concrete architecture/code/product example and practical relevance.
4. **Was als Nächstes wichtig wird / What comes next** — 3–5 specific forward-looking, preferably testable developments or open questions. Never just repeat headlines.

Also required: strong editorial headline and synthesis; **In 60 Sekunden / In 60 Seconds** with the three strongest signals; context and **Warum relevant? / Why it matters** for important stories; Engineering Takeaways where useful; **Signal vs. Hype**; useful primary/original links.

Avoid repeating recent concepts unless revisiting them from a materially different angle.

## 6. Visual editorial & media policy
The AI Daily Brief should look like a high-quality technology publication, not a rendered chat transcript. Visuals must improve comprehension, hierarchy or identity.

### Visual hierarchy
- Give the lead story materially more visual weight than secondary stories.
- Use the existing magazine components: hero/lead media, signal cards, priority badges, key-number blocks, source chips, concept visual, sticky section navigation and reading progress.
- Use **Key Numbers** when a story has 2–4 meaningful quantitative facts. Do not manufacture metrics merely to fill a component.
- Keep secondary stories quieter; not every story needs an image.

### Media target
Aim for roughly **2–4 useful visuals per full edition**, including diagrams/charts. Prefer fewer strong visuals over decorative filler.

Media preference order:
1. Official press/blog/product image whose reuse on this publication is clearly appropriate.
2. Original chart, diagram, benchmark figure or architecture graphic from the primary technical source when reuse is appropriate.
3. Clearly reusable/licensed editorial image from a reputable source.
4. A new original diagram/chart created specifically for the brief from verified facts.
5. No image.

Never scrape or hotlink arbitrary search-result images. Never use a copyrighted news photo merely because it is visible on the web. Avoid generic stock imagery such as glowing brains, humanoid robots, random server rooms or abstract AI faces unless it conveys real information.

### Original diagrams and charts
Prefer original explanatory visuals for technical concepts. The **Concept of the Day should normally include a visual explanation**: architecture flow, comparison, topology, sequence or small data visualization. It may be implemented with semantic HTML/CSS/SVG or a repository-owned generated asset. Diagrams must remain technically accurate and readable on mobile.

For quantitative stories, create a chart only when the underlying values are sufficiently verified and the visual reveals something faster than prose. Cite the underlying data source in the caption or nearby source chips.

### Image handling
- Store publication-owned/reusable media under `assets/media/YYYY-MM-DD/` when practical; avoid fragile external hotlinks.
- Use descriptive filenames and alt text.
- Include a compact caption with source/credit and context where needed.
- German and English editions should normally reuse the same visual asset; translate only caption text.
- If licensing or provenance is unclear, omit the external image and create an original explanatory graphic instead.

## 7. Archive as knowledge library
Archive entries should increasingly expose the edition's editorial headline, important topic tags and Concept of the Day when metadata is available. The archive is intended to become a browsable AI knowledge library, not merely a date list. Preserve backward compatibility with older archive entries.

## 8. Publishing contract
For date `YYYY-MM-DD`, publish `briefings/YYYY-MM-DD-de.html` and `briefings/YYYY-MM-DD-en.html`, then update `data/latest.json` and `data/archive.json`. The website must remain readable if one language file fails; do not replace a valid previous edition with incomplete or unverified output.

## 9. Quality bar
Signal over volume. Explain rather than aggregate. Prefer primary evidence for factual verification. Label uncertainty. Never turn a vendor benchmark into an independent fact. Let the source catalog evolve. Prefer an accurate original diagram or no image over visually impressive but misleading media.
