import { describe, expect, it, vi } from 'vitest';
import { createComponent } from '../src/model/catalog';
import { createJunction, createLine, createWire } from '../src/model/factories';
import type { CircuitDocument, CircuitObject, Point } from '../src/model/types';
import { serializeDocument } from '../src/model/serialization';
import { computeMoveGuides, createMoveContext, GuideIndex } from '../src/utils/smartGuides';
import { getMeasurementBounds } from '../src/utils/measurementGeometry';
import { parallelSources } from './helpers/parallelSources';

const doc = (objects: CircuitObject[]): CircuitDocument => ({
  version: 1,
  title: 'Quote',
  objects,
});
const wire = (a: Point, b: Point, vertices: Point[] = []) =>
  createWire({ kind: 'free', point: a }, { kind: 'free', point: b }, vertices, 'free');
const feedback = (document: CircuitDocument, ids: string[], delta = { x: 0, y: 0 }, zoom = 1) =>
  computeMoveGuides(createMoveContext(document, ids), delta, zoom, false, true);

describe('distances on both axes', () => {
  it.each([0.25, 0.5, 1, 2, 4])(
    'keeps parallel centers and both connected rail gaps at zoom %s',
    (zoom) => {
      const document = parallelSources([0, 138, 278]),
        before = serializeDocument(document),
        result = feedback(document, ['source-2'], { x: 0, y: 0 }, zoom);
      expect(
        result.distances.map((g) => [g.axis, g.from, g.to, g.value, g.measurement ?? 'gaps']),
      ).toEqual([
        ['x', 0, 138, 138, 'centers'],
        ['x', 138, 278, 140, 'centers'],
        ['y', -100, -20, 80, 'gaps'],
        ['y', 20, 100, 80, 'gaps'],
      ]);
      expect(result.distances.filter((g) => g.equal).map((g) => g.axis)).toEqual(['y', 'y']);
      expect(serializeDocument(document)).toBe(before);
    },
  );
  it('rotates the same workflow: vertical center distances with horizontal connected clearances', () => {
    const document = parallelSources([0, 138, 278]);
    for (const o of document.objects) {
      if (o.kind === 'component' || o.kind === 'junction') {
        [o.x, o.y] = [-o.y, o.x];
        if (o.kind === 'component') o.rotation = 0;
      } else if (o.kind === 'wire' && o.endEndpoint.kind === 'free') {
        const p = o.endEndpoint.point;
        o.endEndpoint.point = { x: -p.y, y: p.x };
      }
    }
    const result = feedback(document, ['source-2']);
    expect(result.distances.map((g) => [g.axis, g.value])).toEqual([
      ['x', 80],
      ['x', 80],
      ['y', 138],
      ['y', 140],
    ]);
  });
  it('keeps unequal gaps unhighlighted when only one matches a more remote gap', () => {
    const objects = [
      createComponent('resistor', { x: 0, y: 0 }),
      createJunction({ x: 120, y: 0 }, ''),
      createComponent('resistor', { x: 240, y: 0 }),
      createComponent('resistor', { x: 500, y: 0 }),
    ];
    const result = feedback(doc(objects), [objects[2].id]);
    expect(result.distances).toHaveLength(2);
    expect(result.distances.every((g) => !g.equal)).toBe(true);
  });
  it('shows both axes for an isolated component surrounded by components', () => {
    const objects = [
      { x: 0, y: 0 },
      { x: -200, y: 0 },
      { x: 300, y: 0 },
      { x: 0, y: -150 },
      { x: 0, y: 250 },
    ].map((p) => createComponent('voltageSource', p));
    const result = feedback(doc(objects), [objects[0].id]);
    expect(result.distances.map((g) => [g.axis, g.value])).toEqual([
      ['x', 160],
      ['x', 260],
      ['y', 150],
      ['y', 250],
    ]);
  });
});

