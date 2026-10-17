import type { CircuitDocument, Highlight, HighlightSpan, Point } from '../model/types';
import { componentRegistry } from '../model/catalog';
import {
  distance,
  localToWorld,
  pointsPath,
  projectOnSegment,
  rotatePoint,
  wirePoints,
} from '../utils/geometry';

export const DEFAULT_HIGHLIGHT = {
  mode: 'smart',
  color: '#FACC15',
  opacity: 0.4,
  width: 12,
} as const;
export const HIGHLIGHT_COLORS = {
  Giallo: '#FACC15',
  Arancione: '#FDBA74',
  Rosa: '#F9A8D4',
  Verde: '#86EFAC',
  Azzurro: '#7DD3FC',
  Viola: '#C4B5FD',
};
export const routeLength = (points: Point[]) =>
  points.slice(1).reduce((sum, point, i) => sum + distance(points[i], point), 0);

/** Target the symbol body, leaving wire gestures on its leads available. */
export function highlightComponentAt(doc: CircuitDocument, point: Point, tolerance: number) {
  return [...doc.objects].reverse().find((o) => {
    if (o.kind !== 'component') return false;
    const p = rotatePoint({ x: point.x - o.x, y: point.y - o.y }, -o.rotation);
    const b = componentRegistry[o.type].measurementBounds;
    return (
      p.x >= b.x - tolerance && p.x <= b.x + b.width + tolerance &&
      p.y >= b.y - tolerance && p.y <= b.y + b.height + tolerance
    );
  });
}

function componentHighlight(object: Highlight, doc: CircuitDocument) {
  if (object.mode !== 'component') return null;
  const component = doc.objects.find((o) => o.id === object.componentId);
  if (component?.kind !== 'component') return null;
  const b = componentRegistry[component.type].measurementBounds;
  const horizontal = b.width >= b.height;
  const minor = Math.min(b.width, b.height);
  const half = Math.max(0.1, Math.max(b.width, b.height) - minor) / 2;
  const center = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  return {
    width: minor + object.width,
    points: [-1, 1].map((sign) =>
      localToWorld(component, {
        x: center.x + (horizontal ? sign * half : 0),
        y: center.y + (horizontal ? 0 : sign * half),
      }),
    ),
  };
}
export const highlightStrokeWidth = (object: Highlight, doc: CircuitDocument) =>
  componentHighlight(object, doc)?.width ?? object.width;

/** Exact projection, deliberately independent of the circuit's grid snapping. */
export function projectHighlight(points: Point[], point: Point, preferred = 0) {
  const length = routeLength(points);
  let walked = 0;
  let best = { point: points[0], ratio: 0, distance: Infinity };
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      size = distance(a, b);
    const q = projectOnSegment(point, a, b),
      gap = distance(q, point);
    const ratio = length ? (walked + distance(a, q)) / length : 0;
    if (
      gap < best.distance - 0.001 ||
      (Math.abs(gap - best.distance) <= 0.001 &&
        Math.abs(ratio - preferred) < Math.abs(best.ratio - preferred))
    )
      best = { point: q, ratio, distance: gap };
    walked += size;
  }
  return best;
}
export function nearestHighlightWire(doc: CircuitDocument, point: Point, threshold: number) {
  let best: {
    wireId: string;
    ratio: number;
    point: Point;
    distance: number;
  } | null = null;
  for (const wire of doc.objects) {
    if (wire.kind !== 'wire') continue;
    const projection = projectHighlight(wirePoints(wire, doc), point);
    if (projection.distance < (best?.distance ?? threshold))
      best = { ...projection, wireId: wire.id };
  }
  return best;
}

