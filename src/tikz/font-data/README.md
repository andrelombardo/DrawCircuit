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
When updating the source fonts, regenerate both JSON inputs and ASCII subsets
together, retaining the metadata described above. Verify font coverage, metrics,
shaping and exported SVG rendering before accepting an update.
