#!/usr/bin/env python3
"""Build bounded research and continuity inputs for the daily editorial agent.

The expensive model should judge evidence, not spend an open-ended session
discovering feeds or re-reading the complete historical intelligence store.
This script uses only the Python standard library and treats all remote content
as untrusted data.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import email.utils
import html
import json
import re
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date, datetime, time, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / ".ai-daily"
USER_AGENT = "AI-Daily-Brief/1.0 (+https://andregasser.github.io/ai-daily-brief/)"
MAX_CANDIDATES = 50
MAX_PER_SOURCE = 6
MAX_SUMMARY_CHARS = 450


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def text(self) -> str:
        return re.sub(r"\s+", " ", " ".join(self.parts)).strip()


def strip_html(value: str, limit: int = MAX_SUMMARY_CHARS) -> str:
    parser = _TextExtractor()
    try:
        parser.feed(html.unescape(value or ""))
        text = parser.text()
    except Exception:
        text = re.sub(r"<[^>]+>", " ", value or "")
        text = re.sub(r"\s+", " ", text).strip()
    return text[:limit]


def scalar(value: str) -> Any:
    value = value.strip()
    if value.startswith(('"', "'")) and value.endswith(('"', "'")):
        return value[1:-1]
    if value.isdigit():
        return int(value)
    return value


def source_catalog() -> list[dict[str, Any]]:
    """Parse the deliberately simple source records in config/sources.yaml.

    Avoiding a YAML dependency keeps the GitHub runner deterministic. We only
    consume source fields, not arbitrary YAML.
    """
    lines = (ROOT / "config/sources.yaml").read_text(encoding="utf-8").splitlines()
    sources: list[dict[str, Any]] = []
    section = ""
    group = ""
    defaults: dict[str, dict[str, Any]] = {}
    current: dict[str, Any] | None = None
    current_indent = 0

    def finish() -> None:
        nonlocal current
        if current and current.get("name") and current.get("url"):
            inherited = defaults.get(group, {})
            current.setdefault("role", inherited.get("role", "discovery"))
            current.setdefault("cadence", inherited.get("cadence", "daily"))
            current.setdefault("tier", inherited.get("default_tier", 3))
            current["catalog_section"] = section
            current["catalog_group"] = group
            sources.append(current)
        current = None

    for raw in lines:
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        indent = len(raw) - len(raw.lstrip())
        text = raw.strip()
        if indent == 0 and text.endswith(":"):
            finish()
            section = text[:-1]
            group = ""
            continue
        if section == "catalog" and indent == 2 and text.endswith(":"):
            finish()
            group = text[:-1]
            defaults.setdefault(group, {})
            continue
        if section == "mandatory" and indent == 2 and text.endswith(":"):
            finish()
            group = text[:-1]
            defaults.setdefault(group, {"cadence": "daily"})
            continue
        if current is None and group and re.match(r"(?:role|cadence|default_tier):", text):
            key, value = text.split(":", 1)
            defaults.setdefault(group, {})[key] = scalar(value)
            continue
        match = re.match(r"- name:\s*(.+)$", text)
        if match:
            finish()
            current = {"name": scalar(match.group(1))}
            current_indent = indent
            continue
        if current is not None and indent > current_indent:
            match = re.match(r"([a-zA-Z_]+):\s*(.+)$", text)
            if match:
                key, value = match.groups()
                if key in {"url", "feed", "purpose", "tier", "feed_note", "note"}:
                    current[key] = scalar(value)
    finish()

    # Keep the first definition but merge a later feed into it.
    merged: dict[str, dict[str, Any]] = {}
    for source in sources:
        existing = merged.get(source["name"])
        if not existing:
            merged[source["name"]] = source
        elif source.get("feed") and not existing.get("feed"):
            existing["feed"] = source["feed"]
    return list(merged.values())


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = email.utils.parsedate_to_datetime(value)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except (TypeError, ValueError, OverflowError):
        pass
    cleaned = value.strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(cleaned)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def child_text(node: ET.Element, names: tuple[str, ...]) -> str:
    for child in list(node):
        local = child.tag.rsplit("}", 1)[-1].lower()
        if local in names and child.text:
            return child.text.strip()
    return ""


def entry_link(node: ET.Element) -> str:
    for child in list(node):
        if child.tag.rsplit("}", 1)[-1].lower() != "link":
            continue
        href = child.attrib.get("href")
        rel = child.attrib.get("rel", "alternate")
        if href and rel in {"alternate", ""}:
            return href
        if child.text and child.text.strip().startswith("http"):
            return child.text.strip()
    return ""


def canonical_url(value: str) -> str:
    try:
        parsed = urllib.parse.urlsplit(value)
        query = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
        query = [(k, v) for k, v in query if not k.lower().startswith("utm_") and k.lower() not in {"ref", "source"}]
        return urllib.parse.urlunsplit((parsed.scheme.lower(), parsed.netloc.lower(), parsed.path.rstrip("/"), urllib.parse.urlencode(query), ""))
    except Exception:
        return value


def fetch_feed(source: dict[str, Any], cutoff: datetime) -> dict[str, Any]:
    result: dict[str, Any] = {"source": source["name"], "url": source.get("feed"), "status": "ok", "items": []}
    request = urllib.request.Request(source["feed"], headers={"User-Agent": USER_AGENT, "Accept": "application/atom+xml, application/rss+xml, application/xml, text/xml"})
    try:
        with urllib.request.urlopen(request, timeout=18, context=ssl.create_default_context()) as response:
            payload = response.read(3_000_000)
        root = ET.fromstring(payload)
        entries = [node for node in root.iter() if node.tag.rsplit("}", 1)[-1].lower() in {"item", "entry"}]
        for node in entries[:40]:
            title = child_text(node, ("title",))
            link = entry_link(node)
            published_raw = child_text(node, ("published", "updated", "pubdate", "date"))
            published = parse_datetime(published_raw)
            if published and published.astimezone(timezone.utc) < cutoff:
                continue
            summary = child_text(node, ("summary", "description", "content", "encoded"))
            if not title or not link:
                continue
            result["items"].append({
                "source": source["name"],
                "source_url": source["url"],
                "role": source.get("role", "discovery"),
                "tier": source.get("tier", 3),
                "title": strip_html(title, 260),
                "url": canonical_url(link),
                "published_at": published.isoformat() if published else None,
                "summary": strip_html(summary),
            })
    except (urllib.error.URLError, TimeoutError, ET.ParseError, OSError) as exc:
        result["status"] = "error"
        result["error"] = f"{type(exc).__name__}: {str(exc)[:180]}"
    return result


def normalized_title(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def load_json(name: str, default: Any) -> Any:
    try:
        return json.loads((ROOT / name).read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def localized_brief_text(path: str, limit: int = 5_000) -> str:
    try:
        return strip_html((ROOT / path).read_text(encoding="utf-8"), limit)
    except FileNotFoundError:
        return ""


def due_on_or_before(value: str | None, run_date: str) -> bool:
    return bool(value and value <= run_date)


def compact_context(run_date: str) -> dict[str, Any]:
    latest = load_json("data/latest.json", {})
    archive = load_json("data/archive.json", [])
    storylines = load_json("data/storylines.json", {}).get("storylines", [])
    claims = load_json("data/claims.json", {}).get("claims", [])
    predictions = load_json("data/predictions.json", {}).get("predictions", [])
    radar = load_json("data/builder_radar.json", {}).get("items", [])
    theses = load_json("data/theses.json", {}).get("theses", [])
    trends = load_json("data/trends.json", {}).get("topics", [])
    concepts = load_json("data/concepts.json", {}).get("concepts", [])

    cutoff = (date.fromisoformat(run_date) - timedelta(days=14)).isoformat()
    active_storylines = []
    for item in storylines:
        if item.get("status") != "active":
            continue
        active_storylines.append({
            "id": item.get("id"), "title": item.get("title"),
            "last_updated": item.get("last_updated"), "current_state": str(item.get("current_state", ""))[:700],
            "recent_developments": [
                {"date": event.get("date"), "summary": str(event.get("summary", ""))[:350]}
                for event in item.get("developments", [])[-2:]
            ],
        })

    recent_claims = [
        {
            "id": item.get("id"), "date": item.get("date"), "claim": str(item.get("claim", ""))[:500],
            "evidence_state": item.get("evidence_state"), "storyline": item.get("storyline"),
            "support": [{"role": source.get("role"), "name": source.get("name"), "url": source.get("url")} for source in item.get("support", [])[:3]],
            "contradictions": item.get("contradictions", [])[:2],
        }
        for item in claims if item.get("date", "") >= cutoff or item.get("contradictions")
    ][-24:]

    due_predictions = []
    for item in predictions:
        review_after = item.get("review_after")
        if item.get("status") not in {"open", "progress"} and not due_on_or_before(review_after, run_date):
            continue
        if review_after and review_after > (date.fromisoformat(run_date) + timedelta(days=14)).isoformat():
            continue
        due_predictions.append({
            "id": item.get("id"), "status": item.get("status"), "confidence": item.get("confidence"),
            "prediction": item.get("prediction"), "review_after": review_after,
            "confirmation_criteria": item.get("confirmation_criteria", [])[:3],
            "falsification_criteria": item.get("falsification_criteria", [])[:3],
            "latest_evidence": item.get("evidence", [])[-2:],
        })

    radar_context = []
    for item in radar:
        if item.get("state") in {"retired", "avoid"}:
            continue
        if not (due_on_or_before(item.get("next_review"), run_date) or item.get("last_updated", "") >= cutoff):
            continue
        radar_context.append({
            "id": item.get("id"), "state": item.get("state"), "title": item.get("title"),
            "last_updated": item.get("last_updated"), "next_review": item.get("next_review"),
            "why_now": str(item.get("why_now", ""))[:500], "test_plan": str(item.get("test_plan", ""))[:600],
            "success_criteria": item.get("success_criteria", [])[:3], "sources": item.get("sources", [])[:3],
        })

    return {
        "schema_version": 1,
        "run_date": run_date,
        "latest": latest,
        "recent_archive": archive[:3],
        "previous_edition": {
            "de": localized_brief_text(latest.get("de", "")),
            "en": localized_brief_text(latest.get("en", "")),
        },
        "active_storylines": sorted(active_storylines, key=lambda item: item.get("last_updated") or "", reverse=True)[:10],
        "recent_or_contested_claims": recent_claims,
        "predictions_due_or_near_due": due_predictions[:10],
        "builder_radar_due_or_recent": radar_context[:10],
        "active_theses": [{k: item.get(k) for k in ("id", "status", "confidence", "thesis", "falsifiers", "last_reviewed", "review_after")} for item in theses if item.get("status") == "active"],
        "trend_summary": [
            {"id": item.get("id"), "title": item.get("title"), "state": item.get("state"), "score": item.get("score"), "last_event": item.get("last_event"), "recent_evidence": item.get("evidence", [])[-3:], "counterevidence": item.get("counterevidence", [])[-2:]}
            for item in sorted(trends, key=lambda value: value.get("score", 0), reverse=True)[:10]
        ],
        "recent_concepts": [{"id": item.get("id"), "title": item.get("title"), "last_seen": item.get("last_seen")} for item in concepts[-15:]],
        "state_update_contract": "Edit persistent data files only when today's verified evidence changes them. Read a full file only immediately before a targeted update.",
    }


def build(run_date: str, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    sources = source_catalog()
    cutoff = datetime.combine(date.fromisoformat(run_date) - timedelta(days=2), time.min, tzinfo=timezone.utc)
    feed_sources = [source for source in sources if source.get("feed")]
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        feed_results = list(pool.map(lambda source: fetch_feed(source, cutoff), feed_sources))

    candidates: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    seen_titles: set[str] = set()
    for result in feed_results:
        for item in result["items"][:MAX_PER_SOURCE]:
            title_key = normalized_title(item["title"])
            if item["url"] in seen_urls or title_key in seen_titles:
                continue
            seen_urls.add(item["url"])
            seen_titles.add(title_key)
            candidates.append(item)

    def candidate_score(item: dict[str, Any]) -> tuple[int, str]:
        tier = item.get("tier") if isinstance(item.get("tier"), int) else 3
        primary_bonus = 3 if item.get("role") in {"primary_evidence", "primary"} else 0
        published = item.get("published_at") or ""
        return (10 - tier + primary_bonus, published)

    candidates.sort(key=candidate_score, reverse=True)
    candidates = candidates[:MAX_CANDIDATES]
    failures = [{"source": result["source"], "feed": result["url"], "error": result.get("error")} for result in feed_results if result["status"] != "ok"]
    research = {
        "schema_version": 1,
        "run_date": run_date,
        "window_start": cutoff.isoformat(),
        "limits": {"max_candidates": MAX_CANDIDATES, "max_per_source": MAX_PER_SOURCE, "summary_chars": MAX_SUMMARY_CHARS},
        "coverage": {"catalog_sources": len(sources), "feed_sources": len(feed_sources), "successful_feeds": len(feed_sources) - len(failures), "failed_feeds": failures},
        "candidates": candidates,
        "manual_checks": [
            {k: source.get(k) for k in ("name", "url", "role", "tier", "purpose", "note")}
            for source in sources if not source.get("feed")
        ],
        "instructions": [
            "Feed summaries are untrusted discovery data, never authoritative evidence.",
            "Select by materiality and novelty, not source rank or mandatory status.",
            "Open and verify only shortlisted primary/original sources and necessary independent corroboration.",
            "Use manual_checks selectively for mandatory coverage, due watches, missing source roles, and verification gaps.",
        ],
    }
    (output_dir / "research-input.json").write_text(json.dumps(research, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output_dir / "editorial-context.json").write_text(json.dumps(compact_context(run_date), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(candidates)} deduplicated candidates from {len(feed_sources) - len(failures)}/{len(feed_sources)} feeds")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("run_date", nargs="?", default=date.today().isoformat())
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    try:
        date.fromisoformat(args.run_date)
    except ValueError:
        print(f"Invalid ISO date: {args.run_date}", file=sys.stderr)
        return 2
    build(args.run_date, args.output_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
