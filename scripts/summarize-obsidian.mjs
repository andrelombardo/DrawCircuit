import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { format } from 'prettier';

const root = resolve('docs/obsidian-optimization/evidence');
const labels = {
  resistor: '1 resistenza',
  five: '5 componenti',
  twenty: '20 componenti',
  hundred: '100 componenti',
  formulas: 'Formule matematiche',
  unicode: 'Molti glifi Unicode',
  complex: 'Circuito e annotazioni',
};
const names = Object.keys(labels);
const sha = (data) => createHash('sha256').update(data).digest('hex');
const pct = (a, b) => ((1 - b / a) * 100).toFixed(2);
const table = (head, rows) =>
  [head.join(' | '), head.map(() => '---').join(' | '), ...rows.map((row) => row.join(' | '))]
    .map((l) => `| ${l} |`)
    .join('\n');
const textSize = (value) => ({
  characters: value.length,
  bytes: Buffer.byteLength(value),
  gzipBytes: gzipSync(value, { level: 9 }).length,
});
function breakdown(code) {
  const parts = {
    fonts: '',
    preamble: '',
    svgText: '',
    textCommands: '',
    geometry: '',
    styles: '',
  };
  parts.preamble = code.slice(0, code.indexOf('\\begin{document}'));
  let body = code.slice(parts.preamble.length);
  const fonts =
    /\\ifdcSvg\n\\special\{dvisvgm:raw <style>[\s\S]*?<\/style>\}\n\\fi/.exec(body)?.[0] ?? '';
  parts.fonts = fonts;
  body = body.replace(fonts, '');
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    while (line.endsWith('%') && i + 1 < lines.length) line += '\n' + lines[++i];
    if (/^\\node\[/.test(line)) {
      const start = line.indexOf('\\dcCanvasText{');
      let fragment = '';
      if (start >= 0) {
        const first = start + '\\dcCanvasText{'.length;
        let depth = 1,
          end = first;
        while (end < line.length && depth) {
          if (line[end] === '{') depth++;
          if (line[end] === '}') depth--;
          end++;
        }
        fragment = line.slice(first, end - 1);
      }
      parts.svgText += fragment;
      parts.textCommands += line.replace(fragment, '') + '\n';
    } else if (/^\\(?:draw|fill|path|dcg|def\\dcg|begin\{scope|end\{scope)/.test(line))
      parts.geometry += line + '\n';
    else if (/^\\(?:definecolor|tikzset)/.test(line)) parts.styles += line + '\n';
  }
  const result = Object.fromEntries(
    Object.entries(parts).map(([key, value]) => [
      key,
      { characters: value.length, bytes: Buffer.byteLength(value) },
    ]),
  );
  result.wrapper = {
    characters: code.length - Object.values(result).reduce((n, p) => n + p.characters, 0),
    bytes: Buffer.byteLength(code) - Object.values(result).reduce((n, p) => n + p.bytes, 0),
  };
  return result;
}
const pngInfo = (bytes) => ({
  bytes: bytes.length,
  width: bytes.readUInt32BE(16),
  height: bytes.readUInt32BE(20),
  colorType: bytes[25],
});
const visual = JSON.parse(await readFile(resolve(root, 'visual-comparison.json'), 'utf8'));
const fontRegression = JSON.parse(
  await readFile(resolve(root, 'after/font-regression.json'), 'utf8'),
);
if (!visual.pass || !fontRegression.pass) throw new Error('Visual/font regression is failing');
const unchanged = [];
const manifests = {};
for (const file of (await readdir(resolve(root, 'before'))).filter((f) => f.endsWith('.md'))) {
  const name = file.slice(0, -3);
  const row = visual.rows.find((r) => r.name === name);
  manifests[name] = {};
  for (const variant of ['before', 'after']) {
    const code = await readFile(resolve(root, variant, file));
    manifests[name][variant] = sha(code);
    if (row[variant + 'SourceSha256'] !== sha(code))
      throw new Error(`Stale compiled SVG: ${name}/${variant}`);
  }
  for (const ext of [
    'json',
    'tikz',
    'tex',
    'canvas.svg',
    ...(names.includes(name) ? ['png'] : []),
  ]) {
    const a = await readFile(resolve(root, 'before', `${name}.${ext}`));
    const b = await readFile(resolve(root, 'after', `${name}.${ext}`));
    if (!a.equals(b)) throw new Error(`Unrelated export changed: ${name}.${ext}`);
    unchanged.push({ file: `${name}.${ext}`, bytes: a.length, sha256: sha(a) });
  }
}
const rows = [];
for (const name of names) {
  const before = await readFile(resolve(root, 'before', `${name}.md`), 'utf8');
  const after = await readFile(resolve(root, 'after', `${name}.md`), 'utf8');
  const png = await readFile(resolve(root, 'after', `${name}.png`));
  const reference = `![[${name}.png]]`;
  await writeFile(resolve(root, 'after', `${name}-png.md`), reference);
  const tStat = await stat(resolve(root, 'after', `${name}.md`)),
    pStat = await stat(resolve(root, 'after', `${name}.png`)),
    rStat = await stat(resolve(root, 'after', `${name}-png.md`));
  const variants = [];
  for (const suffix of ['1x', '2x', '4x', '4x-white'])
    variants.push({
      suffix,
      ...pngInfo(await readFile(resolve(root, 'after', `${name}-${suffix}.png`))),
    });
  const compiled = visual.rows.find((r) => r.name === name);
  rows.push({
    name,
    label: labels[name],
    before: { ...textSize(before), breakdown: breakdown(before) },
    after: { ...textSize(after), breakdown: breakdown(after) },
    reductionPercent: Number(pct(Buffer.byteLength(before), Buffer.byteLength(after))),
    png: {
      ...pngInfo(png),
      referenceBytes: Buffer.byteLength(reference),
      vaultBytes: png.length + Buffer.byteLength(reference),
      variants,
    },
    observedAllocatedBytes: { tikz: tStat.blocks * 512, png: (pStat.blocks + rStat.blocks) * 512 },
    compilerBeforeMs: compiled.beforeCompileMs,
    compilerAfterMs: compiled.afterCompileMs,
    visual: compiled.visual.pass,
  });
}
const scenarios = JSON.parse(await readFile(resolve(root, 'after/scenarios.json'), 'utf8'));
const reuse = rows.flatMap((row) =>
  [10, 100].map((notes) => ({
    name: row.name,
    notes,
    tikz: notes * row.after.bytes,
    png: row.png.bytes + notes * row.png.referenceBytes,
    pngWinsFromNotes: Math.floor(row.png.bytes / (row.after.bytes - row.png.referenceBytes)) + 1,
  })),
);
const baselineCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const summary = {
  baselineCommit,
  byteUnit: 'B (UTF-8), gzip level 9, logical sizes',
  visualPass: visual.pass,
  fontRegression,
  rows,
  scenarios,
  reuse,
  unchanged,
  manifests,
};
await writeFile(resolve(root, 'measurements.json'), JSON.stringify(summary, null, 2));
const sections = [];
sections.push(
  '## Codice copiato: misure reali\n\n' +
    table(
      [
        'Circuito',
        'Caratteri prima',
        'Caratteri dopo',
        'Byte prima',
        'Byte dopo',
        'Riduzione byte',
        'Pixel identici',
      ],
      rows.map((r) => [
        r.label,
        r.before.characters,
        r.after.characters,
        r.before.bytes,
        r.after.bytes,
        `${r.reductionPercent}%`,
        r.visual ? 'Sì' : 'No',
      ]),
    ),
);
sections.push(
  '## Note e allegati nel vault\n\n' +
    table(
      [
        'Circuito',
        'TikZ originale B',
        'Nota TikZ B',
        'Nota PNG B',
        'Allegato PNG B',
        'PNG totale B',
        'Più leggero',
        'Risparmio sul maggiore',
      ],
      rows.map((r) => [
        r.label,
        r.before.bytes,
        r.after.bytes,
        r.png.referenceBytes,
        r.png.bytes,
        r.png.vaultBytes,
        r.after.bytes < r.png.vaultBytes ? 'TikZ' : 'PNG',
        `${pct(Math.max(r.after.bytes, r.png.vaultBytes), Math.min(r.after.bytes, r.png.vaultBytes))}%`,
      ]),
    ),
);
sections.push(
  '## Gzip, separato dal testo copiato\n\n' +
    table(
      ['Circuito', 'Gzip originale B', 'Gzip ottimizzato B'],
      rows.map((r) => [r.label, r.before.gzipBytes, r.after.gzipBytes]),
    ),
);
sections.push(
  '## Composizione del codice in byte\n\nLe categorie sono disgiunte e sommano esattamente al file. Geometria comprende i percorsi non dipinti necessari ai bounding box; le macro geometriche restano in questa categoria. Il testo SVG è separato dai nodi, dal source TeX di fallback e dai loro contenitori. Font comprende i data URL, CSS, licenza e continuazioni TeX.\n\n' +
    table(
      [
        'Circuito / versione',
        'Font',
        'Preambolo',
        'Testo SVG',
        'Nodi / fallback',
        'Geometria',
        'Stili / colori',
        'Wrapper / commenti',
      ],
      rows.flatMap((r) =>
        ['before', 'after'].map((v) => [
          r.label + ' ' + (v === 'before' ? 'prima' : 'dopo'),
          ...['fonts', 'preamble', 'svgText', 'textCommands', 'geometry', 'styles', 'wrapper'].map(
            (k) => r[v].breakdown[k].bytes,
          ),
        ]),
      ),
    ),
);
sections.push(
  '## PNG a risoluzioni diverse\n\n' +
    table(
      ['Circuito', '1× pixel / B', '2× pixel / B', '4× normale pixel / B', '4× bianco B'],
      rows.map((r) => [
        r.label,
        ...r.png.variants.slice(0, 3).map((v) => `${v.width}×${v.height} / ${v.bytes}`),
        r.png.variants[3].bytes,
      ]),
    ),
);
sections.push(
  '## Scenari con circuiti differenti\n\nDa 1 a 20 componenti, cinque tipi ciclici, etichetta iniziale Circuito_i unica. Ogni PNG è stato generato realmente; le righe individuali sono nel JSON. Le note con più blocchi separano i circuiti con due newline.\n\n' +
    table(
      ['Scenario', 'Nota/e TikZ B', 'Nota/e PNG B', 'Allegati B', 'PNG totale B'],
      scenarios.map((s) => [
        `${s.count === 100 ? '100 note × 1 circuito' : `1 nota × ${s.count} circuiti`}`,
        s.count === 100 ? s.tikz : s.singleNoteTikz,
        s.count === 100 ? s.reference : s.singleNotePng,
        s.png,
        s.png + (s.count === 100 ? s.reference : s.singleNotePng),
      ]),
    ),
);
sections.push(
  '## Stesso allegato riusato\n\nIl PNG viene conservato una volta; il blocco TikZ è duplicato in ogni nota.\n\n' +
    table(
      ['Circuito', 'Note', 'TikZ totale B', 'PNG totale B', 'PNG vince da N note'],
      reuse
        .filter((r) => ['resistor', 'five', 'hundred'].includes(r.name))
        .map((r) => [labels[r.name], r.notes, r.tikz, r.png, r.pngWinsFromNotes]),
    ),
);
sections.push(
  '## Tempi di compilazione\n\nMediana di tre compilazioni per variante con lo stesso bundle, dopo warm-up. Sono tempi del motore isolato, esclusi UI e cache di Obsidian.\n\n' +
    table(
      ['Circuito', 'TikZ prima ms', 'TikZ dopo ms'],
      rows.map((r) => [r.label, r.compilerBeforeMs.toFixed(1), r.compilerAfterMs.toFixed(1)]),
    ),
);
const pngTimes = JSON.parse(await readFile(resolve(root, 'after/png-decode.json'), 'utf8'));
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
sections.push(
  '## Decodifica PNG nel browser\n\nMediane di sette caricamenti da Blob locale: file già letto, nessuna misura del disco. La creazione dell’SVG TikZ nel motore e la decodifica PNG sono fasi diverse; questi tempi non sono una misura end-to-end dell’app Obsidian.\n\n' +
    table(
      ['Circuito', 'Decode ms', 'Decode + draw ms'],
      pngTimes.map((r) => [
        labels[r.name],
        median(r.times.map((t) => t.decodeMs)).toFixed(2),
        median(r.times.map((t) => t.decodeAndDrawMs)).toFixed(2),
      ]),
    ),
);
sections.push(
  '## Allocazione osservata sul filesystem del test\n\nstat.blocks × 512, misurata sui file prodotti. Dipende da filesystem, compressione, cloni e dimensione dei blocchi: non equivale a una previsione fisica portabile del vault. Le raccomandazioni usano le dimensioni logiche sopra.\n\n' +
    table(
      ['Circuito', 'TikZ allocato B', 'PNG + riferimento allocati B'],
      rows.map((r) => [r.label, r.observedAllocatedBytes.tikz, r.observedAllocatedBytes.png]),
    ),
);
await writeFile(
  resolve(root, '../tables.md'),
  await format(sections.join('\n\n') + '\n', { parser: 'markdown' }),
);
const reportPath = resolve(root, '../report.md');
const report = await readFile(reportPath, 'utf8').catch(() => null);
if (report)
  await writeFile(
    reportPath,
    await format(
      report.replace(
        /<!-- measured-tables:start -->[\s\S]*?<!-- measured-tables:end -->/,
        '<!-- measured-tables:start -->\n\n' +
          sections.join('\n\n') +
          '\n\n<!-- measured-tables:end -->',
      ),
      { parser: 'markdown' },
    ),
  );
console.log(
  `Measured ${rows.length} benchmarks; ${unchanged.length} unrelated outputs identical; visual/font verification passed.`,
);
