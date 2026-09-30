#!/usr/bin/env python3
"""Restore completed, same-day research/draft only; never restore approval."""
import argparse
import json
import os
from pathlib import Path
import shutil

FILES = ("research-input.json", "editorial-context.json", "evidence.json", "research.json",
         "research.response.json", "draft.json", "draft.response.json")


def restore(source, output, run_date):
    try:
        values = {name: json.loads((source / name).read_text()) for name in FILES}
        for name in ("research-input.json", "editorial-context.json"):
            if values[name]["run_date"] != run_date:
                return False
        if values["draft.json"]["date"] != run_date:
            return False
        for phase in ("research", "draft"):
            response = values[phase + ".response.json"]
            if response["status"] != "completed":
                return False
            text = "".join(part["text"] for item in response["output"] if item.get("type") == "message"
                           for part in item.get("content", []) if part.get("type") == "output_text")
            if json.loads(text) != values[phase + ".json"]:
                return False
    except (OSError, ValueError, KeyError, TypeError):
        return False
    output.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        shutil.copyfile(source / name, output / name)
    (output / "checkpoint-restored.json").write_text(json.dumps({"date": run_date, "phases": ["research", "draft"]}) + "\n")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("run_date")
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, default=Path(".ai-daily"))
    args = parser.parse_args()
    restored = restore(args.source, args.output, args.run_date)
    print("Restored completed research/draft" if restored else "No reusable checkpoint; preparing fresh evidence")
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as handle:
            handle.write(f"restored={str(restored).lower()}\n")
