import type { CircuitDocument, Junction, Point } from '../model/types';
import { add, distance, objectBounds, projectOnSegment, wirePoints } from './geometry';
import { inlineTextTarget } from './labels';
import type { Bounds } from './visualBounds';

function overlaps(a: Bounds, b: Bounds) {
  return (
    Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  );
}
function nearSegment(b: Bounds, start: Point, end: Point) {
  // Segment/rectangle clipping, including diagonals and segments wholly inside the box.
  let low = 0,
    high = 1;
  const dx = end.x - start.x,
    dy = end.y - start.y;
  for (const [p, q] of [
    [-dx, start.x - b.x],
    [dx, b.x + b.width - start.x],
    [-dy, start.y - b.y],
    [dy, b.y + b.height - start.y],
  ]) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) low = Math.max(low, t);
      else high = Math.min(high, t);
    }
  }
  return low <= high;
}

/** Initial placement only: deterministic bounded candidate search around a new node. */
export function placeNodeLabel(junction: Junction, doc: CircuitDocument): Junction {
  const width = Math.max(
    junction.label.fontSize * 0.7,
    junction.label.text.length * junction.label.fontSize * 0.65,
  );
  const height = junction.label.fontSize * 1.25;
  const bodies: Bounds[] = [],
    labels: Bounds[] = [],
    segments: [Point, Point][] = [];
  for (const object of doc.objects) {
    if (object.kind === 'wire') {
      const points = wirePoints(object, doc);
      points.slice(1).forEach((p, i) => segments.push([points[i], p]));
    } else if (object.kind !== 'text') bodies.push(objectBounds(object, doc));
    const label = inlineTextTarget(object, doc);
    if (label?.text) {
      const w = Math.max(
        label.fontSize,
        label.text.replace(/[{}_^]/g, '').length * label.fontSize * 0.65,
      );
      const h = label.fontSize * 1.4;
      const r = (label.rotation * Math.PI) / 180;
      const bw = Math.abs(w * Math.cos(r)) + Math.abs(h * Math.sin(r));
      const bh = Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r));
      labels.push({ x: label.point.x - bw / 2, y: label.point.y - bh / 2, width: bw, height: bh });
    }
  }
  let best = junction.label.offset,
    cost = Infinity;
  const directions = [
    [0, -1],
    [1, -1],
    [-1, -1],
    [0, 1],
    [1, 1],
    [-1, 1],
    [1, 0],
    [-1, 0],
  ];
  for (const radius of [24, 40, 56])
    for (const [dx, dy] of directions) {
      const offset = {
        x: dx * Math.max(radius, width / 2 + 12),
        y: dy * Math.max(radius, height / 2 + 10),
      };
      const p = add(junction, offset),
        b = {
          x: p.x - width / 2 - 3,
          y: p.y - height / 2 - 3,
          width: width + 6,
          height: height + 6,
        };
      const score =
        bodies.reduce((sum, box) => sum + overlaps(b, box) * 100, 0) +
        labels.reduce((sum, box) => sum + overlaps(b, box) * 150, 0) +
        segments.reduce(
          (sum, [a, z]) =>
            sum +
            (nearSegment(b, a, z) ? 1000 : Math.max(0, 8 - distance(p, projectOnSegment(p, a, z)))),
          0,
        ) +
        distance(junction, p);
      if (score < cost) {
        cost = score;
        best = offset;
      }
    }
  return { ...junction, label: { ...junction.label, offset: best } };
}
