import type { CircuitDocument } from '../model/types';
import { currentWireGaps } from '../annotations/electrical';
import { bridgeGeometry, wireCrossings, type WireCrossing } from './crossings';
import { distance, projectOnSegment, wirePoints } from './geometry';
export const translucentCrossing = (c: WireCrossing) =>
  (c.horizontal.opacity ?? 1) !== 1 || (c.vertical.opacity ?? 1) !== 1;

/** Translucent crossings cannot be painted twice or erased with opaque white.
 * Cut only the over-wire and draw its bridge once; the under-wire is untouched. */
export function drawingWireGaps(doc: CircuitDocument) {
  const gaps = currentWireGaps(doc);
  for (const crossing of wireCrossings(doc)) {
    if (!translucentCrossing(crossing)) continue;
    const g = bridgeGeometry(crossing),
      points = wirePoints(g.overWire, doc);
    const segment = points.findIndex(
      (a, i) =>
        i < points.length - 1 &&
        distance(g.start, projectOnSegment(g.start, a, points[i + 1])) < 0.001 &&
        distance(g.end, projectOnSegment(g.end, a, points[i + 1])) < 0.001,
    );
    if (segment < 0) continue;
    const [start, end] =
      distance(points[segment], g.start) < distance(points[segment], g.end)
        ? [g.start, g.end]
        : [g.end, g.start];
    const list = gaps.get(g.overWire.id) ?? [];
    list.push({ segment, start, end });
    gaps.set(g.overWire.id, list);
  }
  return gaps;
}
