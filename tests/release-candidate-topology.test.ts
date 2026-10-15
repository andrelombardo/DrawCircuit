import { exportObsidian } from './helpers/unoptimizedObsidian';
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { catalog, createComponent } from '../src/model/catalog';
import { emptyDocument } from '../src/model/demo';
import { createJunction, createWire } from '../src/model/factories';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import { compatibleReplacements, replaceComponent } from '../src/model/replacement';
import type { CircuitDocument, Rotation, Wire } from '../src/model/types';
import { extractSelection, removeObjects, cloneObjects } from '../src/utils/operations';
import { localToWorld, wirePoints } from '../src/utils/geometry';
import { bridgeGeometry, bridgePaths, wireCrossings } from '../src/utils/crossings';
import { WireBridges } from '../src/circuit/wires/WireBridges';
import { insertJunction } from '../src/utils/wires';
import { exportTikz } from '../src/tikz/exporter';
import {
  CANVAS_UNITS_PER_CM,
  NATIVE_UNITS_PER_CM,
  editorToPt,
  formatNumber,
} from '../src/tikz/units';
import { exportSVG } from '../src/svg/exporter';
import { createCurrent, electricalGeometry } from '../src/annotations/electrical';

describe('release candidate: an existing node does not connect a passing wire implicitly', () => {
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    createWire(
      { kind: 'free', point: { x: x1, y: y1 } },
      { kind: 'free', point: { x: x2, y: y2 } },
    );
  it.each(['horizontal', 'vertical'] as const)(
    'keeps the %s node on its owning wire in the editor and all exports',
    (ownerAxis) => {
      const owner = {
        ...(ownerAxis === 'horizontal' ? line(-100, 0, 100, 0) : line(0, -100, 0, 100)),
        color: '#2463cb',
        width: 2,
      };
      const connected = insertJunction({ ...emptyDocument(), objects: [owner] }, { x: 0, y: 0 });
      const passing = {
        ...(ownerAxis === 'horizontal' ? line(0, -100, 0, 100) : line(-100, 0, 100, 0)),
        color: '#df4949',
        width: 4,
      };
      const doc = { ...connected.doc, objects: [...connected.doc.objects, passing] };
      expect(wireCrossings(doc)).toHaveLength(1);
      const crossing = wireCrossings(doc)[0],
        g = bridgeGeometry(crossing),
        p = bridgePaths(crossing);
      expect(crossing.bridgeAxis).toBe(ownerAxis === 'horizontal' ? 'vertical' : 'horizontal');
      expect(g.overWire.id).toBe(passing.id);
      expect(g.underWire.color).toBe(owner.color);
      expect(g.start).toEqual(
        ownerAxis === 'horizontal' ? { x: 0, y: -crossing.radius } : { x: -crossing.radius, y: 0 },
      );
      // The entire white halo clears the 4.5 px node, including when widths differ.
      const halo = (Math.max(owner.width, passing.width) + 4) / 2,
        apex = {
          x: (g.start.x + 3 * g.controlA.x + 3 * g.controlB.x + g.end.x) / 8,
          y: (g.start.y + 3 * g.controlA.y + 3 * g.controlB.y + g.end.y) / 8,
        };
      expect(Math.hypot(apex.x, apex.y) - halo - 4.5).toBeGreaterThanOrEqual(1.5);
      const ownerWires = connected.doc.objects.filter((o) => o.kind === 'wire');
      expect(ownerWires).toHaveLength(2);
      for (const wire of ownerWires)
        expect([wire.startEndpoint, wire.endEndpoint]).toContainEqual({
          kind: 'junction',
          junctionId: connected.junction.id,
        });
      expect(passing.startEndpoint.kind).toBe('free');
      expect(passing.endEndpoint.kind).toBe('free');
      const markup = renderToStaticMarkup(createElement(WireBridges, { doc }));
      expect(markup).toContain(`data-over-wire="${passing.id}"`);
      expect(markup).toContain(`data-bridge-axis="${crossing.bridgeAxis}"`);
      expect(markup).toContain(`data-under-wire="${g.underWire.id}"`);
      for (const output of [markup, exportSVG(doc)]) {
        expect(output).toContain(`d="${p.under}" fill="none" stroke="${owner.color}"`);
        expect(output).toMatch(
          new RegExp(`d="${p.arc}" fill="none" stroke="${passing.color}" stroke-[wW]idth="4"`),
        );
      }
      for (const [output, units] of [
        [exportTikz(doc), NATIVE_UNITS_PER_CM],
        [exportObsidian(doc), CANVAS_UNITS_PER_CM],
      ] as const) {
        expect(output).toContain(`${crossing.bridgeAxis} bridge`);
        const color = output.match(/\\definecolor\{(dcColor\d+)\}\{HTML\}\{DF4949\}/)![1],
          arc = output
            .split('\n')
            .find((l) => l.startsWith(`\\draw[draw=${color},`) && l.includes('.. controls'))!;
        expect(arc).toContain(`line width=${formatNumber(editorToPt(passing.width, units))}pt`);
        const coordinates = [...arc.matchAll(/\((-?[\d.]+),(-?[\d.]+)\)/g)];
        expect(coordinates).toHaveLength(4);
        for (const [i, point] of [g.start, g.controlA, g.controlB, g.end].entries()) {
          expect(Number(coordinates[i][1]) * units).toBeCloseTo(point.x, 2);
          expect(-Number(coordinates[i][2]) * units).toBeCloseTo(point.y, 2);
        }
      }
      const moved = {
        ...doc,
        objects: doc.objects.map((o) =>
          o.id === connected.junction.id ? { ...o, x: 40, y: 20 } : o,
        ),
      };
      expect(wirePoints(passing, moved)).toEqual(wirePoints(passing, doc));
    },
  );
  it('does not let an unrelated overlapping node hide a crossing', () => {
    const doc = {
      ...emptyDocument(),
      objects: [line(-100, 0, 100, 0), line(0, -100, 0, 100), createJunction({ x: 0, y: 0 }, 'A')],
    };
    expect(wireCrossings(doc)).toHaveLength(1);
    expect(wireCrossings(doc)[0]).toMatchObject({ bridgeAxis: 'horizontal', radius: 7 });
  });
  it('explicitly connects the passing wire using the existing node and keeps current placement', () => {
    const connected = insertJunction(
      { ...emptyDocument(), objects: [line(-100, 0, 100, 0)] },
      { x: 0, y: 0 },
    );
    const vertical = line(0, -100, 0, 100);
    const base = { ...connected.doc, objects: [...connected.doc.objects, vertical] };
    const current = createCurrent(vertical, { x: 0, y: 60 }, base);
    const doc = { ...base, objects: [...base.objects, current] };
    const result = insertJunction(doc, { x: 0, y: 0 });
    expect(result.junction.id).toBe(connected.junction.id);
    expect(result.doc.objects.filter((o) => o.kind === 'junction')).toHaveLength(1);
    expect(result.doc.objects.filter((o) => o.kind === 'wire')).toHaveLength(4);
    expect(wireCrossings(result.doc)).toHaveLength(0);
    expect(exportTikz(result.doc)).not.toContain('Unconnected wire crossing');
    const afterCurrent = result.doc.objects.find((o) => o.id === current.id)!;
    expect(afterCurrent.kind).toBe('electrical');
    if (afterCurrent.kind === 'electrical')
      expect(electricalGeometry(afterCurrent, result.doc)).toEqual(
        electricalGeometry(current, doc),
      );
    expect(deserializeDocument(serializeDocument(result.doc))).toEqual(result.doc);
    expect(insertJunction(result.doc, { x: 0, y: 0 }).doc).toBe(result.doc);
    const deleted = removeObjects(result.doc, [result.junction.id]);
    expect(wireCrossings(deleted)).toHaveLength(1);
  });
  it('attaches free endpoints to an existing node without duplicating it', () => {
    const junction = createJunction({ x: 0, y: 0 }, 'A');
    const wire = line(0, 0, 100, 0);
    const original = { ...emptyDocument(), objects: [junction, wire] };
    const result = insertJunction(original, { x: 0, y: 0 });
    expect(result.doc.objects).toHaveLength(2);
    expect(result.doc.objects[1]).toMatchObject({
      startEndpoint: { kind: 'junction', junctionId: junction.id },
    });
    expect(insertJunction(result.doc, { x: 0, y: 0 }).doc).toBe(result.doc);
  });
});