describe('actual line and wire segments as measurement references', () => {
  it.each(['line', 'wire'] as const)(
    'measures to a %s whose midpoint is not aligned with the selected body',
    (kind) => {
      const component = createComponent('resistor', { x: 200, y: 0 }),
        a = { x: -100, y: -160 },
        b = { x: 1000, y: -160 },
        reference = kind === 'line' ? createLine(a, b) : wire(a, b),
        result = feedback(doc([component, reference]), [component.id]);
      expect(result.distances).toHaveLength(1);
      expect(result.distances[0]).toMatchObject({
        axis: 'y',
        from: -160,
        to: -9,
        at: 200,
        value: 151,
        neighborId: reference.id,
        referenceKind: kind,
      });
    },
  );
  it('retains lateral parallel centers while adding unconnected upper and lower lines', () => {
    const document = parallelSources([0, 138, 278]);
    document.objects = document.objects.filter((o) => o.kind === 'component');
    document.objects.push(
      createLine({ x: -80, y: -160 }, { x: 800, y: -160 }),
      wire({ x: -80, y: 220 }, { x: 500, y: 220 }),
    );
    const result = feedback(document, ['source-2']);
    expect(result.distances.map((g) => [g.axis, g.value])).toEqual([
      ['x', 138],
      ['x', 140],
      ['y', 140],
      ['y', 200],
    ]);
  });
  it('uses only the closest spanning segment on each side of either axis', () => {
    const component = createComponent('voltageSource', { x: 0, y: 0 });
    const references = [
      createLine({ x: 0, y: -200 }, { x: 1000, y: -200 }),
      wire({ x: -1000, y: -100 }, { x: 0, y: -100 }),
      createLine({ x: -1000, y: 140 }, { x: 1000, y: 140 }),
      wire({ x: -180, y: -1000 }, { x: -180, y: 1000 }),
      createLine({ x: 260, y: -1000 }, { x: 260, y: 1000 }),
    ];
    const result = feedback(doc([component, ...references]), [component.id]);
    expect(result.distances.map((g) => [g.axis, g.value, g.neighborId])).toEqual([
      ['x', 160, references[3].id],
      ['x', 240, references[4].id],
      ['y', 80, references[1].id],
      ['y', 120, references[2].id],
    ]);
  });
  it('does not measure empty spans, diagonals, intersecting bodies or remote segments', () => {
    const component = createComponent('voltageSource', { x: 0, y: 0 });
    const references = [
      createLine({ x: 1, y: -80 }, { x: 200, y: -80 }),
      createLine({ x: -200, y: -80 }, { x: -1, y: -80 }),
      createLine({ x: -200, y: -160 }, { x: 200, y: -80 }),
      wire({ x: -200, y: 80 }, { x: 200, y: 160 }),
      createLine({ x: -200, y: 10 }, { x: 200, y: 10 }),
      createLine({ x: -200, y: -900 }, { x: 200, y: -900 }),
      createLine({ x: 0, y: -80 }, { x: 0, y: -80 }),
      // Its union box spans x=0, but neither horizontal run does.
      wire({ x: -200, y: -160 }, { x: 200, y: -80 }, [
        { x: -100, y: -160 },
        { x: -100, y: -300 },
        { x: 100, y: -240 },
        { x: 100, y: -80 },
      ]),
    ];
    expect(feedback(doc([component, ...references]), [component.id]).distances).toEqual([]);
  });
  it('uses the actual horizontal run of a bent wire, independently of its overall bounds', () => {
    const component = createComponent('voltageSource', { x: 0, y: 0 }),
      reference = wire({ x: -200, y: -80 }, { x: 200, y: -300 }, [
        { x: 100, y: -80 },
        { x: 100, y: -300 },
      ]),
      result = feedback(doc([component, reference]), [component.id]);
    expect(result.distances.find((g) => g.axis === 'y')).toMatchObject({
      from: -80,
      to: -20,
      value: 60,
      referenceKind: 'wire',
    });
  });
  it('updates the spanning reference when dragging beyond a line end without adding a snap', () => {
    const component = createComponent('resistor', { x: 0, y: 0 }),
      line = createLine({ x: -100, y: -80 }, { x: 100, y: -80 }),
      context = createMoveContext(doc([component, line]), [component.id]);
    const scan = vi.spyOn(context.index, 'along');
    for (const x of [0, 99, 100]) {
      const result = computeMoveGuides(context, { x, y: 3 }, 1, false, true);
      expect(result.delta).toEqual({ x, y: 3 });
      expect(result.distances[0]).toMatchObject({ axis: 'y', at: x, value: 74 });
    }
    expect(computeMoveGuides(context, { x: 101, y: 3 }, 1, false, true).distances).toEqual([]);
    expect(scan).not.toHaveBeenCalled();
    const raw = { x: 13, y: 5 };
    expect(computeMoveGuides(context, raw, 1).delta).toEqual({ x: 20, y: 0 });
  });
  it('excludes selected lines and wires that move with the selection from static references', () => {
    const component = createComponent('resistor', { x: 0, y: 0 }),
      selectedLine = createLine({ x: -100, y: -80 }, { x: 100, y: -80 }),
      incident = createWire(
        { kind: 'terminal', componentId: component.id, terminalId: 'a' },
        { kind: 'free', point: { x: 200, y: -100 } },
        [
          { x: -100, y: 0 },
          { x: -100, y: -100 },
        ],
      ),
      document = doc([component, selectedLine, incident]),
      context = createMoveContext(document, [component.id, selectedLine.id]);
    expect(context.index.nearby(context.moving.bounds).filter((e) => e.segmentAxis)).toEqual([]);
    expect(feedback(document, [component.id, selectedLine.id]).distances).toEqual([]);
  });
  it('measures from the authored body edge even with displaced labels and thick strokes', () => {
    const component = createComponent('currentSource', { x: 200, y: 0 });
    component.rotation = 270;
    component.label.offset = { x: 800, y: -700 };
    component.width = 10;
    const line = createLine({ x: -100, y: -160 }, { x: 1000, y: -160 });
    line.width = 12;
    const body = getMeasurementBounds(component),
      result = feedback(doc([component, line]), [component.id]);
    expect(result.distances[0].value).toBe(body.y - line.start.y);
  });
  it('keeps connected endpoints ahead of crossings while still showing the other axis', () => {
    const document = parallelSources([0, 138, 278]);
    const crossing = wire({ x: -100, y: -60 }, { x: 500, y: -60 });
    document.objects.push(crossing);
    const result = feedback(document, ['source-2']);
    expect(result.distances).toHaveLength(4);
    expect(
      result.distances.filter((g) => g.axis === 'y').map((g) => [g.value, g.referenceKind]),
    ).toEqual([
      [80, 'junction'],
      [80, 'junction'],
    ]);
    expect(document.objects.filter((o) => o.kind === 'junction')).toHaveLength(6);
  });
  it('keeps spanning bus clearances after moving sideways away from the original straight runs', () => {
    const document = parallelSources([0, 138, 278]),
      result = feedback(document, ['source-2'], { x: 50, y: 0 });
    expect(result.delta).toEqual({ x: 50, y: 0 });
    expect(result.distances.map((g) => [g.axis, g.value])).toEqual([
      ['x', 188],
      ['x', 90],
      ['y', 80],
      ['y', 80],
    ]);
    expect(
      result.distances.filter((g) => g.axis === 'y').every((g) => g.referenceKind === 'wire'),
    ).toBe(true);
  });
  it('queries local segment buckets in large circuits and bounds storage for very long lines', () => {
    const wires = Array.from({ length: 3000 }, (_, i) =>
      wire({ x: i * 200, y: -100 }, { x: i * 200 + 100, y: -100 }),
    );
    const longLine = createLine({ x: -1000000, y: 100 }, { x: 1000000, y: 100 });
    const component = createComponent('resistor', { x: 300050, y: 0 });
    const document = doc([...wires, longLine, component]),
      index = new GuideIndex(document, new Set([component.id]));
    expect(index.nearby(getMeasurementBounds(component)).length).toBeLessThan(15);
    const result = feedback(document, [component.id]);
    expect(result.distances.map((g) => [g.axis, g.value])).toEqual([
      ['y', 91],
      ['y', 91],
    ]);
  });
});
