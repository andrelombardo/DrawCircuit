// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { unzlibSync } from 'fflate';
import regular from '../src/tikz/font-data/regular.json';
import bold from '../src/tikz/font-data/bold.json';
import { subsetFont } from '../src/tikz/fontSubset';
import { svgSpecialPayload } from '../src/tikz/svgSpecial';
import { compactTikzLines } from '../src/tikz/compact';
import { compactCanvasSvg } from '../src/tikz/compactSvg';
import { exportObsidian } from '../src/tikz/exporter';
import * as canvas from '../src/tikz/canvasText';
import { obsidianFontDefinitions, OBSIDIAN_FONT_DEFINITIONS } from '../src/tikz/fonts';
import { fixtures } from '../docs/obsidian-optimization/fixtures';

afterEach(() => vi.restoreAllMocks());
const dv = (bytes: Uint8Array) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
const decode = (url: string) => Uint8Array.from(atob(url.split(',')[1]), (c) => c.charCodeAt(0));
function woff(url: string) {
  const bytes = decode(url),
    d = dv(bytes);
  expect(d.getUint32(0)).toBe(0x774f4646);
  expect(d.getUint32(8)).toBe(bytes.length);
  const tables: Record<string, Uint8Array> = {};
  const sums: Record<string, number> = {};
  let last = 44 + 20 * d.getUint16(12);
  for (let i = 0; i < d.getUint16(12); i++) {
    const at = 44 + i * 20;
    const tag = String.fromCharCode(...bytes.subarray(at, at + 4));
    const offset = d.getUint32(at + 4),
      compressed = d.getUint32(at + 8),
      original = d.getUint32(at + 12);
    expect(offset % 4).toBe(0);
    expect(offset).toBe(last);
    last = offset + ((compressed + 3) & ~3);
    tables[tag] =
      compressed < original
        ? unzlibSync(bytes.slice(offset, offset + compressed))
        : bytes.slice(offset, offset + original);
    expect(tables[tag].length).toBe(original);
    sums[tag] = d.getUint32(at + 16);
  }
  expect(Object.keys(tables)).toEqual(Object.keys(tables).sort());
  expect(d.getUint32(24)).toBe(last);
  const metadata = unzlibSync(bytes.slice(last));
  expect(metadata.length).toBe(d.getUint32(32));
  expect(metadata.length).toBeGreaterThan(4000);
  const xml = new DOMParser().parseFromString(
    new TextDecoder().decode(metadata),
    'application/xml',
  );
  expect(xml.querySelector('parsererror')).toBeNull();
  expect(xml.querySelector('license text')!.textContent).toBe(
    readFileSync('src/fonts/comic-relief/OFL.txt', 'utf8'),
  );
  return { tables, sums };
}
function sfnt(source: { sfnt: string }) {
  const bytes = unzlibSync(decode('data:,' + source.sfnt)),
    d = dv(bytes);
  return Object.fromEntries(
    Array.from({ length: d.getUint16(4) }, (_, i) => {
      const at = 12 + i * 16;
      return [
        String.fromCharCode(...bytes.subarray(at, at + 4)),
        bytes.slice(d.getUint32(at + 8), d.getUint32(at + 8) + d.getUint32(at + 12)),
      ];
    }),
  );
}
function glyph(tables: Record<string, Uint8Array>, id: number) {
  const l = dv(tables.loca),
    short = dv(tables.head).getInt16(50) === 0;
  const at = (id: number) => (short ? l.getUint16(id * 2) * 2 : l.getUint32(id * 4));
  return tables.glyf.slice(at(id), at(id + 1));
}