describe('release candidate: endpoint detachment preserves user-authored wire geometry', () => {
  it('reports malformed JSON in the same language as the existing document validation', () => {
    expect(() => deserializeDocument('{not valid JSON')).toThrow(
      'JSON non valido: controlla formato, oggetti e collegamenti.',
    );
  });
  it.each([0, 90, 180, 270] as Rotation[])(
    'keeps route when deleting a terminal at rotation %i or copying its wire alone',
    (rotation) => {
      const component = createComponent('ground', { x: 0, y: 0 });
      component.rotation = rotation;
      const wire = createWire(
        { kind: 'terminal', componentId: component.id, terminalId: 'a' },
        { kind: 'free', point: { x: 160, y: 100 } },
      );
      const doc: CircuitDocument = { ...emptyDocument(), objects: [component, wire] };
      const before = structuredClone(doc),
        route = wirePoints(wire, doc);
      const removed = removeObjects(doc, [component.id]);
      const detached = removed.objects[0] as Wire;
      expect(detached.startEndpoint).toEqual({
        kind: 'free',
        point: localToWorld(component, { x: 0, y: -40 }),
      });
      expect(wirePoints(detached, removed)).toEqual(route);
      const subset = extractSelection(doc, [wire.id]);
      expect(wirePoints(subset.objects[0] as Wire, subset)).toEqual(route);
      const pasted: CircuitDocument = {
        ...emptyDocument(),
        objects: cloneObjects(subset, { x: 40, y: 60 }),
      };
      expect(wirePoints(pasted.objects[0] as Wire, pasted)).toEqual(
        route.map((point) => ({ x: point.x + 40, y: point.y + 60 })),
      );
      expect(deserializeDocument(serializeDocument(removed))).toEqual(removed);
      expect(doc).toEqual(before);
    },
  );

  it('preserves automatic bends when detaching both differently oriented terminals', () => {
    const a = createComponent('ground', { x: 0, y: 0 }),
      b = createComponent('resistor', { x: 180, y: 140 });
    const wire = createWire(
      { kind: 'terminal', componentId: a.id, terminalId: 'a' },
      { kind: 'terminal', componentId: b.id, terminalId: 'b' },
    );
    const doc: CircuitDocument = { ...emptyDocument(), objects: [a, b, wire] },
      route = wirePoints(wire, doc),
      removed = removeObjects(doc, [a.id, b.id]);
    expect(wirePoints(removed.objects[0] as Wire, removed)).toEqual(route);
    expect(wirePoints(extractSelection(doc, [wire.id]).objects[0] as Wire, removed)).toEqual(route);
  });
});

