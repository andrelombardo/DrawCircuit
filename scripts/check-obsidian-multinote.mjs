import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve('docs/obsidian-optimization/evidence');
const types = ['unicode', 'formulas', 'complex', 'five', 'twenty', 'hundred', 'resistor'];
const source = {};
for (const variant of ['before', 'after'])
  source[variant] = await Promise.all(
    types.map((name) => readFile(resolve(root, variant, `${name}.svg`), 'utf8')),
  );
const browser = await chromium.launch({ headless: true });
const rows = [];
try {
  for (const count of [10, 50, 100]) {
    const screenshots = {};
    for (const variant of ['before', 'after']) {
      const page = await browser.newPage({
        viewport: { width: 1600, height: 1100 },
        deviceScaleFactor: 1,
      });
      // End with ASCII so a last, falsely broad cmap cannot silently blank earlier
      // Greek/Cyrillic/diacritics. All SVGs remain inline in the same document.
      const documents = Array.from({ length: count }, (_, i) =>
        i === count - 1 ? 6 : i % types.length,
      );
      await page.setContent(
        '<!doctype html><style>body{margin:0}section{padding:0;margin:0 0 20px}svg{display:block}</style>' +
          documents.map((index) => `<section>${source[variant][index]}</section>`).join(''),
      );
      await page.evaluate(async () => {
        document.body.getBoundingClientRect();
        await document.fonts.ready;
      });
      screenshots[variant] = [];
      for (const index of [...Array(7).keys(), count - 1])
        screenshots[variant].push(await page.locator('section').nth(index).screenshot());
      await page.close();
    }
    const results = await Promise.all(
      screenshots.before.map(async (before, i) => {
        const after = screenshots.after[i];
        const equal = before.equals(after);
        if (!equal) {
          await Promise.all([
            writeFile(resolve(root, `multinote-${count}-${i}-before.png`), before),
            writeFile(resolve(root, `multinote-${count}-${i}-after.png`), after),
          ]);
        }
        return {
          sample: i,
          equalPngBytes: equal,
          beforeSha256: createHash('sha256').update(before).digest('hex'),
          afterSha256: createHash('sha256').update(after).digest('hex'),
        };
      }),
    );
    rows.push({ count, results, pass: results.every((r) => r.equalPngBytes) });
    console.log(`${count} inline SVGs: ${rows.at(-1).pass ? 'PASS' : 'FAIL'}`);
  }
  await writeFile(
    resolve(root, 'multinote-visual.json'),
    JSON.stringify({ browser: browser.version(), rows, pass: rows.every((r) => r.pass) }, null, 2),
  );
  if (!rows.every((r) => r.pass)) process.exitCode = 1;
} finally {
  await browser.close();
}