describe('lossless, portable font subsetting', () => {
  it.each([
    [400, regular, 'Regular'],
    [700, bold, 'Bold'],
  ] as const)('preserves tables/outlines and closure for weight %s', (weight, source, face) => {
    expect(source.sourceSha256).toBe(
      createHash('sha256')
        .update(readFileSync(`src/fonts/comic-relief/ComicRelief-${face}.woff2`))
        .digest('hex'),
    );
    const original = sfnt(source);
    const { tables } = woff(subsetFont(weight, 'R₁ è e\u0301 Ω Ж í Ş Ț'));
    for (const tag of Object.keys(original).filter(
      (t) => !['head', 'glyf', 'loca', 'cmap', 'post'].includes(t),
    ))
      expect(tables[tag]).toEqual(original[tag]);
    expect(tables.head.slice(0, 8)).toEqual(original.head.slice(0, 8));
    expect(tables.head.slice(12)).toEqual(original.head.slice(12));
    const kept = new Set<number>();
    for (let i = 0; i < dv(tables.maxp).getUint16(4); i++) {
      const outline = glyph(tables, i);
      if (outline.length) {
        expect(outline).toEqual(glyph(original, i));
        kept.add(i);
      }
    }
    const map = source.cmap as Record<string, number>;
    for (const c of 'RèéΩЖíŞȚxH0') expect(kept.has(map[c.codePointAt(0)!])).toBe(true);
    const dependencies = source.dependencies as Record<string, number[]>;
    for (const id of kept)
      for (const dependent of dependencies[id] ?? [])
        if (glyph(original, dependent).length) expect(kept.has(dependent)).toBe(true);
    expect(tables.glyf.length).toBeLessThan(original.glyf.length * 0.75);
    expect(tables.post).toEqual(original.post);
  });
  it('uses deterministic bytes and reuses identical glyph sets', () => {
    expect(subsetFont(400, 'ABC123')).toBe(subsetFont(400, '321CBA'));
    expect(subsetFont(400, 'R')).toBe(subsetFont(400, 'RRRR'));
    expect(subsetFont(400, 'é')).toBe(subsetFont(400, 'e\u0301'));
    expect(subsetFont(400, 'R')).not.toBe(subsetFont(700, 'R'));
    // Unsupported Unicode must not make an equivalent subset depend on which
    // circuit populated the cache first.
    expect(subsetFont(400, '日本語 🙂𝔸')).toBe(subsetFont(400, 'R'));
  });
  it('collects rendered glyphs/weights and omits unused font faces', () => {
    const code = obsidianFontDefinitions(['<text font-family="Comic Relief">R</text>']);
    expect(code.match(/@font-face/g)).toHaveLength(1);
    expect(code).toContain('font-weight:400');
    expect(code).not.toContain('font-weight:700');
    expect(code.length).toBeLessThan(OBSIDIAN_FONT_DEFINITIONS.length / 3);
    const both = obsidianFontDefinitions([
      '<g font-family="Comic Relief" font-weight="700"><text>Ω</text></g><text font-family="Comic Relief">R</text>',
    ]);
    expect(both.match(/@font-face/g)).toHaveLength(2);
    expect(obsidianFontDefinitions(['<path d="M0 0L1 1"/>'])).toBe('');
    expect(obsidianFontDefinitions(['<text>unknown metadata</text>'])).toBe(
      OBSIDIAN_FONT_DEFINITIONS,
    );
    expect(obsidianFontDefinitions(['<malformed'])).toBe(OBSIDIAN_FONT_DEFINITIONS);
  });
  it('costs font combinations together with their shared license instead of greedily choosing each URL', () => {
    const svg = readFileSync(
      'docs/obsidian-optimization/evidence/before/unicode.canvas.svg',
      'utf8',
    ).replace(/<\?xml[^?]*\?>\s*/, '');
    const code = obsidianFontDefinitions([svg]).replace(/%\n/g, '');
    // This regular subset has a larger URL than the full WOFF2. Together with
    // bold it still wins by avoiding the otherwise required full CSS license.
    expect(code.includes('font-weight:400;src:url(data:font/woff;base64,')).toBe(true);
    expect(code.includes('full license in each WOFF metadata block')).toBe(true);
    expect(code.length).toBeLessThan(OBSIDIAN_FONT_DEFINITIONS.length);
  });
});

