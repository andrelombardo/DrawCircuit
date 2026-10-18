# Contributing to DrawCircuit

Thanks for helping improve DrawCircuit. It is a browser-only circuit editor built with React, TypeScript, Vite, and Zustand.

## Find a task

Check existing issues before opening a new one. Use the [bug report form](https://github.com/andrelombardo/DrawCircuit/issues/new?template=bug_report.yml) for reproducible problems and the [feature request form](https://github.com/andrelombardo/DrawCircuit/issues/new?template=feature_request.yml) for proposals.

Tasks labeled [good first issue](https://github.com/andrelombardo/DrawCircuit/labels/good%20first%20issue) are intended for newcomers. [help wanted](https://github.com/andrelombardo/DrawCircuit/labels/help%20wanted) marks work open to contributions. Leave a comment on the issue before starting a substantial change so we can agree on scope and avoid duplicate work.

## Set up

Fork the repository, clone your fork, and create a branch for your change. Use Node.js **26.5.0** from `.nvmrc`:

```sh
nvm install
nvm use
npm ci
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Read the [architecture](docs/architecture.md) and [user guide](docs/guide.md) before changing editing behavior.

## Language and translations

Use **English** for identifiers, source messages, comments, commit messages, issue titles and descriptions, pull requests, and primary documentation. Keep Italian text in `src/i18n/it.ts`, `README.it.md`, and `docs/it/`.

- Wrap UI messages with `t('English message')` from `src/i18n/index.ts` and add the corresponding Italian entry in `src/i18n/it.ts`.
- Translate whole sentences, including accessible labels, hints, and errors. Use named placeholders: `t('Insert {name}', { name })`. Do not construct sentences from separately translated fragments.
- Keep catalog and preset metadata in English. Translate it when displaying it; `searchText()` searches both languages.
- English is the fallback when a translation is missing. Verify new messages in both languages before submitting.
- Subscribe memoized components with translated UI to `useLanguage` so language changes update them immediately.
- Never translate existing user-authored labels, block names, document IDs, or storage keys. Language selection is a separate browser preference.

Keep both READMEs aligned when changing documented features. The detailed Italian user guide is in `docs/it/guide.md`.

## Make and validate the change

Keep pull requests focused. Preserve JSON v1 compatibility, browser data, undo/redo behavior, MIT and third-party notices, bundled Comic Relief fonts, and the `/DrawCircuit/` deployment path. Read [docs/pwa.md](docs/pwa.md) before changing legacy worker retirement; never clear unrelated caches or user storage.

Run:

```sh
npm run lint
npm test
npm run build
npm run preview -- --base /DrawCircuit/
```

Check [http://127.0.0.1:4173/DrawCircuit/](http://127.0.0.1:4173/DrawCircuit/) in the browser. The Node test suite uses Vite’s existing TypeScript loader and covers highlight erasure and its integration with document operations. Verify the behavior relevant to your change, including drawing, selection and editing, undo/redo, persistence after reload, and **Copy as image**. For UI changes, check English and Italian, keyboard access, and narrow layouts.

Do not commit generated builds, local environment files, credentials, temporary checks, screenshots, or reports. Keep required app assets and deliberate documentation assets, such as the README demo. Review `git diff` and staged files before committing.

## Open a pull request

Use a concise English title and explain the problem, resulting behavior, and how you verified it. Link the related issue and include screenshots only when they help explain a visible change. The pull request template provides a starting point.

Pull requests run lint, tests, and the production build. Only pushes to `main` publish to GitHub Pages; contributors do not need deployment credentials. See the [deployment guide](docs/releases.md).

## License

Contributions are distributed under the repository’s [MIT License](LICENSE). Preserve the separate notices for third-party code and assets.
