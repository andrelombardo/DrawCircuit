# DrawCircuit math handwriting

Comic Relief 1.210 remains the first font for every circuit label, internal symbol,
formula and inline editor. Its original regular/bold files are unchanged. These
OFL-1.1 fonts supplement its missing mathematical characters without relying on
the operating system's fallback fonts. They are also embedded in SVG/PNG exports.

## Sources

- [Pecita 5.4](https://pecita.eu/), Philippe Cochy, downloaded from
  `https://pecita.eu/b/Pecita.otf`. Original SHA-256:
  `0fd219fa9e1414750db7d99eec3e2fbf4c7aacc2bd21a56228f962084c97eade`.
- [Comic Relief 1.210](https://github.com/loudifier/Comic-Relief/releases/tag/v1.210),
  The Comic Relief Project Authors, from the adjacent bundled files.
- KaTeX 0.19.0's bundled Main, AMS, Math, Fraktur, Typewriter and Size1–4 fonts,
  Design Science / Khan Academy, for technical symbols and TeX construction metrics.

The complete copyright/OFL notice is in `OFL.txt` and is published as
`public/third-party/drawcircuit-math-fonts.txt`. Modified font families use the new
names DrawCircuit Symbols, Blackboard, Script, Fraktur and Size1–4, respecting
reserved font names.

## Contents and adaptations

`DrawCircuitSymbols-Regular.woff2` and `DrawCircuitSymbols-Bold.woff2` contain 1,795
code points each. Coverage includes every non-control character in KaTeX 0.19.0's
WOFF2 fonts that Comic Relief lacks, plus Pecita's combining marks, Greek variants
and mathematical Unicode characters in U+2000–2AFF. Comic Relief takes precedence
where it has a character; Latin, ordinary Greek, numerals and punctuation are not
replaced. Characters outside these fonts' combined coverage may still need an OS
fallback; this is not a claim to cover every Unicode script.

928 supplemental outlines come from Pecita; 115 rare technical outlines come from
KaTeX with rounded emboldening. Crucially, private-use characters retain KaTeX's
encoding, rather than selecting unrelated Pecita glyphs at the same code point.
Three glyphs are mathematical prime/double/triple prime built from
Comic Relief's own prime, aligned to TeX's baseline; prose uses the original prime.
749 more code points cover ordinary, bold, italic, sans-serif and monospaced
mathematical alphanumerics in U+1D400–1D7FF, using the corresponding Comic Relief/
Pecita base outline. Unicode bold uses the bold outline and Unicode italic applies
a 0.18 shear. Identical outlines and metrics share a glyph entry.

DrawCircuit Blackboard, Script and Fraktur each have regular/bold faces, with
117, 155 and 192 code points respectively. They retain explicit mathematical
alphabet distinctions such as R versus ℝ. Blackboard uses Pecita's letterlike
symbols and rounded AMS outlines; Script uses Pecita's handwritten letters;
Fraktur retains the Gothic letter structure with rounded pen weight. Their
247 Unicode math aliases share these outlines, so the complete stack covers
all 996 assigned mathematical alphanumerics, including letters pasted directly
into plain notes. Ordinary circuit text still takes Comic Relief first.

The four Size fonts contain 45, 37, 21 and 48 glyphs. Where available, Comic Relief
or Pecita outlines are fitted to the corresponding KaTeX size glyph's ink bounds
and advance. This preserves the reserved dimensions of large operators and
delimiters. Remaining technical/stacked pieces retain their construction geometry
with rounded emboldening. Ordinary text never uses these size families.

The derivatives were generated with fontTools 4.60.2, Brotli 1.2.1 and skia-pathops
0.8.0.post2. Outlines are decomposed and converted to quadratic TrueType curves
(0.7-unit maximum conversion error), at 1,000 units/em. Pecita supplemental glyphs
scale by 1.2 (U+2000 and above) or 1.35 (below U+2000), with operator/arrow centres
aligned to Comic Relief's 0.31em math axis. Rounded outline expansion is 12/30 units
for regular/bold Pecita and 18/36 units for technical KaTeX glyphs. Prime scaling
is 2.06 vertically, with a -1.04em baseline shift and 0.275/0.344em advance.
Size variants retain KaTeX's advances and vertical font metrics.

All faces load before the canvas mounts or exports are measured. Keep the family
names in `fonts.css`, `src/model/fonts.ts`, `src/styles.css` and
`src/fonts/embedded.ts` synchronized when changing these assets.
