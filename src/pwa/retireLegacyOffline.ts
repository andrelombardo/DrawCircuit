/** Temporary migration for the old Workbox PWA. See docs/pwa.md before removal.
 * Never touch localStorage, IndexedDB, other scopes or other apps' caches.
 * Failures are retried on the next visit; startup and editing must stay available.
 */
export async function retireLegacyOffline(scope: string): Promise<void> {
  const scopes = [scope];
  // The repository rename changes the case-sensitive Pages path. Browser data
  // stays on the same origin; retire the former installation on the next visit.
  const pathname = new URL(scope).pathname;
  if (pathname === '/drawcircuit/')
    scopes.push(new URL('../DrawCircuit/', scope).href);
  else if (pathname === '/DrawCircuit/')
    scopes.push(new URL('../drawcircuit/', scope).href);
  const workerURLs = new Map(scopes.map((base) => [base, new URL('sw.js', base).href]));
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(
        registrations
          .filter(
            (registration) =>
              workerURLs.has(registration.scope) &&
              [registration.active, registration.waiting, registration.installing].some(
                (worker) => worker?.scriptURL === workerURLs.get(registration.scope),
              ),
          )
          .map((registration) => registration.unregister()),
      );
    }
  } catch {
    // Restricted browser contexts may deny access to worker registrations.
  }
  try {
    if ('caches' in globalThis) {
      const names = await caches.keys();
      await Promise.allSettled(
        names
          .filter(
            (name) =>
              /^workbox-precache-v\d+-/.test(name) &&
              scopes.some((base) => name.endsWith(`-${base}`)),
          )
          .map((name) => caches.delete(name)),
      );
    }
  } catch {
    // CacheStorage can be unavailable even when local document storage works.
  }
}
