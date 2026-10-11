import { createCurrent } from '../../annotations/electrical';
import type { CircuitDocument, Wire } from '../../model/types';
import { distance, midpoint, wirePoints } from '../../utils/geometry';

/** A selection names the whole Wire. Choose its longest rendered branch, then
 * retain the usual segment association so endpoint edits keep the annotation attached. */
export function currentOnSelectedWire(wire: Wire, doc: CircuitDocument) {
  const points = wirePoints(wire, doc);
  let segment = 0;
  for (let i = 1; i < points.length - 1; i++) {
    if (distance(points[i], points[i + 1]) > distance(points[segment], points[segment + 1]))
      segment = i;
  }
  return createCurrent(wire, midpoint(points[segment], points[segment + 1]), doc);
}
