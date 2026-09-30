"""Source-backed editorial graphics: quantitative scale, comparison, decision trace."""
from __future__ import annotations

from html import escape
import json
import math
from pathlib import Path
import re
import textwrap

INK = '#233548'
MUTED = '#64748b'
ACCENT = '#16786d'
LINE = '#dce3e9'


def lines(value, width=29):
    return textwrap.wrap(value, width=width, break_long_words=True) or ['']


def text(x, y, value, size=20, color=INK, weight=400, anchor='start'):
    return f'<text x="{x:g}" y="{y:g}" font-size="{size}" fill="{color}" font-weight="{weight}" text-anchor="{anchor}">{escape(str(value))}</text>'


def paragraph(parts, x, y, value, width=32, size=20, color=INK, weight=400, anchor='start'):
    for line in lines(value, width):
        parts.append(text(x, y, line, size, color, weight, anchor))
        y += size * 1.35
    return y


def rule(parts, x1, y1, x2, y2, color=LINE, width=1, dashed=False):
    parts.append(f'<path d="M{x1:g} {y1:g} L{x2:g} {y2:g}" stroke="{color}" stroke-width="{width}" fill="none"'+(' stroke-dasharray="4 5"' if dashed else '')+'/>')


def number(value, lang):
    value = f'{value:.4g}'
    return value.replace('.', ',') if lang == 'de' else value


def validate_visuals(specs):
    targets, ids = set(), set()
    for spec in specs:
        if spec['target'] in targets or spec['id'] in ids:
            raise ValueError('Visual targets and ids must be unique')
        targets.add(spec['target']); ids.add(spec['id'])
        if spec['kind'] == 'bars':
            if any(not math.isfinite(x['value']) or x['value'] < 0 for x in spec['items']) or max(x['value'] for x in spec['items']) <= 0:
                raise ValueError('A bar chart needs finite nonnegative values and a positive scale')
        if spec['kind'] == 'matrix' and any(len(row['cells']) != len(spec['columns']) for row in spec['rows']):
            raise ValueError('Every matrix row must use the same comparison dimensions')
        if spec['kind'] == 'decision' and spec['selected'] >= len(spec['outcomes']):
            raise ValueError('Selected decision outcome does not exist')


def description(spec, lang):
    if spec['kind'] == 'bars':
        detail = spec['unit'][lang] + ': ' + '; '.join(x['label'][lang] + ' ' + number(x['value'], lang) for x in spec['items'])
    elif spec['kind'] == 'matrix':
        detail = '; '.join(row['label'][lang] + ': ' + ', '.join(col[lang] + ' — ' + cell[lang] for col, cell in zip(spec['columns'], row['cells'])) for row in spec['rows'])
    else:
        detail = spec['input'][lang] + ' ' + spec['question_label'][lang] + ' ' + spec['outcomes'][spec['selected']]['label'][lang] + '. ' + spec['result'][lang]
    return detail + '. ' + spec['takeaway'][lang]


