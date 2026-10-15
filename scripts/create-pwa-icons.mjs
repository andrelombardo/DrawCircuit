import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

// Every app icon and the empty sheet use the same clean vector silhouette.
const master = await readFile(
  new URL('../assets/brand/drawcircuit-logo.svg', import.meta.url),
  'utf8',
);
const inner = master.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const artwork = (width) =>
  `<g transform="translate(96 96) scale(${width / 768}) translate(-384 -224)">${inner}</g>`;
const square = (width = 154, background = true) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">${background ? '<rect width="192" height="192" fill="white"/>' : ''}${artwork(width)}</svg>`;
const render = (svg, size) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

await mkdir(new URL('../public/icons/', import.meta.url), { recursive: true });
const logo = render(master, 2048);
await writeFile(new URL('../assets/brand/drawcircuit-logo.png', import.meta.url), logo);
await writeFile(new URL('../public/logo.png', import.meta.url), logo);
const favicon = square(166, false);
await writeFile(new URL('../public/favicon.svg', import.meta.url), favicon);
await writeFile(new URL('../public/favicon-adaptive.svg', import.meta.url), favicon);
for (const size of [16, 32, 48, 180, 192, 512]) {
  // Distinct installation URLs let existing installations refresh the branding.
  const file =
    size === 180
      ? 'apple-touch-icon-blue.png'
      : size >= 192
        ? `drawcircuit-blue-${size}.png`
        : `icon-${size}.png`;
  await writeFile(new URL(`../public/icons/${file}`, import.meta.url), render(square(), size));
}
// Keep the entire silhouette inside the maskable icon's central safe circle.
await writeFile(
  new URL('../public/icons/maskable-drawcircuit-blue-512.png', import.meta.url),
  render(square(130), 512),
);
