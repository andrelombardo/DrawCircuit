<p align="center">
  <img src="assets/brand/drawcircuit-logo.svg" alt="DrawCircuit logo" width="96" />
</p>

<h1 align="center">DrawCircuit</h1>

<p align="center">Draw electrical circuits for notes, lessons, and publications.</p>

<p align="center">
  <a href="https://andrelombardo.github.io/DrawCircuit/">Open in your browser</a>
  ·
  <a href="docs/manuale.md">User guide</a>
</p>

Place components, connect them, and add mathematical labels and electrical annotations. Export the result as a diagram or as TikZ code for your documents.

DrawCircuit is a web editor that saves your work in your browser and requires no account. It loads from the network and can be installed as a standalone web app in supporting browsers. Local circuits, personal blocks, and preferences remain in the browser between visits.

Circuit labels and formulas use **Comic Relief**, bundled with the app so visitors see the same font without installing it. SVG and PNG exports include the font too. The interface keeps Inter. See the font's [source and SIL Open Font License](src/fonts/comic-relief/README.md).

## Get started

1. Open the [browser app](https://andrelombardo.github.io/DrawCircuit/).
2. Choose a component from **Componenti**, then click the sheet to place it.
3. Connect terminals with wires and edit the selection in **Proprietà**.
4. Open **Esporta** to copy or download your circuit.

The public URL is now `/DrawCircuit/` (case-sensitive). Browser data stays on the same origin; open the current URL to retire the previous installation. Existing PWA shortcuts may need to be installed again from the new address.

The interface and [user guide](docs/manuale.md) are in Italian. See the [web app guide](docs/pwa.md) for installation, local data, and browser differences.

## What you can do

- **Draw circuits:** searchable electrical symbols, editable wires, and junctions, with snapping and placement guides.
- **Annotate diagrams:** LaTeX labels, current and voltage arrows, polarity signs, loop arrows, text, and decorative shapes.
- **Reuse arrangements:** start from quick blocks or save a selection as a personal block.
- **Edit precisely:** move, rotate, replace, align, and distribute components; adjust numeric spacing, colours, and styles with undo and redo.
- **Export your work:** TikZ/CircuitikZ, standalone `.tex`, Obsidian TikZ blocks, SVG, and transparent PNG, for the whole circuit or a selection.
- **Keep local copies:** automatic saving, portable JSON archives, and personal block library import/export.

## Run locally

Use Node.js **26.5.0**, pinned in `.nvmrc`. With [nvm](https://github.com/nvm-sh/nvm) installed:

```sh
git clone https://github.com/andrelombardo/DrawCircuit.git
cd DrawCircuit
nvm install
nvm use
npm ci
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Development

The editor uses React, TypeScript, Vite, and Zustand. Diagrams render as SVG; KaTeX handles mathematical labels. The app is entirely static, with no backend or native runtime. See the [architecture](docs/architecture.md).

| Command                | Purpose                               |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Start the local development server.   |
| `npm run lint`         | Check the source with ESLint.         |
| `npm run test`         | Run the test suite.                   |
| `npm run build`        | Build the browser app in `dist/`.     |
| `npm run preview`      | Preview the browser production build. |
| `npm run format:check` | Check formatting with Prettier.       |

Pushes to `main` run lint, tests, and the production build before publishing to GitHub Pages. Pull requests run the same checks without publishing. See the [deployment guide](docs/releases.md).

## Documentation

- [User guide](docs/manuale.md): drawing, editing, shortcuts, exports, and technical details.
- [Web app guide](docs/pwa.md): installation, local data, and migration from old offline installations.
- [Architecture](docs/architecture.md): modules, persistence, rendering, and build.
- [Deployment guide](docs/releases.md): quality checks, GitHub Pages, and verification.
