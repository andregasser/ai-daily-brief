# AI Daily Brief — Editorial & Research Policy

This file defines the canonical process for every daily edition. `config/sources.yaml` defines the configurable mandatory source set.

## 1. Coverage window and continuity
Cover meaningful developments since the previous published brief. If the previous timestamp cannot be established, use the fallback lookback configured in `sources.yaml`. Older developments may be included only when there is a meaningful new development today.

Every run must explicitly compare candidate developments with the previous edition and ask **What changed since yesterday?** Avoid repeating unchanged stories. When a continuing story has genuinely moved, explain the delta rather than retelling the whole background.

Before research, inspect recent archive metadata and `data/storylines.json` when present. Review the previous edition's **What comes next** items and close the loop when new evidence answers one of those questions.

## 2. Research pipeline
### Phase A — Mandatory source sweep
Explicitly inspect every source configured under `mandatory` in `sources.yaml` carefully enough to identify relevant new items in the coverage window. All mandatory sources are equal in terms of required checking. Being mandatory gives no editorial priority or ranking bonus. Mandatory sources are a coverage floor, not a whitelist.

### Phase B — Open-web discovery
Always run broad, current web discovery beyond the mandatory source set across the configured categories. Discover new labs, startups, repositories, papers, tools and sources. During discovery, evaluate whether newly encountered sources deserve promotion into the permanent source catalog.

### Phase C — Expand, verify and triangulate
Cluster duplicate coverage. Locate primary sources whenever available. Use reputable independent reporting for context and material/contested claims. Treat newsletters, aggregators, Reddit and social posts primarily as discovery signals. Clearly distinguish vendor claims and benchmarks from independently verified results.

For each material story assign an internal evidence state and expose it in the article when useful:
- **Confirmed · Primary** — directly supported by authoritative original evidence.
- **Confirmed · Multiple** — supported by multiple credible independent/original sources.
- **Reported** — credible reporting, but key facts are not yet publicly confirmed by the parties involved.
- **Vendor claim** — performance, benchmark or capability claim currently supported primarily by the vendor.
- **Early signal** — potentially important but still incomplete; use sparingly and label uncertainty prominently.

Do not convert a weakly evidenced story into certainty through confident prose.

## 3. Source catalog maintenance
Review previously unknown sources that materially helped discovery or verification. Promote sources with credible recurring value: repeated early high-signal discovery, newly important primary sources, unique technical depth or demonstrated reliability. Do not grow the catalog because of one incidental useful link. Reclassify or remove stale, redundant, low-signal or unreliable sources. Commit catalog changes with a short reason. Promotion never gives stories a ranking bonus.

## 4. Ranking and editorial selection
Rank stories using `sources.yaml`: engineering relevance, strategic impact, novelty, evidence quality and durability versus hype. Editorial importance belongs to the story, not the source that surfaced it. Prefer a small number of deeply explained high-signal stories over exhaustive aggregation.

Also evaluate whether a story materially changes one of these dimensions: architecture, developer workflow, deployment options, unit economics, security posture, market structure, regulation or strategic control of the AI stack. A model/version launch with no meaningful change should normally not receive prominent coverage.

Perform a **source-diversity sanity check** before publication. Do not manufacture geographic or company balance, but detect accidental overreliance on one company, newsletter or region when equally important developments exist elsewhere.

## 5. Editorial format
Every edition is built from one canonical research set and then rendered in German and English. Both editions contain the same facts, prioritization, visuals and sources.

### Fixed editorial pillars — required in every edition
1. **Business & Strategie / Business & Strategy** — separate article group.
2. **Modelle, Agents & Engineering / Models, Agents & Engineering** — separate article group.
3. **🔬 Konzept des Tages / Concept of the Day** — substantial learning section: intuition, technical depth, concrete architecture/code/product example and practical relevance.
4. **Was als Nächstes wichtig wird / What comes next** — 3–5 specific forward-looking, preferably testable developments or open questions. Never just repeat headlines.

Also required: strong editorial headline and synthesis; **In 60 Sekunden / In 60 Seconds** with the three strongest signals; context and **Warum relevant? / Why it matters** for important stories; Engineering Takeaways where useful; **Signal vs. Hype**; useful primary/original links.

### Required intelligence enhancements
For material stories, add these elements when applicable:
- **Evidence label** using the states above.
- **Was ist neu? / What changed?** for continuing stories, describing the delta since prior coverage.
- **Builder Action** with one of: **Jetzt testen / Test now**, **Beobachten / Watch**, **Abwarten / Wait**. The recommendation must say what a software engineer or AI-product team should concretely do and why.
- **Quantitative context** where meaningful: price, latency, throughput, context, memory/VRAM, hardware requirements, deployment mode, adoption, revenue or other verified metrics. Prefer relative comparison to isolated numbers.

