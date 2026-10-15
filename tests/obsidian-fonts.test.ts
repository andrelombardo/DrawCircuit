import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as canvasText from '../src/tikz/canvasText';
import { exportObsidian, exportStandalone, exportTikz } from '../src/tikz/exporter';
import { createTextAnnotation } from '../src/model/factories';

const doc = {
  version: 1 as const,
  title: 'Font portabile',
  objects: ['Rete αβΩ', 'R_1', '\\mathbf{V}_1'].map((source, i) =>
    createTextAnnotation({ x: i * 100, y: 0 }, source),
  ),
};
afterEach(() => vi.restoreAllMocks());

describe('portable Obsidian circuit font', () => {
  it('includes both actual font files once inside the picture, preserving license and math source', () => {
    vi.spyOn(canvasText, 'canvasTextLayout').mockReturnValue({
      svg: '<text font-family="Comic Relief">R</text>',
      alignWidth: 20,
      bounds: { x: -10, y: -8, width: 20, height: 16 },
    });
    const code = exportObsidian(doc);
    const special = /\\special\{dvisvgm:raw (<style>[\s\S]*?<\/style>)\}/.exec(code)![1];
    const style = special.replace(/%\n/g, '');
    const fonts = [...style.matchAll(/url\(data:font\/woff2;base64,([^)]*)\)/g)];
    expect(fonts).toHaveLength(2);
    for (const [i, weight] of ['Regular', 'Bold'].entries())
      expect(Buffer.from(fonts[i][1], 'base64')).toEqual(
        readFileSync(resolve('src/fonts/comic-relief', `ComicRelief-${weight}.woff2`)),
      );
    // CSS optimizers preserve /*! license comments in the compiled SVG.
    expect(style).toContain('/*! Copyright 2013 The Comic Relief Project Authors');
    expect(style).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(style).not.toMatch(/src:url\(['"]?https?:/);
    expect(code.indexOf('\\begin{circuitikz}')).toBeLessThan(code.indexOf('<style>'));
    expect(code.indexOf('<style>')).toBeLessThan(code.indexOf('\\node['));
    expect(code.split('\n').every((line) => line.length < 2000)).toBe(true);
    expect(code).toContain('$R_1$');
    expect(code).toContain('$\\mathbf{V}_1$');
    expect(code.match(/\\dcCanvasText\{/g)).toHaveLength(3);
    expect(exportTikz(doc)).not.toContain('data:font');
    expect(exportStandalone(doc)).not.toContain('data:font');
  });

  it('omits unused font data for empty drawings and environments without SVG text layout', () => {
    expect(exportObsidian({ ...doc, objects: [] })).not.toContain('@font-face');
    expect(exportObsidian(doc)).not.toContain('@font-face');
    expect(exportObsidian(doc)).toContain('\\sffamily');
  });
});