export function sliceHighlightRoute(points: Point[], start: number, end: number): Point[] {
  if (start > end) return sliceHighlightRoute(points, end, start).reverse();
  const length = routeLength(points),
    from = start * length,
    to = end * length;
  let walked = 0;
  const result: Point[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      size = distance(a, b);
    if (size && walked + size >= from && walked <= to) {
      const at = (n: number) => ({
        x: a.x + (b.x - a.x) * n,
        y: a.y + (b.y - a.y) * n,
      });
      const p = at(Math.max(0, (from - walked) / size));
      if (!result.length || distance(result.at(-1)!, p) > 1e-7) result.push(p);
      result.push(at(Math.min(1, (to - walked) / size)));
    }
    walked += size;
  }
  return result.length ? result : [points[0] ?? { x: 0, y: 0 }];
}
export function highlightRoutes(object: Highlight, doc: CircuitDocument): Point[][] {
  if (object.mode === 'component') {
    const geometry = componentHighlight(object, doc);
    return geometry ? [geometry.points] : [];
  }
  if (object.mode === 'free') {
    const ends = [...(object.breaks ?? []), object.points.length];
    return ends.map((end, i) => object.points.slice(i ? ends[i - 1] : 0, end));
  }
  const routes: Point[][] = [];
  for (const span of object.spans) {
    const wire = doc.objects.find((o) => o.id === span.wireId);
    if (wire?.kind !== 'wire') continue;
    try {
      const points = sliceHighlightRoute(wirePoints(wire, doc), span.start, span.end);
      const previous = routes.at(-1);
      if (previous && distance(previous.at(-1)!, points[0]) < 1e-6)
        previous.push(...points.slice(1));
      else routes.push(points);
    } catch {
      /* Invalid export references do not interrupt the other objects. */
    }
  }
  return routes;
}
export const highlightPoints = (object: Highlight, doc: CircuitDocument) =>
  highlightRoutes(object, doc).flat();

/** Iterative Ramer–Douglas–Peucker: no recursion limit on long pen gestures. */
export function simplifyHighlight(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) return points;
  const keep = new Set([0, points.length - 1]),
    pending = [[0, points.length - 1]];
  while (pending.length) {
    const [first, last] = pending.pop()!;
    let index = -1,
      furthest = tolerance;
    for (let i = first + 1; i < last; i++) {
      const gap = distance(points[i], projectOnSegment(points[i], points[first], points[last]));
      if (gap > furthest) {
        furthest = gap;
        index = i;
      }
    }
    if (index !== -1) {
      keep.add(index);
      pending.push([first, index], [index, last]);
    }
  }
  return [...keep].sort((a, b) => a - b).map((i) => points[i]);
}
/** Interpolate through the simplified anchors. Gentle turns share a tangent;
 * a sharp turn keeps its authored direction. Handles are bounded by adjacent
 * segment lengths so uneven pointer samples cannot create loops. */
function freehandCurves(points: Point[]) {
  return points.slice(1).map((end, i) => {
    const start = points[i],
      length = distance(start, end);
    const control = (index: number, forward: boolean): Point => {
      const p = points[index],
        before = points[index - 1],
        after = points[index + 1];
      if (before && after) {
        const incoming = distance(before, p),
          outgoing = distance(p, after);
        const dot = (p.x - before.x) * (after.x - p.x) + (p.y - before.y) * (after.y - p.y);
        if (incoming && outgoing && dot / (incoming * outgoing) > 0.5) {
          const tangent = distance(before, after) || 1;
          const amount = (Math.min(incoming, outgoing, length) / 3) * (forward ? 1 : -1);
          return {
            x: p.x + ((after.x - before.x) / tangent) * amount,
            y: p.y + ((after.y - before.y) / tangent) * amount,
          };
        }
      }
      const other = forward ? end : start;
      return { x: p.x + (other.x - p.x) / 3, y: p.y + (other.y - p.y) / 3 };
    };
    return { start, end, a: control(i, true), b: control(i + 1, false) };
  });
}
function smoothPath(points: Point[]) {
  if (points.length < 3) return pointsPath(points);
  return (
    pointsPath([points[0]]) +
    freehandCurves(points)
      .map(({ a, b, end }) => ` C ${a.x} ${a.y} ${b.x} ${b.y} ${end.x} ${end.y}`)
      .join('')
  );
}
/** Conservative Bezier bounds keep rounded strokes inside all export frames. */
export function highlightExtentPoints(object: Highlight, doc: CircuitDocument): Point[] {
  return highlightRoutes(object, doc).flatMap((points) =>
    object.mode === 'free' && object.smoothing !== false
      ? [...points, ...freehandCurves(points).flatMap(({ a, b }) => [a, b])]
      : points,
  );
}
export function highlightPath(object: Highlight, doc: CircuitDocument): string {
  return highlightRoutes(object, doc)
    .map((points) =>
      object.mode === 'free' && object.smoothing !== false
        ? smoothPath(points)
        : pointsPath(points),
    )
    .join(' ');
}
export function detachHighlight(object: Highlight, doc: CircuitDocument): Highlight {
  const routes = highlightRoutes(object, doc);
  let count = 0;
  const breaks = routes.slice(0, -1).map((route) => (count += route.length));
  return object.mode === 'free'
    ? object
    : {
        kind: 'highlight',
        id: object.id,
        mode: 'free',
        color: object.color,
        width: highlightStrokeWidth(object, doc),
        opacity: object.opacity,
        smoothing: false,
        points: routes.flat(),
        ...(breaks.length ? { breaks } : {}),
      };
}

