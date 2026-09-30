#!/usr/bin/env python3
"""Validate the minimum publishing contract for one AI Daily Brief edition."""

from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_json(relative_path: str):
    path = ROOT / relative_path
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise AssertionError(f"Missing required file: {relative_path}") from exc
    except json.JSONDecodeError as exc:
        raise AssertionError(f"Invalid JSON in {relative_path}: {exc}") from exc


def contains_path(value, expected: str) -> bool:
    if isinstance(value, str):
        return value == expected
    if isinstance(value, list):
        return any(contains_path(item, expected) for item in value)
    if isinstance(value, dict):
        return any(contains_path(item, expected) for item in value.values())
    return False


def validate_html(relative_path: str, language: str) -> None:
    path = ROOT / relative_path
    if not path.is_file():
        raise AssertionError(f"Missing briefing: {relative_path}")

    html = path.read_text(encoding="utf-8")
    if len(html) < 8_000:
        raise AssertionError(f"Briefing is unexpectedly short: {relative_path}")
    if re.search(r"(?:TODO|TBD|PLACEHOLDER)", html, re.IGNORECASE):
        raise AssertionError(f"Placeholder text found in {relative_path}")
    if len(re.findall(r'href=["\']https?://', html)) < 5:
        raise AssertionError(f"Fewer than five external source links in {relative_path}")

    language_markers = {
        "de": ("Warum relevant", "Quellen"),
        "en": ("Why it matters", "Sources"),
    }
    if not any(marker.lower() in html.lower() for marker in language_markers[language]):
        raise AssertionError(f"Expected {language.upper()} editorial markers in {relative_path}")


def main() -> int:
    run_date = sys.argv[1] if len(sys.argv) > 1 else date.today().isoformat()
    try:
        date.fromisoformat(run_date)
    except ValueError as exc:
        raise AssertionError(f"Expected ISO date, got {run_date!r}") from exc

    de_path = f"briefings/{run_date}-de.html"
    en_path = f"briefings/{run_date}-en.html"
    validate_html(de_path, "de")
    validate_html(en_path, "en")

    latest = load_json("data/latest.json")
    if not contains_path(latest, de_path) or not contains_path(latest, en_path):
        raise AssertionError("data/latest.json does not point to both current editions")

    archive = load_json("data/archive.json")
    if not contains_path(archive, de_path) or not contains_path(archive, en_path):
        raise AssertionError("data/archive.json does not contain both current editions")

    research_path = f"data/research/{run_date}.json"
    research = load_json(research_path)
    if not contains_path(research, run_date):
        raise AssertionError(f"{research_path} does not identify the run date")

    covers = load_json("data/covers.json")
    if run_date >= "2026-09-30":
        review = research.get("red_team_report", {})
        if review.get("approved") is not True or review.get("issues") != [] or not review.get("checks"):
            raise AssertionError("Independent editorial review is missing or has unresolved issues")
        if research.get("publish_decision") != "publish" or not research.get("claims"):
            raise AssertionError("Missing publication decision or claim-level evidence")
        illustration = covers.get(run_date, {}).get("illustration", {})
        for lang in ("de", "en"):
            src = illustration.get("src", {})
            src = src.get(lang) if isinstance(src, dict) else src
            if illustration and (not src or not src.startswith("assets/illustrations/") or not (ROOT / src).is_file()):
                raise AssertionError(f"Missing {lang} cover illustration")
            fragment = (ROOT / f"briefings/{run_date}-{lang}.html").read_text()
            for image in re.findall(r'<img[^>]+src="([^"]+)"', fragment):
                if not image.startswith("assets/illustrations/") or not (ROOT / image).is_file():
                    raise AssertionError("Missing generated diagram: " + image)
            expected = sum(v.get("target") != "cover" for v in research.get("visual_plan", []))
            if fragment.count('class="editorial-visual ') != expected:
                raise AssertionError("Rendered graphics do not match the editorial visual plan")
    print(f"Validated AI Daily Brief publishing contract for {run_date}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
