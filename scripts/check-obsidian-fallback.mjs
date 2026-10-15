import { createServer } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Compare the actual baseline checkout with today's exporter without a DOM.
const baselineRoot = process.argv[2];
if (!baselineRoot)
  throw new Error('Usage: node scripts/check-obsidian-fallback.mjs /path/to/baseline-checkout');
const doc = JSON.parse(
  await readFile('docs/obsidian-optimization/evidence/before/five.json', 'utf8'),
);
for (const [variant, root] of [
  ['before', baselineRoot],
  ['after', process.cwd()],
]) {
  const server = await createServer({ root, server: { middlewareMode: true } });
  try {
    const exporter = await server.ssrLoadModule('/src/tikz/exporter.ts');
    const svg = await server.ssrLoadModule('/src/svg/exporter.tsx');
    const base = resolve('docs/obsidian-optimization/evidence', variant, 'fallback');
    for (const [ext, data] of Object.entries({
      json: JSON.stringify(doc, null, 2),
      md: exporter.exportObsidian(doc),
      tikz: exporter.exportTikz(doc),
      tex: exporter.exportStandalone(doc),
      'canvas.svg': svg.exportSVG(doc),
    }))
      await writeFile(`${base}.${ext}`, data);
  } finally {
    await server.close();
  }
}