/** Preserve the visible stroke when its host disappears; undo restores the reference. */
export function reconcileHighlights(
  previous: CircuitDocument,
  next: CircuitDocument,
): CircuitDocument {
  const wires = new Set(next.objects.filter((o) => o.kind === 'wire').map((o) => o.id));
  const components = new Set(next.objects.filter((o) => o.kind === 'component').map((o) => o.id));
  let changed = false;
  const objects = next.objects.map((o) => {
    if (
      o.kind !== 'highlight' ||
      o.mode === 'free' ||
      (o.mode === 'smart' ? o.spans.every((s) => wires.has(s.wireId)) : components.has(o.componentId))
    )
      return o;
    const original = previous.objects.find((p) => p.id === o.id);
    if (original?.kind !== 'highlight') return o;
    changed = true;
    return detachHighlight(original, previous);
  });
  return changed ? { ...next, objects } : next;
}

/** A split keeps one highlight object, with a compact range for each new branch. */
export function remapHighlightSpans(
  previous: CircuitDocument,
  next: CircuitDocument,
  splits: Map<string, string[]>,
): CircuitDocument {
  return {
    ...next,
    objects: next.objects.map((o) => {
      if (
        o.kind !== 'highlight' ||
        o.mode !== 'smart' ||
        !o.spans.some((s) => splits.has(s.wireId))
      )
        return o;
      const spans = o.spans.flatMap((span): HighlightSpan[] => {
        const ids = splits.get(span.wireId);
        if (!ids) return [span];
        const original = previous.objects.find((p) => p.id === span.wireId);
        if (original?.kind !== 'wire') return [span];
        const total = routeLength(wirePoints(original, previous));
        // Branches are emitted in the original route's order by the wire splitter.
        let walked = 0;
        const ranges: HighlightSpan[] = [];
        for (const id of ids) {
          const wire = next.objects.find((p) => p.id === id);
          if (wire?.kind !== 'wire') continue;
          const size = routeLength(wirePoints(wire, next));
          const from = Math.max(Math.min(span.start, span.end) * total, walked);
          const to = Math.min(Math.max(span.start, span.end) * total, walked + size);
          if (size && to > from + 1e-7)
            ranges.push({
              wireId: id,
              start: Math.max(0, Math.min(1, (from - walked) / size)),
              end: Math.max(0, Math.min(1, (to - walked) / size)),
            });
          walked += size;
        }
        return span.start <= span.end
          ? ranges
          : ranges.reverse().map((r) => ({ ...r, start: r.end, end: r.start }));
      });
      return spans.length ? { ...o, spans } : detachHighlight(o, previous);
    }),
  };
}
