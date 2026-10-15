# Official DrawCircuit logo

`drawcircuit-logo.svg` is the single editable master: a vector reconstruction of the supplied blue symbol, with its rounded corners and connected diagonal silhouette. The solid blue fill (`#0062fd`) removes the reference image's raster noise. The background is transparent and the 768×448 viewBox preserves the original proportions.

Run `node scripts/create-pwa-icons.mjs` to regenerate the transparent 2048px brand PNGs, browser/PWA artwork. Installation icons centre the mark on an opaque white square, covering approximately 78% of its width. The maskable artwork stays inside the central safe circle. Vector favicons remain blue on a transparent background.

The empty sheet uses the master SVG as a CSS mask, coloured light grey (`#c5ccd6`) at the same size and position as the former resistor. The mark disappears when the document contains any object and remains outside the circuit's exported artwork.

The manifest uses `drawcircuit-blue-192.png`, `drawcircuit-blue-512.png` and `maskable-drawcircuit-blue-512.png`; Apple uses `apple-touch-icon-blue.png`. Distinct URLs expose the new artwork to existing installations as well as new ones. The README uses the same master SVG.
