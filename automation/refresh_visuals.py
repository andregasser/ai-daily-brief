#!/usr/bin/env python3
"""Re-render a published edition's graphics without changing its article copy."""
import argparse
import json
from pathlib import Path
import re
from jsonschema import Draft202012Validator
try:
    from . import render_visuals
except ImportError:
    import render_visuals

ROOT = Path(__file__).resolve().parents[1]


def refresh(run_date, root=ROOT):
    specs = json.loads((root / f'data/visuals/{run_date}.json').read_text())
    schema = json.loads((root / 'config/daily_brief.schema.json').read_text())
    Draft202012Validator({'$defs': schema['$defs'], **schema['properties']['visuals']}).validate(specs)
    render_visuals.validate_visuals(specs)
    brief = {'date': run_date, 'visuals': specs}
    render_visuals.materialize(brief, root)
    for lang in ('de', 'en'):
        path = root / f'briefings/{run_date}-{lang}.html'
        html = path.read_text()
        html = re.sub(r'<figure class="editorial-visual\b[^>]*>.*?</figure>', '', html, flags=re.S)
        index = 0
        def story(match):
            nonlocal index
            index += 1
            graphics = ''.join(render_visuals.figure(v, lang) for v in specs if v['target'] == f'story-{index}')
            return match[0].replace('</article>', graphics + '</article>')
        html = re.sub(r'<article class="story">.*?</article>', story, html, flags=re.S)
        if any(v['target'].startswith('story-') and int(v['target'][6:]) > index for v in specs):
            raise ValueError('Visual target story does not exist')
        graphics = ''.join(render_visuals.figure(v, lang) for v in specs if v['target'] == 'concept')
        html = re.sub(r'(<section class="concept">.*?)(</section>)', lambda m: m[1] + graphics + m[2], html, flags=re.S)
        path.write_text(html)
    path = root / 'data/covers.json'
    covers = json.loads(path.read_text())
    covers[run_date].pop('illustration', None)
    covers[run_date].update(brief.get('cover', {}))
    path.write_text(json.dumps(covers,ensure_ascii=False,indent=2)+'\n')
    path = root / f'data/research/{run_date}.json'
    audit = json.loads(path.read_text())
    audit['visual_plan'] = [{k:v[k] for k in ('id','target','kind','title','question','takeaway','sources')} for v in specs]
    audit['visual_provenance'] = [{'id':v['id'], 'class':'data-visualization' if v['kind']=='bars' else 'explanatory-diagram',
                                 'basis':v['caption'], 'sources':v['sources']} for v in specs]
    audit['visual_revision'] = {'date':run_date,'reason':'Update source-backed graphics without rewriting the articles.',
        'verification':'Visual structure validated and sources attached to each graphic. Original article review retained; this visual revision does not represent a new independent API review.'}
    path.write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('date')
    args=parser.parse_args()
    refresh(args.date)
