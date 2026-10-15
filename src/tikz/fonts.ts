import { EMBEDDED_CIRCUIT_FONTS } from '../fonts/embedded';
import { svgSpecialPayload } from './svgSpecial';
import { subsetFont } from './fontSubset';
import license from '../fonts/comic-relief/OFL.txt?raw';

/** Emit inside circuitikz: TikZJax discards SVG specials outside the picture. */
export const OBSIDIAN_FONT_DEFINITIONS = `\\ifdcSvg
\\special{dvisvgm:raw ${svgSpecialPayload(EMBEDDED_CIRCUIT_FONTS)}}
\\fi`;

/** Collect the rendered SVG text, not the LaTeX source (which can contain glyphs
 * that never render). Unsupported/missing SVG font metadata uses the old embed. */
export function obsidianFontDefinitions(fragments: string[]): string {
  if (typeof DOMParser === 'undefined') return OBSIDIAN_FONT_DEFINITIONS;
  try {
    const usage = new Map<400 | 700, string>();
    const svg = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg">${fragments.join('')}</svg>`,
      'image/svg+xml',
    );
    if (svg.querySelector('parsererror')) return OBSIDIAN_FONT_DEFINITIONS;
    for (const text of svg.querySelectorAll('text')) {
      const inherited = (name: string): string | null => {
        for (let e: Element | null = text; e; e = e.parentElement) {
          const value = e.getAttribute(name);
          if (value) return value;
        }
        return null;
      };
      const family = inherited('font-family');
      if (!family) return OBSIDIAN_FONT_DEFINITIONS;
      if (!family.includes('Comic Relief')) continue;
      const value = inherited('font-weight') ?? '400';
      const weight = value === 'bold' || Number(value) >= 600 ? 700 : 400;
      usage.set(weight, (usage.get(weight) ?? '') + (text.textContent ?? ''));
    }
    if (!usage.size) return '';
    // At most two weights/four combinations. Compare the complete payload:
    // choosing one original font adds a shared full CSS license, so the shortest
    // individual URLs do not always produce the shortest self-contained block.
    let candidates: { faces: string[]; needsLicense: boolean }[] = [
      { faces: [], needsLicense: false },
    ];
    for (const [weight, text] of [...usage].sort(([a], [b]) => a - b)) {
      const original = EMBEDDED_CIRCUIT_FONTS.match(
        new RegExp(`font-weight:${weight};src:url\\(([^)]+)\\)`),
      )![1];
      const subset = subsetFont(weight, text);
      candidates = candidates.flatMap((candidate) =>
        [subset, original].map((url) => ({
          faces: [
            ...candidate.faces,
            `@font-face{font-family:'Comic Relief';font-style:normal;font-weight:${weight};src:url(${url}) format('${url.startsWith('data:font/woff2;') ? 'woff2' : 'woff'}');}`,
          ],
          needsLicense: candidate.needsLicense || url === original,
        })),
      );
    }
    let best = OBSIDIAN_FONT_DEFINITIONS;
    for (const candidate of candidates) {
      const notice = candidate.needsLicense
        ? license
        : 'Copyright 2013 The Comic Relief Project Authors. SIL OPEN FONT LICENSE Version 1.1; full license in each WOFF metadata block.';
      const style = `<style><![CDATA[/*! ${notice} */${candidate.faces.join('')}]]></style>`;
      const result = `\\ifdcSvg\n\\special{dvisvgm:raw ${svgSpecialPayload(style)}}\n\\fi`;
      if (result.length < best.length) best = result;
    }
    return best;
  } catch {
    return OBSIDIAN_FONT_DEFINITIONS;
  }
}
