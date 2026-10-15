import { exportObsidian } from './helpers/unoptimizedObsidian';
import { describe, expect, it } from 'vitest';
import { createComponent } from '../src/model/catalog';
import { createJunction, createTextAnnotation, createWire } from '../src/model/factories';
import type { CircuitDocument, CircuitObject, Wire } from '../src/model/types';
import { getExportSelection } from '../src/tikz/selection';
import { exportTikz } from '../src/tikz/exporter';
import { exportSVG } from '../src/svg/exporter';
import {
  createCurrent,
  createElectrical,
  createPolarity,
  electricalDrawingGeometry,
} from '../src/annotations/electrical';
import { wirePoints } from '../src/utils/geometry';
import { instantiatePreset } from '../src/presets/instantiate';
import { circuitPresets } from '../src/presets/registry';
import { createPersonalBlock, instantiatePersonalBlock } from '../src/personalBlocks/library';
import { serializeDocument } from '../src/model/serialization';
const doc = (objects: CircuitObject[]): CircuitDocument => ({
  version: 1,
  title: 'Selection closure',
  objects,
});
const resistor = (id: string, x: number) => {
  const c = createComponent('resistor', { x, y: 0 });
  return { ...c, id, label: { ...c.label, text: id } };
};
const pin = (componentId: string, terminalId = 'b') => ({
  kind: 'terminal' as const,
  componentId,
  terminalId,
});
const node = (junctionId: string) => ({ kind: 'junction' as const, junctionId });
const ids = (d: CircuitDocument) => d.objects.map((o) => o.id);
function fixture() {
  const a = resistor('R1', 0),
    b = resistor('R2', 240),
    c = resistor('R3', 520),
    j = { ...createJunction({ x: 140, y: 0 }, 'J'), id: 'J' },
    branch = { ...createJunction({ x: 140, y: 140 }, 'OUT'), id: 'OUT' },
    wires = [
      createWire(pin(a.id), node(j.id)),
      createWire(node(j.id), pin(b.id, 'a')),
      createWire(pin(b.id), pin(c.id, 'a')),
      createWire(node(j.id), node(branch.id)),
      createWire(node(branch.id), pin(c.id, 'b')),
    ];
  const source = doc([a, b, c, j, branch, ...wires]);
  const current = createCurrent(wires[0], { x: 80, y: 0 }, source);
  const polarity = createPolarity(b)!;
  const note = { ...createTextAnnotation({ x: 260, y: 180 }), id: 'note', text: 'independent' };
  const arrow: CircuitObject = {
    kind: 'arrow',
    id: 'arrow',
    type: 'straight',
    start: { x: 30, y: 200 },
    end: { x: 140, y: 200 },
    controlPoints: [
      { x: 30, y: 200 },
      { x: 140, y: 200 },
    ],
    reversed: false,
    color: '#171a20',
    width: 2,
  };
  const loop: CircuitObject = {
    kind: 'loop-arrow',
    id: 'loop',
    x: 60,
    y: 80,
    width: 140,
    height: 80,
    direction: 'clockwise',
    arrowPosition: 0.25,
    color: '#171a20',
    strokeWidth: 2,
  };
  const voltage = {
    ...createElectrical('voltage', { x: 0, y: 300 }, { x: 280, y: 300 }, 'V_{AB}'),
    id: 'voltage',
  };
  return {
    source: doc([...source.objects, current, polarity, note, arrow, loop, voltage]),
    a,
    b,
    c,
    j,
    branch,
    wires,
    current,
    polarity,
    note,
    arrow,
    loop,
    voltage,
  };
}
describe('selection export closure A–H', () => {
  it('A: exports R2 alone with its owned LaTeX label and attached polarity', () => {
    const f = fixture();
    f.b.label.text = 'R_{AC}';
    const subset = getExportSelection(f.source, [f.b.id]);
    expect(ids(subset)).toEqual([f.b.id, f.polarity.id]);
    expect(exportTikz(subset)).toContain('R_{AC}');
    expect(exportObsidian(subset)).toContain('% Component: resistor');
    expect(exportSVG(subset)).toContain('<g transform=');
  });
  it('B/E: closes the internal connection through a Junction without adding external branches', () => {
    const f = fixture(),
      subset = getExportSelection(f.source, [f.a.id, f.b.id, f.wires[0].id]);
    expect(new Set(ids(subset))).toEqual(
      new Set([f.a.id, f.b.id, f.j.id, f.wires[0].id, f.wires[1].id, f.current.id, f.polarity.id]),
    );
    expect(ids(subset)).not.toContain(f.c.id);
    expect(ids(subset)).not.toContain(f.branch.id);
    for (const w of subset.objects.filter((o): o is Wire => o.kind === 'wire'))
      expect(wirePoints(w, subset)).toHaveLength(2);
  });
  it('automatically closes multi-Junction chains and ignores dangling Junction leaves', () => {
    const f = fixture(),
      j2 = { ...createJunction({ x: 180, y: 0 }, 'J2'), id: 'J2' };
    const middle = createWire(node(f.j.id), node(j2.id));
    f.wires[1].startEndpoint = node(j2.id);
    f.source.objects.push(j2, middle);
    const subset = getExportSelection(f.source, [f.a.id, f.b.id]);
    for (const id of [f.a.id, f.b.id, f.j.id, j2.id, middle.id, f.wires[0].id, f.wires[1].id])
      expect(ids(subset)).toContain(id);
    expect(ids(subset)).not.toContain(f.branch.id);
  });
  it('does not bridge through an unselected component or geometrical crossings', () => {
    const f = fixture(),
      crossing = createWire(
        { kind: 'free', point: { x: 110, y: -100 } },
        { kind: 'free', point: { x: 110, y: 100 } },
      );
    f.source.objects.push(crossing);
    const subset = getExportSelection(f.source, [f.a.id]);
    expect(ids(subset)).toEqual([f.a.id]);
  });
  it('C: model IDs from equivalent manual and box selections produce identical output, regardless of order or duplicates', () => {
    const f = fixture(),
      manual = [f.a.id, f.b.id, f.j.id],
      box = [f.j.id, f.b.id, f.a.id, f.a.id];
    expect(getExportSelection(f.source, manual)).toEqual(getExportSelection(f.source, box));
    expect(exportTikz(getExportSelection(f.source, manual))).toBe(
      exportTikz(getExportSelection(f.source, box)),
    );
  });
  it('preserves selected external wires exactly, detaching only absent terminal references', () => {
    const f = fixture(),
      subset = getExportSelection(f.source, [f.wires[2].id]);
    const w = subset.objects.find((o): o is Wire => o.kind === 'wire')!;
    expect(w.startEndpoint.kind).toBe('free');
    expect(w.endEndpoint.kind).toBe('free');
    const before = wirePoints(f.wires[2], f.source),
      after = wirePoints(w, subset);
    expect(after[1].x - after[0].x).toBe(before[1].x - before[0].x);
  });
  it('F: includes each independently selected annotation and keeps unselected independent annotations out', () => {
    const f = fixture();
    for (const o of [f.arrow, f.loop, f.voltage, f.note])
      expect(ids(getExportSelection(f.source, [o.id]))).toEqual([o.id]);
    const subset = getExportSelection(f.source, [f.a.id, f.b.id]);
    for (const o of [f.arrow, f.loop, f.voltage, f.note]) expect(ids(subset)).not.toContain(o.id);
  });
  it('detaches a selected current annotation from an excluded wire, preserving rendered length and direction', () => {
    const f = fixture(),
      subset = getExportSelection(f.source, [f.current.id]);
    const o = subset.objects[0];
    expect(o).toMatchObject({ wireId: undefined, componentId: undefined, offset: { x: 0, y: 0 } });
    if (o.kind !== 'electrical') throw new Error('Missing current');
    const a = electricalDrawingGeometry(f.current, f.source),
      b = electricalDrawingGeometry(o, subset);
    expect(b.end.x - b.start.x).toBeCloseTo(a.end.x - a.start.x);
    expect(b.end.y - b.start.y).toBeCloseTo(a.end.y - a.start.y);
  });
  it('G: no preset or personal-block object is omitted from a complete block selection', () => {
    for (const preset of circuitPresets) {
      const objects = instantiatePreset(preset, { x: 1000, y: 900 }, 90, doc([])),
        source = doc(objects);
      const subset = getExportSelection(source, ids(source));
      expect(ids(subset)).toEqual(ids(source));
      const block = createPersonalBlock(source, ids(source), preset.name);
      const pasted = doc(instantiatePersonalBlock(block, { x: 400, y: 600 }, 180, doc([])));
      expect(ids(getExportSelection(pasted, ids(pasted)))).toEqual(ids(pasted));
    }
  });
  it('H: all three formats export the same subset for ten different selections without changing source data', () => {
    const f = fixture(),
      original = serializeDocument(f.source);
    const sets = [
      [f.b.id],
      [f.a.id, f.b.id],
      [f.a.id, f.b.id, f.j.id],
      [f.loop.id],
      [f.arrow.id],
      [f.current.id],
      [f.voltage.id],
      [f.c.id, f.wires[2].id],
      [f.a.id, f.b.id, f.c.id],
      [...ids(f.source)],
    ];
    for (const selection of sets) {
      const subset = getExportSelection(f.source, selection),
        tikz = exportTikz(subset),
        obsidian = exportObsidian(subset),
        svg = exportSVG(subset);
      expect(tikz).not.toMatch(/NaN|undefined/);
      expect(obsidian).not.toMatch(/NaN|undefined/);
      expect(svg).not.toMatch(/NaN|undefined/);
      const count = subset.objects.filter((o) => o.kind === 'component').length;
      expect(tikz.match(/% Component:/g) ?? []).toHaveLength(count);
      expect(obsidian.match(/% Component:/g) ?? []).toHaveLength(count);
      expect(
        svg.match(/ stroke-linecap="round" stroke-linejoin="round"><path/g) ?? [],
      ).toHaveLength(count);
      for (const id of selection) expect(ids(subset)).toContain(id);
      expect(serializeDocument(f.source)).toBe(original);
    }
  });
  it('uses only subset geometry to compute SVG bounds, including a detached rotated label and loop arrowhead', () => {
    const f = fixture(),
      single = getExportSelection(f.source, [f.loop.id]),
      code = exportSVG(single);
    expect(code).toContain('viewBox="');
    expect(code).not.toContain('independent');
    expect(code).not.toContain('NaN');
    expect(getExportSelection(f.source, []).objects).toEqual([]);
    expect(getExportSelection(f.source, ['stale-id']).objects).toEqual([]);
  });
});
