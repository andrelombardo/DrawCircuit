// Retirement endpoint for previously installed workers, never registered by the
// current app. No fetch handler, caching, reloads or update UI. See docs/pwa.md.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const scope = new URL('./', self.location.href).href;
      if (self.registration.scope !== scope) return;
      // Take over old clients with a network-only worker before unregistering.
      // Already open circuits are left intact; subsequent loads use the network.
      await Promise.allSettled([
        self.clients.claim(),
        (async () => {
          const names = await caches.keys();
          await Promise.allSettled(
            names
              .filter((name) => /^workbox-precache-v\d+-/.test(name) && name.endsWith(`-${scope}`))
              .map((name) => caches.delete(name)),
          );
        })(),
      ]);
      await self.registration.unregister();
    })(),
  );
});
