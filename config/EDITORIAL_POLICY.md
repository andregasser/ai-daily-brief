# AI Daily Brief — Editorial & Research Policy

This file defines the canonical process for every daily edition. `config/sources.yaml` defines the configurable mandatory source set.

## 1. Coverage window

Cover meaningful developments since the previous published brief. If the previous timestamp cannot be established, use the fallback lookback configured in `sources.yaml`. Older developments may be included only when there is a meaningful new development today.

## 2. Research pipeline

### Phase A — Mandatory source sweep

Explicitly inspect every source configured under `mandatory` in `sources.yaml`. Ben's Bites News has the highest discovery priority and must be checked carefully enough to identify relevant new items in the coverage window.

Mandatory sources are a coverage floor, not a whitelist. Their inclusion in the configuration does not make their stories automatically newsworthy.

### Phase B — Open-web discovery

Always run broad, current web discovery beyond the mandatory source set. Search across the categories configured in `discovery.categories`. The purpose is to catch important developments before they appear in newsletters and to discover new labs, startups, repositories, papers, tools and sources.

Search from multiple angles rather than relying on one generic AI-news query. At minimum cover business/strategy, models/agents, engineering/infrastructure, research/open source, developer tools/security and regulation.

### Phase C — Expand and verify

For each potentially important event:

1. Cluster duplicate coverage of the same event.
2. Locate the primary source whenever available: official announcement, documentation, paper, GitHub repository, regulator or standards body.
3. Use reputable independent reporting for context and for material or contested claims where useful.
4. Treat newsletters, aggregators, Reddit and social posts primarily as discovery signals, not as sufficient evidence for important factual claims.
5. Clearly distinguish vendor claims and benchmarks from independently verified results.

## 3. Ranking

Rank candidate stories using the scoring weights in `sources.yaml`: practical engineering relevance, strategic impact, novelty, evidence quality and durability versus hype.

The goal is not exhaustive coverage. Select the developments a technically sophisticated reader should genuinely know about today.

## 4. Editorial format

Every edition is built from one canonical research set and then rendered in German and English. The two editions must contain the same facts, prioritization and sources; English is not researched independently.

The full report should normally contain:

- A strong editorial headline and opening synthesis
- **In 60 Sekunden / In 60 Seconds** with the 3 strongest signals
- **Business & Strategie / Business & Strategy**
- **Modelle, Agents & Engineering / Models, Agents & Engineering**
- For important stories: context, **Warum relevant? / Why it matters**, and when useful an **Engineering Takeaway**
- **Signal vs. Hype**
- **Konzept des Tages / Concept of the Day**: one substantial AI/ML/software-engineering concept, explained intuitively and technically, ideally connected to current news but not forced
- **Heute im Auge behalten / Watch today** with 3–5 concrete developments to follow
- Links to the most useful primary/original sources

The concept section is a required daily component. Avoid repeating recent concepts unless there is a strong reason to revisit them from a materially different angle.

## 5. Publishing contract

For date `YYYY-MM-DD`, publish:

- `briefings/YYYY-MM-DD-de.html`
- `briefings/YYYY-MM-DD-en.html`

Then update:

- `data/latest.json`
- `data/archive.json`

The website must remain readable even if one language file fails; do not replace a valid previous edition with incomplete or unverified output.

## 6. Quality bar

Signal over volume. Explain rather than aggregate. Prefer primary evidence. Label uncertainty. Never turn a vendor benchmark into an independent fact. A new source can become important immediately; the fixed source list must never prevent discovery of it.
