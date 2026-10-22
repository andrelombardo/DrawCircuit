# DrawCircuit

## Publication and browser checks

- Public repository: https://github.com/andrelombardo/drawcircuit
- Preferred URL for manual checks of the deployed app: https://andrelombardo.github.io/drawcircuit/
- The live site represents the last successfully deployed commit, not uncommitted local changes. Confirm the GitHub Actions run and Pages deployment match the commit being tested; asset hashes can be compared with the run’s build artifact.
- When the user asks to complete a change through publication: implement, run lint/build and check the local app in the browser, commit, push to main, wait for the Pages build and publication, then verify the public site. For web changes, test the public URL in the browser. Keep main deployable; never push a failing intermediate change.
- DrawCircuit is web-only (React + TypeScript + Vite). Pushes to main run lint and build before deploying Pages via `.github/workflows/deploy-pages.yml`; pull requests only validate. See `docs/releases.md`.
- Keep the static manifest installable under `/drawcircuit/`. Do not add offline caching or update dialogs. `public/sw.js` and `src/pwa/retireLegacyOffline.ts` only retire legacy workers/caches; read `docs/pwa.md` before changing or removing them. The previous `/DrawCircuit/` scope is an explicit migration alias. Keep the visible app name DrawCircuit. Never clear user storage or other applications’ caches.
- Use local dev/production preview when validating changes before deployment. Visiting the public site requires no local server or tunnel.
- Keep Comic Relief bundled and self-hosted for circuit text; load both faces before canvas measurements. Preserve its third-party OFL notice and embedded SVG/PNG fonts. The UI keeps Inter.
- Preserve the MIT license and third-party license notices. Never publish credentials. Audit staged/tracked files before publishing; keep local environment files and generated builds ignored.

## Cleanup after every task

- Before finishing any task, delete all support material created for that task: temporary tests and fixtures, helper scripts, screenshots, sample exports, downloaded build artifacts, logs, reports and generated builds. Clean up task-specific temporary files outside the repository as well.
- Run the necessary checks first, then remove their temporary outputs. Keep only the implementation, required application assets/configuration and lasting deliverables requested by the user; do not leave or commit support files or tests unless the user explicitly asks to keep them.
- Audit the working tree and staged files before committing or pushing. Never remove pre-existing user files, application data or installed dependencies as part of this cleanup.

## Local commands

Use Node 26.5.0 from `.nvmrc`. Install with `npm ci`; checks are `npm run lint` and `npm run build`. Start development with `npm run dev`, or test the built output with `npm run preview`. Verify drawing, editing, persistence and exports in the browser before publishing.
