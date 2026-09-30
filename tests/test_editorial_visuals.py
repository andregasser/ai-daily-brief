import copy
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from automation import render_visuals, generate_daily, refresh_visuals
from pipeline_fixture import brief, URL


class EditorialVisualTests(unittest.TestCase):
    def test_no_illustration_is_a_valid_editorial_choice(self):
        doc = brief()
        doc['visuals'] = []
        doc['cover'] = {'illustration': {'src': 'stale.svg'}}
        generate_daily.validate_draft(doc, doc['date'], {URL})
        with tempfile.TemporaryDirectory() as temp:
            render_visuals.materialize(doc, Path(temp))
            self.assertEqual(json.loads((Path(temp)/'data/visuals/2026-09-30.json').read_text()), [])
            self.assertFalse(list(Path(temp).rglob('*.svg')))
            self.assertNotIn('illustration', doc['cover'])

    def test_bars_preserve_zero_baseline_ratio_and_accessible_values(self):
        spec = brief()['visuals'][0]
        spec['items'][0]['value'] = .2
        spec['items'][1]['value'] = .1
        svg = ET.fromstring(render_visuals.diagram(spec, 'en'))
        bars = [e for e in svg.iter() if e.get('class') == 'data-bar']
        self.assertEqual(bars[0].get('x'), bars[1].get('x'))
        self.assertAlmostEqual(float(bars[0].get('width')) / float(bars[1].get('width')), 2)
        self.assertIn('A 0.2', ''.join(svg.itertext()))
        spec['items'][0]['value'] = float('nan')
        with self.assertRaises(ValueError): render_visuals.diagram(spec, 'en')

    def test_mismatched_comparisons_and_impossible_routes_are_rejected(self):
        specs = json.loads((ROOT/'data/visuals/2026-09-30.json').read_text())
        matrix = copy.deepcopy(next(v for v in specs if v['kind'] == 'matrix'))
        matrix['rows'][0]['cells'].pop()
        with self.assertRaisesRegex(ValueError, 'dimensions'): render_visuals.validate_visuals([matrix])
        decision = copy.deepcopy(next(v for v in specs if v['kind'] == 'decision'))
        decision['selected'] = len(decision['outcomes'])
        with self.assertRaisesRegex(ValueError, 'outcome'): render_visuals.validate_visuals([decision])

    def test_visual_revision_is_repeatable_and_does_not_rewrite_articles(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for folder in ('data', 'briefings', 'config'):
                shutil.copytree(ROOT/folder, root/folder)
            before = [(root/f'briefings/2026-09-30-{lang}.html').read_text() for lang in ('de','en')]
            refresh_visuals.refresh('2026-09-30', root)
            refresh_visuals.refresh('2026-09-30', root)
            after = [(root/f'briefings/2026-09-30-{lang}.html').read_text() for lang in ('de','en')]
            self.assertEqual(before, after)
            for spec in json.loads((root/'data/visuals/2026-09-30.json').read_text()):
                self.assertNotIn('src', spec)
            for path in (root/'assets/illustrations').glob('*.svg'):
                ET.parse(path)


if __name__ == '__main__': unittest.main()
