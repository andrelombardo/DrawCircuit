import { describe, expect, it } from 'vitest';
import { createCurrent, createElectrical } from '../src/annotations/electrical';
import { createWire } from '../src/model/factories';
import { inlineTextTarget } from '../src/utils/labels';
import type { CircuitDocument } from '../src/model/types';

describe('current inline editor uses the same document units as component labels', () => {
  it.each(['inline', 'external'] as const)(
    '%s keeps its input anchor, font and manual label offset in document units',
    (placement) => {
      const wire = createWire(
        { kind: 'free', point: { x: 0, y: 0 } },
        { kind: 'free', point: { x: 400, y: 0 } },
      );
      const source: CircuitDocument = { version: 1, title: 'Current label', objects: [wire] };
      const current = createCurrent(wire, { x: 200, y: 0 }, source);
      current.currentPlacement = placement;
      current.label.offset = { x: 7, y: 9 };
      const doc: CircuitDocument = { ...source, objects: [wire, current] };
      const target = inlineTextTarget(current, doc)!;
      expect(target.fontSize).toBe(current.label.fontSize);
      expect(target.point.x).toBe(207);
      expect(target.point.y).toBeCloseTo(24 + 9);
    },
  );

  it('leaves voltage labels in document space', () => {
    const voltage = createElectrical('voltage', { x: 0, y: 0 }, { x: 100, y: 0 }, 'V_1');
    const doc: CircuitDocument = { version: 1, title: 'Voltage label', objects: [voltage] };
    expect(inlineTextTarget(voltage, doc)?.fontSize).toBe(voltage.label.fontSize);
  });
});
