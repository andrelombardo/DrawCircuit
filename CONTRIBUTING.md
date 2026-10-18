# Contributing to DrawCircuit

Thanks for your interest in improving DrawCircuit! Contributions of all kinds are welcome, from bug fixes and documentation improvements to new features.

## Before you start

Take a look at the [existing issues](https://github.com/andrelombardo/DrawCircuit/issues) to see whether your idea or bug has already been discussed.

- [Good first issues](https://github.com/andrelombardo/DrawCircuit/labels/good%20first%20issue) are a good place to start.
- [Help wanted](https://github.com/andrelombardo/DrawCircuit/labels/help%20wanted) highlights tasks open to contributions.
- [Report a bug](https://github.com/andrelombardo/DrawCircuit/issues/new?template=bug_report.yml) or [suggest a feature](https://github.com/andrelombardo/DrawCircuit/issues/new?template=feature_request.yml) if you have something new to share.

For larger changes, open an issue or leave a comment before writing code. This helps avoid duplicate work and keeps the scope clear.

## Run locally

You'll need [Node.js](https://nodejs.org/) and npm. The recommended Node.js version is specified in [`.nvmrc`](.nvmrc).

1. Fork the repository and clone your fork.
2. Create a branch for your changes.
3. Install dependencies and start the development server.

```sh
git clone https://github.com/YOUR_USERNAME/DrawCircuit.git
cd DrawCircuit
nvm install
nvm use
npm ci
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.

For more context, see the [architecture documentation](docs/architecture.md) and [user guide](docs/guide.md).

## Development guidelines

Keep changes focused and consistent with the existing codebase. In particular:

- Preserve existing drawing, selection, editing, and undo/redo behavior unless your change intentionally updates it.
- Avoid breaking saved documents, browser storage, or compatibility with the current JSON format.
- Keep the interface accessible and usable on different screen sizes.
- Update relevant documentation when changing how something works.
- Preserve the bundled assets, their license notices, and the `/DrawCircuit/` deployment path.
- If you're changing app installation or caching behavior, review [the PWA documentation](docs/pwa.md) first and avoid clearing unrelated user data.

## Test your changes

Before submitting a pull request, run:

```sh
npm run lint
npm test
npm run build
npm run preview -- --base /DrawCircuit/
```

Check the production preview at [http://127.0.0.1:4173/DrawCircuit/](http://127.0.0.1:4173/DrawCircuit/).

Also test the behavior affected by your changes. When relevant, verify drawing and editing, undo/redo, saving after reload, copying as an image, keyboard interactions, and responsive layouts.

Review your changes with `git diff` before committing. Don't include secrets, generated build files, local configuration, or temporary debugging artifacts.

## Submit a pull request

Open a pull request against `main` and briefly describe:

- **What changed** and why.
- **How you tested it.**
- **Related issues**, if any.

Screenshots or short recordings are welcome when they help illustrate a visible change. Automated checks run on pull requests; deployment is handled separately. See the [deployment guide](docs/releases.md) for details.

## License

By contributing, you agree that your contributions will be distributed under the project's [MIT License](LICENSE). Keep existing third-party license notices intact.
