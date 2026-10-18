# Publishing the website

DrawCircuit is a static web application. Its only deployment target is [GitHub Pages](https://andrelombardo.github.io/DrawCircuit/).

`.github/workflows/deploy-pages.yml` runs on Ubuntu with Node 26.5.0:

1. `npm ci`.
2. `npm run lint`.
3. `npm test`.
4. `npm run build`, including TypeScript checking.
5. Upload `dist/` and deploy to Pages, only for a push to `main` or a manual workflow run on `main`.

Pull requests run the same checks without publishing. The pipeline does not use platform routing, automatic versioning, release tags, or repository-content write permissions. Deployments are serialized.

Before publishing, use `npm run preview` locally and also check the `/DrawCircuit/` prefix with `npm run preview -- --base /DrawCircuit/`. Verify drawing, editing, local saving, image copying, and both interface languages in the browser. `npm test` covers highlight erasure, geometry, history, and persistence compatibility. Build assets, manifest, and icons use relative paths. Never include generated builds, `.env` files, or private keys in commits.

To verify publication, confirm that the Actions run and Pages deployment match the commit being tested. Open the public URL in the browser and, when needed, compare its HTML asset hashes with the run’s build artifact. The public site does not include unpublished local changes. No app version file is generated.

## Historical remote resources

Previously published native releases, tags, and artifacts are historical; the web app does not delete them or produce new native packages or updates. Removing old releases or unused signing secrets is a separate repository-settings operation and is unnecessary for the website to work.

## Migrating old web installations

The published `sw.js` endpoint must continue serving the retirement worker from `public/`, even though the app no longer registers workers. The repository rename changes Pages from `/drawcircuit/` to `/DrawCircuit/`; GitHub does not automatically redirect the site.

The separate [andrelombardo.github.io repository](https://github.com/andrelombardo/andrelombardo.github.io) publishes `/drawcircuit/index.html`, which redirects to `/DrawCircuit/`, preserving query and fragment when JavaScript is enabled. Both `/drawcircuit/` and `/drawcircuit` work. The application is deployed only by this repository and pipeline.

Opening the canonical address also retires registrations and caches belonging to the old scope while preserving same-origin data. Older installed web app shortcuts may require reinstallation. See the [web app and persistence guide](pwa.md) for cache ownership, limitations, and migration removal criteria.
