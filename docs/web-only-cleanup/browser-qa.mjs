// Local regression harness, never included in the web build. Run with the saved
// pre-change dist as argv[2], the current dist as argv[3]. Uses a disposable origin.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
const baseline = process.argv[2];
if (!baseline)
  throw Error('Usage: node docs/web-only-cleanup/browser-qa.mjs BEFORE_DIST [AFTER_DIST]');
const current = resolve(process.argv[3] ?? 'dist');
const seed = JSON.parse(await readFile(new URL('./evidence/seed.json', import.meta.url), 'utf8'));
const renamed = process.env.DRAWCIRCUIT_QA_RENAME === '1';
let phase = 'before';
const html = `<!doctype html><html lang="it"><meta charset="utf-8"><title>DrawCircuit — verifica migrazione</title>
<style>body{font:15px system-ui;margin:24px}button{margin:4px;padding:8px}pre{white-space:pre-wrap}iframe{width:100%;height:600px;border:1px solid #ddd}</style>
<h1>Verifica migrazione DrawCircuit</h1><p>Origine locale isolata. Fixture di circuito e blocco personale; nessun dato di produzione.</p>
<button id="prepare">1. Installa la build precedente</button><button id="migrate">2. Pubblica e dismetti il worker</button><button id="open">3. Apri il nuovo sito</button><button id="offline">4. Simula rete indisponibile</button><button id="restore">5. Ripristina e verifica</button>
<pre id="result">Pronto</pre><iframe title="Editor di verifica"></iframe>
<script>
const seed = ${JSON.stringify(seed)};
const output = document.querySelector("#result"),
  frame = document.querySelector("iframe");
const scope = new URL("/drawcircuit/", location.href).href;
const currentPath = ${JSON.stringify(renamed ? '/DrawCircuit/' : '/drawcircuit/')};
const currentScope = new URL(currentPath, location.href).href;
const expected = {
  "drawcircuit.document.v1": seed.document,
  "drawcircuit.personal-blocks.v1": seed.blocks,
  "drawcircuit.sidebar.v1": JSON.stringify({ visible: true, width: 232 }),
};
const wait = async (fn) => {
  for (let i = 0; i < 200; i++) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error("Timeout");
};
async function openEditor(path = currentPath) {
  const loaded = new Promise((resolve) => (frame.onload = resolve));
  frame.src = path + "?qa=" + Date.now();
  await loaded;
  await wait(() =>
    frame.contentDocument?.querySelector('[data-testid="circuit-canvas"]'),
  );
}
async function report(label) {
  const regs = await navigator.serviceWorker.getRegistrations(),
    names = await caches.keys();
  output.textContent = JSON.stringify(
    {
      label,
      legacyRegistered: regs.some((r) => r.scope === scope),
      legacyPrecache: names.some(
        (n) => /^workbox-precache-v\\d+-/.test(n) && n.endsWith("-" + scope),
      ),
      otherRegistered: regs.some(
        (r) => r.scope === new URL("/other/", location.href).href,
      ),
      otherCache: names.includes("other-app-keep"),
      otherPrecache: names.includes(
        "workbox-precache-v2-" + new URL("/other/", location.href).href,
      ),
      userDataIdentical: Object.entries(expected).every(
        ([k, v]) => localStorage.getItem(k) === v,
      ),
      circuitObjects:
        frame.contentDocument?.querySelectorAll("[data-object]").length,
      personalBlockVisible:
        frame.contentDocument?.body.textContent.includes("Blocco conservato"),
      caches: names,
      script: frame.contentDocument
        ?.querySelector('script[type="module"]')
        ?.getAttribute("src"),
    },
    null,
    2,
  );
}
const run = (id, fn) =>
  (document.querySelector(id).onclick = () =>
    fn().catch((e) => (output.textContent = "FAIL: " + e.stack)));
run("#prepare", async () => {
  Object.entries(expected).forEach(([k, v]) => localStorage.setItem(k, v));
  const reg = await navigator.serviceWorker.register("/drawcircuit/sw.js", {
    scope: "/drawcircuit/",
  });
  await wait(() => reg.active?.state === "activated");
  await navigator.serviceWorker.register("/other/sw.js", { scope: "/other/" });
  await caches.open("other-app-keep");
  await caches.open(
    "workbox-precache-v2-" + new URL("/other/", location.href).href,
  );
  await openEditor("/drawcircuit/");
  await report("Build precedente installata");
});
run("#migrate", async () => {
  await fetch("/__qa/publish", { method: "POST" });
  const reg = await navigator.serviceWorker.getRegistration(scope);
  if (!reg) throw Error("Worker legacy non installato");
  if (${JSON.stringify(renamed)}) await openEditor();
  else await reg.update();
  await wait(
    async () => !(await navigator.serviceWorker.getRegistration(scope)),
  );
  await report(${JSON.stringify(renamed ? 'Vecchio worker dismesso aprendo il nuovo percorso' : 'Worker dismesso senza ricaricare il circuito aperto')});
});
run("#open", async () => {
  await openEditor();
  const manifest = await (
    await fetch(currentPath + "manifest.webmanifest")
  ).json();
  for (const icon of manifest.icons) {
    const r = await fetch(new URL(icon.src, currentScope));
    if (!r.ok || !r.headers.get("content-type").includes("image/png"))
      throw Error("Icona non valida");
  }
  if (
    new URL(manifest.start_url, currentScope).href !== currentScope ||
    new URL(manifest.scope, currentScope).href !== currentScope
  )
    throw Error("Scope non valido");
  await report("Nuova build, manifest e icone verificati");
});
run("#offline", async () => {
  await fetch("/__qa/offline", { method: "POST" });
  const loaded = new Promise((resolve) => (frame.onload = resolve));
  frame.src = currentPath + "?offline=" + Date.now();
  await loaded;
  await wait(() =>
    frame.contentDocument?.body.textContent.includes(
      "Rete non disponibile (test)",
    ),
  );
  output.textContent =
    "PASS: senza rete il worker non fornisce una copia offline. Dati locali conservati: " +
    Object.entries(expected).every(([k, v]) => localStorage.getItem(k) === v);
});
run("#restore", async () => {
  await fetch("/__qa/publish", { method: "POST" });
  await openEditor();
  await report("PASS: rete ripristinata, documento e blocco ritrovati");
});
</script></html>`;
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'POST' && pathname.startsWith('/__qa/')) {
    phase = pathname === '/__qa/offline' ? 'offline' : 'after';
    res.end(phase);
    return;
  }
  if (pathname === '/qa.html') {
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
    return;
  }
  if (pathname === '/other/sw.js') {
    res.setHeader('Content-Type', 'text/javascript');
    res.end("self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));");
    return;
  }
  const prefix = renamed && phase !== 'before' ? '/DrawCircuit/' : '/drawcircuit/';
  if (!pathname.startsWith(prefix)) {
    res.writeHead(404);
    res.end();
    return;
  }
  if (phase === 'offline') {
    res.writeHead(503, { 'Content-Type': 'text/html' });
    res.end('<p>Rete non disponibile (test)</p>');
    return;
  }
  const root = resolve(phase === 'before' ? baseline : current);
  const path = resolve(root, decodeURIComponent(pathname.slice(prefix.length)) || 'index.html');
  if (!path.startsWith(root + sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    res.setHeader('Content-Type', types[extname(path)] ?? 'application/octet-stream');
    res.end(await readFile(path));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
const port = Number(process.env.DRAWCIRCUIT_QA_PORT ?? 46193);
server.listen(port, '127.0.0.1', () =>
  console.log('Migration QA: http://127.0.0.1:' + port + '/qa.html'),
);
