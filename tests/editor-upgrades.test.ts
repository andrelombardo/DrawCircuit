import { beforeEach, describe, expect, it } from 'vitest';
import { Resvg } from '@resvg/resvg-js';
import { createComponent } from '../src/model/catalog';
import { createJunction, createWire } from '../src/model/factories';
import { emptyDocument } from '../src/model/demo';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import { commonReplacements, replaceComponents } from '../src/model/replacement';
import type {
  ArrowAnnotation,
  CircuitDocument,
  CircuitObject,
  LoopArrow,
  Point,
} from '../src/model/types';
import { useEditorStore } from '../src/store/editorStore';
import {
  arcGeometry,
  distance,
  localToWorld,
  resolveEndpoint,
  rotatePoint,
  wirePoints,
} from '../src/utils/geometry';
import { cloneObjects, moveSelection, rotateObjects } from '../src/utils/operations';
import {
  beginWire,
  commitWire,
  insertJunction,
  normalizeDocumentWires,
  wireCandidate,
  wirePreview,
} from '../src/utils/wires';
import { instantiatePersonalBlock } from '../src/personalBlocks/library';
import { arrowCenter, mirrorArrow, rotateArrow, rotationGesture } from '../src/utils/arrows';
import { loopGeometry } from '../src/utils/loops';
import { canvasArrowHead } from '../src/tikz/arrowheads';
import { createCurrent, electricalDrawingGeometry } from '../src/annotations/electrical';
import { exportSVG } from '../src/svg/exporter';
import { exportObsidian, exportTikz } from '../src/tikz/exporter';
import { moveLabel } from '../src/utils/labels';
import { placeNodeLabel } from '../src/utils/nodeLabels';
import { wireCrossings } from '../src/utils/crossings';
import { drawingWireGaps } from '../src/utils/wireRendering';
const doc = (objects: CircuitObject[]): CircuitDocument => ({ ...emptyDocument(), objects });
const free = (x: number, y: number) => ({ kind: 'free' as const, point: { x, y } });
const close = (a: Point, b: Point) => {
  expect(a.x).toBeCloseTo(b.x, 8);
  expect(a.y).toBeCloseTo(b.y, 8);
};
export function triangle(): CircuitDocument {
  const nodes = [
    createJunction({ x: -200, y: 100 }, 'A'),
    createJunction({ x: 200, y: 100 }, 'B'),
    createJunction({ x: 0, y: -100 }, 'C'),
  ];
  const components = [
    createComponent('resistor', { x: 0, y: 100 }),
    createComponent('resistor', { x: -100, y: 0 }),
    createComponent('resistor', { x: 100, y: 0 }),
  ];
  components[1].rotation = 315;
  components[2].rotation = 45;
  const ends = [
    [0, 1],
    [0, 2],
    [2, 1],
  ];
  return doc([
    ...nodes,
    ...components,
    ...components.flatMap((c, i) =>
      c.terminals.map((t, k) =>
        createWire(
          { kind: 'terminal', componentId: c.id, terminalId: t.id },
          { kind: 'junction', junctionId: nodes[ends[i][k]].id },
          [],
          '45',
        ),
      ),
    ),
  ]);
}
const curve: ArrowAnnotation = {
  kind: 'arrow',
  id: 'curve',
  type: 'curve',
  start: { x: -70, y: 10 },
  end: { x: 90, y: 40 },
  controlPoints: [
    { x: -10, y: -110 },
    { x: 130, y: 160 },
  ],
  color: '#171a20',
  width: 2,
  reversed: true,
};
const loop: LoopArrow = {
  kind: 'loop-arrow',
  id: 'loop',
  x: 20,
  y: 30,
  width: 180,
  height: 90,
  rotation: 27,
  direction: 'clockwise',
  arrowPosition: 0.19,
  color: '#df4949',
  strokeWidth: 2,
};
beforeEach(() =>
  useEditorStore.setState({
    document: emptyDocument(),
    selection: [],
    activeLabel: null,
    past: [],
    future: [],
    gestureStart: null,
    tool: 'select',
    wireRouting: 'orthogonal',
  }),
);

