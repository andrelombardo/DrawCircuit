import { chromium } from 'playwright';
import { createServer } from 'vite';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';

const bundle = resolve(process.argv[2] ?? '');
if (!process.argv[2])
  throw new Error('Usage: node scripts/compare-obsidian.mjs /path/to/inline-tikz/main.js');
const requireVendor = createRequire(bundle);
const source = await readFile(bundle, 'utf8');
const manifest = JSON.parse(await readFile(resolve(dirname(bundle), 'manifest.json'), 'utf8'));
const vendorModule = { exports: {} };
const engine = new Function(
  'require',
  'module',
  'exports',
  '__dirname',
  '__filename',
  source + '\nreturn {init, compile};',
)(
  (name) =>
    name === 'obsidian'
      ? { Plugin: class {}, PluginSettingTab: class {}, normalizePath: (path) => path }
      : requireVendor(name),
  vendorModule,
  vendorModule.exports,
  dirname(bundle),
  bundle,
);
if (!engine.init()) throw new Error('Inline TikZ compiler unavailable');
const root = resolve('docs/obsidian-optimization/evidence');
const names = (await readdir(resolve(root, 'before')))
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.slice(0, -3));
const rows = [];
const warmupStart = performance.now();
await engine.compile(
  '\\usepackage{circuitikz}\\begin{document}\\begin{circuitikz}\\draw (0,0)--(1,1);\\end{circuitikz}\\end{document}',
);
const warmupMs = performance.now() - warmupStart;
for (const name of names) {
  const row = { name };
  for (const variant of ['before', 'after']) {
    const markdown = await readFile(resolve(root, variant, `${name}.md`), 'utf8');
    const tex = markdown.match(/^```tikz\n([\s\S]*)\n```$/)?.[1];
    if (tex === undefined) throw new Error('Invalid Markdown block');
    const runs = [];
    let svg;
    const measured = [
      'resistor',
      'five',
      'twenty',
      'hundred',
      'formulas',
      'unicode',
      'complex',
    ].includes(name);
    for (let i = 0; i < (measured ? 3 : 1); i++) {
      const start = performance.now();
      const rendered = await engine.compile(tex);
      runs.push(performance.now() - start);
      if (svg !== undefined && rendered !== svg)
        throw new Error(`Nondeterministic compilation: ${name}/${variant}`);
      svg = rendered;
    }
    row[variant + 'CompileRunsMs'] = runs;
    row[variant + 'CompileMs'] = [...runs].sort((a, b) => a - b)[Math.floor(runs.length / 2)];
    if (/##|NaN|Infinity/.test(svg.replace(/data:[^,;]+;base64,[A-Za-z0-9+/=]+/g, '')))
      throw new Error(`Corrupted SVG: ${name}/${variant}`);
    await writeFile(resolve(root, variant, `${name}.svg`), svg);
    row[variant + 'SourceSha256'] = createHash('sha256').update(markdown).digest('hex');
    console.log(
      `${name}/${variant}: ${svg.length} chars, ${row[variant + 'CompileMs'].toFixed(1)} ms`,
    );
  }
  rows.push(row);
}
const server = await createServer({ server: { port: 5188, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto('http://localhost:5188/docs/obsidian-optimization/benchmark.html');
  for (const row of rows) {
    row.visual = await page.evaluate(async (name) => {
      const sources = await Promise.all(
        ['before', 'after'].map(async (variant) =>
          (await fetch(`/docs/obsidian-optimization/evidence/${variant}/${name}.svg`)).text(),
        ),
      );
      const metrics = [];
      for (const source of sources) {
        const frame = document.createElement('iframe');
        document.body.append(frame);
        frame.contentDocument.body.innerHTML = source;
        const doc = frame.contentDocument;
        doc.body.getBoundingClientRect();
        await doc.fonts.ready;
        const svg = doc.querySelector('svg');
        const b = svg.getBBox();
        metrics.push({
          viewBox: svg.getAttribute('viewBox'),
          bounds: [b.x, b.y, b.width, b.height],
          text: [...svg.querySelectorAll('text')].map((e) => {
            const box = e.getBBox(),
              css = frame.contentWindow.getComputedStyle(e),
              matrix = e.getCTM();
            return {
              value: e.textContent,
              bbox: [box.x, box.y, box.width, box.height],
              matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f],
              family: css.fontFamily,
              size: css.fontSize,
              weight: css.fontWeight,
              style: css.fontStyle,
              fill: css.fill,
            };
          }),
          fonts: [...doc.fonts].map((f) => ({
            family: f.family,
            weight: f.weight,
            status: f.status,
          })),
        });
        frame.remove();
      }
      const equalMetrics =
        JSON.stringify(metrics[0].text) === JSON.stringify(metrics[1].text) &&
        JSON.stringify(metrics[0].bounds) === JSON.stringify(metrics[1].bounds) &&
        metrics[0].viewBox === metrics[1].viewBox;
      const scales = [];
      for (const scale of name === 'catalog' || name === 'repeated' ? [1, 2] : [1, 2, 4]) {
        const images = [];
        for (const source of sources) {
          const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
          const svg = doc.documentElement;
          const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
          const width = Math.ceil(((vb[2] * 4) / 3) * scale),
            height = Math.ceil(((vb[3] * 4) / 3) * scale);
          svg.setAttribute('width', String(width));
          svg.setAttribute('height', String(height));
          const url = URL.createObjectURL(
            new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }),
          );
          const image = new Image();
          image.src = url;
          await image.decode();
          URL.revokeObjectURL(url);
          images.push({ image, width, height });
        }
        const [a, b] = images;
        if (a.width !== b.width || a.height !== b.height) {
          scales.push({ scale, dimensionsEqual: false });
          continue;
        }
        const canvas = document.createElement('canvas');
        canvas.width = a.width;
        canvas.height = Math.min(256, a.height);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        let differentPixels = 0,
          maxChannelDelta = 0;
        for (let y = 0; y < a.height; y += canvas.height) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(a.image, 0, -y);
          const first = context.getImageData(
            0,
            0,
            canvas.width,
            Math.min(canvas.height, a.height - y),
          ).data;
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(b.image, 0, -y);
          const second = context.getImageData(
            0,
            0,
            canvas.width,
            Math.min(canvas.height, a.height - y),
          ).data;
          for (let i = 0; i < first.length; i += 4) {
            let different = false;
            for (let j = 0; j < 4; j++) {
              const d = Math.abs(first[i + j] - second[i + j]);
              if (d) different = true;
              maxChannelDelta = Math.max(maxChannelDelta, d);
            }
            if (different) differentPixels++;
          }
        }
        scales.push({ scale, width: a.width, height: a.height, differentPixels, maxChannelDelta });
      }
      return {
        equalMetrics,
        metrics,
        scales,
        pass: equalMetrics && scales.every((s) => s.differentPixels === 0),
      };
    }, row.name);
    console.log(
      `${row.name}: pixel comparison ${row.visual.pass ? 'PASS' : 'FAIL'} ${row.visual.scales.map((s) => s.differentPixels).join('/')}`,
    );
  }
  const report = {
    plugin: manifest,
    compilerSha256: createHash('sha256').update(source).digest('hex'),
    browser: browser.version(),
    warmupMs,
    rows,
    pass: rows.every((r) => r.visual.pass),
  };
  await writeFile(resolve(root, 'visual-comparison.json'), JSON.stringify(report, null, 2));
  if (!report.pass) process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
