# AI Daily Brief

Bilingual daily AI briefing published via GitHub Pages.

## Content model

Each research run produces one editorially consistent briefing in two languages:

- `briefings/YYYY-MM-DD-de.html`
- `briefings/YYYY-MM-DD-en.html`

`data/latest.json` points the homepage to the current DE/EN versions. `data/archive.json` contains previous editions.

## Publishing contract

For each new edition:

1. Research and prioritize the developments once.
2. Generate German and English versions from the same factual/editorial basis.
3. Create both dated briefing files under `briefings/`.
4. Update `data/latest.json`.
5. Prepend the edition to `data/archive.json`.

The site intentionally separates presentation from generated briefing content so a scheduled publisher only needs to write the two briefing files and update the JSON metadata.