describe('persistent routing and real triangle topology', () => {
  it.each(['45', 'free'] as const)(
    'previews, connects rotated pins and retains %s routing on split',
    (routing) => {
      const a = { ...createComponent('resistor', { x: 0, y: 0 }), rotation: 45 as const };
      const b = { ...createComponent('resistor', { x: 200, y: 200 }), rotation: 45 as const };
      const source = doc([a, b]);
      const start = wireCandidate(localToWorld(a, { x: 40, y: 0 }), source, 1);
      const end = wireCandidate(localToWorld(b, { x: -40, y: 0 }), source, 1);
      const { draft } = beginWire(source, start, routing);
      expect(wirePoints(wirePreview(draft, end, source), source)).toHaveLength(2);
      const result = commitWire(source, draft, end)!;
      const wire = result.doc.objects.find((o) => o.kind === 'wire')!;
      expect(wirePoints(wire, result.doc)).toHaveLength(2);
      expect(wire.startEndpoint.kind).toBe('terminal');
      expect(wire.endEndpoint.kind).toBe('terminal');
      const split = insertJunction(result.doc, { x: 100, y: 100 });
      const branches = split.doc.objects.filter((o) => o.kind === 'wire');
      expect(branches).toHaveLength(2);
      for (const w of branches) {
        expect(w.routing).toBe(routing);
        expect(wirePoints(w, split.doc)).toHaveLength(2);
      }
      expect(insertJunction(split.doc, split.junction).doc).toBe(split.doc);
      expect(deserializeDocument(serializeDocument(split.doc))).toEqual(split.doc);
    },
  );
  it('keeps a closed three-resistor triangle through save, reopen, move, rotate, copy and export', () => {
    const original = triangle();
    const loaded = deserializeDocument(serializeDocument(original));
    for (const wire of loaded.objects.filter((o) => o.kind === 'wire'))
      expect(wirePoints(wire, loaded)).toHaveLength(2);
    const components = loaded.objects.filter((o) => o.kind === 'component');
    let edited = moveSelection(loaded, [components[1].id], { x: 20, y: 20 });
    edited = normalizeDocumentWires(rotateObjects(edited, [components[2].id]));
    for (const c of components)
      for (const terminal of c.terminals)
        expect(
          edited.objects.filter(
            (o) =>
              o.kind === 'wire' &&
              [o.startEndpoint, o.endEndpoint].some(
                (e) =>
                  e.kind === 'terminal' && e.componentId === c.id && e.terminalId === terminal.id,
              ),
          ),
        ).toHaveLength(1);
    for (const node of loaded.objects.filter((o) => o.kind === 'junction'))
      expect(
        edited.objects.filter(
          (o) =>
            o.kind === 'wire' &&
            [o.startEndpoint, o.endEndpoint].some(
              (e) => e.kind === 'junction' && e.junctionId === node.id,
            ),
        ),
      ).toHaveLength(2);
    for (const wire of edited.objects.filter((o) => o.kind === 'wire')) {
      expect(wire.routing).toBe('45');
      const points = wirePoints(wire, edited);
      close(points[0], resolveEndpoint(wire.startEndpoint, edited));
      close(points.at(-1)!, resolveEndpoint(wire.endEndpoint, edited));
      points.slice(1).forEach((b, i) => {
        const a = points[i],
          dx = Math.abs(b.x - a.x),
          dy = Math.abs(b.y - a.y);
        expect(Math.min(dx, dy, Math.abs(dx - dy))).toBeLessThan(1e-8);
      });
    }
    const copy = doc(cloneObjects(edited, { x: 600, y: 0 }));
    expect(deserializeDocument(serializeDocument(copy))).toEqual(copy);
    for (const output of [exportSVG(edited), exportTikz(edited), exportObsidian(edited)]) {
      expect(output).not.toMatch(/NaN|Infinity|data-handle|selection-box/);
    }
    const diagonal = loaded.objects.find(
      (o) => o.kind === 'wire' && wirePoints(o, loaded)[0].y !== wirePoints(o, loaded)[1].y,
    )!;
    expect(exportSVG(loaded)).toContain(`M ${wirePoints(diagonal as never, loaded)[0].x}`);
  });
  it('keeps arbitrary authored bends and bridges a diagonal crossing until a node connects it', () => {
    const a = createWire(free(-100, -100), free(100, 100), [], 'free');
    const b = createWire(free(-100, 100), free(100, -100), [], '45');
    const source = doc([a, b]);
    expect(wireCrossings(source)).toHaveLength(1);
    expect(exportSVG(source)).toContain(' C ');
    const split = insertJunction(source, { x: 0, y: 0 });
    expect(split.doc.objects.filter((o) => o.kind === 'wire')).toHaveLength(4);
    expect(wireCrossings(split.doc)).toHaveLength(0);
    const authored = {
      ...a,
      vertices: [
        { x: -37, y: 21 },
        { x: 18, y: 77 },
      ],
    };
    expect(wirePoints(authored, doc([authored]))).toEqual([
      a.startEndpoint.kind === 'free' ? a.startEndpoint.point : { x: 0, y: 0 },
      ...authored.vertices,
      { x: 100, y: 100 },
    ]);
    expect(normalizeDocumentWires(doc([authored])).objects[0]).toEqual(authored);
  });
});

