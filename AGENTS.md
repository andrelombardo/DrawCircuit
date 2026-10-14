# DrawCircuit

## Publication and browser checks

- Public repository: https://github.com/andrelombardo/drawcircuit
- Preferred URL for manual checks of the deployed app: https://andrelombardo.github.io/drawcircuit/
- The live site represents the last successfully deployed commit, not uncommitted local changes. Confirm the GitHub Actions run matches the commit being tested.
- When the user asks to complete a change through publication: implement, run lint/tests/build, commit, push to main, wait for the affected channel builds and publications, then verify their public versions. For web changes, test the public URL in the browser. Keep main deployable; never push a failing intermediate change.
- Pushes to main run `.github/workflows/deploy-pages.yml`: desktop-only changes publish only the app, web/PWA-only changes publish only Pages, shared changes publish both. See `docs/releases.md` for path ownership, independent version tags and signing.
- Use local dev/production preview when validating changes before deployment. Visiting the public site requires no local server or tunnel.
- Do not introduce a license or publish credentials. Audit staged/tracked files before publishing; keep local environment files and generated builds ignored.

## Local commands

Use Node 26.5.0 from `.nvmrc`. Install with `npm ci`; checks are `npm run lint`, `npm run test`, and `npm run build`. Start development with `npm run dev`, or test the built output with `npm run preview`.