/** Expand only our generated definitions, without executing TeX. This checks that
 * compaction never changes an operation, its coordinates, style or paint order. */
function expand(lines: string[]) {
  let text = lines.join('\n');
  const styles = new Map(
    [...text.matchAll(/\\tikzset\{(dc[a-z]+)\/\.style=\{([^\n]*)\}\}/g)].map((m) => [m[1], m[2]]),
  );
  const macros = [...text.matchAll(/^\\def(\\dcg[a-z]+)((?:#\d)+)\{([^\n]*)\}$/gm)];
  text = text.replace(/^\\(?:tikzset\{dc[a-z]|def\\dcg[a-z])[^\n]*\n/gm, '');
  for (const [, macro, args, template] of macros) {
    const pattern = new RegExp(
      macro.replace(/\\/g, '\\\\') + '(?![a-z])' + '(?:\\{([^{}]*)\\})'.repeat(args.length / 2),
      'g',
    );
    text = text.replace(pattern, (...match) =>
      template.replace(/#(\d)/g, (_, i) => match[Number(i)]),
    );
  }
  for (const [key, options] of styles) text = text.replaceAll(`[${key}]`, `[${options}]`);
  return text
    .split('\n')
    .filter((l) => !l.startsWith('%'))
    .join('\n');
}
describe('costed TikZ and SVG representations', () => {
  it('keeps spaces at continued SVG boundaries without splitting TeX escapes', () => {
    const svg = '<text>' + 'A '.repeat(4000) + '&#37;&#937;</text>';
    const payload = svgSpecialPayload(svg, true);
    expect(payload.replace(/%\n/g, '').replace(/\\string#/g, '#')).toBe(svg);
    expect(
      payload
        .split('\n')
        .slice(1)
        .every((l) => !/^\s/.test(l)),
    ).toBe(true);
  });
  it.each(Object.entries(fixtures()))(
    'preserves the ordered operations for %s, including translucent overlaps',
    (_, doc) => {
      const source = exportObsidian(doc, { compact: false }).split('\n');
      const result = compactTikzLines(source);
      expect(expand(result)).toBe(source.filter((l) => !l.startsWith('%')).join('\n'));
      expect(result.join('\n').length).toBeLessThanOrEqual(source.join('\n').length);
    },
  );
  it('keeps SVG glyphs, source, safety escaping and font fallbacks in the default export', () => {
    vi.spyOn(canvas, 'canvasTextLayout').mockReturnValue({
      svg: '<text font-family="Comic Relief" font-size="22">&#82;</text>',
      alignWidth: 20,
      bounds: { x: -10, y: -8, width: 20, height: 16 },
    });
    const doc = fixtures().resistor;
    const code = exportObsidian(doc);
    expect(code).toMatch(/data:font\/woff2?;base64,/);
    expect(code).toContain('SIL OPEN FONT LICENSE');
    expect(code).toContain('{$R_1$}');
    expect(code).toContain('<text font-family="Comic Relief" font-size="22">R</text>');
    expect(code.length).toBeLessThan(exportObsidian(doc, { compact: false }).length / 3);
    expect(code.split('\n').every((l) => l.length < 2000)).toBe(true);
  });
  it('inherits common SVG fonts while preserving safe entities, positions and explicit exceptions', () => {
    const text =
      '<text x="1" y="2" font-family="Comic Relief" font-size="22" font-weight="400" font-style="normal">&#65;&#38;&#37;&#937;</text>';
    const code = compactCanvasSvg(text.repeat(5));
    const doc = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg">${code}</svg>`,
      'image/svg+xml',
    );
    expect(doc.querySelectorAll('text')).toHaveLength(5);
    expect([...doc.querySelectorAll('text')].map((t) => t.textContent)).toEqual(
      Array(5).fill('A&%Ω'),
    );
    expect(code).toContain('A&#38;&#37;&#937;');
    expect(code).not.toContain('%');
    expect(code.length).toBeLessThan(text.length * 3);
    expect(compactCanvasSvg('<broken')).toBe('<broken');
  });
});
