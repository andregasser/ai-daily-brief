# AI Daily Brief — Editorial & Research Policy

This file defines the canonical process for every daily edition. `config/sources.yaml` defines the configurable source catalog and mandatory coverage floor. `config/source_roles.yaml`, `config/research_watches.yaml`, `config/intelligence.yaml` and `config/evals.yaml` define the advanced intelligence system.

## 1. Coverage window and continuity
Cover meaningful developments since the previous published brief. If the previous timestamp cannot be established, use the fallback lookback configured in `sources.yaml`. Older developments may be included only when there is a meaningful new development today.

Every run must explicitly compare candidate developments with the previous edition and ask **What changed since yesterday?** Avoid repeating unchanged stories. When a continuing story has genuinely moved, explain the delta rather than retelling the whole background.

Before research, inspect recent archive metadata, `data/storylines.json`, `data/predictions.json`, `data/builder_radar.json`, `data/trends.json`, `data/concepts.json`, `data/claims.json`, `data/entities.json` and `data/theses.json` when present. Review the previous edition's **What comes next** items and close the loop when new evidence answers one of those questions.

## 2. Research pipeline
### Phase A — Mandatory source sweep
Explicitly inspect every source configured under `mandatory` in `sources.yaml` carefully enough to identify relevant new items in the coverage window. All mandatory sources are equal in terms of required checking. Being mandatory gives no editorial priority or ranking bonus. Mandatory sources are a coverage floor, not a whitelist.

### Phase B — Structured catalog discovery
Inspect the broader role-based source catalog according to `config/source_roles.yaml`. Use discovery/newsletter feeds for breadth, engineering sources for technical interpretation, research sources for forward-looking work, journalism for independent verification/context, business/strategy sources for market structure and capital, contrarian sources for credible disconfirming evidence, community feeds for weak-signal discovery, regional sources for geographic coverage and builder sources for practical experimentation.

Do not treat all catalog sources as mandatory or equally authoritative. The catalog exists to increase recall and perspective diversity without creating a volume bias.

### Phase C — Research Watches
Run the persistent watches in `config/research_watches.yaml`. Watches are thematic lenses, not publication quotas. Inspect new papers, repositories, engineering posts and open-web signals in each watch area. Keyword overlap alone is insufficient. Prefer original papers/repos, reproducibility, independent replication and builder relevance. Promote persistent high-signal watch findings into `data/storylines.json`.

### Phase D — Open-web discovery
Always run broad, current web discovery beyond the configured source set across all configured categories. Discover new labs, startups, repositories, papers, tools and sources. During discovery, evaluate whether newly encountered sources deserve promotion into the permanent source catalog.

### Phase E — Expand, verify and triangulate
Cluster duplicate coverage. Locate primary sources whenever available. Use reputable independent reporting for context and material/contested claims. Treat newsletters, aggregators, Reddit and social posts primarily as discovery signals. Clearly distinguish vendor claims and benchmarks from independently verified results.

For each material story assign an internal evidence state and expose it in the article when useful:
- **Confirmed · Primary** — directly supported by authoritative original evidence.
- **Confirmed · Multiple** — supported by multiple credible independent/original sources.
- **Reported** — credible reporting, but key facts are not yet publicly confirmed by the parties involved.
- **Vendor claim** — performance, benchmark or capability claim currently supported primarily by the vendor.
- **Early signal** — potentially important but still incomplete; use sparingly and label uncertainty prominently.

Do not convert a weakly evidenced story into certainty through confident prose.

### Phase F — Claim/Evidence Graph
Every material story must be decomposed into material factual claims and stored in `data/claims.json` using stable claim IDs where practical. Each claim records supporting and contradicting sources, source role, evidence state, observed date and relationship to entities/storylines.

Story-level evidence is derived from claim-level evidence, not the reverse. A story may contain a mix of `Confirmed · Primary`, `Reported` and `Vendor claim` claims. Do not let a strongly evidenced headline silently upgrade weaker subclaims.

Material contradictions remain represented until resolved. If a critical claim is unresolved, either downgrade the story language/evidence label or omit the claim/story.

### Phase G — Intelligence passes
Every run performs three explicit intelligence passes after initial story clustering:

#### 1. Emerging Signals
Look for multiple individually small but directionally consistent developments that may indicate an architectural, economic, regulatory or workflow shift before it becomes a headline story.

