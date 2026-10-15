import { unzlibSync, zlibSync } from 'fflate';
import regular from './font-data/regular.json';
import bold from './font-data/bold.json';
import asciiRegular from './font-data/regular-ascii.woff2?inline';
import asciiBold from './font-data/bold-ascii.woff2?inline';
import license from '../fonts/comic-relief/OFL.txt?raw';

interface FontSource {
  sfnt: string;
  cmap: Record<string, number>;
  dependencies: Record<string, number[]>;
  canonical: Record<string, number[]>;
  asciiGlyphs: number[];
}
type Table = { tag: string; data: Uint8Array };
const sources: Record<number, FontSource> = { 400: regular, 700: bold };
const decoded = new Map<number, Table[]>();
const cache = new Map<string, string>();
// WOFF's standard, compressed XML metadata carries the complete, unmodified OFL.
// It remains inside each self-contained font even if an SVG optimizer removes CSS.
const metadata = new TextEncoder().encode(
  `<?xml version="1.0" encoding="UTF-8"?><metadata version="1.0"><copyright><text>Copyright 2013 The Comic Relief Project Authors</text></copyright><license url="https://openfontlicense.org"><text>${license.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text></license></metadata>`,
);
const compressedMetadata = zlibSync(metadata, { level: 9 });
const pad = (n: number) => (n + 3) & ~3;
const view = (data: Uint8Array) => new DataView(data.buffer, data.byteOffset, data.byteLength);
const checksum = (data: Uint8Array) => {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum = (sum + (data[i] << (24 - (i % 4) * 8))) >>> 0;
  return sum;
};
const base64 = (data: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < data.length; i += 8192)
    binary += String.fromCharCode(...data.subarray(i, i + 8192));
  return btoa(binary);
};
function tablesFor(weight: number): Table[] {
  let tables = decoded.get(weight);
  if (!tables) {
    const data = unzlibSync(Uint8Array.from(atob(sources[weight].sfnt), (c) => c.charCodeAt(0)));
    const dv = view(data);
    tables = Array.from({ length: dv.getUint16(4) }, (_, i) => {
      const offset = 12 + i * 16;
      return {
        tag: String.fromCharCode(...data.subarray(offset, offset + 4)),
        data: data.slice(
          dv.getUint32(offset + 8),
          dv.getUint32(offset + 8) + dv.getUint32(offset + 12),
        ),
      };
    });
    decoded.set(weight, tables);
  }
  return tables;
}

/** BMP format 4. These bundled fonts only map BMP characters; preparation fails
 * if that changes. Alias codepoints sharing a retained glyph remain available. */
function subsetCmap(source: FontSource, glyphs: Set<number>): Uint8Array {
  const ranges: { start: number; end: number; delta: number }[] = [];
  for (const [code, glyph] of Object.entries(source.cmap)) {
    if (!glyphs.has(glyph)) continue;
    const cp = Number(code);
    const delta = (glyph - cp) & 0xffff;
    const previous = ranges.at(-1);
    if (previous && cp === previous.end + 1 && delta === previous.delta) previous.end = cp;
    else ranges.push({ start: cp, end: cp, delta });
  }
  ranges.push({ start: 0xffff, end: 0xffff, delta: 1 });
  const count = ranges.length;
  const data = new Uint8Array(20 + 16 + count * 8),
    dv = view(data);
  dv.setUint16(2, 2);
  // Unicode and Windows Unicode BMP records share one subtable.
  dv.setUint16(6, 3);
  dv.setUint32(8, 20);
  dv.setUint16(12, 3);
  dv.setUint16(14, 1);
  dv.setUint32(16, 20);
  dv.setUint16(20, 4);
  dv.setUint16(22, data.length - 20);
  dv.setUint16(26, count * 2);
  const power = Math.floor(Math.log2(count));
  dv.setUint16(28, 2 * 2 ** power);
  dv.setUint16(30, power);
  dv.setUint16(32, count * 2 - 2 * 2 ** power);
  ranges.forEach((r, i) => {
    dv.setUint16(34 + i * 2, r.end);
    dv.setUint16(36 + count * 2 + i * 2, r.start);
    dv.setUint16(36 + count * 4 + i * 2, r.delta);
  });
  return data;
}

/** Preserve glyph IDs, hints, metrics and every shaping table. Only unused glyf
 * outlines disappear. Empty loca slots retain all references without renumbering.
 * The generated closure also retains localized substitutions and composites. */
