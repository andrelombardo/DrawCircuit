import { chromium } from 'playwright';
import { preview } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve('docs/obsidian-optimization/evidence');
const fixture = JSON.parse(await readFile(resolve(root, 'before/five.json'), 'utf8'));
const sha = (value) => createHash('sha256').update(value).digest('hex');
const assert = (value, message) => {
  if (!value) throw new Error(message);
};
const server = await preview({ base: '/DrawCircuit/', preview: { port: 5190, strictPort: true } });
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  await context.addInitScript(
    (doc) => localStorage.setItem('drawcircuit.document.v1', JSON.stringify(doc)),
    fixture,
  );
  const page = await context.newPage();
  const errors = [],
    externalRequests = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => {
    if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== 'http://localhost:5190')
      externalRequests.push(r.url());
  });
  await page.goto('http://localhost:5190/DrawCircuit/');
  await page.getByRole('button', { name: 'Esporta', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Adatta circuito alla vista', exact: true }).click();
  const canvas = page.getByTestId('circuit-canvas');
  const beforeCanvas = await canvas.innerHTML();
  const beforeStorage = await page.evaluate(() => localStorage.getItem('drawcircuit.document.v1'));
  await page.getByRole('button', { name: 'Esporta', exact: true }).click();
  const code = page.getByRole('textbox', { name: 'Codice TikZ generato' });
  assert(
    (await code.inputValue()) === (await readFile(resolve(root, 'before/five.tikz'), 'utf8')),
    'Raw preview changed',
  );
  await page.getByRole('button', { name: 'Obsidian', exact: true }).click();
  const markdown = await code.inputValue();
  assert(
    markdown === (await readFile(resolve(root, 'after/five.md'), 'utf8')),
    'UI output differs from measured export',
  );
  await page.getByRole('button', { name: 'Copia per Obsidian', exact: true }).click();
  await page.getByRole('button', { name: 'Copiato per Obsidian', exact: true }).waitFor();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  assert(clipboard === markdown, 'Clipboard differs from preview');
  await page.screenshot({ path: resolve(root, 'ui-export.png') });
  await page.getByRole('button', { name: 'File .tex', exact: true }).click();
  assert(
    (await code.inputValue()) === (await readFile(resolve(root, 'before/five.tex'), 'utf8')),
    'Standalone preview changed',
  );
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Scarica .tex', exact: true }).click();
  const download = await downloadPromise;
  const downloaded = await readFile(await download.path());
  assert(
    downloaded.equals(await readFile(resolve(root, 'before/five.tex'))),
    'Standalone download changed',
  );
  const pngPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Scarica PNG', exact: true }).click();
  const png = await pngPromise;
  const pngBytes = await readFile(await png.path());
  assert(pngBytes.equals(await readFile(resolve(root, 'before/five.png'))), 'PNG download changed');
  await page.getByRole('button', { name: 'Chiudi export', exact: true }).click();
  assert((await canvas.innerHTML()) === beforeCanvas, 'Export changed canvas DOM');
  await page.locator('[data-object="object-0"] rect[fill="white"]').first().click();
  await page.getByRole('button', { name: 'Esporta', exact: true }).click();
  await page.getByRole('button', { name: 'Solo selezione', exact: true }).click();
  await page.getByRole('button', { name: 'Obsidian', exact: true }).click();
  const selection = await code.inputValue();
  assert(selection.includes('$R_1$') && !selection.includes('$R_2$'), 'Selection closure changed');
  assert(selection.includes('data:font/woff2;base64,'), 'Selected circuit lacks embedded font');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Codice TikZ', exact: true }).click();
  await page.getByRole('button', { name: 'Obsidian', exact: true }).click();
  assert((await code.inputValue()) === selection, 'Offline export changed');
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new Error('Denied for fallback test');
    };
  });
  await page.getByRole('button', { name: 'Copia selezione per Obsidian', exact: true }).click();
  await page.getByText(/Codice selezionato: premi/).waitFor();
  const selected = await code.evaluate((e) => [e.selectionStart, e.selectionEnd, e.value.length]);
  assert(selected[0] === 0 && selected[1] === selected[2], 'Manual copy selection changed');
  const afterStorage = await page.evaluate(() => localStorage.getItem('drawcircuit.document.v1'));
  assert(beforeStorage === afterStorage, 'Export mutated stored circuit');
  assert(errors.length === 0 && externalRequests.length === 0, 'Browser errors/external requests');
  await writeFile(
    resolve(root, 'ui-verification.json'),
    JSON.stringify(
      {
        pass: true,
        url: 'local production preview under /DrawCircuit/',
        browser: browser.version(),
        previewClipboardSha256: sha(markdown),
        selectionSha256: sha(selection),
        texSha256: sha(downloaded),
        pngSha256: sha(pngBytes),
        offline: true,
        manualClipboardFallback: true,
        canvasUnchanged: true,
        documentUnchanged: true,
        errors,
        externalRequests,
      },
      null,
      2,
    ),
  );
  console.log('Production UI, clipboard, selection, offline, PNG and .tex checks passed');
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
