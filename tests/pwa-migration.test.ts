import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { retireLegacyOffline } from '../src/pwa/retireLegacyOffline';
import { demoDocument } from '../src/model/demo';
import { serializeDocument } from '../src/model/serialization';

const scope = 'https://andrelombardo.github.io/drawcircuit/';
const oldCache = `workbox-precache-v2-${scope}`;
const otherCaches = [
  'another-app',
  `workbox-precache-v2-${scope}other/`,
  'workbox-precache-v2-https://andrelombardo.github.io/other/',
  `other-cache-${scope}`,
];
const worker = (base = scope, script = 'sw.js') => ({
  scope: base,
  active: { scriptURL: new URL(script, base).href },
  waiting: null,
  installing: null,
  unregister: vi.fn().mockResolvedValue(true),
});
function cacheStorage(names = [oldCache, ...otherCaches]) {
  const stored = new Set(names);
  const api = {
    keys: vi.fn(async () => [...stored]),
    delete: vi.fn(async (name: string) => stored.delete(name)),
  };
  vi.stubGlobal('caches', api);
  return { api, stored };
}
afterEach(() => vi.unstubAllGlobals());

describe('retiring only the former DrawCircuit offline installation', () => {
  it('unregisters only its exact scope and script, removes only its precache, preserves user data', async () => {
    const own = worker();
    const others = [worker('https://andrelombardo.github.io/other/'), worker(scope, 'other.js')];
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistrations: async () => [own, ...others] },
    });
    const { api, stored } = cacheStorage();
    const saved = new Map([
      ['drawcircuit.document.v1', serializeDocument(demoDocument())],
      ['drawcircuit.personal-blocks.v1', '{"version":1,"blocks":[]}'],
      ['drawcircuit.sidebar.v1', '{"width":280}'],
    ]);
    const snapshot = [...saved];
    const storage = {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: vi.fn((key: string, value: string) => saved.set(key, value)),
      removeItem: vi.fn((key: string) => saved.delete(key)),
      clear: vi.fn(() => saved.clear()),
    };
    vi.stubGlobal('localStorage', storage);
    await retireLegacyOffline(scope);
    await retireLegacyOffline(scope);
    expect(own.unregister).toHaveBeenCalledTimes(2);
    others.forEach((entry) => expect(entry.unregister).not.toHaveBeenCalled());
    expect(api.delete.mock.calls).toEqual([[oldCache]]);
    expect([...stored]).toEqual(otherCaches);
    expect([...saved]).toEqual(snapshot);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(storage.clear).not.toHaveBeenCalled();
  });

  it('also handles waiting/installing workers and a root deployment', async () => {
    const root = 'https://example.test/';
    const own = { ...worker(root), active: null, waiting: { scriptURL: `${root}sw.js` } };
    vi.stubGlobal('navigator', { serviceWorker: { getRegistrations: async () => [own] } });
    const { api } = cacheStorage([`workbox-precache-v2-${root}`, oldCache]);
    await retireLegacyOffline(root);
    expect(own.unregister).toHaveBeenCalledOnce();
    expect(api.delete.mock.calls).toEqual([[`workbox-precache-v2-${root}`]]);
  });

  it('retires the old lowercase Pages scope after the repository rename without matching other names', async () => {
    const renamedScope = 'https://andrelombardo.github.io/DrawCircuit/';
    const own = [worker(), worker(renamedScope)];
    const others = [
      worker('https://andrelombardo.github.io/DRAWCIRCUIT/'),
      worker(scope, 'unrelated.js'),
    ];
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistrations: async () => [...own, ...others] },
    });
    const unrelatedCache = 'workbox-precache-v2-https://andrelombardo.github.io/DRAWCIRCUIT/';
    const renamedCache = `workbox-precache-v2-${renamedScope}`;
    const { stored } = cacheStorage([oldCache, renamedCache, unrelatedCache, ...otherCaches]);
    await retireLegacyOffline(renamedScope);
    own.forEach((entry) => expect(entry.unregister).toHaveBeenCalledOnce());
    others.forEach((entry) => expect(entry.unregister).not.toHaveBeenCalled());
    expect([...stored]).toEqual([unrelatedCache, ...otherCaches]);
  });

  it('cleans orphaned caches even when worker access or unregistration fails', async () => {
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistrations: async () => {
          throw Error('denied');
        },
      },
    });
    const { api } = cacheStorage();
    await expect(retireLegacyOffline(scope)).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledWith(oldCache);
    const own = worker();
    own.unregister.mockRejectedValue(Error('denied'));
    vi.stubGlobal('navigator', { serviceWorker: { getRegistrations: async () => [own] } });
    await expect(retireLegacyOffline(scope)).resolves.toBeUndefined();
  });

  it('never blocks startup in unsupported or restricted browsers', async () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('caches', {
      keys: async () => {
        throw Error('denied');
      },
    });
    await expect(retireLegacyOffline(scope)).resolves.toBeUndefined();
    const own = worker();
    vi.stubGlobal('navigator', { serviceWorker: { getRegistrations: async () => [own] } });
    await retireLegacyOffline(scope);
    expect(own.unregister).toHaveBeenCalledOnce();
  });
});

function retirementWorker(cacheFailure = false) {
  const handlers = new Map<
    string,
    (event: { waitUntil: (task: Promise<unknown>) => void }) => void
  >();
  const { api, stored } = cacheStorage();
  if (cacheFailure) api.keys.mockRejectedValue(Error('denied'));
  const self = {
    location: { href: `${scope}sw.js` },
    registration: { scope, unregister: vi.fn().mockResolvedValue(true) },
    clients: { claim: vi.fn().mockResolvedValue(undefined) },
    skipWaiting: vi.fn().mockResolvedValue(undefined),
    addEventListener: (
      type: string,
      fn: (event: { waitUntil: (task: Promise<unknown>) => void }) => void,
    ) => handlers.set(type, fn),
  };
  runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), {
    self,
    caches: api,
    URL,
  });
  const dispatch = (type: string) =>
    new Promise<void>((resolve, reject) => {
      handlers.get(type)!({
        waitUntil: (task) => {
          void task.then(() => resolve(), reject);
        },
      });
    });
  return { self, handlers, stored, dispatch };
}

describe('old sw.js retirement endpoint', () => {
  it('replaces active/waiting workers without reloads, then deletes its cache and unregisters', async () => {
    const { self, handlers, stored, dispatch } = retirementWorker();
    expect([...handlers.keys()]).toEqual(['install', 'activate']);
    await dispatch('install');
    expect(self.skipWaiting).toHaveBeenCalledOnce();
    await dispatch('activate');
    expect(self.clients.claim).toHaveBeenCalledOnce();
    expect(self.registration.unregister).toHaveBeenCalledOnce();
    expect([...stored]).toEqual(otherCaches);
  });

  it('still unregisters if CacheStorage is denied', async () => {
    const { self, dispatch } = retirementWorker(true);
    await dispatch('activate');
    expect(self.registration.unregister).toHaveBeenCalledOnce();
  });
});
