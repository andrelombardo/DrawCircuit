<p align="center">
  <img src="assets/brand/drawcircuit-logo.svg" alt="DrawCircuit logo" width="96" />
</p>

<h1 align="center">DrawCircuit</h1>

<p align="center">Draw electrical circuits for notes, lessons, and publications.</p>

<p align="center">
  <a href="https://andrelombardo.github.io/drawcircuit/">Open in your browser</a>
  ·
  <a href="https://github.com/andrelombardo/drawcircuit/releases/latest">Download for macOS</a>
  ·
  <a href="docs/manuale.md">User guide</a>
</p>

Place components, connect them, and add mathematical labels and electrical annotations. Export the result as a diagram or as TikZ code for your documents.

DrawCircuit saves your work locally and requires no account. The browser app works offline after its first successful load; the macOS app includes everything it needs to work offline.

## Get started

1. Open the [browser app](https://andrelombardo.github.io/drawcircuit/) or download the [macOS release](https://github.com/andrelombardo/drawcircuit/releases/latest) for Apple Silicon or Intel.
2. Choose a component from **Componenti**, then click the sheet to place it.
3. Connect terminals with wires and edit the selection in **Proprietà**.
4. Open **Esporta** to copy or download your circuit.

The interface and [user guide](docs/manuale.md) are in Italian. For macOS installation, backups, and transferring circuits between the browser and desktop app, see the [macOS guide](docs/desktop.md).

## What you can do

- **Draw circuits:** searchable electrical symbols, editable wires, and junctions, with snapping and placement guides.
- **Annotate diagrams:** LaTeX labels, current and voltage arrows, polarity signs, loop arrows, text, and decorative shapes.
- **Reuse arrangements:** start from quick blocks or save a selection as a personal block.
- **Edit precisely:** move, rotate, replace, align, and distribute components; adjust numeric spacing, colours, and styles with undo and redo.
- **Export your work:** TikZ/CircuitikZ, standalone `.tex`, Obsidian TikZ blocks, SVG, and transparent PNG, for the whole circuit or a selection.
- **Keep local copies:** automatic saving and portable JSON archives; the macOS app also keeps a disk backup and offers signed updates.

## Run locally

Use Node.js **26.5.0**, pinned in `.nvmrc`. With [nvm](https://github.com/nvm-sh/nvm) installed:

```sh
git clone https://github.com/andrelombardo/drawcircuit.git
cd drawcircuit
nvm install
nvm use
npm ci
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). To build the native app, follow the [macOS development instructions](docs/desktop.md#sviluppo-e-build).

## Development

The editor uses React, TypeScript, Vite, and Zustand. Diagrams render as SVG; KaTeX handles mathematical labels. The browser and macOS apps share the circuit model and exporters.

| Command                | Purpose                               |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Start the local development server.   |
| `npm run lint`         | Check the source with ESLint.         |
| `npm run test`         | Run the test suite.                   |
| `npm run build`        | Build the browser app in `dist/`.     |
| `npm run preview`      | Preview the browser production build. |
| `npm run format:check` | Check formatting with Prettier.       |

Pushes to `main` publish the affected apps: web changes update Pages, macOS changes update the desktop release, and shared changes update both. Each app has its own version. See [releases and update signing](docs/releases.md) for the full process.

## Documentation

- [User guide](docs/manuale.md): drawing, editing, shortcuts, exports, and technical details.
- [macOS guide](docs/desktop.md): installation, local saving, archives, updates, and native builds.
- [Release guide](docs/releases.md): publication channels, versioning, signing, and verification.
