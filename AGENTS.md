# DrawCircuit

## Publication and browser checks

- Public repository: https://github.com/andrelombardo/DrawCircuit
- Preferred URL for manual checks of the deployed app: https://andrelombardo.github.io/DrawCircuit/
- The live site represents the last successfully deployed commit, not uncommitted local changes. Confirm the GitHub Actions run and Pages deployment match the commit being tested; asset hashes can be compared with the run’s build artifact.
- When the user asks to complete a change through publication: implement, run lint/build and check the local app in the browser, commit, push to main, wait for the Pages build and publication, then verify the public site. For web changes, test the public URL in the browser. Keep main deployable; never push a failing intermediate change.
- DrawCircuit is web-only (React + TypeScript + Vite). Pushes to main run lint and build before deploying Pages via `.github/workflows/deploy-pages.yml`; pull requests only validate. See `docs/releases.md`.
- Keep the static manifest installable under `/DrawCircuit/`. Do not add offline caching or update dialogs. `public/sw.js` and `src/pwa/retireLegacyOffline.ts` only retire legacy workers/caches; read `docs/pwa.md` before changing or removing them. The previous `/drawcircuit/` scope is an explicit migration alias. Never clear user storage or other applications’ caches.
- Use local dev/production preview when validating changes before deployment. Visiting the public site requires no local server or tunnel.
- Keep Comic Relief bundled and self-hosted for circuit text; load both faces before canvas measurements. Preserve its third-party OFL notice and embedded SVG/PNG fonts. The UI keeps Inter.
- Do not introduce a license or publish credentials. Audit staged/tracked files before publishing; keep local environment files and generated builds ignored.

## Local commands

Use Node 26.5.0 from `.nvmrc`. Install with `npm ci`; checks are `npm run lint` and `npm run build`. Start development with `npm run dev`, or test the built output with `npm run preview`. Verify drawing, editing, persistence and exports in the browser before publishing.