describe('current migration, replacement and readable new labels', () => {
  it.each(['external', undefined] as const)(
    'renders legacy %s currents integrated and preserves metadata across migration',
    (placement) => {
      const wire = createWire(free(0, 0), free(200, 200), [], '45');
      const current = {
        ...createCurrent(wire, { x: 100, y: 100 }, doc([wire])),
        currentPlacement: placement,
        reversed: true,
      };
      current.label.text = 'i_{old}';
      const loaded = deserializeDocument(serializeDocument(doc([wire, current])));
      const migrated = loaded.objects[1];
      expect(migrated).toEqual({ ...current, currentPlacement: 'inline' });
      if (migrated.kind !== 'electrical') throw Error();
      const g = electricalDrawingGeometry(migrated, loaded);
      expect(g.inline).toBe(true);
      expect(g.start.x).toBeCloseTo(g.start.y);
      const split = insertJunction(loaded, { x: 150, y: 150 });
      const after = split.doc.objects.find((o) => o.id === current.id)!;
      expect(after).toMatchObject({ reversed: true, label: current.label });
    },
  );
  it('replaces five components in one history entry, ignores wires/nodes and leaves incompatible batches untouched', () => {
    const components = Array.from({ length: 5 }, (_, i) =>
      createComponent('resistor', { x: i * 150, y: 0 }, i + 1),
    );
    const wire = createWire(
      { kind: 'terminal', componentId: components[0].id, terminalId: 'b' },
      { kind: 'terminal', componentId: components[1].id, terminalId: 'a' },
    );
    const node = createJunction({ x: 0, y: 100 }, 'A');
    const source = doc([...components, wire, node]);
    useEditorStore.setState({ document: source });
    const store = useEditorStore.getState();
    store.replaceComponents(
      source.objects.map((o) => o.id),
      'capacitor',
    );
    const changed = useEditorStore.getState().document;
    expect(
      changed.objects.filter((o) => o.kind === 'component').every((o) => o.type === 'capacitor'),
    ).toBe(true);
    expect(changed.objects.at(-1)).toBe(node);
    expect(useEditorStore.getState().past).toHaveLength(1);
    expect(new Set(changed.objects.map((o) => o.id)).size).toBe(changed.objects.length);
    expect(deserializeDocument(serializeDocument(changed))).toEqual(changed);
    store.undo();
    expect(useEditorStore.getState().document).toEqual(source);
    store.redo();
    expect(useEditorStore.getState().document).toEqual(changed);
    const transistor = createComponent('npn', { x: 0, y: 200 });
    const incompatible = doc([...components, transistor]);
    expect(commonReplacements([...components, transistor])).toEqual([]);
    expect(() =>
      replaceComponents(
        incompatible,
        incompatible.objects.map((o) => o.id),
        'capacitor',
      ),
    ).toThrow(/compatibile/);
    expect(incompatible.objects[0]).toBe(components[0]);
  });
  it('snaps an already rotated arrow to absolute 15 degree steps', () => {
    const to = rotatePoint({ x: 100, y: 0 }, 20);
    expect(rotationGesture({ x: 0, y: 0 }, { x: 100, y: 0 }, to, true, 17)).toBe(13);
  });
  it('places a new node label away from nearby symbols, wires and text, deterministically; manual moves stay put', () => {
    const c = createComponent('resistor', { x: 0, y: -26 });
    c.label.text = '';
    const a = createWire(free(-100, 0), free(100, 0));
    const b = createWire(free(0, -100), free(0, 100));
    const source = doc([a, b, c]);
    const node = insertJunction(source, { x: 0, y: 0 }).junction;
    expect(node.label.offset.x).not.toBe(0);
    expect(node.label.offset.y).toBeGreaterThan(0);
    expect(placeNodeLabel(createJunction({ x: 0, y: 0 }, 'A'), source).label.offset).toEqual(
      node.label.offset,
    );
    const moved = moveLabel(doc([node]), node.id, { x: 18, y: 29 });
    expect(insertJunction(moved, { x: 0, y: 0 }).junction).toEqual(moved.objects[0]);
    expect(moved.objects[0]).toMatchObject({ x: 0, y: 0 });
  });
});

