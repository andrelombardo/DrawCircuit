import { describe, expect, it } from 'vitest';
import { componentRegistry, createComponent } from '../src/model/catalog';
import { componentTypes } from '../src/model/types';
import { demoDocument } from '../src/model/demo';
import { escapeTex, exportStandalone, exportTikz, svgToTikz, texText } from '../src/tikz/exporter';
import { resolveEndpoint } from '../src/utils/geometry';
describe('TikZ exporter', () => {
  it.each([
    [
      { x: 80, y: 120 },
      { x: 2, y: -3 },
    ],
    [
      { x: -40, y: -80 },
      { x: -1, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0, y: -0 },
    ],
  ])('converts SVG coordinates and inverts Y', (input, output) =>
    expect(svgToTikz(input)).toEqual(output),
  );
  it('supports a consistent custom coordinate scale', () =>
    expect(svgToTikz({ x: 100, y: 100 }, 50)).toEqual({ x: 2, y: -2 }));
  it('has an explicit mapping or geometry fallback for every catalog type', () => {
    expect(Object.keys(componentRegistry)).toHaveLength(componentTypes.length);
    componentTypes.forEach((type) => {
      const c = createComponent(type, { x: 0, y: 0 }),
        code = exportTikz({ version: 1, title: 'x', objects: [c] });
      expect(code).not.toContain('undefined');
      const mapping = componentRegistry[type].tikz;
      if (mapping.kind === 'geometry') {
        expect(code).toContain(mapping.reason);
        expect(code).toContain('\\draw[');
      } else
        expect(code).toContain(`${mapping.kind === 'bipole' ? 'to' : 'node'}[${mapping.symbol}`);
      if (mapping.kind === 'node')
        for (const anchor of Object.values(mapping.anchors)) expect(code).toContain(`.${anchor})`);
    });
  });
  it('preserves orientation through rotated terminal coordinates', () => {
    const c = { ...createComponent('resistor', { x: 80, y: 120 }), rotation: 90 as const };
    expect(exportTikz({ version: 1, title: 'x', objects: [c] })).toContain(
      '(2,-2) to[R, fill=white',
    );
    expect(exportTikz({ version: 1, title: 'x', objects: [c] })).toContain('(2,-4);');
  });
  it('preserves labels independently of components', () => {
    const doc = demoDocument(),
      code = exportTikz(doc);
    expect(code).toContain('$r_{AB}$');
    expect(code).toContain('at (-3,0.75)');
    expect(code).toContain('{HTML}{2463CB}');
    expect(code).toContain('{HTML}{DF4949}');
  });
  it('resolves endpoints from the current document when exporting', () => {
    const doc = demoDocument();
    doc.objects = doc.objects.map((o) =>
      o.id === 'r-AB' && o.kind === 'component' ? { ...o, y: 40 } : o,
    );
    expect(
      resolveEndpoint({ kind: 'terminal', componentId: 'r-AB', terminalId: 'a' }, doc),
    ).toEqual({ x: -160, y: 40 });
    expect(exportTikz(doc)).toContain('(-4,-1)');
  });
  it('exports Bézier curves, circular arcs and reversed arrows', () => {
    const doc = demoDocument();
    expect(exportTikz(doc)).toContain('.. controls');
    expect(exportTikz(doc)).toContain('arc[start angle=60, end angle=-250');
    doc.objects = doc.objects.map((o) => (o.kind === 'arrow' ? { ...o, reversed: true } : o));
    expect(exportTikz(doc)).toContain('\\draw[<-,');
  });
  it('exports the third potentiometer terminal with a real wiper connection', () => {
    const c = createComponent('potentiometer', { x: 0, y: 0 });
    expect(exportTikz({ version: 1, title: 'x', objects: [c] })).toContain(
      '(0,1) -- (dcComponent0.wiper)',
    );
  });
  it('builds a portable standalone without mandatory custom fonts', () => {
    const code = exportStandalone(demoDocument());
    expect(code).toContain('\\documentclass[tikz,border=5pt]{standalone}');
    expect(code).toContain('\\usepackage{circuitikz}');
    expect(code).toContain('\\ifPDFTeX');
    expect(code).toContain('\\IfFontExistsTF{Comic Sans MS}');
    expect(code.trim().endsWith('\\end{document}')).toBe(true);
  });
  it('exports without font choices or bundled handwritten fonts', () => {
    expect(exportStandalone(demoDocument())).not.toContain('Kalam');
  });
  it('preserves subscripts and escapes ordinary LaTeX punctuation', () => {
    expect(texText('r_{AB}')).toBe('$r_{AB}$');
    expect(texText('maglia 1')).toBe('maglia 1');
    expect(escapeTex('50% & #1')).toBe('50\\% \\& \\#1');
    expect(texText('r_{AB', true)).toBe(escapeTex('r_{AB'));
  });
  it.each(['R__1', 'R_1_2', 'R_{a_}', 'R_\\]', 'R^1^2'])(
    'preserves invalid math as compilable literal text: %s',
    (text) => {
      expect(texText(text, true)).toBe(escapeTex(text));
    },
  );
  it('preserves valid nested scripts and both scripts on the same base', () => {
    expect(texText('R_\\{', true)).toBe('$R_\\{$');
    expect(texText('R_{a_1}^{b^2}', true)).toBe('$R_{a_1}^{b^2}$');
    expect(texText('R_1^2+\\alpha_{AB}', true)).toBe('$R_1^2+\\alpha_{AB}$');
  });
  it.each(['pnp', 'pmos', 'pjfet'] as const)(
    'mirrors native %s locally after its rotation',
    (type) => {
      for (const rotation of [0, 90, 180, 270] as const) {
        const component = { ...createComponent(type, { x: 0, y: 0 }), rotation };
        const code = exportTikz({ version: 1, title: 'x', objects: [component] });
        expect(code).toContain(`rotate=${-rotation}, scale=0.7, yscale=-1, transform shape`);
      }
    },
  );
});
