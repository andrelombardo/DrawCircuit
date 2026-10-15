"""Validate compiled font transport, OFL metadata, outlines and metric tables.

Uses the same optional fonttools[woff]==4.60.2 environment as asset preparation.
"""
from pathlib import Path
import base64
import hashlib
import io
import json
import re
import xml.etree.ElementTree as ET
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
evidence = root / 'docs/obsidian-optimization/evidence'
license_text = (root / 'src/fonts/comic-relief/OFL.txt').read_text()
original = {weight: (root / f'src/fonts/comic-relief/ComicRelief-{face}.woff2').read_bytes()
            for weight, face in [(400, 'Regular'), (700, 'Bold')]}
fonts = {weight: TTFont(io.BytesIO(data), recalcBBoxes=False, recalcTimestamp=False)
         for weight, data in original.items()}
seen, rows = {}, []
for source in sorted((evidence / 'before').glob('*.md')):
    for variant in ['before', 'after']:
        md = (evidence / variant / source.name).read_text().replace('%\n', '')
        svg = (evidence / variant / source.with_suffix('.svg').name).read_text()
        pattern = r'font-weight:(400|700);src:url\((data:font/woff2?;base64,[A-Za-z0-9+/=]+)\)'
        inputs = re.findall(pattern, md)
        outputs = re.findall(pattern, svg)
        assert sorted(inputs) == sorted(outputs), f'Font bytes changed in compiler: {source.name}/{variant}'
        for weight, url in outputs:
            weight = int(weight)
            data = base64.b64decode(url.split(',')[1])
            digest = hashlib.sha256(data).hexdigest()
            if digest not in seen:
                f = TTFont(io.BytesIO(data), checkChecksums=2, recalcBBoxes=False, recalcTimestamp=False)
                original_font = fonts[weight]
                order = f.getGlyphOrder()
                assert len(order) == len(original_font.getGlyphOrder()) == 607
                for tag in ['hmtx', 'hhea', 'OS/2', 'maxp', 'prep', 'gasp', 'GDEF', 'GSUB', 'name', 'post']:
                    assert f.reader[tag] == original_font.reader[tag], f'{tag} changed'
                for cp, name in f.getBestCmap().items():
                    original_name = original_font.getBestCmap()[cp]
                    assert f.getGlyphID(name) == original_font.getGlyphID(original_name)
                    if original_font['glyf'][original_name].numberOfContours:
                        assert f['glyf'][name].numberOfContours, 'cmap advertises a removed outline'
                kept = 0
                for i, name in enumerate(order):
                    g = f['glyf'][name]
                    if not g.numberOfContours:
                        continue
                    before = original_font['glyf'][original_font.getGlyphName(i)]
                    a = g.getCoordinates(f['glyf'])
                    b = before.getCoordinates(original_font['glyf'])
                    assert [list(x) for x in a] == [list(x) for x in b], f'Outline changed: {name}'
                    assert getattr(g, 'program', None) == getattr(before, 'program', None), f'Hinting changed: {name}'
                    kept += 1
                if data != original[weight]:
                    assert f.flavorData.metaData, 'Missing embedded license'
                    metadata = ET.fromstring(f.flavorData.metaData)
                    assert metadata.find('license/text').text == license_text
                else:
                    assert 'SIL OPEN FONT LICENSE' in svg, 'Original font requires its CSS license'
                seen[digest] = {'weight': weight, 'bytes': len(data), 'keptOutlines': kept, 'original': data == original[weight], 'format': f.flavor}
            rows.append({'source': source.name, 'variant': variant, 'fontSha256': digest})
result = {'pass': True, 'uniqueFonts': seen, 'transports': rows}
(evidence / 'font-resources.json').write_text(json.dumps(result, indent=2) + '\n')
print(f'{len(rows)} font transports byte-identical; {len(seen)} unique fonts preserve outlines, tables and OFL')
