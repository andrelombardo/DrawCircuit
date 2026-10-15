import { exportObsidian } from './helpers/unoptimizedObsidian';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import {
  createCurrent,
  electricalGeometry,
  electricalDrawingGeometry,
} from '../src/annotations/electrical';
import { ElectricalView } from '../src/circuit/annotations/ElectricalView';
import { emptyDocument } from '../src/model/demo';
import { createComponent } from '../src/model/catalog';
import { createWire } from '../src/model/factories';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import type { CircuitDocument, ElectricalAnnotation, Point } from '../src/model/types';
import type { PlacementPreview } from '../src/smartPlacement/types';
import { createPersonalBlock, instantiatePersonalBlock } from '../src/personalBlocks/library';
import { findInlineCandidate } from '../src/smartPlacement/findCandidates';
import { smartPlacement } from '../src/smartPlacement/smartConnection';
import { useEditorStore } from '../src/store/editorStore';
import { exportSVG } from '../src/svg/exporter';
import { exportTikz } from '../src/tikz/exporter';
import { getExportSelection } from '../src/tikz/selection';
import { add, moveObject, pointsPath, rotatePoint, wirePoints } from '../src/utils/geometry';
import {
  cloneObjects,
  extractSelection,
  moveSelection,
  rotateObjects,
} from '../src/utils/operations';
import { insertJunction, normalizeDocumentWires } from '../src/utils/wires';

function fixture(placement: 'external' | 'inline' = 'inline', end: Point = { x: 400, y: 0 }) {
  const wire = createWire({ kind: 'free', point: { x: 0, y: 0 } }, { kind: 'free', point: end });
  const source = { ...emptyDocument(), objects: [wire] };
  const annotation = createCurrent(wire, { x: end.x / 2, y: end.y / 2 }, source);
  annotation.currentPlacement = placement;
  const doc: CircuitDocument = { ...source, objects: [wire, annotation] };
  return { wire, annotation, doc };
}

