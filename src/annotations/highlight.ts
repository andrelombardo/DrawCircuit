import type { CircuitComponent, CircuitDocument, Highlight, HighlightSpan, Point } from '../model/types';
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
const hosts = new WeakMap<CircuitDocument, Map<string, CircuitDocument['objects'][number]>>();
function hostById(doc: CircuitDocument, id: string) {
  let index = hosts.get(doc);
  if (!index) {
    index = new Map(doc.objects.map((o) => [o.id, o]));
    hosts.set(doc, index);
  }
  return index.get(id);
}


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
  const component = hostById(doc, object.componentId);
  if (component?.kind !== 'component') return null;
  const b = componentRegistry[component.type].measurementBounds;
  const horizontal = b.width >= b.height;
  const half = Math.max(0.1, Math.max(b.width, b.height)) / 2;
  const center = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  return {
    points: [-1, 1].map((sign) =>
      localToWorld(component, {
        x: center.x + (horizontal ? sign * half : 0),
        y: center.y + (horizontal ? 0 : sign * half),
      }),
    ),
  };
}
export const highlightSpanHost = (span: HighlightSpan) =>
  'wireId' in span ? span.wireId : span.componentId;

/** A component is a visual hub. Leads reach the body before turning toward its center. */
export function componentHighlightRoute(component: CircuitComponent, terminalId: string): Point[] {
  const terminal = component.terminals.find((t) => t.id === terminalId);
  if (!terminal) return [];
  const b = componentRegistry[component.type].measurementBounds;
  const local = [
    { x: terminal.localX, y: terminal.localY },
    { x: Math.max(b.x, Math.min(b.x + b.width, terminal.localX)),
      y: Math.max(b.y, Math.min(b.y + b.height, terminal.localY)) },
    { x: b.x + b.width / 2, y: b.y + b.height / 2 },
  ];
  return local.filter((p, i) => !i || distance(p, local[i - 1]) > 1e-7)
    .map((p) => localToWorld(component, p));
}
export function highlightSpanPoints(span: HighlightSpan, doc: CircuitDocument): Point[] {
  const host = hostById(doc, highlightSpanHost(span));
  if ('wireId' in span) return host?.kind === 'wire' ? wirePoints(host, doc) : [];
  return host?.kind === 'component' ? componentHighlightRoute(host, span.terminalId) : [];
}
export function highlightSpanExists(span: HighlightSpan, doc: CircuitDocument) {
  const host = hostById(doc, highlightSpanHost(span));
  return 'wireId' in span ? host?.kind === 'wire' :
    host?.kind === 'component' && host.terminals.some((t) => t.id === span.terminalId);
}

/** Legacy detached body patches do not take the main route's endpoint handles. */
export function highlightEndpointIndices(object: Extract<Highlight, { mode: 'free' }>) {
  const ends = [...(object.breaks ?? []), object.points.length];
  const main = ends.map((_, i) => i).filter((i) => !object.widthOffsets?.[i]);
  const first = main[0] ?? 0, last = main.at(-1) ?? ends.length - 1;
  return [first ? ends[first - 1] : 0, ends[last] - 1];
}

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
    try {
      const route = highlightSpanPoints(span, doc);
      if (!route.length) continue;
      const points = sliceHighlightRoute(route, span.start, span.end);
      const previous = routes.at(-1);
      if (previous && distance(previous.at(-1)!, points[0]) < 1e-6)
        previous.push(...points.slice(1));
      else routes.push(points);
    } catch {
      /* Invalid references do not interrupt the other objects. */
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
/** Every route uses the chosen width, including legacy detached body patches.
 * The renderer groups opacity so overlapping routes cannot create dark seams. */
export function highlightDrawing(object: Highlight, doc: CircuitDocument) {
  return highlightRoutes(object, doc).map((points) => ({
    points,
    d: object.mode === 'free' && object.smoothing !== false ? smoothPath(points) : pointsPath(points),
    width: object.width,
  }));
}
export function highlightBounds(object: Highlight, doc: CircuitDocument) {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const { points, width } of highlightDrawing(object, doc)) {
    const include = (p: Point) => {
      left = Math.min(left, p.x - width / 2);
      top = Math.min(top, p.y - width / 2);
      right = Math.max(right, p.x + width / 2);
      bottom = Math.max(bottom, p.y + width / 2);
    };
    points.forEach(include);
    if (object.mode === 'free' && object.smoothing !== false)
      for (const { a, b } of freehandCurves(points)) { include(a); include(b); }
  }
  return Number.isFinite(left)
    ? { x: left, y: top, width: right - left, height: bottom - top }
    : { x: 0, y: 0, width: 0, height: 0 };
}
export const highlightPath = (object: Highlight, doc: CircuitDocument) =>
  highlightDrawing(object, doc).map((stroke) => stroke.d).join(' ');

export function detachHighlight(object: Highlight, doc: CircuitDocument): Highlight {
  if (object.mode === 'free') return object;
  const drawing = highlightDrawing(object, doc);
  let count = 0;
  const breaks = drawing.slice(0, -1).map((stroke) => (count += stroke.points.length));
  return {
    kind: 'highlight', id: object.id, mode: 'free', color: object.color,
    width: object.width, opacity: object.opacity, smoothing: false,
    points: drawing.flatMap((stroke) => stroke.points),
    ...(breaks.length ? { breaks } : {}),
  };
}

/** Preserve the visible stroke when its host disappears; undo restores the reference. */
export function reconcileHighlights(
  previous: CircuitDocument,
  next: CircuitDocument,
): CircuitDocument {
  const components = new Set(next.objects.filter((o) => o.kind === 'component').map((o) => o.id));
  let changed = false;
  const objects = next.objects.map((o) => {
    if (
      o.kind !== 'highlight' ||
      o.mode === 'free' ||
      (o.mode === 'smart' ? o.spans.every((s) => highlightSpanExists(s, next)) : components.has(o.componentId))
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
        !o.spans.some((s) => 'wireId' in s && splits.has(s.wireId))
      )
        return o;
      const spans = o.spans.flatMap((span): HighlightSpan[] => {
        if (!('wireId' in span)) return [span];
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
