import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Resvg } from '@resvg/resvg-js';
import { pwaOptions } from '../src/pwa/config';

function pixels(file: string, size: number) {
  const data = readFileSync(new URL(`../public/icons/${file}`, import.meta.url)).toString('base64');
  return new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><image width="${size}" height="${size}" href="data:image/png;base64,${data}"/></svg>`,
  ).render().pixels;
}

describe('visible installation artwork', () => {
  it.each([16, 24, 32, 48, 128, 180, 192, 512])(
    'is opaque white with a prominent blue mark at %ipx',
    (size) => {
      const file =
        size === 180
          ? 'apple-touch-icon-blue.png'
          : size >= 192
            ? `drawcircuit-blue-${size}.png`
            : `icon-${size}.png`;
      const data = pixels(file, size);
      const dark: { x: number; y: number }[] = [];
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          const offset = (y * size + x) * 4;
          expect(data[offset + 3]).toBe(255);
          if (data[offset] < 160) {
            dark.push({ x, y });
            expect(data[offset + 2]).toBeGreaterThan(240);
          }
          if (x === 0 || y === 0 || x === size - 1 || y === size - 1)
            expect([...data.slice(offset, offset + 4)]).toEqual([255, 255, 255, 255]);
        }
      expect(dark.length / (size * size)).toBeGreaterThan(0.13);
      expect(
        Math.max(...dark.map((p) => p.x)) - Math.min(...dark.map((p) => p.x)) + 1,
      ).toBeGreaterThan(size * 0.7);
      // Allow the one-pixel quantization of the smallest raster sizes.
      expect(
        Math.max(...dark.map((p) => p.y)) - Math.min(...dark.map((p) => p.y)) + 1,
      ).toBeGreaterThan(size * 0.42 - 1);
    },
  );
  it('keeps all maskable artwork inside the standard safe circle on white', () => {
    const size = 512,
      data = pixels('maskable-drawcircuit-blue-512.png', size);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const offset = (y * size + x) * 4;
        expect(data[offset + 3]).toBe(255);
        if (data[offset] < 250)
          expect(Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2)).toBeLessThan(size * 0.4);
      }
  });
  it('uses fresh installation URLs and a transparent blue vector favicon', () => {
    expect(
      pwaOptions.manifest &&
        typeof pwaOptions.manifest === 'object' &&
        pwaOptions.manifest.icons?.every((icon) => icon.src.includes('drawcircuit-blue')),
    ).toBe(true);
    const favicon = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');
    expect(favicon).toContain('fill="#0062fd"');
    expect(favicon).not.toContain('<rect');
    expect(readFileSync(new URL('../public/favicon-adaptive.svg', import.meta.url), 'utf8')).toBe(
      favicon,
    );
    const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const icons = index.match(/<link rel="icon"[^>]+>/g)!;
    expect(icons.at(-1)).toContain('sizes="any"');
    expect(icons.at(-1)).toContain('favicon-adaptive.svg');
  });
});
