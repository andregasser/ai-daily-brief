#!/usr/bin/env python3
"""Render a canonical bilingual daily-brief JSON document into site artifacts."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]


def load(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ValueError(f"Missing file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in {path}: {exc}") from exc


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def esc(value: Any) -> str:
    return html.escape(str(value or ""), quote=True)


def loc(value: Any, lang: str, field: str) -> str:
    if not isinstance(value, dict) or not isinstance(value.get(lang), str) or not value[lang].strip():
        raise ValueError(f"Missing localized {field}.{lang}")
    return value[lang].strip()


def optional_loc(value: Any, lang: str) -> str:
    return value.get(lang, "").strip() if isinstance(value, dict) and isinstance(value.get(lang), str) else ""


def slug(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")[:80] or "concept"


LABELS = {
    "de": {
        "overview": "In 60 Sekunden", "lead": "Editorial Lead — Analyse", "changed": "Was ist neu?",
        "why": "Warum relevant?", "engineering": "Engineering Takeaway", "hype": "Signal vs. Hype",
        "sources": "Quellen", "concept": "🔬 Konzept des Tages", "intuition": "Intuition",
        "technical": "Technische Tiefe", "example": "Konkretes Beispiel", "practical": "Praktische Relevanz",
        "next": "Was als Nächstes wichtig wird", "confidence": "Confidence", "falsifiable": "Falsifizierbar",
    },
    "en": {
        "overview": "In 60 Seconds", "lead": "Editorial Lead — Analysis", "changed": "What changed?",
        "why": "Why it matters", "engineering": "Engineering takeaway", "hype": "Signal vs. Hype",
        "sources": "Sources", "concept": "🔬 Concept of the Day", "intuition": "Intuition",
        "technical": "Technical depth", "example": "Concrete example", "practical": "Practical relevance",
        "next": "What comes next", "confidence": "Confidence", "falsifiable": "Falsifiable",
    },
}


def source_links(sources: Any, lang: str) -> str:
    if not isinstance(sources, list) or not sources:
        return ""
    links = []
    for source in sources:
        if not isinstance(source, dict) or not source.get("url"):
            continue
        links.append(f'<a href="{esc(source["url"])}">{esc(source.get("label") or source["url"])}</a>')
    return f'<div class="sources"><strong>{LABELS[lang]["sources"]}:</strong> ' + " · ".join(links) + "</div>" if links else ""


def paragraphs(values: Any) -> str:
    if not isinstance(values, list):
        return ""
    return "\n".join(f"    <p>{esc(value)}</p>" for value in values if isinstance(value, str) and value.strip())


def story_html(story: dict[str, Any], lang: str) -> str:
    priority = esc(story.get("priority", "HIGH").upper())
    evidence = esc(story.get("evidence", "REPORTED").upper())
    pieces = [
        '  <article class="story">',
        f'    <div class="story-meta"><span class="priority high">{priority}</span><span class="evidence reported">{evidence}</span></div>',
        f"    <h2>{esc(loc(story.get('title'), lang, 'story.title'))}</h2>",
        paragraphs(story.get("body", {}).get(lang, []) if isinstance(story.get("body"), dict) else []),
    ]
    for field, css_name in (("changed", "changed"), ("why", "why"), ("engineering", "engineering"), ("signal_hype", "signal-hype")):
        value = optional_loc(story.get(field), lang)
        if value:
            pieces.append(f'    <p class="{css_name}"><strong>{LABELS[lang]["hype" if field == "signal_hype" else field]}:</strong> {esc(value)}</p>')
    pieces.append("    " + source_links(story.get("sources"), lang))
    pieces.append("  </article>")
    return "\n".join(piece for piece in pieces if piece.strip())


def chapter_html(section: dict[str, Any], lang: str) -> str:
    title = loc(section.get("title"), lang, "section.title")
    stories = section.get("stories")
    if not isinstance(stories, list) or not stories:
        raise ValueError(f"Section {title!r} has no stories")
    return "\n".join([
        '<section class="chapter">',
        f'  <div class="section-kicker">{esc(title)}</div>',
        *(story_html(story, lang) for story in stories),
        "</section>",
    ])


def callout_html(callout: Any, lang: str) -> str:
    if not isinstance(callout, dict) or not optional_loc(callout.get("title"), lang):
        return ""
    return "\n".join([
        '<section class="signal-box emerging-callout">',
        '  <div class="section-kicker">Emerging Signal</div>',
        f"  <h2>{esc(loc(callout['title'], lang, 'emerging_signal.title'))}</h2>",
        f'  <p><strong>{LABELS[lang]["confidence"]}: {esc(callout.get("confidence", "Medium"))}.</strong> {esc(loc(callout.get("analysis"), lang, "emerging_signal.analysis"))}</p>',
        f'  <p><strong>{LABELS[lang]["falsifiable"]}:</strong> {esc(loc(callout.get("falsifiable"), lang, "emerging_signal.falsifiable"))}</p>',
        "</section>",
    ])


def concept_html(concept: dict[str, Any], lang: str) -> str:
    pieces = [
        '<section class="concept">',
        f'  <div class="section-kicker">{LABELS[lang]["concept"]}</div>',
        f'  <h2 class="concept-heading">{esc(loc(concept.get("title"), lang, "concept.title"))}</h2>',
    ]
    intuition = optional_loc(concept.get("intuition"), lang)
    if intuition:
        pieces.append(f'  <p><strong>{LABELS[lang]["intuition"]}:</strong> {esc(intuition)}</p>')
    technical = concept.get("technical_depth", {}).get(lang, []) if isinstance(concept.get("technical_depth"), dict) else []
    if technical:
        pieces.append(f'  <h3>{LABELS[lang]["technical"]}</h3>')
        pieces.append(paragraphs(technical))
    example = optional_loc(concept.get("example"), lang)
    if example:
        pieces.append(f'  <p><strong>{LABELS[lang]["example"]}:</strong> {esc(example)}</p>')
    code = concept.get("code")
    if isinstance(code, str) and code.strip():
        pieces.append(f"  <pre><code>{esc(code.strip())}</code></pre>")
    practical = optional_loc(concept.get("practical"), lang)
    if practical:
        pieces.append(f'  <p><strong>{LABELS[lang]["practical"]}:</strong> {esc(practical)}</p>')
    pieces.append("  " + source_links(concept.get("sources"), lang))
    pieces.append("</section>")
    return "\n".join(piece for piece in pieces if piece.strip())


def render(brief: dict[str, Any], lang: str) -> str:
    run_date = brief["date"]
    executive = brief.get("executive_summary")
    if not isinstance(executive, list) or len(executive) < 3:
        raise ValueError("executive_summary must contain at least three signals")
    sections = brief.get("sections")
    if not isinstance(sections, list) or len(sections) < 2:
        raise ValueError("sections must contain at least Business and Engineering")

    output = [
        '<section class="briefing-intro">',
        f'  <div class="brief-label">AI Daily Brief · {esc(date.fromisoformat(run_date).strftime("%d.%m.%Y"))}</div>',
        f"  <h1>{esc(loc(brief.get('headline'), lang, 'headline'))}</h1>",
        f'  <p class="dek">{esc(loc(brief.get("dek"), lang, "dek"))}</p>',
        f'  <p><strong>{LABELS[lang]["lead"]}:</strong> {esc(loc(brief.get("editorial_lead"), lang, "editorial_lead"))}</p>',
        "</section>",
        '<section class="executive">',
        f'  <div class="section-kicker">{LABELS[lang]["overview"]}</div>',
        '  <div class="signal-grid">',
        *(f'    <div><strong>{esc(loc(item.get("title"), lang, "executive.title"))}</strong><br>{esc(loc(item.get("body"), lang, "executive.body"))}</div>' for item in executive[:4]),
        "  </div>",
        "</section>",
        *(chapter_html(section, lang) for section in sections),
        callout_html(brief.get("emerging_signal"), lang),
        concept_html(brief["concept"], lang),
        '<section class="chapter">',
        f'  <div class="section-kicker">{LABELS[lang]["next"]}</div>',
        '  <article class="story"><ul>',
        *(f"    <li>{esc(item)}</li>" for item in brief.get("what_next", {}).get(lang, [])),
        "  </ul></article>",
        "</section>",
    ]
    return "\n\n".join(part for part in output if part and str(part).strip()) + "\n"


def render_weekly(review: dict[str, Any], lang: str) -> str:
    week = review.get("week")
    sections = review.get("sections")
    if not isinstance(week, str) or not isinstance(sections, list) or len(sections) < 3:
        raise ValueError("Sunday weekly_review needs week and at least three sections")
    output = [
        '<section class="briefing-intro">',
        f'  <span class="brief-label">WEEKLY INTELLIGENCE REVIEW · {esc(week)}</span>',
        f'  <h2>{esc(loc(review.get("headline"), lang, "weekly_review.headline"))}</h2>',
        f'  <p>{esc(loc(review.get("intro"), lang, "weekly_review.intro"))}</p>',
        "</section>",
    ]
    for section in sections:
        output.extend([
            f'<h2 class="chapter">{esc(loc(section.get("title"), lang, "weekly_review.section.title"))}</h2>',
            '<section class="story">',
            paragraphs(section.get("body", {}).get(lang, []) if isinstance(section.get("body"), dict) else []),
            "</section>",
        ])
    return "\n\n".join(part for part in output if part and str(part).strip()) + "\n"


def validate_brief(brief: dict[str, Any], expected_date: str | None) -> None:
    run_date = brief.get("date")
    if not isinstance(run_date, str):
        raise ValueError("Missing date")
    date.fromisoformat(run_date)
    if expected_date and run_date != expected_date:
        raise ValueError(f"Brief date {run_date} does not match expected {expected_date}")
    for field in ("headline", "dek", "editorial_lead"):
        loc(brief.get(field), "de", field)
        loc(brief.get(field), "en", field)
    if not isinstance(brief.get("concept"), dict):
        raise ValueError("Missing concept")
    if not isinstance(brief.get("tags"), list) or len(brief["tags"]) < 3:
        raise ValueError("At least three tags are required")
    if date.fromisoformat(run_date).weekday() == 6 and not isinstance(brief.get("weekly_review"), dict):
        raise ValueError("Sunday editions require weekly_review")


def update_metadata(brief: dict[str, Any]) -> None:
    run_date = brief["date"]
    de_path = f"briefings/{run_date}-de.html"
    en_path = f"briefings/{run_date}-en.html"
    updated_at = brief.get("updated_at") or datetime.now().astimezone().isoformat(timespec="seconds")
    write_json(ROOT / "data/latest.json", {"date": run_date, "de": de_path, "en": en_path, "updated_at": updated_at, "layout": "v4-visual-intelligence"})

    archive_path = ROOT / "data/archive.json"
    archive = load(archive_path)
    archive = [item for item in archive if item.get("date") != run_date]
    archive.insert(0, {
        "date": run_date, "de": de_path, "en": en_path,
        "headline": brief["headline"], "tags": brief["tags"],
        "concept": brief["concept"]["title"],
    })
    write_json(archive_path, archive)

    covers_path = ROOT / "data/covers.json"
    covers = load(covers_path)
    cover = brief.get("cover") or {}
    covers[run_date] = {
        "kicker": cover.get("kicker") or {"de": "Die Leitgeschichte", "en": "The lead story"},
        "deck": cover.get("deck") or brief["dek"],
    }
    if isinstance(cover.get("illustration"), dict):
        covers[run_date]["illustration"] = cover["illustration"]
    write_json(covers_path, covers)

    concept = brief["concept"]
    concepts_path = ROOT / "data/concepts.json"
    concepts_doc = load(concepts_path)
    records = concepts_doc.setdefault("concepts", [])
    concept_id = concept.get("id") or slug(concept["title"]["en"])
    records[:] = [item for item in records if item.get("id") != concept_id]
    records.append({
        "id": concept_id, "first_seen": run_date, "last_seen": run_date,
        "title": concept["title"], "summary": concept.get("summary") or concept.get("intuition"),
        "tags": concept.get("tags", []), "storylines": concept.get("storylines", []),
        "sources": [source["url"] for source in concept.get("sources", []) if isinstance(source, dict) and source.get("url")],
        "related_concepts": concept.get("related_concepts", []),
        "briefing": {"de": de_path, "en": en_path},
    })
    write_json(concepts_path, concepts_doc)

    research = brief.get("research_audit")
    if not isinstance(research, dict):
        raise ValueError("research_audit must be an object")
    research.setdefault("date", run_date)
    research.setdefault("publish_decision", "publish")
    write_json(ROOT / f"data/research/{run_date}.json", research)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--date", dest="expected_date")
    args = parser.parse_args()
    try:
        brief = load(args.input)
        validate_brief(brief, args.expected_date)
        for lang in ("de", "en"):
            output = ROOT / f"briefings/{brief['date']}-{lang}.html"
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(render(brief, lang), encoding="utf-8")
            if isinstance(brief.get("weekly_review"), dict):
                weekly = brief["weekly_review"]
                weekly_output = ROOT / f"weekly/{weekly['week']}-{lang}.html"
                weekly_output.parent.mkdir(parents=True, exist_ok=True)
                weekly_output.write_text(render_weekly(weekly, lang), encoding="utf-8")
        update_metadata(brief)
        print(f"Rendered bilingual AI Daily Brief for {brief['date']}")
        return 0
    except (ValueError, KeyError, TypeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