A valid Emerging Signal should normally combine at least two independent evidence types, for example a model/serving release plus a hardware/platform change; a paper plus a production engineering change; multiple labs converging on the same architecture; repeated enterprise behavior plus new tooling/infrastructure; or regulatory movement plus market response.

Do not manufacture trends from coincidental keywords. Prefer 2–4 concrete observations with dates and explain why they jointly matter. When confidence is limited, label the conclusion as analysis or `Early signal`. Persistent signals belong in `data/storylines.json` and feed `data/trends.json`.

#### 2. Contrarian Evidence
For every strong market narrative or major vendor claim, actively search for credible disconfirming or complicating evidence before publication. Prefer empirical measurements, postmortems, independent benchmarks, production reports, regulatory filings, reproducible experiments and credible reporting. Do not elevate weak criticism merely to create artificial balance.

Material stories should include a **Signal vs. Hype** judgment informed by both supporting and disconfirming evidence.

#### 3. Builder Radar
Maintain a practical builder-facing watch for tools, releases, techniques and papers worth trying now or in the coming week. Each item must answer: what it is, why now, what to try, what success/failure looks like, and maturity/risk.

Builder items have lifecycle state in `data/builder_radar.json`: `experimental`, `trial`, `promising`, `adopt`, `watch`, `avoid`, or `retired`. Revisit published items after roughly 3, 7 and 30 days when evidence exists. Prefer releases with active maintainers, credible docs, reproducibility, adoption signals and clear deployment paths.

### Phase H — Trend Heatmap
Maintain `data/trends.json` as an internal momentum model across configured topics. Score independent events, not article counts. Use a rolling window and decay older evidence. Track whether a theme is `emerging`, `rising`, `stable` or `falling`, plus supporting and contradicting evidence.

The trend heatmap is an editorial input, not a popularity leaderboard. It may be surfaced only when the signal is genuinely informative.

### Phase I — Red-Team Pass
Before publishing, run a separate adversarial editorial pass over the finished research set and draft. The red-team objective is to falsify or weaken the brief, not polish it.

It must check at minimum:
- factual claims and numbers against evidence,
- unsupported confidence,
- vendor claims presented as facts,
- missing primary sources,
- contradictions or omitted counterevidence,
- duplicate/unchanged stories from previous editions,
- misleading benchmark comparisons,
- DE/EN factual equivalence,
- visual provenance and caption/source correctness.

Store the result in the daily research audit. Unresolved material issues block publication until removed, corrected or explicitly downgraded.

## 3. Source catalog maintenance and measurement
Review previously unknown sources that materially helped discovery or verification. Promote sources with credible recurring value: repeated early high-signal discovery, newly important primary sources, unique technical depth, useful contrarian evidence or demonstrated reliability. Do not grow the catalog because of one incidental useful link.

Treat sources as multi-role assets: primary evidence, independent journalism, engineering analysis, research, business/strategy, contrarian/critical analysis, builder/tooling discovery, community discovery, regional coverage or regulation.

Update `data/source_metrics.json` on every run. Track at least `items_seen`, `candidates`, `shortlisted`, `published`, `unique_discoveries`, `primary_confirmations`, `independent_confirmations`, `contrarian_hits`, `builder_hits`, `research_hits`, `false_or_retracted` and `duplicate_only`.

Derived metrics may include publication yield, unique signal rate, verification value, contrarian value, builder value, research value and noise/duplicate rate. Compare sources mainly within compatible roles. Metrics may influence checking cadence and catalog maintenance, but **must never grant automatic ranking bonus to a story**. Promotions/demotions require enough observations and a short reason in the commit.

## 4. Ranking and editorial selection
Rank stories using engineering relevance, strategic impact, novelty, evidence quality and durability versus hype. Editorial importance belongs to the story, not the source that surfaced it. Prefer a small number of deeply explained high-signal stories over exhaustive aggregation.

Also evaluate whether a story materially changes architecture, developer workflow, deployment options, unit economics, security posture, market structure, regulation or strategic control of the AI stack. A model/version launch with no meaningful change should normally not receive prominent coverage.

Perform a **source-diversity sanity check** before publication. Do not manufacture geographic or company balance, but detect accidental overreliance on one company, newsletter, source class or region when equally important developments exist elsewhere.

Before final ranking, explicitly ask:
1. What is the strongest new evidence today?
2. What changed since yesterday?
3. Is there credible evidence against the dominant interpretation?
4. Are several small developments pointing to the same emerging trend?
5. Is there something builders should actually test this week?
6. Did a previous prediction, thesis, builder item or watch materially change?

