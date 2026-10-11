import { createCurrent } from '../../src/annotations/electrical';
import { createComponent } from '../../src/model/catalog';
import { createJunction, createWire } from '../../src/model/factories';
import type { CircuitDocument, Point } from '../../src/model/types';

export function currentZoomFixture(scene = 'circuit'): CircuitDocument {
  const doc: CircuitDocument = { version: 1, title: 'Current zoom regression', objects: [] };
  function branch(id: string, start: Point, end: Point) {
    const wire = {
      ...createWire({ kind: 'free', point: start }, { kind: 'free', point: end }),
      id,
    };
    doc.objects.push(wire);
    return wire;
  }
  function current(wire: ReturnType<typeof branch>, point: Point, label: string) {
    const arrow = { ...createCurrent(wire, point, doc), id: `current-${label}` };
    arrow.label.text = label;
    doc.objects.push(arrow);
  }
  if (scene === 'golden') {
    for (const [row, placement] of (['inline', 'external'] as const).entries()) {
      const y = row * 100 - 50;
      const wire = branch(`wire-${placement}`, { x: -90, y }, { x: 90, y });
      doc.objects.push(
        { ...createJunction({ x: -90, y }, 'A'), id: `a-${placement}` },
        { ...createJunction({ x: 90, y }, 'B'), id: `b-${placement}` },
      );
      current(wire, { x: 0, y }, row ? 'i' : 'i_1');
    }
    return doc;
  }
  for (const [index, x] of [-160, 0, 160].entries()) {
    const resistor = {
      ...createComponent('americanResistor', { x, y: 0 }),
      id: `resistor-${index}`,
      rotation: 90 as const,
    };
    resistor.label.text = `R_${index + 1}`;
    doc.objects.push(resistor);
    const top = branch(`top-${index}`, { x, y: -160 }, { x, y: -40 });
    const bottom = branch(`bottom-${index}`, { x, y: 40 }, { x, y: 160 });
    current(top, { x, y: -100 }, `i_${index + 1}`);
    if (index === 1) current(bottom, { x, y: 100 }, 'i_4');
  }
  const top = branch('wire-top', { x: -160, y: -160 }, { x: 160, y: -160 });
  branch('wire-bottom', { x: -160, y: 160 }, { x: 160, y: 160 });
  current(top, { x: -80, y: -160 }, 'i');
  doc.objects.push(
    { ...createJunction({ x: 0, y: -160 }, "A''"), id: 'junction-a' },
    { ...createJunction({ x: 0, y: 160 }, "B''"), id: 'junction-b' },
  );
  return doc;
}
