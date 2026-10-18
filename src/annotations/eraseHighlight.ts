import type { CircuitDocument, CircuitObject, Highlight, Point } from '../model/types';
import { distance as gap, projectOnSegment } from '../utils/geometry';
import { highlightCurves } from './highlight';
import type { HighlightBezier } from './highlight';

const epsilon = 1e-8;
type Range = [number, number];
const mix = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
const distanceToSegment = (p: Point, a: Point, b: Point) => gap(p, projectOnSegment(p, a, b));
/** De Casteljau subdivision preserves the exact authored curve outside each cut. */
export function splitHighlightCurve(
  c: HighlightBezier,
  t: number,
): [HighlightBezier, HighlightBezier] {
  const p = mix(c.start, c.a, t),
    q = mix(c.a, c.b, t),
    r = mix(c.b, c.end, t);
  const s = mix(p, q, t),
    u = mix(q, r, t),
    m = mix(s, u, t);
  return [
    { start: c.start, a: p, b: s, end: m },
    { start: m, a: u, b: r, end: c.end },
  ];
}
function sliceCurve(c: HighlightBezier, from: number, to: number) {
  if (from <= epsilon && to >= 1 - epsilon) return c;
  const left = to < 1 ? splitHighlightCurve(c, to)[0] : c;
  return from > 0 ? splitHighlightCurve(left, from / to)[1] : left;
}
function merge(ranges: Range[]): Range[] {
  const merged: Range[] = [];
  for (const [lo, hi] of ranges.sort((a, b) => a[0] - b[0])) {
    if (hi - lo <= epsilon) continue;
    const previous = merged.at(-1);
    if (previous && lo <= previous[1] + epsilon) previous[1] = Math.max(previous[1], hi);
    else merged.push([lo, hi]);
  }
  return merged;
}
/** Exact line/capsule intersection: two endpoint disks plus the connecting strip. */
function capsuleRanges(p: Point, q: Point, a: Point, b: Point, radius: number): Range[] {
  const dx = q.x - p.x,
    dy = q.y - p.y,
    length2 = dx * dx + dy * dy;
  if (length2 < epsilon * epsilon) return distanceToSegment(p, a, b) < radius ? [[0, 1]] : [];
  const result: Range[] = [];
  for (const center of [a, b]) {
    const x = p.x - center.x,
      y = p.y - center.y;
    const linear = x * dx + y * dy;
    const discriminant = linear * linear - length2 * (x * x + y * y - radius * radius);
    if (discriminant > 0) {
      const root = Math.sqrt(discriminant);
      result.push([
        Math.max(0, (-linear - root) / length2),
        Math.min(1, (-linear + root) / length2),
      ]);
    }
  }
  const size = gap(a, b);
  if (size > epsilon) {
    const ux = (b.x - a.x) / size,
      uy = (b.y - a.y) / size;
    let lo = 0,
      hi = 1;
    for (const [start, delta, min, max] of [
      [(p.x - a.x) * ux + (p.y - a.y) * uy, dx * ux + dy * uy, 0, size],
      [-(p.x - a.x) * uy + (p.y - a.y) * ux, -dx * uy + dy * ux, -radius, radius],
    ]) {
      if (Math.abs(delta) < epsilon) {
        if (start < min || start > max) {
          hi = -1;
          break;
        }
      } else {
        const first = (min - start) / delta,
          last = (max - start) / delta;
        lo = Math.max(lo, Math.min(first, last));
        hi = Math.min(hi, Math.max(first, last));
      }
    }
    if (hi > lo) result.push([lo, hi]);
  }
  return merge(result);
}
function erasedRanges(
  curve: HighlightBezier,
  from: Point,
  to: Point,
  radius: number,
  tolerance: number,
): Range[] {
  const result: Range[] = [];
  const left = Math.min(from.x, to.x) - radius,
    right = Math.max(from.x, to.x) + radius;
  const top = Math.min(from.y, to.y) - radius,
    bottom = Math.max(from.y, to.y) + radius;
  const visit = (c: HighlightBezier, lo: number, hi: number, depth: number) => {
    const points = [c.start, c.a, c.b, c.end];
    // The Bezier convex hull permits cheap rejection and exact full containment.
    if (
      points.every((p) => p.x < left) ||
      points.every((p) => p.x > right) ||
      points.every((p) => p.y < top) ||
      points.every((p) => p.y > bottom)
    )
      return;
    if (points.every((p) => distanceToSegment(p, from, to) < radius)) {
      result.push([lo, hi]);
      return;
    }
    if (
      depth >= 20 ||
      Math.max(distanceToSegment(c.a, c.start, c.end), distanceToSegment(c.b, c.start, c.end)) <=
        tolerance
    ) {
      for (const [a, b] of capsuleRanges(c.start, c.end, from, to, radius))
        result.push([lo + (hi - lo) * a, lo + (hi - lo) * b]);
      return;
    }
    const [a, b] = splitHighlightCurve(c, 0.5),
      middle = (lo + hi) / 2;
    visit(a, lo, middle, depth + 1);
    visit(b, middle, hi, depth + 1);
  };
  visit(curve, 0, 1, 0);
  return merge(result);
}
type EraseGeometry = {
  routes: HighlightBezier[][];
  left: number;
  right: number;
  top: number;
  bottom: number;
};
function eraseGeometry(object: Highlight, doc: CircuitDocument): EraseGeometry {
  const routes = highlightCurves(object, doc);
  let left = Infinity,
    right = -Infinity,
    top = Infinity,
    bottom = -Infinity;
  for (const route of routes)
    for (const c of route)
      for (const p of [c.start, c.a, c.b, c.end]) {
        left = Math.min(left, p.x);
        right = Math.max(right, p.x);
        top = Math.min(top, p.y);
        bottom = Math.max(bottom, p.y);
      }
  return { routes, left, right, top, bottom };
}
/** Only highlight objects are replaced. Electrical objects retain even their identity. */
export function eraseHighlights(
  doc: CircuitDocument,
  from: Point,
  to: Point,
  radius: number,
  tolerance = 0.05,
  cache = new WeakMap<Highlight, EraseGeometry>(),
): CircuitDocument {
  let changed = false;
  const objects = doc.objects.flatMap<CircuitObject>((object) => {
    if (object.kind !== 'highlight') return [object];
    const geometry = cache.get(object) ?? eraseGeometry(object, doc);
    cache.set(object, geometry);
    const reach = radius + object.width / 2;
    if (
      geometry.right < Math.min(from.x, to.x) - reach ||
      geometry.left > Math.max(from.x, to.x) + reach ||
      geometry.bottom < Math.min(from.y, to.y) - reach ||
      geometry.top > Math.max(from.y, to.y) + reach
    )
      return [object];

    const pieces: HighlightBezier[][] = [];
    let touched = false;
    for (const route of geometry.routes) {
      let current: HighlightBezier[] = [];
      const flush = () => {
        if (current.length) pieces.push(current);
        current = [];
      };
      for (const curve of route) {
        const cuts = erasedRanges(curve, from, to, radius + object.width / 2, tolerance);
        if (!cuts.length) {
          current.push(curve);
          continue;
        }
        touched = true;
        let start = 0;
        for (const [lo, hi] of cuts) {
          if (lo - start > epsilon) current.push(sliceCurve(curve, start, lo));
          flush();
          start = hi;
        }
        if (start < 1 - epsilon) current.push(sliceCurve(curve, start, 1));
      }
      flush();
    }
    if (!touched) return [object];
    changed = true;
    return pieces
      .filter(
        (curves) =>
          curves.reduce(
            (length, c) => length + gap(c.start, c.a) + gap(c.a, c.b) + gap(c.b, c.end),
            0,
          ) > 0.01,
      )
      .map(
        (curves, i): Highlight => ({
          kind: 'highlight',
          paintGroup: object.paintGroup ?? object.id,
          id: i === 0 ? object.id : crypto.randomUUID(),
          mode: 'free',
          color: object.color,
          width: object.width,
          opacity: object.opacity,
          smoothing: false,
          points: [curves[0].start, ...curves.map((c) => c.end)],
          curves: curves.map(({ a, b }) => ({ a, b })),
        }),
      );
  });
  return changed ? { ...doc, objects } : doc;
}
export function eraseTopHighlight(
  doc: CircuitDocument,
  point: Point,
  tolerance = 0,
): CircuitDocument {
  const hit = [...doc.objects]
    .reverse()
    .find(
      (o) =>
        o.kind === 'highlight' &&
        o.opacity > 0 &&
        highlightCurves(o, doc).some((route) =>
          route.some((c) => erasedRanges(c, point, point, o.width / 2 + tolerance, 0.05).length),
        ),
    );
  return hit ? { ...doc, objects: doc.objects.filter((o) => o !== hit) } : doc;
}
/** Delay any deletion until screen-space intent is known; a sweep includes fast jumps. */
export class HighlightEraserGesture {
  readonly original: CircuitDocument;
  document: CircuitDocument;
  readonly origin: Point;
  readonly radius: number;
  readonly zoom: number;
  dragged = false;
  private last: Point;
  private readonly cache = new WeakMap<Highlight, EraseGeometry>();
  constructor(document: CircuitDocument, point: Point, diameter: number, zoom: number) {
    this.original = this.document = document;
    this.origin = this.last = point;
    this.radius = diameter / 2;
    this.zoom = zoom;
  }
  advance(point: Point) {
    if (!this.dragged && gap(this.origin, point) * this.zoom >= 4) this.dragged = true;
    if (this.dragged) {
      this.document = eraseHighlights(
        this.document,
        this.last,
        point,
        this.radius,
        0.08 / this.zoom,
        this.cache,
      );
      this.last = point;
    }
    return this.document;
  }
  finish(point: Point) {
    this.advance(point);
    return this.dragged
      ? this.document
      : eraseTopHighlight(this.original, this.origin, 2 / this.zoom);
  }
}
