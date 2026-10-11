import { describe, expect, it } from 'vitest';
import { createComponent } from '../src/model/catalog';
import { emptyDocument } from '../src/model/demo';
import { COLORS } from '../src/model/types';
import type { CircuitDocument, LoopArrow, Wire } from '../src/model/types';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import { resolveEndpoint, wirePoints } from '../src/utils/geometry';
import { cloneObjects, extractSelection, rotateObjects } from '../src/utils/operations';
import { insertJunction, normalizeWire, simplifyPolyline, wireCandidate } from '../src/utils/wires';
import { loopGeometry, loopPath, loopPositionAt, reverseLoop } from '../src/utils/loops';
import { exportTikz, svgToTikz } from '../src/tikz/exporter';
const free = (x: number, y: number) => ({ kind: 'free' as const, point: { x, y } });
const wire = (id: string, x1: number, y1: number, x2: number, y2: number): Wire => ({
  kind: 'wire',
  id,
  startEndpoint: free(x1, y1),
  endEndpoint: free(x2, y2),
  vertices: [],
  color: COLORS.ink,
  width: 2,
});
const loop: LoopArrow = {
  kind: 'loop-arrow',
  id: 'ellipse',
  x: 80,
  y: 120,
  width: 240,
  height: 120,
  direction: 'clockwise',
  arrowPosition: 0.25,
  color: COLORS.red,
  strokeWidth: 2,
};
describe('junction topology and routes', () => {
  it('snaps to a wire between grid points at high zoom and removes zero length route segments', () => {
    const w = wire('w', 0, 0, 160, 0),
      doc = { ...emptyDocument(), objects: [w] };
    expect(wireCandidate({ x: 73, y: 1 }, doc, 4)).toMatchObject({
      kind: 'wire',
      point: { x: 73, y: 0 },
    });
    const zero = wire('z', 0, 0, 0, 0);
    expect(wirePoints(zero, { ...emptyDocument(), objects: [zero] })).toEqual([{ x: 0, y: 0 }]);
  });
  it('splits every wire at a crossing and all four ends follow the moved junction', () => {
    const original: CircuitDocument = {
      ...emptyDocument(),
      objects: [wire('h', 0, 0, 160, 0), wire('v', 80, -80, 80, 80)],
    };
    const { doc, junction } = insertJunction(original, { x: 80, y: 0 });
    expect(original.objects).toHaveLength(2);
    const incident = doc.objects.filter((o): o is Wire => o.kind === 'wire');
    expect(incident).toHaveLength(4);
    const moved = {
      ...doc,
      objects: doc.objects.map((o) => (o.id === junction.id ? { ...junction, x: 100, y: 20 } : o)),
    };
    incident.forEach((o) => {
      const ep = o.startEndpoint.kind === 'junction' ? o.startEndpoint : o.endEndpoint;
      expect(resolveEndpoint(ep, moved)).toEqual({ x: 100, y: 20 });
    });
    expect(deserializeDocument(serializeDocument(moved))).toEqual(moved);
    expect(insertJunction(doc, junction).doc).toBe(doc);
  });
  it('reanchors free ends and keeps semantic terminal connections at an endpoint', () => {
    const c = { ...createComponent('resistor', { x: 0, y: 0 }), id: 'r' };
    const w = {
      ...wire('w', 40, 0, 160, 0),
      startEndpoint: { kind: 'terminal' as const, componentId: 'r', terminalId: 'b' },
    };
    const { doc, junction } = insertJunction(
      { ...emptyDocument(), objects: [c, w, wire('free', 40, 0, 40, 100)] },
      { x: 40, y: 0 },
    );
    const moved = {
      ...doc,
      objects: doc.objects.map((o) => (o.kind === 'component' ? { ...o, x: 60 } : o)),
    };
    const bridge = doc.objects.find(
      (o): o is Wire => o.kind === 'wire' && o.startEndpoint.kind === 'terminal',
    )!;
    expect(resolveEndpoint(bridge.startEndpoint, moved)).toEqual({ x: 100, y: 0 });
    expect(bridge.endEndpoint).toEqual({ kind: 'junction', junctionId: junction.id });
    expect(doc.objects.find((o) => o.id === 'free')).toMatchObject({
      startEndpoint: { kind: 'junction', junctionId: junction.id },
    });
  });
  it('preserves a manually routed shape through a split', () => {
    const w = {
      ...wire('w', 0, 0, 160, 80),
      vertices: [
        { x: 40, y: 0 },
        { x: 40, y: 80 },
      ],
    };
    const original = { ...emptyDocument(), objects: [w] };
    const { doc } = insertJunction(original, { x: 40, y: 40 });
    const halves = doc.objects.filter((o): o is Wire => o.kind === 'wire');
    expect(
      simplifyPolyline([...wirePoints(halves[0], doc), ...wirePoints(halves[1], doc)]),
    ).toEqual(simplifyPolyline(wirePoints(w, original)));
  });
  it('removes duplicate and redundant collinear points while retaining backtracks and elbows', () => {
    expect(
      simplifyPolyline([
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 20 },
      ]),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 20 },
    ]);
    expect(
      simplifyPolyline([
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 20, y: 0 },
      ]),
    ).toHaveLength(3);
    const w = {
      ...wire('w', 0, 0, 160, 80),
      vertices: [
        { x: 40, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 80 },
        { x: 100, y: 80 },
      ],
    };
    const doc = { ...emptyDocument(), objects: [w] };
    const normalized = normalizeWire(w, doc);
    expect(normalized.vertices.length).toBeLessThan(w.vertices.length);
    expect(simplifyPolyline(wirePoints(normalized, doc))).toEqual(
      simplifyPolyline(wirePoints(w, doc)),
    );
  });
  it.each([0.25, 1, 4])('uses screen pixel thresholds and terminal priority at zoom %s', (zoom) => {
    const c = { ...createComponent('resistor', { x: 0, y: 0 }), id: 'r' };
    const doc = { ...emptyDocument(), objects: [c, wire('w', 40, -100, 40, 100)] };
    expect(wireCandidate({ x: 40 + 5 / zoom, y: 0 }, doc, zoom).kind).toBe('terminal');
    expect(wireCandidate({ x: 40 + 5 / zoom, y: 60 }, doc, zoom).kind).toBe('wire');
    expect(wireCandidate({ x: 40 + 20 / zoom, y: 60 }, doc, zoom).kind).toBe('grid');
  });
  it('duplicates isolated components with new IDs and sequential labels', () => {
    const c = {
      ...createComponent('resistor', { x: 0, y: 0 }),
      id: 'r',
      label: { ...createComponent('resistor', { x: 0, y: 0 }).label, text: 'R1' },
    };
    const doc = { ...emptyDocument(), objects: [c, wire('external', 40, 0, 160, 0)] };
    const copies = cloneObjects(extractSelection(doc, ['r']), { x: 40, y: 40 }, doc);
    expect(copies).toHaveLength(1);
    expect(copies[0].id).not.toBe('r');
    expect(copies[0]).toMatchObject({ x: 40, y: 40, label: { text: 'R2' } });
  });
});
describe('parametric loop and export', () => {
  it.each(['clockwise', 'counterclockwise'] as const)(
    'exports %s with ellipse radii and inverted angles',
    (direction) => {
      const o = { ...loop, direction },
        g = loopGeometry(o);
      const code = exportTikz({ ...emptyDocument(), objects: [o] });
      expect(loopPath(o)).toContain(`A 120 60 0 1 ${direction === 'clockwise' ? 1 : 0}`);
      expect(code).toContain(
        `start angle=${-g.startAngle}, end angle=${-g.endAngle}, x radius=3cm, y radius=1.5cm`,
      );
      expect(code).toContain('line width=1.4226pt');
      expect(svgToTikz(g.end)).toEqual({ x: 8, y: -4.5 });
    },
  );
  it('moves head continuously, reverses the same arc and works for tall ellipses', () => {
    expect(loopPositionAt(loop, { x: 200, y: 120 })).toBe(0);
    expect(loopPositionAt(loop, { x: 200, y: 240 })).toBe(0.5);
    const reversed = reverseLoop(loop),
      a = loopGeometry(loop),
      b = loopGeometry(reversed);
    expect(b.end.x).toBeCloseTo(a.start.x);
    expect(b.start.y).toBeCloseTo(a.end.y);
    const tall = { ...loop, width: 80, height: 320 };
    expect(loopPath(tall)).toContain('A 40 160');
    expect(exportTikz({ ...emptyDocument(), objects: [tall] })).toContain(
      'x radius=1cm, y radius=4cm',
    );
  });
  it('roundtrips the entire loop and rejects malformed dimensions or head parameters', () => {
    const doc = { ...emptyDocument(), objects: [loop] };
    expect(deserializeDocument(serializeDocument(doc))).toEqual(doc);
    for (const patch of [
      { width: 0 },
      { height: -1 },
      { arrowPosition: 1 },
      { direction: 'bad' },
      { strokeWidth: 0 },
    ])
      expect(() =>
        deserializeDocument(JSON.stringify({ ...doc, objects: [{ ...loop, ...patch }] })),
      ).toThrow();
  });
  it('rotates bounding box and head without losing ellipse proportions', () => {
    const doc = { ...emptyDocument(), objects: [loop] };
    expect(rotateObjects(doc, [loop.id]).objects[0]).toMatchObject({
      width: 240,
      height: 120,
      rotation: 90,
      arrowPosition: 0.25,
    });
    let result: CircuitDocument = doc;
    for (let i = 0; i < 4; i++) result = rotateObjects(result, [loop.id]);
    expect(result).toEqual({ ...doc, objects: [{ ...loop, rotation: 0 }] });
  });
  it('exports bodies, junctions, labels and annotations in explicit order without UI', () => {
    const c = createComponent('resistor', { x: 0, y: 0 });
    const { junction } = insertJunction(emptyDocument(), { x: 80, y: 0 });
    const code = exportTikz({ ...emptyDocument(), objects: [loop, junction, c] });
    expect(code.indexOf('to[R')).toBeLessThan(code.indexOf('\\fill['));
    expect(code.indexOf('\\fill[')).toBeLessThan(code.indexOf('\\node['));
    expect(code.indexOf('\\node[')).toBeLessThan(code.indexOf('arc['));
    expect(code).not.toContain('handle');
  });
});
