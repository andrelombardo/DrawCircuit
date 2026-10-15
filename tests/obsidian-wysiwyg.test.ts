/// <reference types="vite/client" />
import { exportObsidian } from './helpers/unoptimizedObsidian';
import { describe, expect, it } from 'vitest';
import { componentTypes, COLORS, type CircuitDocument } from '../src/model/types';
import { createComponent } from '../src/model/catalog';
import { emptyDocument } from '../src/model/demo';
import { circuitPresets } from '../src/presets/registry';
import { instantiatePreset } from '../src/presets/instantiate';
import { exportTikz } from '../src/tikz/exporter';
import { canvasArrowHead, chevron } from '../src/tikz/arrowheads';
import { canvasTextTikz, xmlText } from '../src/tikz/canvasText';
import {
  CANVAS_UNITS_PER_CM,
  editorToCm,
  editorToPt,
  editorFontSizeToTikz,
} from '../src/tikz/units';
const fixtures = import.meta.glob<string>(
  '../docs/obsidian-wysiwyg/evidence/*.{md,svg,json,tikz}',
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
);
const evidence = (name: string) => fixtures[`../docs/obsidian-wysiwyg/evidence/${name}`];
const doc = (count: number): CircuitDocument => ({
  version: 1,
  title: 'scale',
  objects: Array.from({ length: count }, (_, i) => ({
    ...createComponent('resistor', { x: i * 120, y: 0 }),
    id: `r-${i}`,
    label: { text: '', offset: { x: 0, y: -30 }, rotation: 0, fontSize: 22, color: COLORS.blue },
  })),
});
const draws = (code: string) => code.split('\n').filter((l) => /^\\(?:draw|fill)\[/.test(l));
describe('Obsidian canvas fidelity', () => {
  it('uses one deterministic conversion for coordinates, stroke, radii and fonts', () => {
    expect(editorToPt(1)).toBe(0.75);
    expect(editorToPt(2)).toBe(1.5);
    expect(editorToPt(4.5)).toBe(3.375);
    expect(editorFontSizeToTikz(22)).toBeCloseTo(16.5);
    expect(editorToCm(80) * CANVAS_UNITS_PER_CM).toBe(80);
  });
  it.each([1, 5, 200])(
    'keeps the same resistor body and stroke in a circuit with %i resistors',
    (count) => {
      const code = exportObsidian(doc(count));
      expect(draws(code).slice(0, 2)).toEqual(draws(exportObsidian(doc(1))));
      expect(code).not.toMatch(/resizebox|bipoles\/length|to\[R/);
      expect(code.match(/-- cycle;/g)).toHaveLength(count);
    },
  );
  it.each(componentTypes)('preserves the raw CircuitikZ output byte for byte: %s', (type) => {
    const i = componentTypes.indexOf(type);
    const snapshot = JSON.parse(evidence('raw-before.json'));
    const circuit: CircuitDocument = {
      version: 1,
      title: type,
      objects: [0, 90, 180, 270].map((rotation, j) => ({
        ...createComponent(type, { x: j * 130, y: i * 130 }),
        id: type + '-' + rotation,
        rotation: rotation as 0 | 90 | 180 | 270,
      })),
    };
    expect(exportTikz(circuit)).toBe(snapshot[i]);
  });
  it('preserves the raw export of wires, nodes, labels, curved arrows and loops byte for byte', () => {
    expect(exportTikz(JSON.parse(evidence('golden.json')))).toBe(
      evidence('raw-golden-before.tikz'),
    );
  });
  it.each(circuitPresets)('exports preset $id through the same canvas pipeline', (preset) => {
    const source = {
      ...emptyDocument(),
      objects: instantiatePreset(preset, { x: 0, y: 0 }, 0, emptyDocument()),
    };
    const before = JSON.stringify(source);
    const code = exportObsidian(source);
    expect(code).not.toMatch(/to\[|bipoles\/length|transform shape/);
    expect(code.match(/% Component:/g)).toHaveLength(preset.components.length);
    expect(JSON.stringify(source)).toBe(before);
  });
  it.each([
    'resistor',
    'capacitor',
    'inductor',
    'currentSource',
    'voltageSource',
    'diode',
    'ground',
    'opAmp',
    'variableResistor',
    'transformer',
  ] as const)('matches the geometry compiled by the actual Obsidian engine: %s', (type) => {
    const source: CircuitDocument = {
      version: 1,
      title: type,
      objects: [0, 90, 180, 270].map((rotation, i) => ({
        ...createComponent(type, { x: 80 + i * 160, y: 80 }),
        id: `${type}-${rotation}`,
        rotation: rotation as 0 | 90 | 180 | 270,
        label: { text: '', offset: { x: 0, y: 0 }, fontSize: 22, color: COLORS.blue, rotation: 0 },
      })),
    };
    expect(draws(exportObsidian(source))).toEqual(draws(evidence(`${type}.md`)));
    const result = JSON.parse(evidence(`${type}.svg.result.json`));
    expect(result.ok).toBe(true);
    expect(result.plugin).toBe('Inline TikZ');
    expect(evidence(`${type}.svg`)).not.toMatch(/##|NaN|Infinity/);
  });
  it('matches rendered bounds of the principal components within 0.12 editor units', () => {
    const metrics = JSON.parse(evidence('visual-metrics.json'));
    expect(metrics.pass).toBe(true);
    expect(metrics.rows).toHaveLength(10);
    for (const row of metrics.rows) expect(row.error).toBeLessThan(0.12);
  });
  it('preserves label positions, Comic Sans, weight and style in the compiled golden circuit', () => {
    const metrics = JSON.parse(evidence('label-metrics.json'));
    expect(metrics.pass).toBe(true);
    expect(metrics.labelPositions).toHaveLength(19);
    for (const label of metrics.labelPositions) {
      expect(label.error).toBeLessThan(0.02);
      expect(label.font).toContain('Comic Sans MS');
      expect(label.weight).toBe('400');
      expect(label.style).toBe('normal');
    }
  });
  it('compiles all 72 canvas symbols at every orientation with the installed renderer', () => {
    const result = JSON.parse(evidence('catalog.svg.result.json'));
    expect(result.ok).toBe(true);
    expect(evidence('catalog.md').match(/% Component:/g)).toHaveLength(72 * 4);
    expect(evidence('catalog.svg')).not.toMatch(/NaN|Infinity|##|<image/);
  });
  it('keeps Comic Sans, mathematical source and real subscripts in the compiled font fixture', () => {
    const svg = evidence('fonts.svg');
    const code = evidence('fonts.md');
    expect(svg).toContain('Comic Sans MS');
    expect(svg).not.toMatch(/cmr10|cmmi10|##/);
    for (const source of [
      'r_{AB}',
      'r_{AC}',
      'r_{BC}',
      'r_{AD}',
      'r_{BD}',
      'r_{CD}',
      'R_1',
      'R_2',
      'R_3',
      'R_4',
      'I_1',
      'L_1',
      'i_1',
    ])
      expect(code).toContain(`$${source}$`);
    expect(code).toContain('$50 \\Omega$');
    expect(code).not.toContain('\\ohm');
    expect(svg).toContain('font-size="15.4"');
    expect(svg).toContain('font-size="22"');
    expect(svg).not.toContain('font-style="italic"');
    expect(code).toContain('\\sffamily');
    expect(code).not.toContain('fontspec');
    expect(svg).toContain('matrix(0 .75 -.75 0');
    expect(svg).toContain('matrix(0 -.75 .75 0');
    expect(svg).toContain('prima');
    expect(svg).toContain('seconda');
  });
  it('keeps SVG payload inert in TeX and includes rotated measured bounds', () => {
    expect(xmlText('%#{}\\$&')).toBe('&#37;&#35;&#123;&#125;&#92;&#36;&#38;');
    const lines = canvasTextTikz(
      {
        svg: '<text>&#65;</text>',
        alignWidth: 20,
        bounds: { x: -10, y: -8, width: 20, height: 16 },
      },
      'A',
      { x: 100, y: 80 },
      '#DF4949',
      'dcColor0',
      22,
      90,
      'middle',
      (p) => `(${p.x},${p.y})`,
    );
    expect(lines[0]).toContain('(108,70)');
    expect(lines[1]).toContain('rotate=-90');
    expect(lines[1]).toContain('minimum size=0pt');
    expect(lines[1]).toContain('\\string#');
    expect(lines[1]).toContain('font=\\fontsize{16.5}');
  });
  it.each([
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: 3, y: 4 },
  ])('matches the fixed SVG chevron dimensions at tangent %j', (tangent) => {
    const tip = { x: 100, y: 40 };
    const [a, t, b] = chevron(tip, tangent);
    expect(t).toEqual(tip);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(7);
    expect(Math.hypot((a.x + b.x) / 2 - tip.x, (a.y + b.y) / 2 - tip.y)).toBeCloseTo(8);
  });
  it('uses the first nonzero cubic tangent for a reversed arrow with coincident controls', () => {
    const head = canvasArrowHead({
      kind: 'arrow',
      id: 'a',
      type: 'curve',
      start: { x: 0, y: 0 },
      end: { x: 80, y: 20 },
      controlPoints: [
        { x: 0, y: 0 },
        { x: 0, y: 40 },
      ],
      reversed: true,
      width: 9,
      color: COLORS.red,
    });
    expect(head).toEqual([
      { x: 3.5, y: 8 },
      { x: 0, y: 0 },
      { x: -3.5, y: 8 },
    ]);
  });
});