### Benchmark hygiene
For important model/inference releases, distinguish vendor benchmarks from independent tests. When available, compare practical dimensions: quality, task success, latency, cost, context length, memory/VRAM, hardware, deployment/local availability and licensing. End-to-end task results are more valuable than isolated benchmark scores for agents.

### Research Digest
Include a compact **Research Digest** when 1–2 new papers/research results have credible practical potential. For each: what is actually new, evidence/limitations, and when a builder should care. Do not fill this section on quiet research days.

### Open Source Radar
Include a compact **Open Source Radar** when projects/releases have meaningful momentum or practical value. Evaluate more than stars: release activity, maintainer quality, adoption signals, documentation, reproducibility and production readiness. Do not include projects merely because they are trending.

### Original analysis
At least one major edition theme should synthesize multiple developments into an original, evidence-grounded conclusion rather than merely summarizing sources. Clearly distinguish analysis from reported fact.

### Six-month thesis
For genuinely structural developments only, optionally include **6-Monats-These / Six-month thesis**: a concise falsifiable prediction, confidence (low/medium/high), rationale and what evidence would invalidate it. Store active theses in `data/theses.json` and revisit them when evidence changes or the review date arrives. Do not force a thesis every day.

Avoid repeating recent concepts unless revisiting them from a materially different angle.

## 6. Story memory and follow-up tracking
Maintain `data/storylines.json` as lightweight editorial memory. Track only recurring high-value themes (for example agent security, frontier compute commitments, AI regulation, inference economics, coding agents, Chinese model ecosystem). Each storyline should have a stable id, title, status, last_updated, short current_state and notable dated developments.

Maintain continuity without bloating the brief: storyline memory informs research and analysis but does not need to be printed verbatim.

Every **What comes next** item should be concrete enough that a later run can classify it as `open`, `progress`, `resolved` or `stale`. When a watched item materially progresses, mention that update in the relevant story or a short follow-up note.

## 7. Visual editorial & media policy
The AI Daily Brief should look like a high-quality technology publication, not a rendered chat transcript. Visuals must improve comprehension, hierarchy or identity.

### Visual hierarchy
- Give the lead story materially more visual weight than secondary stories.
- Use the existing magazine components: hero/lead media, signal cards, priority badges, key-number blocks, source chips, concept visual, sticky section navigation and reading progress.
- Use **Key Numbers** when a story has 2–4 meaningful quantitative facts. Do not manufacture metrics merely to fill a component.
- Keep secondary stories quieter; not every story needs an image.

### Media target
Aim for roughly **2–4 useful visuals per full edition**, including diagrams/charts. Prefer fewer strong visuals over decorative filler.

Media preference order: suitable official media; technical original graphics with appropriate reuse; clearly reusable/licensed editorial media; a new original diagram/chart from verified facts; otherwise no image. Never scrape/hotlink arbitrary search images or use unclear copyrighted news photography. Avoid generic AI stock imagery.

The Concept of the Day should normally include an accurate visual explanation. Quantitative charts require sufficiently verified underlying values and a nearby source/credit. Store publication-owned/reusable media under `assets/media/YYYY-MM-DD/` when practical, with descriptive filenames, alt text and captions. DE/EN normally share the same asset.

## 8. Archive as knowledge library
Archive metadata should expose editorial headline, topic tags and Concept of the Day when available. Preserve backward compatibility. Over time, the archive should allow readers to follow recurring storylines and concepts, not merely dates.

## 9. Publishing and structured intelligence contract
For date `YYYY-MM-DD`, publish `briefings/YYYY-MM-DD-de.html` and `briefings/YYYY-MM-DD-en.html`, then update `data/latest.json` and `data/archive.json`.

Also maintain when applicable:
- `data/storylines.json` — recurring editorial story memory.
- `data/theses.json` — active structural predictions and later evaluations.

The website must remain readable if one language file fails; do not replace a valid previous edition with incomplete or unverified output.

## 10. Quality bar
Signal over volume. Explain rather than aggregate. Prefer primary evidence. Label uncertainty. Track what changed. Close loops on prior predictions/questions. Give builders concrete actions. Prefer end-to-end evidence over benchmark theater. Let the source catalog evolve. Prefer an accurate original diagram or no image over visually impressive but misleading media.