it('rotates imported personal blocks with an oriented ellipse and mirrored legacy arc', () => {
  const arc = { ...curve, type: 'arc' as const, arcRotation: 37, arcMirrored: true };
  const block = { id: 'block', name: 'rotated arrows', document: doc([arc, loop]) };
  const inserted = instantiatePersonalBlock(block, { x: 0, y: 0 }, 90, emptyDocument());
  for (const [i, original] of [arc, loop].entries()) {
    const transformed = inserted[i] as typeof original;
    const expected = rotateArrow(original, 90, { x: 0, y: 0 });
    expect(transformed).toEqual({ ...expected, id: transformed.id });
    canvasArrowHead(transformed).forEach((p, k) =>
      close(p, rotatePoint(canvasArrowHead(original)[k], 90)),
    );
  }
});

describe('geometry transforms and independent transparency', () => {
  it.each(['horizontal', 'vertical'] as const)(
    'exactly mirrors Bézier points, legacy arcs and rotated ellipses: %s',
    (axis) => {
      for (const original of [
        curve,
        { ...curve, type: 'straight' as const },
        { ...curve, type: 'arc' as const, arcRotation: 38 },
        loop,
      ]) {
        const mirrored = mirrorArrow(original, axis);
        const c = arrowCenter(original);
        const reflection = (p: Point) =>
          axis === 'horizontal' ? { x: 2 * c.x - p.x, y: p.y } : { x: p.x, y: 2 * c.y - p.y };
        if (original.kind === 'arrow' && mirrored.kind === 'arrow') {
          close(mirrored.start, reflection(original.start));
          close(mirrored.end, reflection(original.end));
          original.controlPoints.forEach((p, i) => close(mirrored.controlPoints[i], reflection(p)));
          expect(mirrored.reversed).toBe(original.reversed);
          if (original.type === 'arc') {
            close(arcGeometry(mirrored).start, reflection(arcGeometry(original).start));
            close(arcGeometry(mirrored).end, reflection(arcGeometry(original).end));
          }
        } else if (original.kind === 'loop-arrow' && mirrored.kind === 'loop-arrow') {
          close(loopGeometry(mirrored).start, reflection(loopGeometry(original).start));
          close(loopGeometry(mirrored).end, reflection(loopGeometry(original).end));
        }
        canvasArrowHead(mirrored).forEach((p, i) =>
          close(p, reflection(canvasArrowHead(original)[2 - i])),
        );
        const twice = mirrorArrow(mirrored, axis);
        close(arrowCenter(twice), c);
        expect(twice.color).toBe(original.color);
        expect(deserializeDocument(serializeDocument(doc([mirrored])))).toEqual(doc([mirrored]));
      }
    },
  );
  it.each([17.35, -123.7, 45])(
    'rotates all points rigidly by %s° and preserves exports',
    (angle) => {
      for (const original of [curve, loop]) {
        const rotated = rotateArrow(original, angle),
          c = arrowCenter(original);
        const rotate = (p: Point) => {
          const r = rotatePoint({ x: p.x - c.x, y: p.y - c.y }, angle);
          return { x: c.x + r.x, y: c.y + r.y };
        };
        canvasArrowHead(rotated).forEach((p, i) => close(p, rotate(canvasArrowHead(original)[i])));
        if (rotated.kind === 'arrow')
          expect(distance(rotated.start, rotated.end)).toBeCloseTo(
            distance(curve.start, curve.end),
          );
        expect(deserializeDocument(serializeDocument(doc([rotated])))).toEqual(doc([rotated]));
        for (const output of [
          exportSVG(doc([rotated])),
          exportTikz(doc([rotated])),
          exportObsidian(doc([rotated])),
        ])
          expect(output).not.toMatch(/NaN|Infinity|handle/);
      }
      const p = rotatePoint({ x: 100, y: 0 }, angle);
      expect(rotationGesture({ x: 0, y: 0 }, { x: 100, y: 0 }, p, false)).toBeCloseTo(angle);
      expect(rotationGesture({ x: 0, y: 0 }, { x: 100, y: 0 }, p, true) % 15).toBeCloseTo(0);
    },
  );
  it.each([0, 0.5, 1])(
    'round-trips opacity %s separately from labels and actually rasterizes the alpha',
    (opacity) => {
      const wire = { ...createWire(free(0, 0), free(100, 0)), color: '#000000', width: 4, opacity };
      const source = doc([wire]);
      expect(deserializeDocument(serializeDocument(source))).toEqual(source);
      const svg = exportSVG(source);
      const raster = new Resvg(svg).render();
      let minimum = 255;
      for (let i = 0; i < raster.pixels.length; i += 4)
        minimum = Math.min(minimum, raster.pixels[i]);
      expect(minimum).toBeCloseTo(Math.round(255 * (1 - opacity)), 0);
      const c = {
        ...createComponent('resistor', { x: 0, y: 100 }),
        opacity,
        label: { ...createComponent('resistor', { x: 0, y: 100 }).label, opacity: 0.25 },
      };
      const document = doc([wire, c]);
      for (const output of [exportTikz(document), exportObsidian(document)]) {
        expect(output).toContain(`opacity=${opacity}`);
        expect(output).toContain('opacity=0.25');
      }
      expect(exportSVG(document)).toContain('opacity="0.25"');
    },
  );
  it('does not double-paint translucent crossings', () => {
    const a = { ...createWire(free(-100, 0), free(100, 0)), opacity: 0.5 };
    const b = { ...createWire(free(0, -100), free(0, 100)), opacity: 0.5 };
    const source = doc([a, b]);
    expect(drawingWireGaps(source).get(a.id)).toHaveLength(1);
    expect(exportSVG(source)).not.toContain('stroke="white"');
    expect(exportTikz(source)).not.toContain('draw=white');
  });
  it.each([
    { opacity: -0.1 },
    { opacity: 1.1 },
    { opacity: '0.5' },
    { routing: 'diagonal' },
    { opacity: null },
  ])('rejects invalid v1 extensions %j', (patch) => {
    const wire = createWire(free(0, 0), free(100, 100));
    expect(() =>
      deserializeDocument(JSON.stringify(doc([{ ...wire, ...patch } as never]))),
    ).toThrow();
  });
});
