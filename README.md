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
9. Include edition-specific cover metadata in `data/covers.json` and its original assets in `assets/illustrations/`; the publishing runner stages both with the content. From the 2026-09-25 edition onward, follow the approved illustrated presentation in `config/EDITORIAL_POLICY.md`.
10. On Sundays, additionally publish the Weekly Intelligence Review under `weekly/`.

The site intentionally separates presentation from generated briefing content so the publisher can evolve the intelligence system without coupling the homepage to the research pipeline.

## Visual editorial system

Daily editions use a small set of information-bearing visual classes: primary-source media, data visualizations, explanatory diagrams and evidence cards. The default budget is three to five visuals per edition, including the Concept of the Day. Trend heatmaps are rendered from `data/trends.json`; Builder Radar cards are hydrated from `data/builder_radar.json`. Every original graphic carries provenance, and external media requires a visible source and reuse status. Generic AI stock imagery is not used.


## Editorial presentation

The reading layout is implemented in `assets/editorial.css` and `assets/editorial.js`, on top of the existing briefing and visual styles. It uses a cool light background, rounded surfaces and restrained sky-blue, sage, lavender and sand accents. DM Sans is served locally from `assets/fonts/` for both prominent headlines and body copy. The overview uses softly tinted cards; prose keeps a consistent left edge. Companion library pages share the presentation through `assets/library.css`.

The daily headline is followed by the prominent “In 60 Sekunden” / “In 60 seconds” overview, then the full editorial introduction and news. Story headings, paragraphs and source rows share a consistent left edge. Daily fragments may use standalone `h2.chapter` headings or `section.chapter` containers with a direct `.section-kicker`. The renderer normalizes these without removing articles, paragraphs, links or visuals. Story `h2` headings become `h3`; executive section labels become real `h2` headings. Both historical `strong` + `span` + `p` signal cards and newer `strong` + `br` + text cards are supported.

The homepage derives its headline and chapter navigation from the selected DE/EN briefing. `data/covers.json` optionally supplies a date-specific translated `kicker` and `deck`; historical art-direction fields remain stored. An optional `illustration` object supplies `src`, translated `alt` and `caption`, and linked `sources` for an edition-specific lead illustration. It is never reused automatically for other dates. The complete editorial introduction remains in the article. The “Archiv” / “Archive” navigation leads to past editions; “Konzepte” / “Concepts” leads to the separate knowledge library.

Concept cards link to `concept.html?id=<concept-id>&lang=de|en`. `assets/concepts.js` resolves the selected record from `data/concepts.json`, loads its language-specific `briefing` path and renders only the `.concept` explanation (or historical `.concept-story` section) on the dedicated page. Paragraphs, diagrams, code and source links are preserved; daily briefing chrome and unrelated news are excluded. Future concepts need a unique ID, translated title/summary and `briefing.de` / `briefing.en` paths to fragments containing one `.concept` section. Explicit URL language takes precedence over saved preferences. Unknown IDs and load failures show recoverable states.

Preview locally with `python3 -m http.server 8766 --bind 127.0.0.1`, then open `http://localhost:8766/`. Check both languages and archived editions at desktop and 320px widths when changing the shell. Explicit `?lang=de` / `?lang=en` links take precedence over the saved language preference.

With Playwright and Chromium available, run `node tests/typography.cjs` against that preview (`BRIEF_URL` overrides its URL). The regression check covers every date in `data/archive.json` in DE/EN at four widths and verifies content/link preservation, heading roles, readable fonts, aligned text, overview prominence, cover/navigation labels and overflow. Run `node tests/concepts.cjs` to check all concept routes in both languages at desktop/mobile widths, content and source preservation, language switching, unknown IDs and load-error recovery.

The September 24 edition includes an original SVG lead illustration, a common-scale SPACE bypass chart (0/108, 0/54, 11/54, with the post-fix caveat kept outside the scale), and an illustrated network-authority chain reused on its concept detail page. Sources and provenance accompany each visual. New editions should use the same visual classes with their own evidence and date-specific art.

Edition menu and archive links open `#edition` so the cover remains visible. `#brief` remains the deliberate shortcut to the quick overview; editions with a title illustration offer a return link there. Cover metadata bypasses browser cache so newly added art appears on reload. Run `node tests/cover-navigation.cjs` to check image loading and both entry paths at desktop and mobile widths.
