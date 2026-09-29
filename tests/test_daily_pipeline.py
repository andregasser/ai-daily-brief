#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from automation import prepare_daily_context as prepare  # noqa: E402
from automation import render_daily as renderer  # noqa: E402


def localized(de: str, en: str) -> dict[str, str]:
    return {"de": de, "en": en}


class DailyPipelineTests(unittest.TestCase):
    def test_source_catalog_is_broad_and_has_feeds(self) -> None:
        sources = prepare.source_catalog()
        self.assertGreaterEqual(len(sources), 60)
        self.assertGreaterEqual(sum(bool(source.get("feed")) for source in sources), 40)
        self.assertEqual(len({source["name"] for source in sources}), len(sources))

    def test_editorial_context_is_bounded(self) -> None:
        context = prepare.compact_context("2026-09-29")
        encoded = json.dumps(context, ensure_ascii=False)
        self.assertLess(len(encoded), 90_000)
        self.assertLessEqual(len(context["recent_archive"]), 3)
        self.assertLessEqual(len(context["recent_or_contested_claims"]), 24)

    def test_renderer_produces_bilingual_editorial_contract(self) -> None:
        body_de = "Verifizierte Entwicklung mit technischer Einordnung und belastbarer Einschränkung. " * 18
        body_en = "Verified development with technical context and a material limitation. " * 18
        source = {"label": "Primary source", "url": "https://example.com/source"}
        stories = []
        for number in range(4):
            stories.append({
                "priority": "high", "evidence": "confirmed primary",
                "title": localized(f"Geschichte {number}", f"Story {number}"),
                "body": {"de": [body_de, body_de], "en": [body_en, body_en]},
                "changed": localized("Neue Evidenz ist hinzugekommen.", "New evidence was added."),
                "why": localized("Das verändert Architekturentscheidungen.", "This changes architecture decisions."),
                "engineering": localized("Mit einem gepinnten Test prüfen.", "Verify with a pinned test."),
                "signal_hype": localized("Starkes Signal, aber begrenzte Generalisierbarkeit.", "Strong signal with limited generalizability."),
                "sources": [source],
            })
        brief = {
            "date": "2026-09-29", "updated_at": "2026-09-29T07:00:00+02:00",
            "headline": localized("Eine verifizierte Leitgeschichte", "A verified lead story"),
            "dek": localized("Die wichtigsten Entwicklungen im Zusammenhang.", "The most important developments in context."),
            "editorial_lead": localized(body_de, body_en),
            "executive_summary": [
                {"title": localized(f"Signal {i}", f"Signal {i}"), "body": localized(body_de[:220], body_en[:220])}
                for i in range(4)
            ],
            "sections": [
                {"title": localized("Business & Strategie", "Business & Strategy"), "stories": stories[:2]},
                {"title": localized("Modelle, Agents & Engineering", "Models, Agents & Engineering"), "stories": stories[2:]},
            ],
            "concept": {
                "id": "bounded-agent-context", "title": localized("Begrenzter Agent-Kontext", "Bounded agent context"),
                "summary": localized("Kontext gezielt auswählen.", "Select context deliberately."),
                "intuition": localized(body_de, body_en), "technical_depth": {"de": [body_de], "en": [body_en]},
                "example": localized("Ein Research-Paket statt eines Reposcans.", "A research packet instead of a repository scan."),
                "code": "candidates = deduplicate(feed_items)[:50]", "practical": localized(body_de, body_en),
                "sources": [source], "tags": ["agents"], "storylines": [], "related_concepts": [],
            },
            "what_next": {"de": ["Messbaren Test durchführen."] * 3, "en": ["Run a measurable test."] * 3},
            "tags": ["Agents", "Research", "Cost"], "research_audit": {"date": "2026-09-29"},
        }
        renderer.validate_brief(brief, "2026-09-29")
        for lang, marker in (("de", "Warum relevant"), ("en", "Why it matters")):
            output = renderer.render(brief, lang)
            self.assertGreater(len(output), 8_000)
            self.assertIn(marker, output)
            self.assertGreaterEqual(output.count('href="https://'), 5)


if __name__ == "__main__":
    unittest.main()
