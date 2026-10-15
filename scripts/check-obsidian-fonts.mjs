import { chromium } from 'playwright';
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const server = await createServer({ server: { port: 5189, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto('http://localhost:5189/docs/obsidian-optimization/benchmark.html');
  await page.waitForFunction(() => !!window.optimizationBenchmark);
  const result = await page.evaluate(() => window.optimizationBenchmark.fontRegression());
  await writeFile('/tmp/drawcircuit-font-regression.json', JSON.stringify(result, null, 2));
  console.log(`${result.cases} cases; ${result.failures.length} failures`);
  if (!result.pass) process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