describe('external and integrated current use one wire-associated annotation', () => {
  it('migrates legacy currents to integrated rendering without losing source metadata', () => {
    const { annotation, doc } = fixture('external');
    const legacy = { ...annotation, currentPlacement: undefined, wireSegment: undefined };
    const original = serializeDocument({ ...doc, objects: [doc.objects[0], legacy] });
    const loaded = deserializeDocument(original);
    expect(loaded.objects[1]).toEqual({
      ...JSON.parse(original).objects[1],
      currentPlacement: 'inline',
    });
    expect(electricalGeometry(legacy, doc)).toEqual(electricalGeometry(annotation, doc));
    expect(electricalGeometry(legacy, doc).start.y).toBe(0);
  });

  it.each([
    { x: 400, y: 0 },
    { x: 0, y: 400 },
    { x: -400, y: 0 },
    { x: 0, y: -400 },
    { x: 400, y: 400 },
  ])('centers an integrated arrow on its chosen branch and reverses there: %j', (end) => {
    const { annotation, wire, doc } = fixture('inline', end);
    const before = serializeDocument(doc);
    const route = wirePoints(wire, doc);
    const geometry = electricalGeometry(annotation, doc);
    expect(geometry.inline).toBe(true);
    expect(geometry.arrowEnd).toEqual({ x: end.x / 2, y: end.y / 2 });
    const reverse = electricalGeometry({ ...annotation, reversed: true }, doc);
    expect(reverse.arrowEnd).toEqual(geometry.arrowEnd);
    expect(reverse.arrowStart).toEqual(geometry.end);
    const head = electricalDrawingGeometry(annotation, doc).head;
    expect(exportSVG(doc)).toContain(`d="${pointsPath(head)}"`);
    expect(serializeDocument(doc)).toBe(before);
    expect(wirePoints(wire, doc)).toEqual(route);
  });

  it('follows the chosen segment when earlier or later route lengths change', () => {
    const wire = createWire(
      { kind: 'free', point: { x: 0, y: 0 } },
      { kind: 'free', point: { x: 400, y: 200 } },
      [
        { x: 200, y: 0 },
        { x: 200, y: 200 },
      ],
    );
    const source = { ...emptyDocument(), objects: [wire] };
    const annotation = createCurrent(wire, { x: 200, y: 100 }, source);
    expect(annotation.wireSegment).toEqual({ index: 1, ratio: 0.5 });
    const resized = {
      ...wire,
      endEndpoint: { kind: 'free' as const, point: { x: 1000, y: 400 } },
      vertices: [
        { x: 300, y: 0 },
        { x: 300, y: 400 },
      ],
    };
    const doc = { ...source, objects: [resized, annotation] };
    expect(electricalGeometry(annotation, doc).arrowEnd).toEqual({ x: 300, y: 200 });
    const moved = moveObject(resized, { x: 80, y: -20 }, new Set());
    expect(
      electricalGeometry(annotation, { ...doc, objects: [moved, annotation] }).arrowEnd,
    ).toEqual({ x: 380, y: 180 });
  });

  it('keeps integrated arrows on the line while their labels retain independent offsets', () => {
    const { annotation, doc } = fixture();
    const moved = {
      ...annotation,
      offset: { x: 40, y: 80 },
      label: {
        ...annotation.label,
        offset: { x: 8, y: 12 },
      },
    };
    const geometry = electricalGeometry(moved, doc);
    expect(geometry.arrowEnd).toEqual({ x: 240, y: 0 });
    expect(geometry.labelPoint).toEqual({ x: 248, y: 36 });
    const far = electricalGeometry({ ...annotation, offset: { x: 2000, y: 500 } }, doc);
    expect(far.arrowEnd).toEqual({ x: 370, y: 0 });
  });

  it('keeps the same branch when a waypoint edit removes earlier routed segments', () => {
    const wire = createWire(
      { kind: 'free', point: { x: 0, y: 0 } },
      { kind: 'free', point: { x: 400, y: 400 } },
      [
        { x: 100, y: 0 },
        { x: 100, y: 200 },
        { x: 200, y: 200 },
        { x: 200, y: 400 },
      ],
    );
    const source = { ...emptyDocument(), objects: [wire] };
    const annotation = createCurrent(wire, { x: 200, y: 300 }, source);
    const doc = { ...source, objects: [wire, annotation] };
    expect(annotation.wireSegment).toEqual({ index: 3, ratio: 0.5 });
    useEditorStore.setState({ document: doc, past: [], future: [], gestureStart: null });
    const store = useEditorStore.getState();
    store.beginGesture();
    store.preview({ ...doc, objects: [{ ...wire, vertices: [{ x: 200, y: 400 }] }, annotation] });
    const edited = useEditorStore.getState().document;
    const after = edited.objects[1] as ElectricalAnnotation;
    expect(after.wireSegment).toEqual({ index: 1, ratio: 0.75 });
    expect(electricalGeometry(after, edited).arrowEnd).toEqual({ x: 200, y: 300 });
    store.endGesture();
    store.undo();
    expect(useEditorStore.getState().document).toEqual(doc);
    store.redo();
    expect(useEditorStore.getState().document).toEqual(edited);
  });

  it('preserves placement when redundant collinear waypoints are normalized', () => {
    const wire = createWire(
      { kind: 'free', point: { x: 0, y: 0 } },
      { kind: 'free', point: { x: 400, y: 0 } },
      [{ x: 100, y: 0 }],
    );
    const source = { ...emptyDocument(), objects: [wire] };
    const annotation = createCurrent(wire, { x: 200, y: 0 }, source);
    const doc = { ...source, objects: [wire, annotation] };
    expect(annotation.wireSegment?.index).toBe(1);
    const normalized = normalizeDocumentWires(doc);
    const after = normalized.objects[1] as ElectricalAnnotation;
    expect(after.wireSegment?.index).toBe(0);
    expect(electricalGeometry(after, normalized)).toEqual(electricalGeometry(annotation, doc));
  });

  it.each([
    { placement: 'inline' as const, includeCurrent: true },
    { placement: 'external' as const, includeCurrent: true },
    { placement: 'inline' as const, includeCurrent: false },
    { placement: 'external' as const, includeCurrent: false },
  ])(
    'keeps the transformed branch in a mixed 45° group rotation: %j',
    ({ placement, includeCurrent }) => {
      const { annotation, wire, doc: base } = fixture(placement);
      annotation.wireSegment = { index: 0, ratio: 0.75 };
      annotation.ratio = 0.75;
      // Freeze the initial visible baseline, as with insertion at this position.
      const initial = electricalGeometry(annotation, base);
      annotation.start = initial.start;
      annotation.end = initial.end;
      const resistor = createComponent('resistor', { x: 200, y: -100 });
      const doc = { ...base, objects: [...base.objects, resistor] };
      const selection = [wire.id, resistor.id, ...(includeCurrent ? [annotation.id] : [])];
      const rotated = rotateObjects(doc, selection);
      const component = rotated.objects.find((o) => o.id === resistor.id)!;
      if (component.kind !== 'component') throw new Error('Missing rotated component');
      // The branch point receives the same rigid transform as the component.
      const branchPoint = add(component, rotatePoint({ x: 100, y: 100 }, 45));
      const rotatedWire = rotated.objects.find((o) => o.id === wire.id)!;
      if (rotatedWire.kind !== 'wire') throw new Error('Missing rotated wire');
      expect(wirePoints(rotatedWire, rotated).length).toBeGreaterThan(wirePoints(wire, doc).length);
      const expected = createCurrent(rotatedWire, branchPoint, rotated);
      useEditorStore.setState({ document: doc, past: [], future: [], gestureStart: null });
      const store = useEditorStore.getState();
      store.commit(rotated);
      const committed = useEditorStore.getState().document;
      const after = committed.objects.find((o) => o.id === annotation.id) as ElectricalAnnotation;
      expect(after.wireSegment).toEqual(expected.wireSegment);
      expect(electricalGeometry(after, committed)).toEqual(electricalGeometry(expected, rotated));
      store.undo();
      expect(useEditorStore.getState().document).toEqual(doc);
      store.redo();
      expect(useEditorStore.getState().document).toEqual(committed);

      const beforeMove = electricalGeometry(after, committed);
      const delta = { x: 40, y: 60 };
      store.beginGesture();
      store.preview(moveSelection(committed, [wire.id, annotation.id], delta));
      const moved = useEditorStore.getState().document;
      const movedCurrent = moved.objects.find(
        (o) => o.id === annotation.id,
      ) as ElectricalAnnotation;
      const movedGeometry = electricalGeometry(movedCurrent, moved);
      expect(movedGeometry.start).toEqual(add(beforeMove.start, delta));
      expect(movedGeometry.end).toEqual(add(beforeMove.end, delta));
      expect(movedGeometry.arrowEnd).toEqual(add(beforeMove.arrowEnd, delta));
      store.cancelGesture();
      expect(useEditorStore.getState().document).toEqual(committed);
    },
  );

  it.each(['external', 'inline'] as const)(
    'reconciles repeated %s wire-handle previews from the gesture origin',
    (placement) => {
      const { annotation, wire, doc } = fixture(placement);
      annotation.wireSegment = { index: 0, ratio: 0.75 };
      annotation.ratio = 0.75;
      useEditorStore.setState({ document: doc, past: [], future: [], gestureStart: null });
      const store = useEditorStore.getState();
      store.beginGesture();
      for (const point of [
        { x: 400, y: 200 },
        { x: 600, y: 200 },
      ]) {
        const editedWire = { ...wire, endEndpoint: { kind: 'free' as const, point } };
        const preview = { ...doc, objects: [editedWire, annotation] };
        const expected = createCurrent(editedWire, { x: 300, y: 0 }, preview);
        store.preview(preview);
        const actual = useEditorStore.getState().document;
        const current = actual.objects[1] as ElectricalAnnotation;
        expect(current.wireSegment).toEqual(expected.wireSegment);
        expect(electricalGeometry(current, actual)).toEqual(electricalGeometry(expected, preview));
      }
      store.cancelGesture();
      expect(useEditorStore.getState().document).toEqual(doc);
    },
  );

  it.each(['inline-insertion', 'snapped-connection'] as const)(
    'keeps both currents on a later vertical branch when %s splits an earlier segment',
    (workflow) => {
      const wire = createWire(
        { kind: 'free', point: { x: -100, y: 20 } },
        { kind: 'free', point: { x: 340, y: 20 } },
        [
          { x: 40, y: 20 },
          { x: 40, y: 100 },
          { x: 260, y: 100 },
          { x: 260, y: 20 },
        ],
      );
      const source = { ...emptyDocument(), objects: [wire] };
      const external = createCurrent(wire, { x: 260, y: 60 }, source);
      const inline = createCurrent(wire, { x: 260, y: 60 }, source);
      const doc = { ...source, objects: [wire, external, inline] };
      for (const current of [external, inline])
        expect(current.wireSegment).toEqual({ index: 3, ratio: 0.5 });
      const originalGeometry = [external, inline].map((current) =>
        electricalGeometry(current, doc),
      );
      const points = wirePoints(wire, doc);
      let preview: PlacementPreview;
      if (workflow === 'inline-insertion') {
        const candidate = findInlineCandidate(doc, 'resistor', { x: 150, y: 100 }, 0, 1)!;
        expect(candidate.segment.segment).toBe(2);
        preview = {
          phase: 'inline-candidate',
          candidate,
          position: candidate.position,
          rotation: candidate.rotation,
          guides: [],
        };
      } else {
        const terminalId = createComponent('resistor', { x: 0, y: 0 }).terminals[0].id;
        preview = {
          phase: 'snapped',
          position: { x: 150, y: 100 },
          rotation: 0,
          guides: [],
          candidate: {
            key: wire.id + ':2',
            kind: 'wire',
            terminalId,
            point: { x: 110, y: 100 },
            distance: 0,
            segment: { key: wire.id + ':2', wire, points, segment: 2, a: points[2], b: points[3] },
          },
        };
      }
      const result = smartPlacement(doc, 'resistor', preview).doc;
      for (const [i, current] of [external, inline].entries()) {
        const after = result.objects.find((o) => o.id === current.id) as ElectricalAnnotation;
        expect(after.wireId).not.toBe(wire.id);
        expect(after.currentPlacement).toBe(current.currentPlacement);
        expect(electricalGeometry(after, result)).toEqual(originalGeometry[i]);
        expect(after.wireSegment?.index).not.toBe(current.wireSegment?.index);
      }
      expect(deserializeDocument(serializeDocument(result))).toEqual(result);
      useEditorStore.setState({ document: doc, past: [], future: [], gestureStart: null });
      const store = useEditorStore.getState();
      store.commit(result);
      expect(useEditorStore.getState().document).toEqual(result);
      store.undo();
      expect(useEditorStore.getState().document).toEqual(doc);
      store.redo();
      const redone = useEditorStore.getState().document;
      expect(redone).toEqual(result);
      for (const [i, current] of [external, inline].entries()) {
        const after = redone.objects.find((o) => o.id === current.id) as ElectricalAnnotation;
        expect(electricalGeometry(after, redone)).toEqual(originalGeometry[i]);
      }
    },
  );

  it.each(['external', 'inline'] as const)(
    'remaps %s current on junction split and component insertion',
    (placement) => {
      const { annotation, wire, doc } = fixture(placement);
      annotation.wireSegment = { index: 0, ratio: 0.75 };
      annotation.ratio = 0.75;
      annotation.reversed = true;
      annotation.offset = { x: 20, y: 40 };
      annotation.label.offset = { x: 9, y: -11 };
      const geometry = electricalGeometry(annotation, doc);
      const split = insertJunction(doc, { x: 100, y: 0 }).doc;
      const after = split.objects.find((o) => o.id === annotation.id) as ElectricalAnnotation;
      expect(after.wireId).not.toBe(wire.id);
      expect(after.currentPlacement).toBe(placement);
      expect(after.wireSegment?.index).toBe(0);
      expect(electricalGeometry(after, split)).toEqual(geometry);
      const candidate = findInlineCandidate(doc, 'resistor', { x: 100, y: 0 }, 0, 1)!;
      const inserted = smartPlacement(doc, 'resistor', {
        phase: 'inline-candidate',
        candidate,
        position: candidate.position,
        rotation: candidate.rotation,
        guides: [],
      }).doc;
      const insertedCurrent = inserted.objects.find(
        (o) => o.id === annotation.id,
      ) as ElectricalAnnotation;
      expect(insertedCurrent.currentPlacement).toBe(placement);
      expect(electricalGeometry(insertedCurrent, inserted)).toEqual(geometry);
      expect(deserializeDocument(serializeDocument(inserted))).toEqual({
        ...inserted,
        objects: inserted.objects.map((o) =>
          o.kind === 'electrical' && o.mode === 'current'
            ? { ...o, currentPlacement: 'inline' }
            : o,
        ),
      });
    },
  );

  it('round-trips placement, direction and segment through JSON, copy, duplicate and personal blocks', () => {
    const { annotation, wire, doc } = fixture();
    annotation.reversed = true;
    expect(deserializeDocument(serializeDocument(doc))).toEqual(doc);
    const copied = extractSelection(doc, [wire.id, annotation.id]);
    const clones = cloneObjects(copied, { x: 80, y: 60 });
    const clone = clones.find((o) => o.kind === 'electrical') as ElectricalAnnotation;
    const cloneWire = clones.find((o) => o.kind === 'wire')!;
    expect(clone.wireId).toBe(cloneWire.id);
    expect(clone.wireSegment).toEqual(annotation.wireSegment);
    expect(clone.currentPlacement).toBe('inline');
    expect(electricalGeometry(clone, { ...doc, objects: clones }).arrowEnd).toEqual({
      x: 280,
      y: 60,
    });
    const block = createPersonalBlock(doc, [wire.id, annotation.id], 'Corrente integrata');
    const objects = instantiatePersonalBlock(block, { x: 600, y: 400 }, 90, emptyDocument());
    const inserted = objects.find((o) => o.kind === 'electrical') as ElectricalAnnotation;
    expect(inserted.currentPlacement).toBe('inline');
    expect(inserted.reversed).toBe(true);
    expect(inserted.wireSegment).toEqual(annotation.wireSegment);
    const saved = serializeDocument({ ...doc, objects });
    expect(serializeDocument(deserializeDocument(saved))).toBe(saved);
  });

  it('undoes and redoes placement, direction and wire edits through the existing store history', () => {
    const { annotation, wire, doc } = fixture('external');
    useEditorStore.setState({ document: doc, past: [], future: [], gestureStart: null });
    const store = useEditorStore.getState();
    store.update(annotation.id, (o) =>
      o.kind === 'electrical' ? { ...o, currentPlacement: 'inline' } : o,
    );
    const inline = useEditorStore.getState().document;
    store.update(annotation.id, (o) => (o.kind === 'electrical' ? { ...o, reversed: true } : o));
    const reversed = useEditorStore.getState().document;
    store.update(wire.id, (o) => moveObject(o, { x: 40, y: 60 }, new Set()));
    const moved = useEditorStore.getState().document;
    store.undo();
    expect(useEditorStore.getState().document).toEqual(reversed);
    store.undo();
    expect(useEditorStore.getState().document).toEqual(inline);
    store.undo();
    expect(useEditorStore.getState().document).toEqual(doc);
    store.redo();
    store.redo();
    store.redo();
    expect(useEditorStore.getState().document).toEqual(moved);
    const current = moved.objects.find((o) => o.id === annotation.id) as ElectricalAnnotation;
    expect(electricalGeometry(current, moved).arrowEnd).toEqual({ x: 240, y: 60 });
  });

  it('uses the same wire replacement shaft and head in canvas, SVG, PNG, TikZ and Obsidian', () => {
    const { annotation, doc } = fixture();
    annotation.label.text = '';
    const markup = renderToStaticMarkup(<ElectricalView object={annotation} doc={doc} hideLabel />);
    expect(markup).toContain('data-current-placement="inline"');
    expect(markup.match(/<path /g)).toHaveLength(3); // hit corridor + shaft + head
    const svg = exportSVG(doc);
    expect(svg.match(/<path /g)).toHaveLength(3); // split visual wire + shaft + head
    expect(svg).not.toContain('stroke="white"');
    expect(svg).not.toContain('transparent');
    const png = new Resvg(svg).render();
    expect([...png.asPng().slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    let red = 0,
      ink = 0;
    const pixels = png.pixels;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > pixels[i + 1] * 1.5 && pixels[i + 1] < 140) red++;
      if (pixels[i] < 80 && pixels[i + 1] < 80 && pixels[i + 2] < 80) ink++;
    }
    expect(red).toBeGreaterThan(10);
    expect(ink).toBeGreaterThan(100);
    for (const output of [exportTikz(doc), exportObsidian(doc)]) {
      const electrical = output
        .split('% Electrical annotation: current')[1]
        .split('\\end{circuitikz}')[0];
      expect(electrical.match(/\\draw\[/g)).toHaveLength(2);
    }
    annotation.currentPlacement = 'external';
    expect(exportSVG(doc).match(/<path /g)).toHaveLength(3);
  });

  it('preserves an integrated arrow when only the annotation is exported', () => {
    const { annotation, doc } = fixture();
    annotation.offset = { x: 20, y: 40 };
    const geometry = electricalDrawingGeometry(annotation, doc);
    const subset = getExportSelection(doc, [annotation.id]);
    const detached = subset.objects[0] as ElectricalAnnotation;
    expect(detached.wireId).toBeUndefined();
    expect(detached.wireSegment).toBeUndefined();
    const actual = electricalDrawingGeometry(detached, subset);
    expect(actual.inline).toBe(true);
    expect(actual.end.x - actual.start.x).toBe(geometry.end.x - geometry.start.x);
    expect(actual.arrowEnd.x - actual.arrowStart.x).toBe(
      geometry.arrowEnd.x - geometry.arrowStart.x,
    );
    expect(actual.labelPoint.y - actual.arrowEnd.y).toBe(
      geometry.labelPoint.y - geometry.arrowEnd.y,
    );
    expect(deserializeDocument(serializeDocument(subset))).toEqual(subset);
    expect(exportSVG(subset)).toContain('stroke="' + annotation.color + '"');
  });

  it.each([
    { currentPlacement: 'inside' },
    { wireSegment: { index: -1, ratio: 0.5 } },
    { wireSegment: { index: 0.5, ratio: 0.5 } },
    { wireSegment: { index: 0, ratio: 1.1 } },
    { wireSegment: { index: 0, ratio: '0.5' } },
    { currentPlacement: 'inline', mode: 'voltage' },
  ])('rejects malformed current placement or association: %j', (invalid) => {
    const { annotation, wire, doc } = fixture();
    expect(() =>
      deserializeDocument(
        JSON.stringify({
          ...doc,
          objects: [wire, { ...annotation, ...invalid }],
        }),
      ),
    ).toThrow();
  });
});
