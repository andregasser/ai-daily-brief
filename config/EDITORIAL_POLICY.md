# AI Daily Brief — Editorial & Research Policy

This file defines the canonical process for every daily edition. `config/sources.yaml` defines the configurable mandatory source set.

## 1. Coverage window

Cover meaningful developments since the previous published brief. If the previous timestamp cannot be established, use the fallback lookback configured in `sources.yaml`. Older developments may be included only when there is a meaningful new development today.

## 2. Research pipeline

### Phase A — Mandatory source sweep

Explicitly inspect every source configured under `mandatory` in `sources.yaml` carefully enough to identify relevant new items in the coverage window.

All mandatory sources are equal in terms of required checking. Being a mandatory source gives a source **no editorial priority, ranking bonus or presumption of importance**. Ben's Bites and AI Weekly are checked every day because they are useful discovery sources, not because stories appearing there deserve more weight.

Mandatory sources are a coverage floor, not a whitelist. Their inclusion in the configuration does not make their stories automatically newsworthy.

### Phase B — Open-web discovery

Always run broad, current web discovery beyond the mandatory source set. Search across the categories configured in `discovery.categories`. The purpose is to catch important developments before they appear in newsletters and to discover new labs, startups, repositories, papers, tools and sources.

Search from multiple angles rather than relying on one generic AI-news query. At minimum cover business/strategy, models/agents, engineering/infrastructure, research/open source, developer tools/security and regulation.

During open discovery, also evaluate whether newly encountered sources deserve promotion into the permanent source catalog. The catalog is intentionally self-maintaining rather than fixed.

### Phase C — Expand and verify

For each potentially important event:

1. Cluster duplicate coverage of the same event.
2. Locate the primary source whenever available: official announcement, documentation, paper, GitHub repository, regulator or standards body.
3. Use reputable independent reporting for context and for material or contested claims where useful.
4. Treat newsletters, aggregators, Reddit and social posts primarily as discovery signals, not as sufficient evidence for important factual claims.
5. Clearly distinguish vendor claims and benchmarks from independently verified results.

Source authority and source-checking priority are different concepts. A primary source is normally stronger evidence for its own announcement than a newsletter summarizing it, but that does not mean stories from that organization are intrinsically more important. Story selection is based on merit.

## 3. Source catalog maintenance

At the end of every research run, review any previously unknown source that materially helped discovery or verification.

Promote a source into `config/sources.yaml` when it has credible recurring value: for example, it repeatedly surfaces high-signal developments early, is a newly important primary source, provides unique technical depth, or has demonstrated enough reliability to justify daily checking.

Do **not** grow the catalog merely because a source produced one useful link. Avoid redundant aggregators, low-quality rewrites, unclear provenance and promotional sources with little recurring signal.

The catalog may also shrink. Reclassify, demote or remove sources that become stale, redundant, low-signal or unreliable. Source additions and removals should be committed with a short reason so the evolution of the catalog remains auditable.

A newly promoted source becomes part of the mandatory sweep starting with subsequent daily runs. Promotion never gives its stories an editorial ranking bonus.

## 4. Ranking

Rank candidate stories using the scoring weights in `sources.yaml`: practical engineering relevance, strategic impact, novelty, evidence quality and durability versus hype.

Never boost a candidate merely because it was found in Ben's Bites, AI Weekly, a major vendor blog or any other mandatory source. Conversely, a major story discovered through an unfamiliar source should rank highly when its significance and evidence justify it.

The goal is not exhaustive coverage. Select the developments a technically sophisticated reader should genuinely know about today.

## 5. Editorial format

Every edition is built from one canonical research set and then rendered in German and English. The two editions must contain the same facts, prioritization and sources; English is not researched independently.

### Fixed editorial pillars — required in every edition

These are permanent structural elements of the AI Daily Brief and must not be omitted, merged away or replaced by a generic news list:

1. **Business & Strategie / Business & Strategy** — business model shifts, major product moves, partnerships, funding/M&A, regulation, company strategy, compute/infrastructure commitments and market developments.
2. **Modelle, Agents & Engineering / Models, Agents & Engineering** — models, agents, coding agents, VLM/image/video systems, open source, serving/inference, infrastructure, developer tools, security and technically relevant research.
3. **🔬 Konzept des Tages / Concept of the Day** — one substantial AI/ML/software-engineering concept explained intuitively, technically, with a concrete architecture/code/product example and practical relevance. This is a learning pillar, not a short glossary box.
4. **Was als Nächstes wichtig wird / What comes next** — 3–5 concrete forward-looking developments, unresolved questions, upcoming tests, expected releases, regulatory deadlines or signals worth watching after today's news. This section should synthesize the implications of the day's reporting rather than merely repeat headlines.

The Business and Engineering sections are separate editorial groupings even when one story spans both. Place each story where its primary implication belongs and cross-reference the other dimension in the analysis if useful.

The full report must also contain:

- A strong editorial headline and opening synthesis
- **In 60 Sekunden / In 60 Seconds** with the 3 strongest signals
- For important stories: context, **Warum relevant? / Why it matters**, and when useful an **Engineering Takeaway**
- **Signal vs. Hype**
- Links to the most useful primary/original sources

The concept section is a required daily component. Avoid repeating recent concepts unless there is a strong reason to revisit them from a materially different angle.

The forward-looking section is also required daily, including on quiet news days. It should answer: **What should a technically sophisticated reader watch next because of today's developments?** Prefer specific, testable items over generic predictions.

## 6. Publishing contract

For date `YYYY-MM-DD`, publish:

- `briefings/YYYY-MM-DD-de.html`
- `briefings/YYYY-MM-DD-en.html`

Then update:

- `data/latest.json`
- `data/archive.json`

The website must remain readable even if one language file fails; do not replace a valid previous edition with incomplete or unverified output.

## 7. Quality bar

Signal over volume. Explain rather than aggregate. Prefer primary evidence for factual verification. Label uncertainty. Never turn a vendor benchmark into an independent fact. A new source can become important immediately; the source catalog should evolve when that source proves recurring value. Editorial importance belongs to the story, not the source that first surfaced it.
