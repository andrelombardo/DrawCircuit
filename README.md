<p align="center">
  <img src="assets/brand/drawcircuit-logo.svg" alt="DrawCircuit XNOR logo" width="128" />
</p>

<h1 align="center">DrawCircuit</h1>

<p align="center">A fast circuit editor for notes and teaching.</p>

<p align="center">
  <a href="https://andrelombardo.github.io/drawcircuit/">Open DrawCircuit</a>
  ·
  <a href="docs/manuale.md">Documentation</a>
</p>

DrawCircuit turns circuit sketches into editable vector diagrams. Place components, connect terminals, add annotations, and export the result for your notes or teaching material. Everything runs in the browser, with automatic local saving and offline support after the first completed visit. There are no accounts or backend services; the editor focuses on drawing rather than circuit simulation.

## Features

### Drawing

- **72 electrical symbols** — A searchable library covering passive components, sources, semiconductors, switches, meters, logic gates, and more.
- **Wires and junctions** — Connect terminals and nodes with editable orthogonal, 45° or free paths; crossings stay disconnected until you add a junction.
- **Continuous nodes** — Press N and click to add nodes, then Esc or V to finish. Each node is separately undoable.
- **Smart Placement** — Snap a new component to a terminal or node, or explicitly insert a compatible component into a wire.
- **23 quick blocks** — Start with series and parallel networks, dividers, Wheatstone bridges, RC/RL/RLC circuits, and other common arrangements.
- **Personal blocks** — Save a selection as a reusable block, then rotate, insert, rename, or transfer your library as JSON.

### Editing

- **Selection and geometry** — Move groups, drag labels independently, and use grid snapping, alignment guides, and equal spacing.
- **Math labels** — Edit directly on the rendered text, with LaTeX and live KaTeX rendering. Node labels choose a clear initial position and stay independently draggable.
- **Component replacement** — Swap one or several compatible symbols in a single undoable operation while preserving their connections, position, label, and style.
- **Undo and reuse** — Rotate, duplicate, copy, and paste with keyboard shortcuts and undo/redo.
- **Flexible workspace** — Press T to show or hide the component sidebar, resize it, and drag the drawing toolbar to a position that suits your circuit. Text remains available in the toolbar.

### Annotations

- **Current arrows** — Integrate a labeled arrow into a branch so it follows the wire as the circuit changes.
- **Voltage and polarity** — Mark a two-terminal component with +/− signs or draw a voltage arrow between chosen points.
- **Loops, arrows, and text** — Add editable elliptical loop arrows, straight or Bézier arrows, and mathematical notes. Mirror arrows horizontally or vertically and drag their rotation handle for arbitrary angles; hold Shift to snap to 15°.
- **Visual styling** — Adjust colors, symbol and label opacity, line thickness, label size, and alignment from the contextual toolbar.

### Export & Offline

- **TikZ / CircuitikZ** — Copy circuit code or download a standalone `.tex` document.
- **Obsidian** — Copy a complete Markdown TikZ block for notes using Inline TikZ or a compatible TikZ renderer.
- **SVG** — Copy or download a vector diagram with mathematical labels and no editor controls or grid.
- **Selection export** — Export the whole circuit or only the selected elements, including their internal wires.
- **Local saving and PWA** — Keep your circuit in the current browser and work offline after the app is cached; available installation options depend on the browser.

## Quick Start

Use Node.js **26.5.0**, the version pinned in `.nvmrc`. With [nvm](https://github.com/nvm-sh/nvm) installed:

```sh
git clone https://github.com/andrelombardo/drawcircuit.git
cd drawcircuit
nvm install
nvm use
npm ci
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). To use the hosted editor, open [DrawCircuit](https://andrelombardo.github.io/drawcircuit/) directly.

## Development

| Command                | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `npm run dev`          | Start the local Vite development server.                     |
| `npm run build`        | Check TypeScript and create the production build in `dist/`. |
| `npm run preview`      | Serve the production build locally.                          |
| `npm run test`         | Run the Vitest suite.                                        |
| `npm run test:watch`   | Run tests in watch mode.                                     |
| `npm run lint`         | Check the source with ESLint.                                |
| `npm run format:check` | Check formatting with Prettier.                              |

Pushes to `main` run lint, tests, and the production build before GitHub Pages deployment. See the [deployment workflow](.github/workflows/deploy-pages.yml).

## Architecture

React and TypeScript provide the UI, Vite builds the app, and Zustand manages the document, selection, and edit history. The canvas renders SVG objects; KaTeX lays out mathematical labels. Dedicated exporters produce CircuitikZ, Obsidian TikZ, and SVG from the same circuit model. LocalStorage keeps the document and preferences, while a service worker caches the app and its bundled fonts for offline use.

The [manual](docs/manuale.md) covers the document model, geometry, export behavior, shortcuts, and implementation details.

## Project Structure

```text
src/
├── circuit/         SVG symbols, wires, junctions, and annotations
├── components/      Canvas, sidebar, toolbars, dialogs, and properties
├── model/           Component catalog, object types, and serialization
├── store/           Document state, history, selection, and persistence
├── presets/         Quick-block definitions and placement
├── personalBlocks/  Reusable block library and its palette
├── smartPlacement/  Snapping, terminal connection, and inline insertion
├── tikz/            CircuitikZ and Obsidian exporters
├── svg/             Standalone SVG export
├── pwa/             Offline cache and update handling
└── utils/           Geometry, routing, crossings, and edit operations
tests/               Model, geometry, export, and DOM interaction tests
docs/                User manual and technical documentation
examples/            Reference circuits and exported examples
public/              Favicons and installable-app assets
assets/              Official brand image and README screenshots
```

## Key Decisions

- **Drawing first** — Keep circuit editing direct and predictable, without a simulation engine.
- **Local by default** — Store work in the browser and let users export it to their own tools.
- **Vector output** — Preserve editable geometry and mathematical labels for notes and publications.
- **Teaching tools** — Treat current, voltage, polarity, and loop annotations as first-class objects.

## Testing

Run `npm run test`. The suite covers component terminals and rotations, wire routing and junctions, crossings, Smart Placement, presets and personal blocks, annotations, serialization, undo/redo, export formats, persistence, and PWA updates. DOM interaction tests exercise selection, keyboard shortcuts, inline editing, clipboard behavior, and toolbar workflows.

## Documentation

- [User manual and technical details](docs/manuale.md) — Usage, shortcuts, architecture, and export conventions.
- [Personal blocks, annotations, SVG, and offline support](docs/nuove-feature.md) — Detailed behavior of the newer editing and PWA features.
