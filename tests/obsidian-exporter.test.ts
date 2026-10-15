import { exportObsidian } from './helpers/unoptimizedObsidian';
import { describe, expect, it } from 'vitest';
import { componentRegistry, createComponent } from '../src/model/catalog';
import { demoDocument } from '../src/model/demo';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import { componentTypes, COLORS } from '../src/model/types';
import type {
  ArrowAnnotation,
  CircuitDocument,
  CircuitObject,
  LoopArrow,
  Point,
  TextAnnotation,
  Wire,
} from '../src/model/types';
import { escapeTex, exportStandalone, exportTikz, tikzCoordinate } from '../src/tikz/exporter';
import { svgPathToTikz } from '../src/tikz/symbolGeometry';
import { normalizeHex } from '../src/tikz/validation';
import { loopGeometry } from '../src/utils/loops';
import { CANVAS_UNITS_PER_CM, editorToCm, formatNumber } from '../src/tikz/units';
const cc = (x: number, y: number) =>
  `(${formatNumber(editorToCm(x))},${formatNumber(-editorToCm(y))})`;

const document = (...objects: CircuitObject[]): CircuitDocument => ({
  version: 1,
  title: 'Export test',
  objects,
});
const text = (value: string, extra: Partial<TextAnnotation> = {}): TextAnnotation => ({
  kind: 'text',
  id: 'text',
  x: 0,
  y: 0,
  text: value,
  color: COLORS.ink,
  fontSize: 22,
  rotation: 0,
  align: 'middle',
  ...extra,
});
const wire = (start: Point, end: Point, extra: Partial<Wire> = {}): Wire => ({
  kind: 'wire',
  id: 'wire',
  startEndpoint: { kind: 'free', point: start },
  endEndpoint: { kind: 'free', point: end },
  vertices: [],
  width: 2,
  color: COLORS.ink,
  ...extra,
});
const arrow = (extra: Partial<ArrowAnnotation> = {}): ArrowAnnotation => ({
  kind: 'arrow',
  id: 'arrow',
  type: 'straight',
  start: { x: -40, y: 40 },
  end: { x: 80, y: 40 },
  controlPoints: [
    { x: 0, y: -40 },
    { x: 40, y: 80 },
  ],
  color: COLORS.red,
  width: 2,
  reversed: false,
  ...extra,
});

function assertStructure(code: string) {
  expect(code.startsWith('```tikz\n')).toBe(true);
  expect(code.endsWith('\n```')).toBe(true);
  for (const required of [
    '\\usepackage{circuitikz}',
    '\\begin{document}',
    '\\begin{circuitikz}',
    '\\end{circuitikz}',
    '\\end{document}',
  ])
    expect(code.split(required)).toHaveLength(2);
  expect(code).not.toMatch(/undefined|NaN|Infinity|name=\s*[,\]]|=\s*[,\]]|,\s*\]/);
  const definitions = [...code.matchAll(/\\definecolor\{(dcColor\d+)\}\{HTML\}\{([A-F0-9]{6})\}/g)];
  expect(new Set(definitions.map((match) => match[2])).size).toBe(definitions.length);
  for (const name of code.match(/dcColor\d+/g) ?? [])
    expect(definitions.some((match) => match[1] === name)).toBe(true);
  for (const match of definitions)
    expect(code.indexOf(match[0])).toBeLessThan(code.indexOf('\\begin{circuitikz}'));
  for (const line of code.split('\n').filter((line) => /^\\(?:draw|fill|node)\b/.test(line))) {
    expect(line.endsWith(';')).toBe(true);
    expect(line).not.toMatch(/^\\draw\[[^\]]*\]\s*\([^)]*\);$/);
    // Ignore escaped literal braces and the coordinate-axis comment.
    const tokens = line.match(/\\[^a-zA-Z]|[{}]/g) ?? [];
    let depth = 0;
    for (const token of tokens) {
      if (token === '{') depth++;
      if (token === '}') depth--;
      expect(depth).toBeGreaterThanOrEqual(0);
    }
    expect(depth).toBe(0);
    const options = line.match(/^\\(?:draw|fill|node)\[([^\]]*)\]/)?.[1];
    expect(options).toBeDefined();
    expect(options).not.toMatch(/\[|,\s*$|=\s*$|,,/);
  }
}

