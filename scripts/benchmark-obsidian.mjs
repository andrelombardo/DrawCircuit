import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const mode = process.argv[2];
if (!['before', 'after'].includes(mode))
  throw new Error('Usage: node scripts/benchmark-obsidian.mjs before|after');
const output = resolve('docs/obsidian-optimization/evidence', mode);
await mkdir(output, { recursive: true });
const server = await createServer({ server: { port: 5187, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  await page.goto('http://localhost:5187/docs/obsidian-optimization/benchmark.html');
  await page.waitForFunction(() => !!window.optimizationBenchmark, { timeout: 60000 });
  const { names, benchmarkNames } = await page.evaluate(() => window.optimizationBenchmark);
  const times = {};
  for (const name of names) {
    const r = await page.evaluate(
      async ({ name, images, compact }) =>
        window.optimizationBenchmark.capture(name, images, compact),
      { name, images: benchmarkNames.includes(name), compact: mode !== 'before' },
    );
    for (const [extension, data] of Object.entries({
      json: JSON.stringify(r.doc, null, 2),
      md: r.md,
      tikz: r.raw,
      tex: r.standalone,
      'canvas.svg': r.svg,
    })) {
      const path = resolve(output, `${name}.${extension}`);
      const existing = mode === 'before' ? await readFile(path, 'utf8').catch(() => null) : null;
      if (existing !== null && existing !== data)
        throw new Error(`Immutable baseline changed: ${path}`);
      if (existing === null) await writeFile(path, data);
    }
    if (r.png) {
      const path = resolve(output, `${name}.png`),
        png = Buffer.from(r.png);
      const previous = mode === 'before' ? await readFile(path).catch(() => null) : null;
      if (previous && !previous.equals(png))
        throw new Error(`Immutable PNG baseline changed: ${path}`);
      if (!previous) await writeFile(path, png);
    }
    times[name] = r.exportMs;
    console.log(
      `${mode}/${name}: ${r.md.length} characters, ${Buffer.byteLength(r.md)} bytes, ${r.exportMs.toFixed(2)} ms`,
    );
  }
  await writeFile(
    resolve(output, 'environment.json'),
    JSON.stringify({ browser: browser.version(), node: process.version, times }, null, 2),
  );
  if (mode === 'after') {
    const fontRegression = await page.evaluate(() => window.optimizationBenchmark.fontRegression());
    await writeFile(
      resolve(output, 'font-regression.json'),
      JSON.stringify(fontRegression, null, 2),
    );
    console.log(
      `Font regression: ${fontRegression.cases} cases, ${fontRegression.failures.length} failures`,
    );
    for (const name of benchmarkNames) {
      const variants = await page.evaluate(
        (name) => window.optimizationBenchmark.variants(name),
        name,
      );
      for (const row of variants)
        await writeFile(
          resolve(output, `${name}-${row.scale}x${row.opaque ? '-white' : ''}.png`),
          Buffer.from(row.data),
        );
    }
    const scenarios = [];
    for (const count of [1, 10, 50, 100]) {
      const result = await page.evaluate(
        (count) => window.optimizationBenchmark.scenario(count),
        count,
      );
      scenarios.push(result);
      console.log('Scenario', {
        count: result.count,
        tikz: result.tikz,
        png: result.png,
        reference: result.reference,
      });
    }
    await writeFile(resolve(output, 'scenarios.json'), JSON.stringify(scenarios, null, 2));
    const pngDecode = [];
    for (const name of benchmarkNames)
      pngDecode.push(
        await page.evaluate((name) => window.optimizationBenchmark.pngDecode(name), name),
      );
    await writeFile(resolve(output, 'png-decode.json'), JSON.stringify(pngDecode, null, 2));
  }
} finally {
  await browser.close();
  await server.close();
}