describe('release candidate: every permitted replacement keeps its attached physical pins', () => {
  it.each(catalog)('$type: replacement matrix at all four rotations', (definition) => {
    for (const rotation of [0, 90, 180, 270] as Rotation[]) {
      const component = createComponent(definition.type, { x: 120, y: -80 });
      component.rotation = rotation;
      component.label.text = 'v_{semantic}';
      component.label.offset = { x: 13, y: 37 };
      const wires = component.terminals.map((terminal, i) =>
        createWire(
          { kind: 'terminal', componentId: component.id, terminalId: terminal.id },
          { kind: 'free', point: { x: 400 + i * 80, y: 300 + i * 40 } },
        ),
      );
      const original: CircuitDocument = { ...emptyDocument(), objects: [component, ...wires] };
      const before = serializeDocument(original);
      for (const type of compatibleReplacements(component)) {
        const replaced = replaceComponent(original, component.id, type);
        expect(replaced.objects[0]).toMatchObject({
          id: component.id,
          x: component.x,
          y: component.y,
          rotation,
          label: component.label,
        });
        for (const wire of wires) {
          const after = replaced.objects.find((o) => o.id === wire.id) as Wire;
          expect(wirePoints(after, replaced)).toEqual(wirePoints(wire, original));
        }
        expect(deserializeDocument(serializeDocument(replaced))).toEqual(replaced);
      }
      expect(() => replaceComponent(original, component.id, definition.type)).toThrow(
        'Sostituzione incompatibile.',
      );
      expect(serializeDocument(original)).toBe(before);
    }
  });
});