describe('Obsidian export uses the shared TikZ generator', () => {
  it('exports a real resistor with a complete pasteable Markdown wrapper', () => {
    const c = createComponent('resistor', { x: 40, y: 0 });
    c.label.text = '';
    const doc = document(c);
    const code = exportObsidian(doc);
    assertStructure(code);
    expect(code).toContain(`${cc(0, 0)} -- ${cc(20, 0)}`);
    expect(code).toContain(
      `${cc(20, -9)} -- ${cc(60, -9)} -- ${cc(60, 9)} -- ${cc(20, 9)} -- cycle`,
    );
    expect(code).not.toMatch(
      /to\[R|bipoles\/length|documentclass|fontspec|inputenc|fontenc|amsmath|amssymb/,
    );
  });
  it('keeps multiple resistors and independent labels with exact canvas bodies', () => {
    const doc = document(
      ...[1, 2, 3].map((i) => createComponent('resistor', { x: i * 120, y: 0 }, i)),
    );
    const code = exportObsidian(doc);
    assertStructure(code);
    expect(code.match(/% Component: resistor/g)).toHaveLength(3);
    expect(code).not.toContain('to[R');
    for (const i of [1, 2, 3]) expect(code).toContain(`{$R_${i}$}`);
  });
  it('preserves routed wires, negative coordinates and deterministic scale', () => {
    const doc = document(wire({ x: -80, y: -140 }, { x: 60.0000000004, y: 0 }));
    const code = exportObsidian(doc);
    assertStructure(code);
    expect(code).toContain(`${cc(-80, -140)} -- ${cc(0, -140)} -- ${cc(0, 0)} -- ${cc(60, 0)};`);
    expect(tikzCoordinate({ x: 80.0000000004, y: 49.3824 })).toBe('(2,-1.2346)');
  });
  it('defines only used colors and normalizes case and shorthand without duplicates', () => {
    const c = createComponent('resistor', { x: 0, y: 0 });
    c.label.text = '';
    c.color = '#aBc';
    c.label.color = '#DF4949';
    const code = exportObsidian(
      document(c, text('A', { color: '#AABBCC' }), text('', { id: 'empty', color: '#123456' })),
    );
    assertStructure(code);
    expect(code.match(/\\definecolor/g)).toHaveLength(1);
    expect(code).toContain('\\definecolor{dcColor0}{HTML}{AABBCC}');
    expect(code).not.toMatch(/DF4949|123456/);
  });
  it.each(['$R_1$', '$V_{AB}$', '$50\\,\\Omega$', '50 \\ohm', '\\frac{R_1}{R_2}'])(
    'preserves mathematical source and the existing electrical alias: %s',
    (source) => {
      const code = exportObsidian(document(text(source)));
      assertStructure(code);
      const value = source.replace('\\ohm', '\\Omega');
      expect(code).toContain(`{${value.startsWith('$') ? value : `$${value}$`}};`);
    },
  );
  it('keeps custom plain text unchanged apart from required TeX escaping', () => {
    const source = 'Ingresso 50% & #1 _ {custom} ~ ^ \\ sconosciuto';
    const code = exportObsidian(document(text(source)));
    assertStructure(code);
    expect(code).toContain(`{${escapeTex(source)}};`);
  });
  it.each(['%', '&', '#', '_', '{', '}', '$', '^', '~', '\\'])(
    'escapes the ordinary special character %s',
    (source) => {
      const code = exportObsidian(document(text(source)));
      assertStructure(code);
      expect(code).toContain(`{${escapeTex(source)}};`);
    },
  );
  it('preserves multiline text alignment, line positions and rotation', () => {
    const code = exportObsidian(
      document(text('prima\n\nterza', { x: -80, y: 40, rotation: 90, align: 'end', fontSize: 20 })),
    );
    assertStructure(code);
    expect(code.match(/\\node\[/g)).toHaveLength(2);
    expect(code).toContain('anchor=east, inner sep=0pt, rotate=-90');
    expect(code).toContain(`at ${cc(-80, 40)} {prima};`);
    expect(code).toContain(`at ${cc(-134, 40)} {terza};`);
  });
  it.each([false, true])('keeps straight and curved arrow direction (reversed=%s)', (reversed) => {
    const code = exportObsidian(
      document(arrow({ reversed }), arrow({ id: 'curve', type: 'curve', reversed })),
    );
    assertStructure(code);
    expect(code).not.toMatch(/\\draw\[(?:->|<-)/);
    expect(code.match(/\\draw\[/g)).toHaveLength(4);
    expect(code).toContain(`${cc(-40, 40)} -- ${cc(80, 40)};`);
    expect(code).toContain(
      `${cc(-40, 40)} .. controls ${cc(0, -40)} and ${cc(40, 80)} .. ${cc(80, 40)};`,
    );
  });
  it('keeps the legacy circular arc geometry and its signed 310 degree sweep', () => {
    const code = exportObsidian(
      document(arrow({ type: 'arc', start: { x: -40, y: 0 }, end: { x: 40, y: 0 } })),
    );
    assertStructure(code);
    expect(code).toContain(
      `${cc(20, -20 * Math.sqrt(3))} arc[start angle=60, end angle=-250, radius=${formatNumber(editorToCm(40))}cm];`,
    );
  });
  it.each(['clockwise', 'counterclockwise'] as const)(
    'preserves elliptical arc endpoints, radii and %s direction after angle normalization',
    (direction) => {
      for (const arrowPosition of [0, 0.25, 0.9, 1.25, -0.25]) {
        const loop: LoopArrow = {
          kind: 'loop-arrow',
          id: 'loop',
          x: -80,
          y: 40,
          width: 160,
          height: 80,
          strokeWidth: 2,
          color: COLORS.blue,
          direction,
          arrowPosition,
        };
        const code = exportObsidian(document(loop));
        assertStructure(code);
        const g = loopGeometry(loop);
        expect(code).toContain(cc(g.start.x, g.start.y));
        const match = code.match(/start angle=([-\d.]+), end angle=([-\d.]+)/)!;
        const start = Number(match[1]),
          end = Number(match[2]);
        expect(end - start).toBe(direction === 'clockwise' ? -324 : 324);
        expect(end).toBeGreaterThanOrEqual(0);
        expect(end).toBeLessThan(360);
        expect(code).toContain(
          `x radius=${formatNumber(editorToCm(80))}cm, y radius=${formatNumber(editorToCm(40))}cm`,
        );
        // Reconstruct the actual TikZ end point on the ellipse, including the Y inversion.
        expect(
          loop.x + loop.width / 2 + (loop.width / 2) * Math.cos((end * Math.PI) / 180),
        ).toBeCloseTo(g.end.x, 7);
        expect(
          loop.y + loop.height / 2 - (loop.height / 2) * Math.sin((end * Math.PI) / 180),
        ).toBeCloseTo(g.end.y, 7);
      }
    },
  );
  it('exports the mixed demo circuit including all object kinds in existing drawing order', () => {
    const doc = demoDocument();
    const c = createComponent('ground', { x: 80, y: 240 });
    doc.objects.push(c);
    const code = exportObsidian(doc);
    assertStructure(code);
    expect(code).toContain('% Component: ground');
    expect(code).not.toContain('node[ground,');
    expect(code).toContain('\\fill[');
    expect(code).toContain('$r_{AB}$');
    expect(code.indexOf('\\draw[')).toBeLessThan(code.indexOf('% Component:'));
    expect(code.indexOf('\\fill[')).toBeLessThan(code.indexOf('{$r_{AB}$}'));
  });
  it('exports an empty circuit with no color definitions or drawing instructions', () => {
    const code = exportObsidian(document());
    assertStructure(code);
    expect(code).not.toMatch(/\\definecolor|\\draw|\\node|\\fill/);
  });
  it('omits a single-point wire, coincident routes and their unused colors', () => {
    const point = { x: -160, y: -140 };
    const code = exportObsidian(
      document(wire(point, point, { color: '#123456', vertices: [point, point] })),
    );
    assertStructure(code);
    expect(code).not.toMatch(/\\draw|\\definecolor/);
  });
  it('removes repeated object IDs and duplicate wire geometry', () => {
    const c = createComponent('resistor', { x: 0, y: 0 });
    const w = wire({ x: -80, y: 0 }, { x: -40, y: 0 });
    const code = exportObsidian(
      document(c, c, w, { ...w, id: 'duplicate-wire', color: '#171A20' }),
    );
    assertStructure(code);
    expect(code.match(/% Component: resistor/g)).toHaveLength(1);
    expect(code.split(`${cc(-80, 0)} -- ${cc(-40, 0)};`)).toHaveLength(2);
  });
  it.each([NaN, Infinity, -Infinity, undefined])(
    'rejects non-finite coordinates (%s) without losing valid objects',
    (value) => {
      const valid = createComponent('resistor', { x: -80, y: 40 });
      const invalid = {
        ...createComponent('capacitor', { x: 0, y: 0 }),
        x: value,
      } as CircuitObject;
      const invalidWire = wire(
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { vertices: [{ x: value as number, y: 20 }] },
      );
      const code = exportObsidian(document(valid, invalid, invalidWire));
      assertStructure(code);
      expect(code).toContain('% Component: resistor');
      expect(code).not.toContain('% Component: capacitor');
      expect(code.match(/\\draw\[/g)).toHaveLength(2);
    },
  );
  it('skips unknown components, missing terminals, dangling wires and invalid colors', () => {
    const c = createComponent('resistor', { x: 0, y: 0 });
    const doc = document(
      { ...c, id: 'unknown', type: 'unknown' } as unknown as CircuitObject,
      { ...c, id: 'missing-pins', terminals: [] },
      { ...c, id: 'bad-color', color: 'red, name=' },
      wire(
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { startEndpoint: { kind: 'terminal', componentId: 'absent', terminalId: 'a' } },
      ),
      text('ok'),
    );
    const code = exportObsidian(doc);
    assertStructure(code);
    expect(code).not.toMatch(/\\draw|% Component:/);
    expect(code).toContain('{ok};');
  });
  it('omits an invalid label while retaining the valid component body', () => {
    const c = createComponent('resistor', { x: 0, y: 0 });
    c.label.offset.x = NaN;
    const code = exportObsidian(document(c));
    assertStructure(code);
    expect(code).toContain('% Component: resistor');
    expect(code).not.toContain('\\node[');
    expect(code.match(/\\definecolor/g)).toHaveLength(1);
  });
  it.each(componentTypes)(
    'uses canvas geometry for %s at all four rotations and preserves native raw mappings',
    (type) => {
      for (const rotation of [0, 90, 180, 270] as const) {
        const c = { ...createComponent(type, { x: -80.5, y: 40.25 }), rotation };
        const doc = document(c);
        const code = exportObsidian(doc);
        assertStructure(code);
        const mapping = componentRegistry[type].tikz;
        const raw = exportTikz(doc);
        if (mapping.kind === 'geometry') expect(raw).toContain(mapping.reason);
        else
          expect(raw).toContain(`${mapping.kind === 'bipole' ? 'to' : 'node'}[${mapping.symbol}`);
        expect(code).not.toMatch(/to\[|bipoles\/length|transform shape/);
        expect(code).toContain(`line width=1.5pt`);
        expect(CANVAS_UNITS_PER_CM).toBeGreaterThan(37);
        expect(code).toContain(`% Component: ${type}`);
      }
    },
  );
  it.each([
    ['\\text{valore}', 'amsmath'],
    ['\\dfrac{1}{2}', 'amsmath'],
    ['\\begin{aligned}R_1 &= R_2\\end{aligned}', 'amsmath'],
    ['\\mathbb{R}', 'amsfonts'],
    ['\\therefore R_1', 'amssymb'],
  ])('loads the extra package required by %s', (source, name) => {
    const code = exportObsidian(document(text(source)));
    assertStructure(code);
    expect(code).toContain(`\\usepackage{${name}}`);
    expect(code.indexOf(`\\usepackage{${name}}`)).toBeLessThan(code.indexOf('\\begin{document}'));
  });
  it('does not load AMS fonts twice when the symbol package already supplies them', () => {
    const code = exportObsidian(document(text('\\mathbb{R} \\therefore R_1')));
    assertStructure(code);
    expect(code).toContain('\\usepackage{amssymb}');
    expect(code).not.toContain('\\usepackage{amsfonts}');
  });
  it('keeps raw and standalone formats and leaves JSON and the document unchanged', () => {
    const doc = deserializeDocument(serializeDocument(demoDocument()));
    const snapshot = structuredClone(doc);
    const saved = serializeDocument(doc);
    const raw = exportTikz(doc),
      standalone = exportStandalone(doc),
      obsidian = exportObsidian(doc);
    expect(raw).not.toMatch(/```|\\usepackage|\\begin\{document\}|\\end\{document\}/);
    expect(standalone).toContain(raw);
    expect(obsidian).not.toContain(raw);
    expect(obsidian).not.toContain('bipoles/length');
    expect(standalone).toContain('\\documentclass[tikz,border=5pt]{standalone}');
    expect(doc).toEqual(snapshot);
    expect(serializeDocument(doc)).toBe(saved);
    expect(deserializeDocument(saved)).toEqual(snapshot);
  });
});

describe('export path and color sanitation', () => {
  it.each(['', ' ', 'M0 0', 'M0 0L0 0', 'M0 0H0V0Z', 'M0 0C0 0 0 0 0 0', 'M0 0Q0 0 0 0'])(
    'discards empty and geometrically empty paths: %s',
    (path) => expect(svgPathToTikz(path, tikzCoordinate)).toBe(''),
  );
  it('drops empty subpaths while keeping real segments and closed Bézier loops', () => {
    expect(svgPathToTikz('M0 0M40 0L80 0M120 0', tikzCoordinate)).toBe('(1,0) -- (2,0)');
    expect(svgPathToTikz('M0 0C40 0 40 40 0 0Z', tikzCoordinate)).toBe(
      '(0,0) .. controls (1,0) and (1,-1) .. (0,0) -- cycle',
    );
  });
  it('keeps visible one-position symbols and nodes while removing empty fallback shapes', () => {
    const definition = componentRegistry.port;
    const original = definition.shapes;
    try {
      definition.shapes = [
        { kind: 'path', d: '' },
        { kind: 'path', d: 'M0 0' },
        { kind: 'circle', x: 0, y: 0, r: 4 },
        { kind: 'text', x: 0, y: 0, text: 'P', size: 20 },
      ];
      const code = exportObsidian(document(createComponent('port', { x: 0, y: 0 })));
      assertStructure(code);
      expect(code.match(/\\draw\[/g)).toHaveLength(1);
      expect(code).toContain('circle (');
      expect(code).toContain('{P};');
    } finally {
      definition.shapes = original;
    }
  });
  it.each(['M', 'M0 NaN', 'M0 0LInfinity 0', 'M0 0A1 1 0 0 0 1 1'])(
    'rejects malformed authored geometry: %s',
    (path) => expect(() => svgPathToTikz(path, tikzCoordinate)).toThrow(),
  );
  it.each([
    ['#171a20', '171A20'],
    ['171A20', '171A20'],
    [' #aBc ', 'AABBCC'],
    ['undefined', null],
    ['#gggggg', null],
    ['', null],
  ])('normalizes HEX %s safely', (color, expected) => expect(normalizeHex(color!)).toBe(expected));
});
