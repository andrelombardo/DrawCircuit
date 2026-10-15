# Obsidian font inputs

Generated only from the bundled Comic Relief 1.210 fonts. Their existing
[SIL OFL 1.1](../../fonts/comic-relief/OFL.txt) applies to these font resources.
This is not a license for DrawCircuit. Original names, outlines, metric tables,
shaping tables, hinting and glyph IDs are retained.

The JSON files contain a zlib-compressed sfnt and precomputed Unicode, composite,
canonical-composition and GSUB closure information. `asciiGlyphs` describes the
complete glyph coverage of the common prebuilt subset, so font choice depends
on coverage and size, including after a cache hit. Empty glyph slots preserve
IDs; cmap tables never advertise a removed outline.

`*-ascii.woff2` are common subsets made during asset preparation. They retain ASCII
reference outlines and full post names because smaller reference sets alter
autohinting at fractional display sizes. Runtime Unicode subsets additionally
retain the used Greek/Cyrillic reference alphabets. Full fonts remain available
as the size/compatibility fallback. Both WOFF and WOFF2 subsets carry the complete
unmodified OFL in compressed XML metadata.

Routine builds use these checked-in inputs and need no Python/font compiler.
To regenerate them when updating the fonts:

```sh
python3 -m venv /tmp/drawcircuit-font-tools
/tmp/drawcircuit-font-tools/bin/pip install 'fonttools[woff]==4.60.2' 'brotli==1.2.0'
/tmp/drawcircuit-font-tools/bin/python scripts/prepare-obsidian-fonts.py
```

Run from the repository root. Re-run the font, renderer, resource and multi-SVG
checks in [the report](../../../docs/obsidian-optimization/report.md) after an
update. The preparation script rejects unhandled GSUB lookups, GPOS/kern changes
and non-BMP source fonts; extend and verify their closure before accepting them.
