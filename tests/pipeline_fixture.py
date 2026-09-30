"""Synthetic evidence for offline pipeline tests; never used in production."""
import copy

URL = "https://example.org/evidence"


def localized(de, en=None):
    return {"de": de, "en": en or de}


def brief():
    source = {"label": "Synthetic fixture source", "url": URL}
    de = "Im synthetischen Test trennt das System Recherche, Redaktion und technische Prüfung. Die Messung gilt ausschliesslich für diese Testdaten und erlaubt keine Aussage über reale Modelle."
    en = "In this synthetic test the system separates research, writing and technical validation. The measurement applies only to these test data and says nothing about real models."
    stories = []
    for index in range(4):
        stories.append({"priority": "high", "evidence": "confirmed primary", "title": localized(f"Testgeschichte {index + 1}", f"Fixture story {index + 1}"),
                        "body": {"de": [de * 3, de * 2], "en": [en * 3, en * 2]}, "changed": localized(de, en),
                        "why": localized(de, en), "engineering": localized(de, en), "signal_hype": localized(de, en), "sources": [source]})
    visuals = []
    for target in ("cover", "story-1", "concept"):
        visuals.append({"id": "fixture-" + target, "target": target, "kind": "flow",
                        "title": localized("Von der Quelle zur Prüfung", "From source to verification"),
                        "caption": localized("Synthetisches Ablaufdiagramm für den Test.", "Synthetic process diagram for the test."),
                        "nodes": [{"label": localized("Quelle", "Source"), "detail": localized("Belegte Aussagen erfassen.", "Record supported claims.")},
                                  {"label": localized("Prüfung", "Verification"), "detail": localized("Aussagen mit Belegen abgleichen.", "Compare claims with evidence.")}],
                        "sources": [source]})
    claims = [{"id": f"fixture-{i}", "claim": f"Synthetic fixture claim number {i} is supported by the fixture.",
               "evidence_state": "confirmed_primary", "support": [{"role": "primary", "name": source["label"], "url": URL}],
               "entities": [], "storyline": None, "contradictions": []} for i in range(4)]
    result = {"date": "2026-09-30", "updated_at": "2026-09-30T07:00:00+02:00", "headline": localized("Synthetischer Pipeline-Test", "Synthetic pipeline test"),
              "dek": localized(de, en), "editorial_lead": localized(de, en),
              "executive_summary": [{"title": localized(f"Signal {i}"), "body": localized(de, en)} for i in range(3)],
              "sections": [{"title": localized("Business & Strategie", "Business & Strategy"), "stories": stories[:2]},
                           {"title": localized("Modelle, Agents & Engineering", "Models, Agents & Engineering"), "stories": stories[2:]}],
              "concept": {"id": "fixture-pipeline", "title": localized("Geprüfte Veröffentlichung", "Verified publishing"),
                          "summary": localized(de, en), "intuition": localized(de, en), "technical_depth": {"de": [de], "en": [en]},
                          "example": localized(de, en), "practical": localized(de, en), "sources": [source]},
              "what_next": {"de": [de] * 3, "en": [en] * 3}, "tags": ["Fixture", "Pipeline", "Test"],
              "visuals": visuals, "predictions": [{"prediction": f"Synthetic test prediction {i} will be assessed.", "review_after": "2026-10-07",
                                                    "confirmation_criteria": ["Fixture succeeds"], "falsification_criteria": ["Fixture fails"], "confidence": "low"} for i in range(3)],
              "research_audit": {"date": "2026-09-30", "claims": claims, "red_team_report": {"approved": True, "issues": [], "checks": ["Synthetic test only"]}}}
    return copy.deepcopy(result)
