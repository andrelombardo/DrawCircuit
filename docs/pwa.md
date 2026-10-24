# Web app and persistence

DrawCircuit loads from the network and stores circuits, personal blocks, and preferences in the browser. It does not register service workers, precache resources, or implement an update system. Opening the app loads the site normally. The host controls ordinary HTTP caching; this is separate from an app-managed offline cache. An already open editor may continue working with resources in memory, but offline startup is not guaranteed.

`public/manifest.webmanifest` preserves the name, icons, colors, and standalone launch. The canonical public path is case-sensitive `/drawcircuit/`; the visible app name remains DrawCircuit. Relative `start_url` and `scope` work under this path. Local data belongs to the unchanged origin `https://andrelombardo.github.io`. An app installed from the old address may need to be installed again from the new URL. The manifest and interface use Italian. Circuit text and saved personal data retain their original content.

## Browsers

| Browser                         | Installation                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Compatible Chrome / Edge        | Native site installation menu; button availability depends on browser and platform             |
| Safari on macOS Sonoma or later | File → Add to Dock                                                                             |
| Safari on iPhone / iPad         | Share → Add to Home Screen; choose web app launch where offered                                |
| Firefox                         | Support and menus depend on the platform; a manifest does not guarantee an installation prompt |

A service worker is not required for installation in supported browsers. Chrome removed the fetch-handler requirement for menu installation in Android 108 and desktop 112. Installation support does not imply an automatic prompt. Safari can add sites to the Dock without a worker. The app adds no custom installation flow.

Reference documentation, consulted October 15, 2026: [MDN: installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [Chrome: installation criteria](https://developer.chrome.com/blog/update-install-criteria), and [WebKit: Mac web apps](https://webkit.org/blog/15443/news-from-wwdc24-webkit-in-safari-18-beta/). Local manifest and asset checks do not certify installation on every physical device.

## Retiring legacy offline copies

Two entry points are needed because an old cached shell may prevent the new JavaScript from running:

- `public/sw.js`: at the old worker URL, the browser finds a replacement that activates immediately, claims clients without intercepting fetches, removes the old precache, and unregisters itself. It does not reload windows, preserving ongoing edits and memory state.
- `src/pwa/retireLegacyOffline.ts`: when the new production site loads, it removes registrations with the **exact app scope or historical `/DrawCircuit/` alias** and the **exact `sw.js` script**, then removes orphaned precaches. Access failures do not block the editor and are retried on the next visit, without timers or persistent flags.

Only historical Workbox names matching `workbox-precache-v<number>-<exact scope>` are removed. Other scopes, different cache prefixes, localStorage, IndexedDB, documents, blocks, preferences, and recovery copies are preserved. There is no `Clear-Site-Data`, blanket deletion, or document-structure change.

GitHub Pages does not automatically redirect a renamed path, and no separate redirect site is maintained. If `/DrawCircuit/sw.js` is unreachable, the browser cannot fetch its retirement worker; opening the [canonical site](https://andrelombardo.github.io/drawcircuit/) also cleans the old scope without changing local data. A worker on the new scope cannot claim old-scope windows; an old cached shell may require opening the canonical address directly.

Retirement cannot reach an installation that stays completely offline. On reconnection, browser update checks may reach `sw.js`. The site cannot force browser update timing; code already running in an old window stays loaded until the window is normally reopened. Once the retirement worker takes over, resources are no longer served from the old precache.

### Migration lifetime

Introduced October 15, 2026. First necessity review: October 15, 2027. The main-thread cleanup can be removed when legacy profile cleanup is no longer needed. There is no universally safe expiration for the small `sw.js` endpoint: an installation may remain inactive for years. Keep it while those profiles should remain recoverable; removal requires explicitly accepting that never-reopened profiles may retain the old worker. It registers no new installation and does not depend on Workbox.
