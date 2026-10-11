import { describe, expect, it } from 'vitest';
import {
  createCurrent,
  currentWireAnchor,
  electricalGeometry,
} from '../src/annotations/electrical';
import { emptyDocument } from '../src/model/demo';
import { createWire } from '../src/model/factories';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import type { ElectricalAnnotation, Point } from '../src/model/types';
import { findInlineCandidate } from '../src/smartPlacement/findCandidates';
import { smartPlacement } from '../src/smartPlacement/smartConnection';
import { useEditorStore } from '../src/store/editorStore';
import { insertJunction } from '../src/utils/wires';

describe('current annotations survive existing wire splitting workflows', () => {
  it.each([
    { end: { x: 400, y: 0 }, current: { x: 300, y: 0 }, cut: { x: 200, y: 0 } },
    { end: { x: 0, y: 400 }, current: { x: 0, y: 300 }, cut: { x: 0, y: 200 } },
    { end: { x: -400, y: 0 }, current: { x: -300, y: 0 }, cut: { x: -200, y: 0 } },
    { end: { x: 0, y: -400 }, current: { x: 0, y: -300 }, cut: { x: 0, y: -200 } },
  ])(
    'preserves a current on the latter branch after inline insertion: $end',
    ({ end, current, cut }) => {
      const wire = createWire(
        { kind: 'free', point: { x: 0, y: 0 } },
        { kind: 'free', point: end },
      );
      const doc = { ...emptyDocument(), objects: [wire] };
      const annotation = createCurrent(wire, current, doc);
      annotation.reversed = true;
      annotation.label.text = 'i_{AB}';
      annotation.label.offset = { x: 13, y: -7 };
      annotation.offset = { x: 20, y: 40 };
      const original = { ...doc, objects: [wire, annotation] };
      const anchor = currentWireAnchor(annotation, original);
      const candidate = findInlineCandidate(original, 'resistor', cut, 0, 1)!;
      expect(candidate).not.toBeNull();
      const { doc: inserted } = smartPlacement(original, 'resistor', {
        phase: 'inline-candidate',
        candidate,
        position: candidate.position,
        rotation: candidate.rotation,
        guides: [],
      });
      const after = inserted.objects.find((o) => o.id === annotation.id) as ElectricalAnnotation;
      expect(after.wireId).not.toBe(wire.id);
      expect(after).toMatchObject({
        id: annotation.id,
        reversed: true,
        label: annotation.label,
        offset: annotation.offset,
      });
      const actual = electricalGeometry(after, inserted);
      // Integrated currents are clamped within the shortened host segment.
      expect(actual.inline).toBe(true);
      expect(currentWireAnchor(after, inserted)).toEqual(anchor);
      // Visual clamping must not change the semantic attachment or its drag offset.
      expect(actual.arrowEnd).toEqual({
        x: end.x ? (end.x > 0 ? 320 : -280) : 0,
        y: end.y ? (end.y > 0 ? 340 : -270) : 0,
      });
      expect(deserializeDocument(serializeDocument(inserted))).toEqual(inserted);
      useEditorStore.setState({ document: original, past: [], future: [], gestureStart: null });
      useEditorStore.getState().commit(inserted);
      useEditorStore.getState().undo();
      expect(useEditorStore.getState().document).toEqual(original);
      useEditorStore.getState().redo();
      expect(useEditorStore.getState().document).toEqual(inserted);
    },
  );

  it.each([
    { x: 100, y: 0 },
    { x: 300, y: 0 },
  ] as Point[])('preserves current geometry for Quick Junction on either side: %j', (point) => {
    const wire = createWire(
      { kind: 'free', point: { x: 0, y: 0 } },
      { kind: 'free', point: { x: 400, y: 0 } },
    );
    const doc = { ...emptyDocument(), objects: [wire] };
    const annotation = createCurrent(wire, { x: 200, y: 0 }, doc);
    const original = { ...doc, objects: [wire, annotation] };
    const split = insertJunction(original, point).doc;
    const after = split.objects.find((o) => o.id === annotation.id) as ElectricalAnnotation;
    expect(electricalGeometry(after, split)).toEqual(electricalGeometry(annotation, original));
    expect(() => deserializeDocument(serializeDocument(split))).not.toThrow();
  });
});
