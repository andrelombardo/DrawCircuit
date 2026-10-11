import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parallelSources } from './helpers/parallelSources';
import { createComponent } from '../src/model/catalog';
import {
  createLine,
  createRectangle,
  createTextAnnotation,
  createWire,
} from '../src/model/factories';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import { useEditorStore } from '../src/store/editorStore';
import {
  alignSelection,
  distributeSelection,
  positionSelection,
  objectCenter,
} from '../src/utils/selectionGeometry';
import { measurementBounds } from '../src/utils/measurementGeometry';
import { moveSelection, cloneObjects, extractSelection } from '../src/utils/operations';
import { computeMoveGuides, createMoveContext } from '../src/utils/smartGuides';
import { wirePoints, resolveEndpoint, nearestTarget } from '../src/utils/geometry';
import { splitWireAtPoint } from '../src/utils/wires';
import { rectangleFromDrag, resizeRectangle } from '../src/utils/rectangles';
import { createCurrent, currentWireAnchor } from '../src/annotations/electrical';
import { exportSVG } from '../src/svg/exporter';
import { exportTikz, exportObsidian } from '../src/tikz/exporter';
import { createPersonalBlock, instantiatePersonalBlock } from '../src/personalBlocks/library';
import type { CircuitDocument, CircuitObject } from '../src/model/types';
const doc = (objects: CircuitObject[]): CircuitDocument => ({
  version: 1,
  title: 'Precisione',
  objects,
});
const sourceIds = ['source-1', 'source-2', 'source-3'];
const xs = (d: CircuitDocument) => d.objects.flatMap((o) => (o.kind === 'component' ? [o.x] : []));
const rects = () => [
  createRectangle({ x: 0, y: 0 }, { x: 40, y: 30 }),
  createRectangle({ x: 90, y: 70 }, { x: 170, y: 140 }),
  createRectangle({ x: 300, y: 210 }, { x: 330, y: 260 }),
];
beforeEach(() => {
  useEditorStore.setState({
    document: parallelSources(),
    selection: sourceIds,
    past: [],
    future: [],
    gestureStart: null,
    activeLabel: null,
    snapEnabled: true,
    splittingWireId: null,
  });
  vi.stubGlobal('navigator', {
    clipboard: {
      writeText: vi.fn().mockRejectedValue(Error('denied')),
      readText: vi.fn().mockRejectedValue(Error('denied')),
    },
  });
});
describe('shared geometric commands and connections', () => {
  it('positions horizontal and vertical decorative lines using exact centers without hit padding', () => {
    const horizontal = createLine({ x: 0, y: 220 }, { x: 300, y: 220 });
    const vertical = createLine({ x: 420, y: 100 }, { x: 420, y: 300 });
    const d = doc([horizontal, vertical]);
    expect(objectCenter(horizontal, d)).toEqual({ x: 150, y: 220 });
    expect(objectCenter(vertical, d)).toEqual({ x: 420, y: 200 });
    const moved = positionSelection(d, [horizontal.id], 'y', 240);
    expect(moved.objects[0]).toMatchObject({ start: { x: 0, y: 240 }, end: { x: 300, y: 240 } });
    const aligned = alignSelection(d, [horizontal.id, vertical.id], 'y', 'end');
    expect(aligned.objects[0]).toMatchObject({ start: { y: 300 }, end: { y: 300 } });
  });
  it('distributes three parallel sources by their centers with fixed extremes and one undo', () => {
    const s = useEditorStore.getState(),
      original = s.document;
    s.distribute('x');
    expect(xs(useEditorStore.getState().document)).toEqual([0, 150, 300]);
    expect(useEditorStore.getState().past).toHaveLength(1);
    expect(useEditorStore.getState().document.objects.filter((o) => o.kind === 'junction')).toEqual(
      original.objects.filter((o) => o.kind === 'junction'),
    );
    for (const o of useEditorStore.getState().document.objects)
      if (o.kind === 'wire') {
        const before = original.objects.find((b) => b.id === o.id)!;
        expect(before.kind === 'wire' && before.startEndpoint).toEqual(o.startEndpoint);
        expect(wirePoints(o, useEditorStore.getState().document)[0]).toEqual(
          resolveEndpoint(o.startEndpoint, useEditorStore.getState().document),
        );
      }
    expect(deserializeDocument(serializeDocument(useEditorStore.getState().document))).toEqual(
      useEditorStore.getState().document,
    );
    s.undo();
    expect(useEditorStore.getState().document).toEqual(original);
    s.redo();
    expect(xs(useEditorStore.getState().document)).toEqual([0, 150, 300]);
  });
  it('sets exactly 120 units between centers with the first source fixed', () => {
    useEditorStore.getState().distribute('x', 'centers', 120);
    expect(xs(useEditorStore.getState().document)).toEqual([0, 120, 240]);
    expect(useEditorStore.getState().past).toHaveLength(1);
  });
  it.each(['x', 'y'] as const)(
    'distinguishes center distribution and equal free gaps on %s for different sizes',
    (axis) => {
      const objects = rects(),
        d = doc(objects),
        ids = objects.map((o) => o.id),
        dimension = axis === 'x' ? 'width' : 'height';
      const centered = distributeSelection(d, ids, axis, 'centers').objects.filter(
        (o) => o.kind === 'rectangle',
      );
      const c = centered.map((o) => o[axis] + o[dimension] / 2);
      expect(c[1] - c[0]).toBeCloseTo(c[2] - c[1]);
      const spaced = distributeSelection(d, ids, axis, 'gaps').objects.filter(
        (o) => o.kind === 'rectangle',
      );
      expect(spaced[1][axis] - spaced[0][axis] - spaced[0][dimension]).toBeCloseTo(
        spaced[2][axis] - spaced[1][axis] - spaced[1][dimension],
      );
      expect(spaced[0]).toEqual(objects[0]);
      expect(spaced[2]).toEqual(objects[2]);
    },
  );
  it('distributes components with different symbol sizes using authored bounds', () => {
    const objects = ['resistor', 'voltageSource', 'blackBox'].map((type, i) =>
      createComponent(type as 'resistor' | 'voltageSource' | 'blackBox', { x: i * 170, y: 0 }),
    );
    const d = doc(objects),
      next = distributeSelection(
        d,
        objects.map((o) => o.id),
        'x',
        'gaps',
      );
    const b = next.objects.map((o) => measurementBounds(o, next));
    expect(b[1].x - b[0].x - b[0].width).toBeCloseTo(b[2].x - b[1].x - b[1].width);
  });
  it.each(['x', 'y'] as const)('sets exact free gap on %s', (axis) => {
    const objects = rects(),
      next = distributeSelection(
        doc(objects),
        objects.map((o) => o.id),
        axis,
        'gaps',
        32,
      ),
      size = axis === 'x' ? 'width' : 'height';
    const r = next.objects.filter((o) => o.kind === 'rectangle');
    expect(r[0]).toEqual(objects[0]);
    expect(r[1][axis] - r[0][axis] - r[0][size]).toBe(32);
    expect(r[2][axis] - r[1][axis] - r[1][size]).toBe(32);
  });
  it.each(['x', 'y'] as const)('aligns start, center and end along %s', (axis) => {
    for (const mode of ['start', 'center', 'end'] as const) {
      const objects = rects(),
        next = alignSelection(
          doc(objects),
          objects.map((o) => o.id),
          axis,
          mode,
        ),
        size = axis === 'x' ? 'width' : 'height';
      const values = next.objects
        .filter((o) => o.kind === 'rectangle')
        .map((o) => o[axis] + (mode === 'start' ? 0 : o[size] * (mode === 'center' ? 0.5 : 1)));
      expect(new Set(values).size).toBe(1);
    }
  });
  it('ignores invalid spacing and no-op selections without adding history', () => {
    const s = useEditorStore.getState();
    s.distribute('x', 'centers', NaN);
    s.distribute('x', 'centers', -1);
    s.select([]);
    const count = useEditorStore.getState().past.length;
    s.distribute('x');
    expect(useEditorStore.getState().past).toHaveLength(count);
  });
});
describe('indexed guides, zoom and transient modifiers', () => {
  it.each([0.25, 0.5, 1, 2, 4])(
    'shows true center distances for parallel branches at zoom %s',
    (zoom) => {
      const d = parallelSources([0, 150, 300]),
        feedback = computeMoveGuides(createMoveContext(d, ['source-2']), { x: 0, y: 0 }, zoom);
      expect(feedback.distances.map((g) => g.value)).toEqual([150, 150]);
      expect(feedback.distances.every((g) => g.equal && g.measurement === 'centers')).toBe(true);
    },
  );
  it.each([0.5, 1, 2])(
    'snaps an isolated parallel source midpoint within seven screen pixels at zoom %s',
    (zoom) => {
      const d = doc(parallelSources([0, 130, 300]).objects.filter((o) => o.kind === 'component'));
      const context = createMoveContext(d, ['source-2']);
      const result = computeMoveGuides(context, { x: 20 + 5 / zoom, y: 0 }, zoom);
      expect(result.delta.x).toBeCloseTo(20);
      expect(result.distances.map((g) => g.value)).toEqual([150, 150]);
    },
  );
  it('retains geometry and suppresses all snap feedback when snapping is temporarily disabled', () => {
    const context = createMoveContext(parallelSources(), ['source-2']),
      raw = { x: 13.5, y: 4.25 };
    expect(computeMoveGuides(context, raw, 3, true)).toEqual({
      delta: raw,
      alignment: {},
      target: null,
      distances: [],
    });
  });
  it('provides center measurements in detailed mode without snapping keyboard precision', () => {
    const context = createMoveContext(
      doc(parallelSources().objects.filter((o) => o.kind === 'component')),
      ['source-2'],
    );
    const result = computeMoveGuides(context, { x: 1, y: 0 }, 2, false, true, true);
    expect(result.delta).toEqual({ x: 1, y: 0 });
    expect(result.distances.some((g) => g.measurement === 'centers')).toBe(true);
  });
});
describe('stroke styles, split continuity and export', () => {
  it.each(['solid', 'dashed', 'dotted'] as const)(
    'keeps electrical endpoints and route when changing wire style to %s',
    (lineStyle) => {
      const wire = createWire(
          { kind: 'free', point: { x: 0, y: 0 } },
          { kind: 'free', point: { x: 200, y: 0 } },
        ),
        d = doc([wire]),
        styled = { ...wire, lineStyle };
      expect(wirePoints(styled, d)).toEqual(wirePoints(wire, d));
      expect(deserializeDocument(serializeDocument(doc([styled]))).objects[0]).toEqual(styled);
      const svg = exportSVG(doc([styled]));
      expect(svg.includes('stroke-dasharray')).toBe(lineStyle !== 'solid');
      for (const exportDoc of [exportTikz, exportObsidian])
        expect(exportDoc(doc([styled])).includes('dash pattern=')).toBe(lineStyle !== 'solid');
    },
  );
  it('reads old wire documents as continuous', () => {
    const wire = createWire(
      { kind: 'free', point: { x: 0, y: 0 } },
      { kind: 'free', point: { x: 100, y: 0 } },
    );
    const old = deserializeDocument(serializeDocument(doc([wire])));
    expect(exportSVG(old)).not.toContain('stroke-dasharray');
  });
  it('splits a connected wire into independently styled fragments and rebinds its current', () => {
    const d = parallelSources(),
      wire = d.objects.find((o) => o.id === 'extension-0')!;
    if (wire.kind !== 'wire') throw Error();
    const current = createCurrent(wire, { x: 375, y: -100 }, d),
      source = { ...d, objects: [...d.objects, current] };
    const result = splitWireAtPoint(source, wire.id, { x: 350, y: -100 })!;
    const next = {
      ...result.doc,
      objects: result.doc.objects.map((o) =>
        o.id === result.secondId ? { ...o, lineStyle: 'dashed' as const } : o,
      ),
    };
    const first = next.objects.find((o) => o.id === wire.id)!,
      second = next.objects.find((o) => o.id === result.secondId)!;
    expect(first.kind === 'wire' && first.startEndpoint).toEqual(wire.startEndpoint);
    expect(first.kind === 'wire' && second.kind === 'wire' && first.endEndpoint).toEqual(
      second.kind === 'wire' && second.startEndpoint,
    );
    const annotation = next.objects.find((o) => o.id === current.id)!;
    expect(annotation.kind === 'electrical' && annotation.wireId).toBe(result.secondId);
    expect(annotation.kind === 'electrical' && currentWireAnchor(annotation, next)).toEqual({
      x: 375,
      y: -100,
    });
    expect(exportSVG(next)).toContain('stroke-dasharray');
    expect(deserializeDocument(serializeDocument(next))).toEqual(next);
  });
  it('refuses a style split at an unrelated crossing so no junction is introduced', () => {
    const a = createWire(
        { kind: 'free', point: { x: 0, y: 0 } },
        { kind: 'free', point: { x: 200, y: 0 } },
      ),
      b = createWire(
        { kind: 'free', point: { x: 100, y: -100 } },
        { kind: 'free', point: { x: 100, y: 100 } },
      ),
      d = doc([a, b]);
    expect(splitWireAtPoint(d, a.id, { x: 100, y: 0 })).toBeNull();
    expect(d.objects).toHaveLength(2);
  });
  it('decorative lines cannot be snapped as electrical targets or alter topology', () => {
    const line = { ...createLine({ x: 0, y: 0 }, { x: 200, y: 0 }), lineStyle: 'dotted' as const },
      d = doc([line]);
    expect(nearestTarget({ x: 100, y: 0 }, d, 20)).toBeNull();
    expect(d.objects.some((o) => o.kind === 'junction')).toBe(false);
    expect(exportSVG(d)).toContain('stroke-dasharray="0 6"');
  });
  it('validates invalid dash styles, nonfinite lengths and negative rectangle geometry', () => {
    const r = createRectangle({ x: 0, y: 0 }, { x: 100, y: 60 });
    for (const patch of [
      { width: -1 },
      { height: 0 },
      { fillOpacity: 1.1 },
      { lineStyle: 'bad' },
      { dashLength: 0 },
      { dashGap: 1e6 },
    ])
      expect(() =>
        deserializeDocument(JSON.stringify(doc([{ ...r, ...patch } as CircuitObject]))),
      ).toThrow();
  });
});
describe('rectangles, transforms, reuse and persistence', () => {
  it.each([
    [100, 80, 0, 0],
    [0, 80, 100, 0],
    [100, 0, 0, 80],
    [0, 0, 100, 80],
  ])('normalizes drawing direction (%s,%s) → (%s,%s)', (x, y, bx, by) => {
    expect(rectangleFromDrag({ x, y }, { x: bx, y: by })).toMatchObject({
      x: 0,
      y: 0,
      width: 100,
      height: 80,
      fill: 'none',
    });
  });
  it('supports square drawing from center and normalized resize through the opposite corner', () => {
    expect(rectangleFromDrag({ x: 100, y: 100 }, { x: 130, y: 150 }, true, true)).toMatchObject({
      x: 50,
      y: 50,
      width: 100,
      height: 100,
    });
    const r = createRectangle({ x: 0, y: 0 }, { x: 100, y: 80 });
    expect(resizeRectangle(r, 'rectNW', { x: 150, y: 120 })).toMatchObject({
      id: r.id,
      x: 100,
      y: 80,
      width: 50,
      height: 40,
      fill: 'none',
    });
  });
  it('preserves independent fill and outline opacity in SVG, TikZ, Obsidian and JSON', () => {
    const r = {
      ...createRectangle({ x: 0, y: 0 }, { x: 100, y: 80 }),
      fill: '#2463cb',
      fillOpacity: 0.25,
      opacity: 0.75,
      lineStyle: 'dashed' as const,
      dashLength: 9,
      dashGap: 3,
    };
    const d = doc([r]);
    const svg = exportSVG(d);
    expect(svg).toContain('fill-opacity="0.25"');
    expect(svg).toContain('opacity="0.75"');
    expect(svg).toContain('stroke-dasharray="9 3"');
    for (const out of [exportTikz(d), exportObsidian(d)]) {
      expect(out).toContain('fill opacity=0.25');
      expect(out).toContain('opacity=0.75');
      expect(out).toContain('rectangle');
      expect(out).not.toMatch(/handle|distance-guide|selection-box/);
    }
    expect(deserializeDocument(serializeDocument(d))).toEqual(d);
  });
  it('duplicates, moves and rotates rectangles inside personal blocks with fresh IDs', () => {
    const r = createRectangle({ x: 0, y: 0 }, { x: 100, y: 80 }),
      line = createLine({ x: 0, y: 0 }, { x: 100, y: 80 }),
      d = doc([r, line]);
    const copies = cloneObjects(d, { x: 40, y: 40 });
    expect(copies[0]).toMatchObject({ x: 40, y: 40, width: 100, height: 80 });
    expect(copies[0].id).not.toBe(r.id);
    const block = createPersonalBlock(d, [r.id, line.id], 'Graphic');
    const inserted = instantiatePersonalBlock(block, { x: 0, y: 0 }, 90, d);
    expect(inserted.find((o) => o.kind === 'rectangle')).toMatchObject({ width: 80, height: 100 });
    expect(deserializeDocument(serializeDocument(doc(inserted))).objects).toHaveLength(2);
  });
});
describe('atomic cut and fallback clipboard', () => {
  it('cuts a single connected component, freezes dangling endpoints, then pastes fresh IDs', async () => {
    const s = useEditorStore.getState();
    s.select(['source-2']);
    const original = s.document;
    expect(await s.cut()).toBe(true);
    const next = useEditorStore.getState();
    expect(next.document.objects.some((o) => o.id === 'source-2')).toBe(false);
    expect(next.past).toHaveLength(1);
    expect(() => deserializeDocument(serializeDocument(next.document))).not.toThrow();
    await s.paste();
    const added = useEditorStore.getState().document.objects.at(-1)!;
    expect(added.kind).toBe('component');
    expect(added.id).not.toBe('source-2');
    s.undo();
    s.undo();
    expect(useEditorStore.getState().document).toEqual(original);
    s.redo();
    expect(useEditorStore.getState().document.objects.some((o) => o.id === 'source-2')).toBe(false);
  });
  it('cuts and pastes a complex circuit with internal endpoints, annotations and rectangles', async () => {
    const s = useEditorStore.getState(),
      r = createRectangle({ x: -60, y: -140 }, { x: 440, y: 140 }),
      line = createLine({ x: -50, y: -120 }, { x: 430, y: -120 }),
      text = createTextAnnotation({ x: 0, y: 200 }, 'Testo');
    const source = { ...s.document, objects: [...s.document.objects, r, line, text] };
    useEditorStore.setState({ document: source, selection: source.objects.map((o) => o.id) });
    expect(await s.cut()).toBe(true);
    expect(useEditorStore.getState().document.objects).toEqual([]);
    expect(useEditorStore.getState().past).toHaveLength(1);
    await s.paste();
    const pasted = useEditorStore.getState().document;
    expect(pasted.objects).toHaveLength(source.objects.length);
    expect(new Set(pasted.objects.map((o) => o.id)).size).toBe(source.objects.length);
    expect(pasted.objects.every((o) => !source.objects.some((p) => p.id === o.id))).toBe(true);
    expect(deserializeDocument(serializeDocument(pasted))).toEqual(pasted);
  });
  it('does not delete when a valid serialized copy cannot be created', async () => {
    const r = createRectangle({ x: 0, y: 0 }, { x: 20, y: 20 });
    useEditorStore.setState({ document: doc([{ ...r, width: -1 }]), selection: [r.id] });
    expect(await useEditorStore.getState().cut()).toBe(false);
    expect(useEditorStore.getState().document.objects).toHaveLength(1);
    expect(useEditorStore.getState().past).toHaveLength(0);
  });
  it('deletes the captured selection before async clipboard confirmation, never a later selection', async () => {
    let resolve: () => void = () => {};
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: () =>
          new Promise<void>((r) => {
            resolve = r;
          }),
      },
    });
    const s = useEditorStore.getState();
    s.select(['source-1']);
    const pending = s.cut();
    s.select(['source-3']);
    resolve();
    await pending;
    expect(useEditorStore.getState().document.objects.some((o) => o.id === 'source-3')).toBe(true);
    expect(useEditorStore.getState().selection).toEqual(['source-3']);
  });
  it('extracts only chosen wires and detaches external endpoint references', () => {
    const d = parallelSources(),
      wire = d.objects.find((o) => o.kind === 'wire')!,
      copied = extractSelection(d, [wire.id]);
    expect(deserializeDocument(serializeDocument(copied)).objects[0]).toMatchObject({
      startEndpoint: { kind: 'free' },
      endEndpoint: { kind: 'free' },
    });
    expect(
      moveSelection(d, ['source-2'], { x: 40, y: 0 }).objects.filter((o) => o.kind === 'junction'),
    ).toEqual(d.objects.filter((o) => o.kind === 'junction'));
  });
});