export function subsetFont(weight: 400 | 700, text: string): string {
  const source = sources[weight];
  const codepoints = new Set(
    Array.from(text + text.normalize('NFC') + text.normalize('NFD'), (c) => c.codePointAt(0)!),
  );
  // HarfBuzz can compose a base/mark sequence before GSUB. Include every canonical
  // composition available to these characters, even when not in the source text.
  for (const [cp, decomposition] of Object.entries(source.canonical))
    if (decomposition.every((c) => codepoints.has(c))) codepoints.add(Number(cp));
  const glyphs = new Set<number>([0]);
  const add = (id: number) => {
    if (glyphs.has(id)) return;
    glyphs.add(id);
    for (const dependent of source.dependencies[id] ?? []) add(dependent);
  };
  // Besides x-height/baseline metrics, rasterizers inspect unprinted reference
  // outlines for autohinting. Preserve ASCII and each used Greek/Cyrillic alphabet,
  // plus post names. Smaller blue-zone-only sets fail at fractional raster sizes.
  // A printed-glyph-only subset changes
  // antialiasing at small sizes even when all advances and outlines are identical.
  const greek = [...codepoints].some((c) => c >= 0x370 && c < 0x400);
  const cyrillic = [...codepoints].some((c) => c >= 0x400 && c < 0x500);
  const references = Object.keys(source.cmap)
    .map(Number)
    .filter(
      (cp) =>
        cp < 127 || (cp >= 0x370 && cp < 0x400 && greek) || (cp >= 0x400 && cp < 0x500 && cyrillic),
    );
  for (const cp of [...codepoints, ...references])
    if (source.cmap[cp] !== undefined) add(source.cmap[cp]);
  const key = `${weight}:${[...glyphs].sort((a, b) => a - b).join(',')}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const tables: Table[] = tablesFor(weight).map((t) => ({ tag: t.tag, data: t.data.slice() }));
  const table = (tag: string) => tables.find((t) => t.tag === tag)!;
  const head = view(table('head').data);
  const shortLoca = head.getInt16(50) === 0;
  const loca = view(table('loca').data);
  const count = view(table('maxp').data).getUint16(4);
  const original = table('glyf').data;
  const offsetOf = (id: number) =>
    shortLoca ? loca.getUint16(id * 2) * 2 : loca.getUint32(id * 4);
  const chunks = Array.from({ length: count }, (_, id) =>
    glyphs.has(id) ? original.subarray(offsetOf(id), offsetOf(id + 1)) : new Uint8Array(),
  );
  const glyf = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (let id = 0; id <= count; id++) {
    if (shortLoca) loca.setUint16(id * 2, offset / 2);
    else loca.setUint32(id * 4, offset);
    if (id < count) {
      glyf.set(chunks[id], offset);
      offset += chunks[id].length;
    }
  }
  table('glyf').data = glyf;
  table('cmap').data = subsetCmap(source, glyphs);
  head.setUint32(8, 0);
  tables.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
  // Calculate the reconstructed sfnt checksum, including its offset directory.
  const sfntSize = 12 + tables.length * 16 + tables.reduce((n, t) => n + pad(t.data.length), 0);
  const directory = new Uint8Array(12 + tables.length * 16);
  const sd = view(directory);
  sd.setUint32(0, 0x00010000);
  sd.setUint16(4, tables.length);
  const power = Math.floor(Math.log2(tables.length));
  sd.setUint16(6, 16 * 2 ** power);
  sd.setUint16(8, power);
  sd.setUint16(10, tables.length * 16 - 16 * 2 ** power);
  offset = directory.length;
  const checksums = tables.map((t, i) => {
    const entry = 12 + i * 16,
      sum = checksum(t.data);
    directory.set(
      Array.from(t.tag, (c) => c.charCodeAt(0)),
      entry,
    );
    sd.setUint32(entry + 4, sum);
    sd.setUint32(entry + 8, offset);
    sd.setUint32(entry + 12, t.data.length);
    offset += pad(t.data.length);
    return sum;
  });
  head.setUint32(
    8,
    (0xb1b0afba - checksum(directory) - checksums.reduce((a, b) => (a + b) >>> 0, 0)) >>> 0,
  );
  const compressed = tables.map((t) => {
    const packed = zlibSync(t.data, { level: 9 });
    return packed.length < t.data.length ? packed : t.data;
  });
  const metadataOffset =
    44 + tables.length * 20 + compressed.reduce((n, c) => n + pad(c.length), 0);
  const size = metadataOffset + compressedMetadata.length;
  const woff = new Uint8Array(size),
    wd = view(woff);
  wd.setUint32(0, 0x774f4646); // wOFF
  wd.setUint32(4, 0x00010000);
  wd.setUint32(8, size);
  wd.setUint16(12, tables.length);
  wd.setUint32(16, sfntSize);
  wd.setUint16(20, 1);
  wd.setUint32(24, metadataOffset);
  wd.setUint32(28, compressedMetadata.length);
  wd.setUint32(32, metadata.length);
  offset = 44 + tables.length * 20;
  tables.forEach((t, i) => {
    const entry = 44 + i * 20;
    woff.set(
      Array.from(t.tag, (c) => c.charCodeAt(0)),
      entry,
    );
    wd.setUint32(entry + 4, offset);
    wd.setUint32(entry + 8, compressed[i].length);
    wd.setUint32(entry + 12, t.data.length);
    wd.setUint32(entry + 16, checksums[i]);
    woff.set(compressed[i], offset);
    offset += pad(compressed[i].length);
  });
  woff.set(compressedMetadata, metadataOffset);
  const dynamic = `data:font/woff;base64,${base64(woff)}`;
  const common = weight === 400 ? asciiRegular : asciiBold;
  const url =
    [...glyphs].every((id) => source.asciiGlyphs.includes(id)) && common.length < dynamic.length
      ? common
      : dynamic;
  // Bound memory in long editing sessions; identical subsets reuse the same bytes.
  if (cache.size >= 64) cache.delete(cache.keys().next().value!);
  cache.set(key, url);
  return url;
}