## 5. Editorial format
Every edition is built from one canonical research set and then rendered in German and English. Both editions contain the same facts, prioritization, visuals and sources.

### Fixed editorial pillars — required in every edition
1. **Business & Strategie / Business & Strategy** — separate article group.
2. **Modelle, Agents & Engineering / Models, Agents & Engineering** — separate article group.
3. **🔬 Konzept des Tages / Concept of the Day** — substantial learning section: intuition, technical depth, concrete architecture/code/product example and practical relevance.
4. **Was als Nächstes wichtig wird / What comes next** — 3–5 specific forward-looking, preferably testable developments or open questions. Never just repeat headlines.

Also required: strong editorial headline and synthesis; **In 60 Sekunden / In 60 Seconds** with the three strongest signals; context and **Warum relevant? / Why it matters** for important stories; Engineering Takeaways where useful; **Signal vs. Hype**; useful primary/original links.

### Required intelligence enhancements
For material stories, add when applicable:
- Evidence label.
- **Was ist neu? / What changed?** for continuing stories.
- **Builder Action**: `Jetzt testen / Test now`, `Beobachten / Watch`, or `Abwarten / Wait`.
- Quantitative context.
- Contrarian evidence.
- Emerging signal.
- Links to prior concepts/storylines when they improve understanding.

### Benchmark hygiene and House Evals
For important model/inference releases, distinguish vendor benchmarks from independent tests. Compare practical dimensions where available: quality, task success, latency, cost, context length, memory/VRAM, hardware, deployment/local availability and licensing. End-to-end task results are more valuable than isolated benchmark scores for agents.

For materially important releases, the project may run small reproducible house evals defined in `config/evals.yaml`. Record methodology, pinned model/version/parameters, fixtures, raw failures where practical, latency and cost in `data/evals.json`. Never present house evals as universal truth. Never compare materially different harnesses without explicit qualification.

When comparable, highlight meaningful deltas between vendor claims, independent benchmarks and house results.

### Research Digest
Include a compact **Research Digest** when 1–2 new papers/research results have credible practical potential. Do not fill this section on quiet research days.

### Open Source Radar
Include a compact **Open Source Radar** when projects/releases have meaningful momentum or practical value. Evaluate more than stars: release activity, maintainer quality, adoption signals, documentation, reproducibility and production readiness.

### Builder Radar
Include **Builder Radar** when at least one item clears the practical-action threshold. Prefer 1–3 high-value actions over a long list. Follow up lifecycle items when evidence changes.

### Emerging Signals
Include an **Emerging Signal** callout/section when multiple current observations support a credible early trend. State evidence chain, confidence and what future evidence would strengthen or falsify it.

### Original analysis
At least one major edition theme should synthesize multiple developments into an original, evidence-grounded conclusion rather than merely summarizing sources. Clearly distinguish analysis from reported fact.

### Six-month thesis
For genuinely structural developments only, optionally include **6-Monats-These / Six-month thesis**: concise falsifiable prediction, confidence, rationale and invalidation evidence. Store active theses in `data/theses.json` and revisit them when evidence changes or the review date arrives.

## 6. Intelligence memory
Maintain a small structured memory rather than relying on prose archives alone:
- `data/entities.json` — stable entities and aliases relevant to recurring coverage.
- `data/claims.json` — material claims and their evidence graph.
- `data/storylines.json` — recurring high-value themes and emerging signals.
- `data/theses.json` — structural six-month theses.
- `data/predictions.json` — shorter predictions and What-comes-next scorecard.
- `data/builder_radar.json` — builder experiments and lifecycle follow-ups.
- `data/trends.json` — internal topic momentum/heatmap.
- `data/concepts.json` — Concept-of-the-Day knowledge base.
- `data/evals.json` — house benchmark results.

Use stable IDs and dated updates. Memory informs research and analysis but does not need to be printed verbatim.

## 7. Prediction Scorecard
Every concrete **What comes next** prediction and every six-month thesis must be reviewable. Store shorter predictions in `data/predictions.json` with status `open`, `progress`, `confirmed`, `falsified`, or `expired`, plus evidence, review date and falsification/confirmation criteria.

Review due/open predictions on every run when related evidence appears. At least monthly, update an internal scorecard showing confirmed, falsified and expired predictions. Do not rewrite history: preserve the original prediction text, date and confidence.

