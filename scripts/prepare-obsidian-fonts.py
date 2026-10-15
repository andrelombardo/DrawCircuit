"""Rebuild the small runtime font inputs. Requires fonttools[woff]==4.60.2.

No Python, WOFF2 decoder or font editor is shipped to the browser. Glyph IDs,
original tables and outlines are retained; runtime only removes unused outlines.
"""
import base64
import hashlib
import io
import json
from pathlib import Path
import unicodedata
import zlib
import struct
from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable
from fontTools.ttLib.sfnt import SFNTWriter
from fontTools.ttLib.woff2 import WOFF2FlavorData

root = Path(__file__).resolve().parent.parent
for face in ("Regular", "Bold"):
    path = root / f"src/fonts/comic-relief/ComicRelief-{face}.woff2"
    font = TTFont(path, recalcTimestamp=False, recalcBBoxes=False)
    order = font.getGlyphOrder()
    ids = {name: i for i, name in enumerate(order)}
    cmap = {cp: ids[name] for cp, name in font.getBestCmap().items()}
    assert max(cmap) < 0xffff, "Extend runtime cmap serialization for non-BMP fonts"
    dependencies = {}
    for name in order:
        glyph = font["glyf"][name]
        if glyph.isComposite():
            dependencies[ids[name]] = [ids[c.glyphName] for c in glyph.components]
    # Refuse an unhandled shaping change when updating the source fonts. The
    # current fonts only have localized single substitutions; retain all outputs.
    for lookup in font["GSUB"].table.LookupList.Lookup:
        assert lookup.LookupType == 1, "Extend shaping closure before updating fonts"
        for subtable in lookup.SubTable:
            for source, target in subtable.mapping.items():
                dependencies.setdefault(ids[source], []).append(ids[target])
    assert "GPOS" not in font and "kern" not in font  # retained automatically if added
    canonical = {}
    for cp in cmap:
        decomposed = [ord(c) for c in unicodedata.normalize("NFD", chr(cp))]
        if decomposed != [cp]:
            canonical[cp] = decomposed
    output = io.BytesIO()
    # Avoid reserializing GSUB or any other loaded table: preserve original bytes.
    writer = SFNTWriter(output, len(font.reader.tables), font.sfntVersion)
    for tag in sorted(font.reader.tables):
        writer[tag] = font.reader[tag]
    writer.close()
    glyphs = {0}
    def add(gid):
        if gid in glyphs:
            return
        glyphs.add(gid)
        for dependency in dependencies.get(gid, []):
            add(dependency)
    for cp, gid in cmap.items():
        if cp < 127:
            add(gid)
    data = {
        "sourceSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "sfnt": base64.b64encode(zlib.compress(output.getvalue(), 9)).decode(),
        "cmap": cmap,
        "dependencies": dependencies,
        "asciiGlyphs": sorted(glyphs),
        "canonical": canonical,
    }
    target = root / f"src/tikz/font-data/{face.lower()}.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, separators=(",", ":")) + "\n")
    print(f"{face}: {target.stat().st_size} bytes, {len(cmap)} codepoints")
    # Common ASCII-only circuits use an even smaller, precompressed WOFF2. Keep
    # every ASCII reference outline/post name, exactly as in the runtime subset.
    tables = {tag: font.reader[tag] for tag in font.reader.tables}
    short_loca = struct.unpack_from('>h', tables['head'], 50)[0] == 0
    original_loca = struct.unpack('>' + ('H' if short_loca else 'I') * (len(order) + 1), tables['loca'])
    original_loca = [n * (2 if short_loca else 1) for n in original_loca]
    parts, offsets = [], [0]
    for gid in range(len(order)):
        part = tables['glyf'][original_loca[gid]:original_loca[gid + 1]] if gid in glyphs else b''
        parts.append(part)
        offsets.append(offsets[-1] + len(part))
    tables['glyf'] = b''.join(parts)
    tables['loca'] = b''.join(struct.pack('>H' if short_loca else '>I', n // 2 if short_loca else n) for n in offsets)
    cmap_table = newTable('cmap')
    cmap_table.tableVersion = 0
    cmap_table.tables = []
    for platform, encoding in [(0, 3), (3, 1)]:
        subtable = CmapSubtable.newSubtable(4)
        subtable.platformID, subtable.platEncID, subtable.language = platform, encoding, 0
        subtable.cmap = {cp: order[gid] for cp, gid in cmap.items() if gid in glyphs}
        cmap_table.tables.append(subtable)
    # Never advertise removed outlines: inline SVGs share a document font context.
    tables['cmap'] = cmap_table.compile(font)
    subset = io.BytesIO()
    writer = SFNTWriter(subset, len(tables), font.sfntVersion)
    for tag, value in sorted(tables.items()):
        writer[tag] = value
    writer.close()
    common = TTFont(io.BytesIO(subset.getvalue()), recalcTimestamp=False, recalcBBoxes=False)
    common.flavor = 'woff2'
    common.flavorData = WOFF2FlavorData()
    from xml.sax.saxutils import escape
    license_text = (root / 'src/fonts/comic-relief/OFL.txt').read_text()
    common.flavorData.metaData = ('<?xml version="1.0" encoding="UTF-8"?><metadata version="1.0"><copyright><text>Copyright 2013 The Comic Relief Project Authors</text></copyright><license url="https://openfontlicense.org"><text>' + escape(license_text) + '</text></license></metadata>').encode()
    destination = target.with_name(face.lower() + '-ascii.woff2')
    common.save(destination, reorderTables=False)
    print(f"ASCII {face}: {destination.stat().st_size} bytes")
