import { writeFile } from 'node:fs/promises';
const base = 'https://andrelombardo.github.io/drawcircuit/';
const label = process.argv[2] ?? 'baseline';
const fetchText = async (path) => {
  const response = await fetch(new URL(path, base), { cache: 'no-store' });
  if (!response.ok) throw Error(`${path}: HTTP ${response.status}`);
  return response.text();
};
const [html, worker, manifestRaw] = await Promise.all([
  fetchText(''),
  fetchText('sw.js'),
  fetchText('manifest.webmanifest'),
]);
const manifest = JSON.parse(manifestRaw);
const paths = new Set([
  '',
  'sw.js',
  'manifest.webmanifest',
  ...[...worker.matchAll(/url:"([^"]+)"/g)].map((match) => match[1]),
  ...[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]),
  ...manifest.icons.map((icon) => icon.src),
]);
const resources = [];
for (let i = 0; i < [...paths].length; i += 8)
  resources.push(
    ...(await Promise.all(
      [...paths].slice(i, i + 8).map(async (path) => {
        const response = await fetch(new URL(path, base), { cache: 'no-store' });
        const bytes = (await response.arrayBuffer()).byteLength;
        return { path, status: response.status, mime: response.headers.get('content-type'), bytes };
      }),
    )),
  );
const results = {
  base,
  label,
  at: new Date().toISOString(),
  script: [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]),
  manifest,
  startUrl: new URL(manifest.start_url, base).href,
  scope: new URL(manifest.scope, base).href,
  resourceCount: resources.length,
  failed: resources.filter((r) => r.status !== 200),
  resources,
};
await writeFile(
  `docs/release-candidate/evidence/network-${label}.json`,
  JSON.stringify(results, null, 2),
);
console.log(
  JSON.stringify({
    scripts: results.script,
    resources: results.resourceCount,
    failed: results.failed,
    startUrl: results.startUrl,
    scope: results.scope,
  }),
);
if (results.failed.length) process.exitCode = 1;
