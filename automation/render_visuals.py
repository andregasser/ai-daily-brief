"""Render evidence-backed diagram specifications without model-generated code."""
from __future__ import annotations

from html import escape
from pathlib import Path
import re
import textwrap


def lines(value, width=29):
    return textwrap.wrap(value, width=width, break_long_words=True) or [""]


def diagram(spec, lang):
    title = lines(spec["title"][lang], 27)
    top = 36 + 27 * len(title)
    positions = []
    y = top + 22
    for node in spec["nodes"]:
        label, detail = lines(node["label"][lang], 25), lines(node["detail"][lang], 33)
        height = 34 + len(label) * 25 + len(detail) * 22
        positions.append((y, height, label, detail))
        y += height + 40
    height = y + 10
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 {height}" role="img" aria-labelledby="title desc">',
             f'<title id="title">{escape(spec["title"][lang])}</title><desc id="desc">{escape(spec["caption"][lang])}</desc>',
             f'<rect width="420" height="{height}" rx="24" fill="#eff3f7"/>',
             '<g font-family="sans-serif" fill="#233548">']
    for i, line in enumerate(title):
        parts.append(f'<text x="24" y="{36 + i * 27}" font-size="23" font-weight="700">{escape(line)}</text>')
    for index, (y, h, label, detail) in enumerate(positions):
        color = ["#dcecf5", "#e1eddf", "#e9e3f1", "#f0e8d9"][index]
        parts += [f'<rect x="24" y="{y}" width="372" height="{h}" rx="18" fill="{color}" stroke="#b3c1cd"/>',
                  f'<circle cx="47" cy="{y + 29}" r="11" fill="#416a83"/>',
                  f'<text x="47" y="{y + 34}" text-anchor="middle" font-size="14" fill="white">{index + 1}</text>']
        for i, text in enumerate(label):
            parts.append(f'<text x="67" y="{y + 34 + i * 25}" font-size="21" font-weight="700">{escape(text)}</text>')
        for i, text in enumerate(detail):
            parts.append(f'<text x="42" y="{y + 39 + len(label) * 25 + i * 22}" font-size="19">{escape(text)}</text>')
        if spec["kind"] == "flow" and index < len(positions) - 1:
            parts.append(f'<path d="M210 {y+h+7} v23 m-7 -7 l7 7 7 -7" fill="none" stroke="#416a83" stroke-width="3"/>')
    return "\n".join(parts + ["</g></svg>"])


def materialize(brief, root: Path):
    """Enrich a validated document in memory with deterministic asset paths."""
    for spec in brief.get("visuals", []):
        if not re.fullmatch(r"[a-z][a-z0-9-]{0,59}", spec["id"]):
            raise ValueError("Invalid visual id")
        spec["src"] = {}
        for lang in ("de", "en"):
            relative = f"assets/illustrations/{brief['date']}-{spec['id']}-{lang}.svg"
            target = root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(diagram(spec, lang))
            spec["src"][lang] = relative
        if spec["target"] == "cover":
            brief.setdefault("cover", {})["illustration"] = {
                "src": spec["src"], "alt": spec["title"], "caption": spec["caption"],
                "sources": [{"label": s["label"], "href": s["url"]} for s in spec["sources"]],
            }


def figure(spec, lang):
    credit = "AI Daily Brief · Eigene Grafik · Erklärdiagramm" if lang == "de" else "AI Daily Brief · Original graphic · Explanatory diagram"
    sources = " · ".join(f'<a href="{escape(s["url"], quote=True)}">{escape(s["label"])}</a>' for s in spec["sources"])
    return (f'<figure class="editorial-visual visual-explanatory-diagram">'
            f'<img src="{escape(spec["src"][lang], quote=True)}" alt="{escape(spec["title"][lang], quote=True)}" '
            'style="display:block;width:100%;max-width:420px;height:auto;margin:auto" loading="lazy">'
            f'<figcaption>{escape(spec["caption"][lang])}<br>{credit}<br>{sources}</figcaption></figure>')
