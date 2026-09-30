from __future__ import annotations

import copy
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from automation import fetch_evidence, generate_daily, prepare_daily_context, render_daily, render_visuals, run_step, update_intelligence
from pipeline_fixture import brief, URL


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name)

    def test_context_budget_and_source_roles(self):
        packet = prepare_daily_context.editorial_packet("2026-09-30")
        self.assertLessEqual(len(json.dumps(packet, ensure_ascii=False)), 18_000)
        sources = {x["name"]: x for x in prepare_daily_context.source_catalog()}
        self.assertEqual(sources["OpenAI"]["role"], "primary")
        self.assertIn("journalism", sources["Reuters AI"]["roles"])
        self.assertTrue(sources["OpenAI"]["mandatory"])

    def test_timeout_is_measured_and_fails(self):
        code = run_step.run("slow", [sys.executable, "-c", "import time; time.sleep(5)"], .05, self.path)
        self.assertEqual(code, 124)
        timing = json.loads((self.path / "slow.timing.json").read_text())
        self.assertEqual(timing["status"], "timeout")
        self.assertLess(timing["elapsed_seconds"], 2)

    def stream(self, result=None, status="completed"):
        response = {"id": "resp_test", "status": status, "usage": {"input_tokens": 10, "output_tokens": 5},
                    "output": [{"type": "message", "content": [{"type": "output_text", "text": json.dumps(result or {"ok": True})}]}]}
        events = [{"type": "response.output_text.delta", "delta": '{"ok":'}, {"type": "response." + status, "response": response}]
        return io.BytesIO(b"".join(b"data: " + json.dumps(x).encode() + b"\n\n" for x in events))

    def test_api_has_hard_limits_and_no_execution_tools(self):
        requests = []
        def transport(request, **kwargs):
            requests.append(json.loads(request.data))
            return self.stream()
        client = generate_daily.Responses(self.path, "SENTINEL_SECRET", transport)
        self.assertEqual(client.call("research", "Return JSON", {}, seconds=2, tokens=100, search=True), {"ok": True})
        self.assertEqual(requests[0]["max_tool_calls"], 6)
        self.assertEqual(requests[0]["tools"], [{"type": "web_search", "search_context_size": "low"}])
        self.assertFalse(requests[0]["store"])
        self.assertNotIn("text", requests[0])
        client.call("draft", "Return JSON", {}, seconds=2, tokens=100)
        self.assertEqual(requests[1]["text"]["format"], {"type": "json_object"})
        self.assertNotIn("tools", requests[1])
        self.assertNotIn("SENTINEL_SECRET", "".join(p.read_text() for p in self.path.rglob("*") if p.is_file()))

    def test_incomplete_or_interrupted_response_cannot_publish(self):
        client = generate_daily.Responses(self.path, "secret", lambda *a, **k: self.stream(status="incomplete"))
        with self.assertRaisesRegex(RuntimeError, "not completed"):
            client.call("draft", "JSON", {}, seconds=2, tokens=10)
        self.assertTrue((self.path / "draft.partial.txt").exists())
        self.assertFalse((self.path / "draft.json").exists())

    def test_http_error_does_not_retry_or_leak_response(self):
        calls = []
        def fail(*args, **kwargs):
            calls.append(1)
            raise HTTPError("https://api.openai.com", 429, "SENTINEL_SECRET", {}, None)
        client = generate_daily.Responses(self.path, "SENTINEL_SECRET", fail)
        with self.assertRaisesRegex(RuntimeError, "HTTP 429"):
            client.call("draft", "JSON", {}, seconds=2, tokens=10)
        self.assertEqual(len(calls), 1)
        self.assertNotIn("SENTINEL_SECRET", client.events.read_text())

    def test_http_error_keeps_actionable_details_and_redacts_credentials(self):
        def fail(*args, **kwargs):
            body = {"error": {"type": "invalid_request_error", "param": "text.format",
                              "message": "Unsupported format SENTINEL_SECRET sk-other-secret Bearer private",
                              "debug": "SENTINEL_SECRET"}}
            raise HTTPError("https://api.openai.com", 400, "Bad request", {}, io.BytesIO(json.dumps(body).encode()))
        client = generate_daily.Responses(self.path, "SENTINEL_SECRET", fail)
        with self.assertRaisesRegex(RuntimeError, "Unsupported format") as raised:
            client.call("research", "JSON", {}, seconds=2, tokens=10)
        records = client.events.read_text()
        self.assertEqual(json.loads(records.splitlines()[-1])["api_error"]["param"], "text.format")
        for secret in ("SENTINEL_SECRET", "sk-other-secret", "Bearer private", '"debug"'):
            self.assertNotIn(secret, records + str(raised.exception))

    def test_unknown_citations_and_missing_visuals_are_rejected(self):
        doc = brief()
        generate_daily.validate_draft(doc, doc["date"], {URL})
        doc["research_audit"]["claims"][0]["support"][0]["url"] = "https://example.org/invented"
        with self.assertRaisesRegex(ValueError, "Unretrieved"):
            generate_daily.validate_draft(doc, doc["date"], {URL})
        doc = brief()
        doc["visuals"][0]["target"] = "story-2"
        with self.assertRaisesRegex(ValueError, "cover"):
            generate_daily.validate_draft(doc, doc["date"], {URL})

    def test_primary_evaluation_is_primary_but_reporting_is_not(self):
        doc = brief()
        claim = doc["research_audit"]["claims"][0]
        claim["evidence_state"] = "confirmed_primary"
        claim["support"] = [{"role": "primary_evaluation", "name": "Original evaluation", "url": URL}]
        generate_daily.validate_draft(doc, doc["date"], {URL})
        claim["support"][0]["role"] = "independent_reporting"
        with self.assertRaisesRegex(ValueError, "requires primary evidence"):
            generate_daily.validate_draft(doc, doc["date"], {URL})

    def test_small_repairs_preserve_original_and_still_require_validation(self):
        doc = brief()
        fixed = generate_daily.apply_repairs(doc, {"changes": [
            {"op": "replace", "path": "/headline/de", "value": "Korrigierter Titel"},
            {"op": "add", "path": "/temporary", "value": True},
            {"op": "remove", "path": "/temporary"},
        ]})
        self.assertEqual(fixed["headline"]["de"], "Korrigierter Titel")
        self.assertNotEqual(doc["headline"]["de"], fixed["headline"]["de"])
        self.assertEqual(doc["sections"], fixed["sections"])
        generate_daily.validate_draft(fixed, fixed["date"], {URL})
        for path in ("", "/sections/-1", "/sections/999", "/missing"):
            with self.assertRaises(ValueError):
                generate_daily.apply_repairs(doc, {"changes": [{"op": "replace", "path": path, "value": "x"}]})
    def test_refused_review_keeps_last_edition_and_bounds_repair(self):
        self.prepare_inputs()
        calls = []
        class Client:
            evidence_urls = set()
            def call(_, stage, *args, **kwargs):
                calls.append(stage)
                if stage == "research": return {"publish": True, "stories": [], "continuity_reviews": []}
                if stage == "draft": return brief()
                if stage == "repair": return {"changes": [{"op": "replace", "path": "/headline/de", "value": "Korrigiert"}]}
                return {"approved": False, "issues": ["Unsupported factual claim"], "checks": ["Evidence"]}
        with self.assertRaisesRegex(ValueError, "Material review issues"):
            generate_daily.generate("2026-09-30", self.path, Client())
        self.assertEqual(calls, ["research", "draft", "review", "repair", "review_repaired"])
        self.assertFalse((self.path / "daily-brief.json").exists())

    def test_approved_generation_renders_and_validates_in_isolation(self):
        self.prepare_inputs()
        class Client:
            evidence_urls = set()
            def call(_, stage, *args, **kwargs):
                if stage == "research": return {"publish": True, "stories": [], "continuity_reviews": []}
                if stage == "draft": return brief()
                return {"approved": True, "issues": [], "checks": ["Evidence and bilingual equivalence"]}
        generate_daily.generate("2026-09-30", self.path, Client())
        output = json.loads((self.path / "daily-brief.json").read_text())
        self.assertTrue(output["research_audit"]["red_team_report"]["approved"])
        self.assertEqual(len(output["research_audit"]["visual_plan"]), 3)
        for folder in ("automation", "config", "data"):
            shutil.copytree(ROOT / folder, self.path / folder, ignore=shutil.ignore_patterns("__pycache__"))
        subprocess.run([sys.executable, str(self.path / "automation/render_daily.py"), str(self.path / "daily-brief.json"), "--date", "2026-09-30", "--approved"], check=True, capture_output=True)
        subprocess.run([sys.executable, str(self.path / "automation/validate_daily.py"), "2026-09-30"], check=True, capture_output=True)
        self.assertEqual(json.loads((self.path / "data/latest.json").read_text())["date"], "2026-09-30")

    def test_api_deadline_stops_a_stalled_stream(self):
        class Stalled(io.BytesIO):
            def __next__(self):
                time.sleep(3)
                return b"\n"
        client = generate_daily.Responses(self.path, "secret", lambda *a, **k: Stalled())
        started = time.monotonic()
        with self.assertRaises(TimeoutError):
            client.call("draft", "JSON", {}, seconds=.04, tokens=10)
        self.assertLess(time.monotonic() - started, 1)
        self.assertIn('"status": "failed"', client.events.read_text())

    def prepare_inputs(self):
        for name, data in {"research-input": {"run_date": "2026-09-30", "coverage": {}},
                           "editorial-context": {"run_date": "2026-09-30"},
                           "evidence": [{"url": URL, "status": "ok", "text": "Synthetic evidence"}]}.items():
            (self.path / f"{name}.json").write_text(json.dumps(data))

    def test_render_persists_bilingual_diagrams_and_preserves_history(self):
        shutil.copytree(ROOT / "data", self.path / "data")
        doc = brief()
        render_visuals.materialize(doc, self.path)
        self.assertEqual(len(list((self.path / "assets/illustrations").glob("*.svg"))), 6)
        self.assertNotEqual(doc["cover"]["illustration"]["src"]["de"], doc["cover"]["illustration"]["src"]["en"])
        before = json.loads((self.path / "data/claims.json").read_text())["claims"]
        update_intelligence.update(doc, self.path)
        update_intelligence.update(doc, self.path)
        after = json.loads((self.path / "data/claims.json").read_text())["claims"]
        self.assertEqual(after[:len(before)], before)
        self.assertEqual(len(after), len(before) + 4)
        svg = (self.path / doc["visuals"][0]["src"]["en"]).read_text()
        self.assertIn("From source to verification", svg)
        self.assertIn('aria-labelledby="title desc"', svg)

    def test_article_extraction_ignores_scripts_and_navigation(self):
        parser = fetch_evidence.ArticleText()
        parser.feed('<nav>Noise</nav><main><h1>Actual headline</h1><script>do evil()</script><p>Evidence.</p></main><footer>Noise</footer>')
        self.assertEqual(parser.text(), "Actual headline Evidence.")
        with self.assertRaises(ValueError):
            fetch_evidence.public_url("file:///etc/passwd")


if __name__ == "__main__":
    unittest.main()
