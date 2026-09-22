# AI Daily Brief

Bilingual daily AI intelligence for builders — evidence-first, no hype.

The project is not only a news digest. It maintains a small structured intelligence system around daily AI developments: source roles and source quality, research watches, claim-level evidence, story memory, predictions, emerging signals, builder experiments, trend momentum, concepts and reproducible research audits.

## Daily output

Each research run produces one canonical research set and two editorially equivalent editions:

- `briefings/YYYY-MM-DD-de.html`
- `briefings/YYYY-MM-DD-en.html`

`data/latest.json` points the homepage to the current DE/EN versions. `data/archive.json` contains previous editions.

## Intelligence architecture

Core configuration:

- `config/EDITORIAL_POLICY.md` — canonical editorial/research policy
- `config/sources.yaml` — source catalog and mandatory coverage floor
- `config/source_roles.yaml` — multi-role source classification
- `config/research_watches.yaml` — persistent thematic research watches
- `config/intelligence.yaml` — advanced intelligence features and quality gates
- `config/evals.yaml` — small reproducible house-eval policy

Persistent intelligence state:

- `data/entities.json` — recurring entities and aliases
- `data/claims.json` — claim/evidence graph
- `data/storylines.json` — persistent storylines and emerging signals
- `data/theses.json` — falsifiable six-month theses
- `data/predictions.json` — What-comes-next prediction scorecard
- `data/builder_radar.json` — builder experiments and follow-up lifecycle
- `data/trends.json` — internal trend heatmap
- `data/concepts.json` — Concept-of-the-Day knowledge base
- `data/evals.json` — house-eval results
- `data/source_metrics.json` — measured source contribution and quality
- `data/research/YYYY-MM-DD.json` — per-edition research audit

## Editorial intelligence passes

Every run can combine several explicit passes:

1. **Emerging Signals** — detect independent developments converging on a structural trend.
2. **Contrarian Evidence** — actively look for credible evidence that weakens dominant narratives or vendor claims.
3. **Builder Radar** — identify concrete, testable tools/techniques worth trying and follow them over time.
4. **Claim/Evidence Graph** — score material claims individually rather than granting one evidence label to an entire story.
5. **Prediction Scorecard** — preserve and evaluate prior predictions instead of remembering only successes.
6. **Red-Team Pass** — adversarially challenge the draft before publication.
7. **House Evals** — run small reproducible tests when they materially improve a model/tool decision.
8. **Trend Heatmap** — track momentum from independent events rather than article volume.
9. **Concept Knowledge Base** — turn Concepts of the Day into a reusable AI-engineering library.
10. **Weekly Intelligence Review** — on Sundays, synthesize what changed our assessment rather than summarizing seven daily editions.

## Publishing contract

For each new edition:

1. Load current policy, source roles, watches and intelligence state.
2. Research and prioritize developments once.
3. Build claim-level evidence and run continuity/intelligence checks.
4. Generate German and English versions from the same factual/editorial basis.
5. Run the adversarial red-team/quality gates.
6. Store the research audit and update intelligence state.
7. Create both dated briefing files under `briefings/`.
8. Update `data/latest.json` and `data/archive.json`.
9. On Sundays, additionally publish the Weekly Intelligence Review under `weekly/`.

The site intentionally separates presentation from generated briefing content so the publisher can evolve the intelligence system without coupling the homepage to the research pipeline.

## Visual editorial system

Daily editions use a small set of information-bearing visual classes: primary-source media, data visualizations, explanatory diagrams and evidence cards. The default budget is three to five visuals per edition, including the Concept of the Day. Trend heatmaps are rendered from `data/trends.json`; Builder Radar cards are hydrated from `data/builder_radar.json`. Every original graphic carries provenance, and external media requires a visible source and reuse status. Generic AI stock imagery is not used.


## Editorial presentation

The magazine layout is implemented in `assets/editorial.css` and `assets/editorial.js`, on top of the existing briefing and visual styles. Barlow Condensed and DM Sans are served locally from `assets/fonts/`; their SIL Open Font Licenses are included there. Companion library pages share the identity through `assets/library.css`.

The homepage derives its headline, introductory excerpt, signals and chapter navigation from the selected DE/EN briefing. `data/covers.json` optionally supplies art direction for a specific edition date: translated `title` arrays (three short lines), `kicker`, `deck`, `signals`, and a supported `visual` identifier. The `control-stack` graphic is specific to the Alibaba full-stack story and includes its source and roadmap caveat. Do not reuse it for unrelated stories. Missing cover metadata falls back to that edition's own headline and signal list; future publishing does not require a cover entry. The complete editorial introduction remains in the article.

Preview locally with `python3 -m http.server 8766`, then open `http://localhost:8766/`. Check both languages and archived editions at desktop and 320px widths when changing the shell. Explicit `?lang=de` / `?lang=en` links take precedence over the saved language preference.