def diagram(spec, lang):
    validate_visuals([spec])
    parts = []
    eyebrow = {'bars': ('DATENVERGLEICH', 'DATA COMPARISON'), 'matrix': ('IM VERGLEICH', 'SIDE BY SIDE'),
               'decision': ('ILLUSTRATIVES BEISPIEL', 'ILLUSTRATIVE EXAMPLE')}[spec['kind']][lang == 'en']
    parts.append(text(28, 32, eyebrow, 13, ACCENT, 700))
    y = paragraph(parts, 28, 68, spec['title'][lang], width=30, size=27, weight=700) + 15
    if spec['kind'] == 'bars':
        y = paragraph(parts, 28, y, spec['unit'][lang], width=39, size=17, color=MUTED) + 25
        top = y; maximum = max(item['value'] for item in spec['items'])
        row_heights = [len(lines(item['label'][lang], 25)) * 27 + 65 for item in spec['items']]
        bottom = top + sum(row_heights) - 15
        for fraction in (0, .25, .5, .75, 1):
            x = 28 + fraction * 390
            rule(parts, x, top - 10, x, bottom, LINE, 1)
            parts.append(text(x, bottom + 25, number(maximum * fraction, lang), 15, MUTED, anchor='middle'))
        for index, (item, height) in enumerate(zip(spec['items'], row_heights)):
            label_end = paragraph(parts, 28, y + 10, item['label'][lang], width=25, size=21, weight=600)
            color = ACCENT if index == len(spec['items']) - 1 else '#8b9bb0'
            width = item['value'] / maximum * 390
            parts.append(f'<rect class="data-bar" data-value="{item["value"]}" x="28" y="{label_end+5:g}" width="{width:g}" height="19" rx="2" fill="{color}"/>')
            parts.append(text(450, y + 10, number(item['value'], lang), 24, color, 700, 'end'))
            y += height
        y = bottom + 65
    elif spec['kind'] == 'matrix':
        count = len(spec['columns']); width = 424 / count
        header_y = y
        for index, label in enumerate(spec['columns']):
            paragraph(parts, 28 + index * width, header_y, label[lang], width=int(width / 11), size=20, weight=700)
        y += max(len(lines(label[lang], int(width / 11))) for label in spec['columns']) * 27 + 18
        for row in spec['rows']:
            rule(parts, 28, y, 452, y)
            y = paragraph(parts, 28, y + 28, row['label'][lang], width=37, size=17, color=ACCENT, weight=700) + 10
            for index, cell in enumerate(row['cells']):
                paragraph(parts, 28 + index * width, y, cell[lang], width=int(width / 10), size=19)
            y += max(len(lines(cell[lang], int(width / 10))) for cell in row['cells']) * 25.65 + 25
    else:
        # Concrete input -> named decision -> alternative outcomes. The highlighted
        # route is an illustrative choice, never measured model performance.
        parts.append(f'<path d="M32 {y} h34 l12 12 v43 h-46 z M66 {y} v12 h12 M42 {y+27} h24 M42 {y+38} h20" fill="none" stroke="{MUTED}" stroke-width="2"/>')
        end = paragraph(parts, 100, y + 20, spec['input'][lang], width=25, size=21)
        y = max(y + 65, end) + 15
        rule(parts, 240, y, 240, y + 25, ACCENT, 2)
        y += 55
        y = paragraph(parts, 240, y, spec['question_label'][lang], width=30, size=23, weight=700, anchor='middle') + 14
        count = len(spec['outcomes']); width = 424 / count
        xs = [28 + (index + .5) * width for index in range(count)]
        rule(parts, 240, y - 10, 240, y + 12, MUTED)
        rule(parts, xs[0], y + 12, xs[-1], y + 12, MUTED)
        for index, (x, item) in enumerate(zip(xs, spec['outcomes'])):
            selected = index == spec['selected']; color = ACCENT if selected else MUTED
            rule(parts, x, y + 12, x, y + 46, color, 3 if selected else 1, not selected)
            parts.append(f'<circle cx="{x:g}" cy="{y+47:g}" r="5" fill="{color}"/>')
            paragraph(parts, x, y + 80, item['label'][lang], width=int(width / 11), size=20, color=color, weight=700, anchor='middle')
        max_label = max(len(lines(item['label'][lang], int(width / 11))) for item in spec['outcomes'])
        detail_y = y + 90 + max_label * 27
        for x, item in zip(xs, spec['outcomes']):
            paragraph(parts, x, detail_y, item['detail'][lang], width=int(width / 10), size=17, color=MUTED, anchor='middle')
        y = detail_y + max(len(lines(item['detail'][lang], int(width / 10))) for item in spec['outcomes']) * 23 + 30
        rule(parts, 28, y, 452, y)
        y += 35
        y = paragraph(parts, 28, y, spec['result'][lang], width=34, size=21, color=ACCENT, weight=600) + 20
    rule(parts, 28, y, 452, y, ACCENT, 2)
    y = paragraph(parts, 28, y + 33, spec['takeaway'][lang], width=36, size=20, weight=600) + 26
    alt = spec['question'][lang] + ' ' + description(spec, lang) + ' ' + spec['caption'][lang]
    return '\n'.join([f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 {y:g}" role="img" aria-labelledby="title desc">',
        f'<title id="title">{escape(spec["title"][lang])}</title><desc id="desc">{escape(alt)}</desc>',
        f'<rect width="480" height="{y:g}" fill="#fffdf8"/>',
        '<g font-family="Arial, Helvetica, sans-serif">', *parts, '</g></svg>'])


def materialize(brief, root: Path):
    specs = brief.get('visuals', [])
    validate_visuals(specs)
    brief.get('cover', {}).pop('illustration', None)
    # Retain the data behind graphics so later revisions need no new AI run.
    target = root / 'data/visuals' / f'{brief["date"]}.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps([{k:v for k,v in spec.items() if k != 'src'} for spec in specs], ensure_ascii=False, indent=2) + '\n')
    for spec in specs:
        if not re.fullmatch(r'[a-z][a-z0-9-]{0,59}', spec['id']):
            raise ValueError('Invalid visual id')
        spec['src'] = {}
        for lang in ('de', 'en'):
            relative = f'assets/illustrations/{brief["date"]}-{spec["id"]}-{lang}.svg'
            target = root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(diagram(spec, lang))
            spec['src'][lang] = relative
        if spec['target'] == 'cover':
            brief.setdefault('cover', {})['illustration'] = {
                'visual_class': 'data-visualization' if spec['kind'] == 'bars' else 'explanatory-diagram',
                'src': spec['src'], 'alt': {lang: spec['title'][lang] + '. ' + description(spec, lang) for lang in ('de', 'en')},
                'caption': spec['caption'], 'sources': [{'label': s['label'], 'href': s['url']} for s in spec['sources']],
            }


def figure(spec, lang):
    sources = ' · '.join(f'<a href="{escape(s["url"], quote=True)}">{escape(s["label"])}</a>' for s in spec['sources'])
    kind = 'data-visualization' if spec['kind'] == 'bars' else 'explanatory-diagram'
    credit = 'AI Daily Brief · Eigene Grafik' if lang == 'de' else 'AI Daily Brief · Original graphic'
    return (f'<figure class="editorial-visual visual-editorial-data visual-{kind}" data-visual-id="{escape(spec["id"], quote=True)}">'
            f'<img src="{escape(spec["src"][lang], quote=True)}" alt="{escape(description(spec, lang), quote=True)}" loading="lazy">'
            f'<figcaption>{escape(spec["caption"][lang])}<span class="visual-sources">{credit} · {sources}</span></figcaption></figure>')
