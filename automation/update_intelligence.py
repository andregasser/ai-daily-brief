"""Persist reviewed evidence with stable IDs, retaining existing history."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path


def save(path, doc):
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")


def append_record(records, record):
    existing = next((x for x in records if x.get("id") == record["id"]), None)
    if existing is None:
        records.append(record)
    elif existing != record:
        raise ValueError("Refusing to overwrite a different historical record: " + record["id"])


def update(brief, root: Path):
    date = brief["date"]
    audit = brief["research_audit"]
    claims_path = root / "data/claims.json"
    claims = json.loads(claims_path.read_text())
    for claim in audit["claims"]:
        # The date and content determine the ID; a model cannot replace old claims.
        identifier = date + "-" + hashlib.sha256(claim["claim"].encode()).hexdigest()[:12]
        append_record(claims["claims"], {**claim, "id": identifier, "date": date})
    claims["updated_at"] = date
    save(claims_path, claims)

    predictions_path = root / "data/predictions.json"
    predictions = json.loads(predictions_path.read_text())
    for prediction in brief["predictions"]:
        identifier = "pred-" + date + "-" + hashlib.sha256(prediction["prediction"].encode()).hexdigest()[:12]
        append_record(predictions["predictions"], {**prediction, "id": identifier, "created": date, "status": "open", "evidence": []})
    predictions["updated_at"] = date
    save(predictions_path, predictions)

    # Reviews append observations. They do not blindly replace status, scores,
    # criteria, histories or prior evidence with a compact model summary.
    targets = {"prediction": ("predictions", "predictions"), "builder": ("builder_radar", "items"),
               "thesis": ("theses", "theses"), "storyline": ("storylines", "storylines"), "trend": ("trends", "topics")}
    for review in audit.get("continuity_reviews", []):
        if review.get("kind") not in targets:
            raise ValueError("Unknown continuity kind")
        filename, key = targets[review["kind"]]
        path = root / f"data/{filename}.json"
        doc = json.loads(path.read_text())
        item = next((x for x in doc[key] if x.get("id") == review.get("id")), None)
        if item is None:
            raise ValueError("Review references an unknown memory ID")
        observation = {"date": date, "note": review["assessment"], "sources": review.get("sources", [])}
        history = item.setdefault("reviews", [])
        if observation not in history:
            history.append(observation)
        item["last_reviewed"] = date
        save(path, doc)

    metrics_path = root / "data/source_metrics.json"
    metrics = json.loads(metrics_path.read_text())
    # Idempotent observation counters based on actual collector measurements.
    runs = metrics.setdefault("pipeline_observations", {})
    if date not in runs:
        observations = audit.get("source_coverage", {}).get("observations", [])
        for observation in observations:
            record = metrics["sources"].setdefault(observation["source"], {"counters": {}, "observation_days": 0})
            if observation["status"] == "ok":
                counters = record.setdefault("counters", {})
                counters["items_seen"] = counters.get("items_seen", 0) + observation["items_seen"]
                record["observation_days"] = record.get("observation_days", 0) + 1
                record["last_observed"] = date
        runs[date] = observations
    metrics["last_updated"] = date
    save(metrics_path, metrics)
