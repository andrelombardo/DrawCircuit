// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { prepareCircuitFonts } from '../src/model/fonts';
import { exportSVG } from '../src/svg/exporter';
import { createTextAnnotation } from '../src/model/factories';

describe('bundled circuit fonts', () => {
  it('waits for regular and bold before the canvas can measure text', async () => {
    let finishBold!: (faces: FontFace[]) => void;
    const load = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockImplementationOnce(() => new Promise<FontFace[]>((resolve) => (finishBold = resolve)));
    const ready = vi.fn();
    const pending = prepareCircuitFonts({ load } as unknown as FontFaceSet).then(ready);
    await Promise.resolve();
    expect(load.mock.calls.map(([font]) => font)).toEqual([
      '400 22px "Comic Relief", cursive',
      '700 22px "Comic Relief", cursive',
    ]);
    expect(ready).not.toHaveBeenCalled();
    finishBold([]);
    await pending;
    expect(ready).toHaveBeenCalledOnce();
  });

  it('exports the actual font files and OFL license for standalone SVG/PNG rendering', () => {
    const svg = exportSVG({
      version: 1,
      title: 'Font',
      objects: [createTextAnnotation({ x: 0, y: 0 }, 'Circuito αβΩ')],
    });
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(parsed.querySelector('parsererror')).toBeNull();
    const css = parsed.querySelector('style')!.textContent!;
    const embedded = [...css.matchAll(/url\(data:font\/woff2;base64,([^)]*)\)/g)];
    expect(embedded).toHaveLength(2);
    for (const [index, weight] of ['Regular', 'Bold'].entries()) {
      const original = readFileSync(
        resolve('src/fonts/comic-relief', `ComicRelief-${weight}.woff2`),
      );
      expect(Buffer.from(embedded[index][1], 'base64')).toEqual(original);
      expect(original.subarray(0, 4).toString()).toBe('wOF2');
    }
    expect(css).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(css).toContain('Comic Relief Project Authors');
    expect(css).not.toMatch(/src:url\(['"]?https?:/);
    expect(svg).not.toContain('Comic Sans');
  });

  it('does not embed unused fonts into drawings without text', () => {
    expect(exportSVG({ version: 1, title: 'Empty', objects: [] })).not.toContain('@font-face');
  });
});
