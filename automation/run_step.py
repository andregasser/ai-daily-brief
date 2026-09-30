#!/usr/bin/env python3
"""Time a fixed pipeline command, terminate its process group, preserve diagnostics."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone


def run(name: str, command: list[str], timeout: float, output: Path) -> int:
    output.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    record = {"stage": name, "started_at": datetime.now(timezone.utc).isoformat(), "status": "running"}
    target = output / f"{name}.timing.json"
    target.write_text(json.dumps(record) + "\n")
    print(f"Starting {name}; wall-clock limit {timeout:g}s", flush=True)
    with (output / f"{name}.log").open("w") as log:
        process = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            code = process.wait(timeout=timeout)
            record["status"] = "success" if code == 0 else "failed"
        except subprocess.TimeoutExpired:
            record["status"] = "timeout"
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
            code = 124
        finally:
            record.update(elapsed_seconds=round(time.monotonic() - started, 3), exit_code=process.returncode)
            target.write_text(json.dumps(record, indent=2) + "\n")
    # Only our fixed commands use this wrapper. API code never logs credentials.
    print((output / f"{name}.log").read_text(), end="", flush=True)
    print(json.dumps(record), flush=True)
    return code


def summary(output: Path) -> str:
    rows = ["| Stage | Status | Seconds |", "|---|---|---:|"]
    for path in sorted(output.glob("*.timing.json")):
        data = json.loads(path.read_text())
        rows.append(f"| {data['stage']} | {data['status']} | {data.get('elapsed_seconds', 'interrupted')} |")
    events = output / "api-events.jsonl"
    if events.exists():
        for line in events.read_text().splitlines():
            record = json.loads(line)
            if record["status"] in {"completed", "failed"}:
                rows.append(f"| API: {record['stage']} | {record['status']} | {record.get('elapsed_seconds', '?')} |")
    return "\n".join(rows) + "\n"


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("name")
    parser.add_argument("--timeout", type=float, default=60)
    parser.add_argument("--output", type=Path, default=Path(".ai-daily/diagnostics"))
    args, command = parser.parse_known_args()
    if args.name == "summary":
        report = summary(args.output)
        print(report)
        if os.environ.get("GITHUB_STEP_SUMMARY"):
            with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as handle:
                handle.write(report)
        sys.exit(0)
    if command[:1] == ["--"]:
        command = command[1:]
    if not command or args.timeout <= 0:
        parser.error("A command and positive timeout are required")
    sys.exit(run(args.name, command, args.timeout, args.output))