The purpose is calibration, not vanity. Failed predictions are valuable data and must remain visible in the internal record.

## 8. Concept Knowledge Base
Every Concept of the Day is registered in `data/concepts.json` with stable ID, titles, date first covered, summary, related storylines/tags and source links. Link to prior concepts from new editions when useful. Avoid repeating a concept unless there is a materially new angle.

The archive should increasingly behave like an AI Engineering knowledge base rather than a date-only list.

## 9. Visual editorial & media policy
The AI Daily Brief should look like a high-quality technology publication, not a rendered chat transcript. Visuals must improve comprehension, hierarchy or identity.

Give the lead story more visual weight than secondary stories. Use key numbers only when supported by verified quantitative facts. Visuals are optional and must earn their place; zero visuals is acceptable on a quiet day.

Media preference order: suitable official media; technical original graphics with appropriate reuse; clearly reusable/licensed editorial media; a new original diagram/chart from verified facts; otherwise no image. Never scrape/hotlink arbitrary search images or use unclear copyrighted news photography. Avoid generic AI stock imagery.

Every third-party visual must include visible source/credit with organization/author and link to the original source; include license/reuse status where relevant. Publication-created charts/diagrams must be labeled as original and cite underlying data sources.

## 10. Daily Research Audit
For every edition store an internal structured audit at `data/research/YYYY-MM-DD.json`. At minimum retain:
- discovered candidates and source attribution,
- event clusters/deduplication,
- rejected stories with reason,
- material claims and evidence,
- ranking inputs/decision,
- source contributions,
- research watch hits,
- contrarian evidence,
- emerging-signal reasoning,
- builder-radar decisions,
- house-eval references if run,
- red-team findings and disposition,
- final publish/no-publish decision.

The audit is an internal reproducibility/debugging artifact, not a prominent public section of the publication.

## 11. Weekly Intelligence Review
On Sundays, in addition to the Daily Brief, produce a German and English **Weekly Intelligence Review** under `weekly/YYYY-Www-de.html` and `weekly/YYYY-Www-en.html` when enabled in `config/intelligence.yaml`.

The Weekly Review is **not** a seven-day article digest. It must answer:
- What changed our assessment this week?
- Which Emerging Signals strengthened, weakened or disappeared?
- Which predictions/theses progressed, failed or were confirmed?
- Which Builder Radar experiments gained or lost credibility?
- What should builders test next week?
- Which trends moved most in the internal heatmap, and why?

Use the week's research audits, claims, storylines, predictions, builder lifecycle, trends and source metrics as inputs. Publish only evidence-backed synthesis.

## 12. Archive as knowledge library
Archive metadata should expose editorial headline, topic tags and Concept of the Day when available. Preserve backward compatibility. Over time, the archive should allow readers to follow recurring storylines, emerging signals and concepts, not merely dates.

## 13. Publishing and structured intelligence contract
For date `YYYY-MM-DD`, publish `briefings/YYYY-MM-DD-de.html` and `briefings/YYYY-MM-DD-en.html`, then update `data/latest.json` and `data/archive.json`.

Also maintain as applicable:
- `data/entities.json`
- `data/claims.json`
- `data/storylines.json`
- `data/theses.json`
- `data/predictions.json`
- `data/builder_radar.json`
- `data/trends.json`
- `data/concepts.json`
- `data/evals.json`
- `data/source_metrics.json`
- `data/research/YYYY-MM-DD.json`

On Sundays, also publish the Weekly Intelligence Review when enabled.

The website must remain readable if one language file fails; do not replace a valid previous edition with incomplete or unverified output.

## 14. Quality gates
Before publication all enabled gates in `config/intelligence.yaml` must pass. In particular: claim-level evidence for material stories, red-team pass, research audit, source-metrics update, due prediction/thesis reviews and no unresolved material contradictions.

If a gate fails, preserve the last valid published state rather than publishing an incomplete or misleading edition.

## 15. Quality bar
Signal over volume. Explain rather than aggregate. Prefer primary evidence. Label uncertainty. Track what changed. Close loops on prior predictions/questions. Give builders concrete actions. Actively look for credible disconfirming evidence. Detect emerging trends before they become obvious without manufacturing them. Measure sources rather than trusting reputation. Track predictions rather than forgetting misses. Use house evals when they genuinely improve decisions. Preserve auditability. Prefer end-to-end evidence over benchmark theater. Let the source catalog evolve. Prefer an accurate original diagram or no image over visually impressive but misleading media.
