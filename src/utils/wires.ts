import { t } from '../i18n';
import { projectHighlight, remapHighlightSpans, sliceHighlightRoute } from '../annotations/highlight';
import { createCurrent, currentWireAnchor } from '../annotations/electrical';
import { placeNodeLabel } from './nodeLabels';
import { makeId } from '../model/catalog';
import { createJunction, createWire } from '../model/factories';
import { GRID } from '../model/types';
import { placementIndex } from '../smartPlacement/spatialIndex';
import type {
  CircuitDocument,
  CircuitObject,
  Endpoint,
  Junction,
  Point,
  Wire,
  WireRouting,
} from '../model/types';
import {
  distance,
  endpointDirection,
  nearestTarget,
  nearestWire,
  projectOnSegment,
  resolveEndpoint,
  snapPoint,
  safeWirePoints,
  wirePoints,
  add,
  isLooseEndpoint,
  snap,
} from './geometry';
import type { WireExitAxes } from './geometry';
export type WireCandidate =
  | { point: Point; endpoint: Endpoint; kind: 'terminal' | 'junction' | 'grid' }
  | { point: Point; kind: 'wire'; wireId: string; exitAxis?: 'x' | 'y' };
export interface WireDraft {
  routing?: WireRouting;
  start: Endpoint;
  vertices: Point[];
  startAxis?: 'x' | 'y';
}
export const TERMINAL_DRAG_THRESHOLD = 8;
export const WIRE_ENDPOINT_HIT_PX = 7;
const SNAP_PX = 12;
const RELEASE_PX = 16;
const SWITCH_PX = 3;

export interface WireSnapOptions {
  enabled?: boolean;
  previous?: WireCandidate | null;
  routing?: WireRouting;
}

/** Keep endpoint gestures separate from moving the body, even on short wires. */
export function wireEndAtPoint(p: Point, wire: Wire, doc: CircuitDocument, zoom: number) {
  const points = wirePoints(wire, doc);
  const length = points.slice(1).reduce((sum, point, i) => sum + distance(points[i], point), 0);
  const radius = Math.min(WIRE_ENDPOINT_HIT_PX / zoom, length / 4);
  const start = distance(p, points[0]),
    end = distance(p, points.at(-1)!);
  if (Math.min(start, end) > radius) return null;
  return start <= end ? 'start' : 'end';
}

export interface WireSnapContext {
  anchor: Point;
  routing?: WireRouting;
}

/** Use the authored axis before the absolute grid, including off-grid pins/nodes. */
function alignedWirePoint(p: Point, zoom: number, context?: WireSnapContext, enabled = true): Point {
  if (!enabled || context?.routing === 'free') return { ...p };
  const point = snapPoint(p);
  if (!context) return point;
  const { anchor } = context,
    dx = p.x - anchor.x,
    dy = p.y - anchor.y,
    tolerance = 10 / zoom;
  if (Math.abs(dx) <= tolerance) point.x = anchor.x;
  if (Math.abs(dy) <= tolerance) point.y = anchor.y;
  if (
    context.routing === '45' &&
    Math.abs(dx) > tolerance &&
    Math.abs(dy) > tolerance &&
    Math.abs(Math.abs(dx) - Math.abs(dy)) / Math.SQRT2 <= tolerance
  ) {
    // Quantize along the diagonal rather than independently on the two axes.
    const length = Math.round((Math.abs(dx) + Math.abs(dy)) / 2 / GRID) * GRID;
    return {
      x: anchor.x + Math.sign(dx) * length,
      y: anchor.y + Math.sign(dy) * length,
    };
  }
  return point;
}

export function drawingWireCandidate(
  p: Point,
  doc: CircuitDocument,
  zoom: number,
  draft: WireDraft | null,
  options: WireSnapOptions = {},
): WireCandidate {
  return wireCandidate(
    p,
    doc,
    zoom,
    new Set(),
    draft
      ? {
          anchor: draft.vertices.at(-1) ?? resolveEndpoint(draft.start, doc),
          routing: draft.routing,
        }
      : options.routing === 'free' ? { anchor: p, routing: 'free' } : undefined,
    options,
  );
}

export function wireEndpointCandidate(
  p: Point,
  wire: Wire,
  side: 'start' | 'end',
  doc: CircuitDocument,
  zoom: number,
  options: WireSnapOptions = {},
): WireCandidate {
  const anchor =
    side === 'start'
      ? (wire.vertices[0] ?? resolveEndpoint(wire.endEndpoint, doc))
      : (wire.vertices.at(-1) ?? resolveEndpoint(wire.startEndpoint, doc));
  return wireCandidate(
    p, doc, zoom, new Set([wire.id]), { anchor, routing: wire.routing }, options,
  );
}

/** A wire target is resolved only on begin/commit, so hover never changes topology. */
export function resolveWireCandidate(doc: CircuitDocument, candidate: WireCandidate) {
  if (candidate.kind !== 'wire') return { doc, endpoint: candidate.endpoint };
  const wire = doc.objects.find((o) => o.id === candidate.wireId);
  if (wire?.kind !== 'wire') throw new Error(t('Wire connection does not exist.'));
  const points = wirePoints(wire, doc),
    point = candidate.point;
  const side =
    distance(point, points[0]) < 0.001
      ? 'startEndpoint'
      : distance(point, points.at(-1)!) < 0.001
        ? 'endEndpoint'
        : null;
  if (side && (wire[side].kind !== 'free' || wire[side].connectionId))
    return { doc, endpoint: wire[side] };
  const endpoint: Endpoint = {
    kind: 'free',
    point: { ...point },
    connectionId: makeId(),
  };
  if (side) {
    return {
      doc: {
        ...doc,
        objects: doc.objects.map((o) => (o.id === wire.id ? { ...wire, [side]: endpoint } : o)),
      },
      endpoint,
    };
  }
  const result = splitWireAtPoint(doc, wire.id, point, endpoint);
  if (!result) throw new Error(t('Connection point is outside the wire.'));
  return { doc: result.doc, endpoint };
}

/** Shared by the multi-step tool and the quick terminal gesture. */
export function beginWire(
  doc: CircuitDocument,
  candidate: WireCandidate,
  routing: WireRouting = 'orthogonal',
) {
  const resolved = resolveWireCandidate(doc, candidate);
  return {
    doc: resolved.doc,
    draft: {
      start: resolved.endpoint, vertices: [], routing,
      startAxis: candidate.kind === 'wire' ? candidate.exitAxis : undefined,
    } as WireDraft,
  };
}

export function routeEditedWire(wire: Wire, doc: CircuitDocument, axes: WireExitAxes = {}): Wire {
  const original = wirePoints(wire, doc),
    safe = safeWirePoints(wire, doc, axes);
  return original.length === safe.length &&
    original.every((point, i) => distance(point, safe[i]) < 0.001) &&
    wire.vertices.every((vertex) => original.some((point, i) => i > 0 &&
      distance(vertex, projectOnSegment(vertex, original[i - 1], point)) < 0.001))
    ? wire
    : { ...wire, vertices: safe.slice(1, -1) };
}

export function wirePreview(
  draft: WireDraft,
  candidate: WireCandidate,
  doc: CircuitDocument,
): Wire {
  return routeEditedWire(
    {
      ...createWire(
        draft.start,
        candidate.kind === 'wire' ? { kind: 'free', point: candidate.point } : candidate.endpoint,
        draft.vertices,
        draft.routing,
      ),
      id: 'preview',
    },
    doc,
    { start: draft.startAxis, end: candidate.kind === 'wire' ? candidate.exitAxis : undefined },
  );
}

/** Commit wire joins/splits and the new wire as one document change, without junctions. */
export function commitWire(doc: CircuitDocument, draft: WireDraft, candidate: WireCandidate) {
  const resolved = resolveWireCandidate(doc, candidate),
    wire = routeEditedWire(
      createWire(draft.start, resolved.endpoint, draft.vertices, draft.routing),
      resolved.doc,
      { start: draft.startAxis, end: candidate.kind === 'wire' ? candidate.exitAxis : undefined },
    ),
    points = wirePoints(wire, resolved.doc);
  if (points.length < 2 || points.every((point) => distance(point, points[0]) < 0.001)) return null;
  const key = (endpoint: Endpoint) =>
    endpoint.kind === 'terminal'
      ? `terminal:${endpoint.componentId}:${endpoint.terminalId}`
      : endpoint.kind === 'junction'
        ? `junction:${endpoint.junctionId}`
        : `free:${endpoint.point.x}:${endpoint.point.y}`;
  const route = simplifyPolyline(points),
    startKey = key(wire.startEndpoint),
    endKey = key(wire.endEndpoint);
  if (
    resolved.doc.objects.some((object) => {
      if (object.kind !== 'wire') return false;
      const same = key(object.startEndpoint) === startKey && key(object.endEndpoint) === endKey,
        reversed = key(object.startEndpoint) === endKey && key(object.endEndpoint) === startKey;
      if (!same && !reversed) return false;
      const existing = simplifyPolyline(wirePoints(object, resolved.doc));
      if (reversed) existing.reverse();
      return (
        existing.length === route.length &&
        existing.every((point, i) => distance(point, route[i]) < 0.001)
      );
    })
  )
    return null;
  return {
    doc: normalizeDocumentWires({
      ...resolved.doc,
      objects: [...resolved.doc.objects, wire],
    }),
    wireId: wire.id,
  };
}
export function wireCandidate(
  p: Point,
  doc: CircuitDocument,
  zoom: number,
  excluded = new Set<string>(),
  context?: WireSnapContext,
  options: WireSnapOptions = {},
): WireCandidate {
  const enabled = options.enabled !== false;
  const point = alignedWirePoint(p, zoom, context, enabled);
  const free: WireCandidate = { kind: 'grid', point, endpoint: { kind: 'free', point } };
  if (!enabled) return free;
  type Choice = { candidate: WireCandidate; key: string; gap: number; pointTarget: boolean };
  const choices: Choice[] = [];
  const push = (candidate: WireCandidate, key: string, pointTarget = true,
    gap = distance(p, candidate.point) * zoom) => {
    if (gap <= RELEASE_PX) choices.push({ candidate, key, gap, pointTarget });
  };
  const index = placementIndex(doc);
  for (const target of index.nearbyTargets(p, RELEASE_PX / zoom)) {
    const endpoint = target.endpoint;
    const id = endpoint.kind === 'terminal' ? endpoint.componentId
      : endpoint.kind === 'junction' ? endpoint.junctionId : '';
    if (!excluded.has(id)) push({ ...target, kind: target.kind }, target.key);
  }
  for (const end of index.nearbyWireEnds(p, RELEASE_PX / zoom)) {
    if (!excluded.has(end.wireId))
      push({ kind: 'wire', point: end.point, wireId: end.wireId }, `e:${end.wireId}:${end.side}`);
  }
  for (const hit of index.nearbySegments(p, RELEASE_PX / zoom)) {
    if (excluded.has(hit.wire.id) || distance(hit.a, hit.b) < 0.001) continue;
    const { a, b } = hit;
    const aligned = alignedWirePoint(p, zoom, context);
    if (context?.routing !== 'free') {
      if (a.x === b.x) aligned.x = a.x;
      if (a.y === b.y) aligned.y = a.y;
    }
    const point = projectOnSegment(aligned, a, b);
    // Alignment may choose a point only on the actual segment under the pointer.
    const candidate: WireCandidate = {
      kind: 'wire',
      point:
        context?.routing !== 'free' &&
        distance(aligned, point) < 0.001 &&
        distance(p, point) <= SNAP_PX / zoom
          ? point
          : projectOnSegment(p, a, b),
      wireId: hit.wire.id,
    };
    const interior = distance(candidate.point, a) > 0.001 && distance(candidate.point, b) > 0.001;
    if (interior && (a.x === b.x || a.y === b.y))
      candidate.exitAxis = a.x === b.x ? 'x' : 'y';
    // Rank the actual stroke under the pointer, not its optional grid-aligned point.
    push(candidate, `w:${hit.key}`, false, distance(p, projectOnSegment(p, a, b)) * zoom);
  }
  const score = (choice: Choice) => choice.gap - (choice.pointTarget ? 4 : 0);
  choices.sort((a, b) => score(a) - score(b) || a.key.localeCompare(b.key));
  const best = choices.find((choice) => choice.gap <= SNAP_PX);
  const previous = options.previous;
  if (previous && previous.kind !== 'grid') {
    const held = choices.find(({ candidate }) =>
      candidate.kind === previous.kind && (candidate.kind === 'wire'
        ? previous.kind === 'wire' && candidate.wireId === previous.wireId
        : candidate.kind !== 'grid' && previous.kind !== 'wire' &&
          JSON.stringify(candidate.endpoint) === JSON.stringify(previous.endpoint)));
    if (held && (!best || score(held) <= score(best) + SWITCH_PX)) return held.candidate;
  }
  return best?.candidate ?? free;
}
/** Remove only points between their neighbors, never a deliberate backtrack. */
export function simplifyPolyline(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    if (out.length && distance(p, out[out.length - 1]) < 0.001) continue;
    while (out.length > 1) {
      const a = out[out.length - 2],
        b = out[out.length - 1];
      if (distance(b, projectOnSegment(b, a, p)) >= 0.001) break;
      out.pop();
    }
    out.push(p);
  }
  return out;
}
export function normalizeWire(wire: Wire, doc: CircuitDocument): Wire {
  let result = wire;
  const route = JSON.stringify(simplifyPolyline(wirePoints(wire, doc)));
  // Removing a stored point is safe only if the routed geometry remains identical.
  for (let i = result.vertices.length - 1; i >= 0; i--) {
    const candidate = {
      ...result,
      vertices: result.vertices.filter((_, n) => n !== i),
    };
    if (JSON.stringify(simplifyPolyline(wirePoints(candidate, doc))) === route) result = candidate;
  }
  return result;
}
export function normalizeDocumentWires(doc: CircuitDocument): CircuitDocument {
  const normalizedIds = new Map<string, string[]>();
  const objects = doc.objects.map((o) => {
    if (o.kind !== 'wire') return o;
    const next = normalizeWire(o, doc);
    if (next.vertices.length === o.vertices.length) return o;
    normalizedIds.set(o.id, [o.id]);
    return next;
  });
  // Redundant waypoints can change route indices without changing the branch.
  // Rebind the same physical current position through the existing split path.
  return normalizedIds.size
    ? remapHighlightSpans(
        doc,
        remapSplitWireCurrents(doc, { ...doc, objects }, normalizedIds),
        normalizedIds,
      )
    : doc;
}

/** Slide the grabbed segment, keeping fixed connections and the rest of the route stable. */
export function moveWireSegment(
  wire: Wire, index: number, delta: Point, doc: CircuitDocument, snapping = true,
): Wire {
  const points = wirePoints(wire, doc);
  const a = points[index], b = points[index + 1];
  if (!a || !b) return wire;
  const length = distance(a, b);
  if (length < 0.001) return wire;
  const normal = { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
  const projected = delta.x * normal.x + delta.y * normal.y;
  const amount = snapping && (!wire.routing || wire.routing === 'orthogonal') ? snap(projected) : projected;
  if (Math.abs(amount) < 0.001) return wire;
  const shift = { x: normal.x * amount, y: normal.y * amount };
  const route = points.map((point, i) => i === index || i === index + 1 ? add(point, shift) : point);
  let startEndpoint = wire.startEndpoint, endEndpoint = wire.endEndpoint;
  const terminalLead = (endpoint: Endpoint, point: Point, neighbor: Point) => {
    if (endpoint.kind !== 'terminal' || (wire.routing && wire.routing !== 'orthogonal')) return null;
    const axis = endpointDirection(endpoint, doc);
    if (axis === 'x' ? point.y !== neighbor.y : point.x !== neighbor.x) return null;
    const size = distance(point, neighbor);
    const length = Math.min(GRID, size / 3);
    return {
      x: point.x + (neighbor.x - point.x) * length / size,
      y: point.y + (neighbor.y - point.y) * length / size,
    };
  };
  if (index === 0) {
    if (isLooseEndpoint(startEndpoint, doc)) startEndpoint = { kind: 'free', point: route[0] };
    else {
      const lead = terminalLead(startEndpoint, points[0], points[1]);
      if (lead) {
        route[0] = add(lead, shift);
        route.unshift(points[0], lead);
      } else route.unshift(points[0]);
    }
  }
  if (index === points.length - 2) {
    if (isLooseEndpoint(endEndpoint, doc)) endEndpoint = { kind: 'free', point: route.at(-1)! };
    else {
      const lead = terminalLead(endEndpoint, points.at(-1)!, points.at(-2)!);
      if (lead) {
        route[route.length - 1] = add(lead, shift);
        route.push(lead, points.at(-1)!);
      } else route.push(points.at(-1)!);
    }
  }
  const moved = { ...wire, startEndpoint, endEndpoint, vertices: route.slice(1, -1) };
  return routeEditedWire(moved, doc);
}

/** Heal only abandoned branch points. An explicit Split wire remains editable separately. */
export function healWireConnections(doc: CircuitDocument, connections: ReadonlySet<string>): CircuitDocument {
  let result = doc;
  for (const connection of connections) {
    const ends = result.objects.flatMap((o) => o.kind === 'wire'
      ? (['startEndpoint', 'endEndpoint'] as const).flatMap((side) => {
          const ep = o[side];
          return ep.kind === 'free' && ep.connectionId === connection ? [{ wire: o, side }] : [];
        }) : []);
    if (ends.length !== 2 || ends[0].wire.id === ends[1].wire.id) continue;
    const [first, second] = ends;
    const a = first.wire, b = second.wire;
    // A patterned stroke restarts its dash phase per object; merging would move its dashes.
    if ((a.lineStyle ?? 'solid') !== 'solid' || (b.lineStyle ?? 'solid') !== 'solid') continue;
    const style = (w: Wire) => JSON.stringify([
      w.routing ?? 'orthogonal', w.color, w.width, w.opacity ?? 1,
      w.lineStyle ?? 'solid', w.dashLength ?? w.width * 4, w.dashGap ?? w.width * 2,
    ]);
    if (style(a) !== style(b)) continue;
    const ap = simplifyPolyline(wirePoints(a, result)), bp = simplifyPolyline(wirePoints(b, result));
    if (first.side === 'startEndpoint') ap.reverse();
    if (second.side === 'endEndpoint') bp.reverse();
    if (ap.length < 2 || bp.length < 2 || distance(ap.at(-1)!, bp[0]) > 0.001) continue;
    const before = ap.at(-2)!, join = ap.at(-1)!, after = bp[1];
    // Merge a straight continuation, never a corner, return, or semantic zero-length link.
    if (distance(join, projectOnSegment(join, before, after)) > 0.001) continue;
    const route = simplifyPolyline([...ap, ...bp.slice(1)]);
    const merged: Wire = {
      ...a,
      startEndpoint: first.side === 'endEndpoint' ? a.startEndpoint : a.endEndpoint,
      endEndpoint: second.side === 'startEndpoint' ? b.endEndpoint : b.startEndpoint,
      vertices: route.slice(1, -1),
    };
    const actual = simplifyPolyline(wirePoints(merged, result));
    if (actual.length !== route.length || actual.some((p, i) => distance(p, route[i]) > 0.001)) continue;
    const previous = result;
    const ids = new Map([[a.id, [a.id]], [b.id, [a.id]]]);
    result = { ...result, objects: result.objects.flatMap((o) => o.id === a.id ? [merged] : o.id === b.id ? [] : [o]) };
    result = remapSplitWireCurrents(previous, result, ids);
    result = {
      ...result,
      objects: result.objects.map((o) => o.kind === 'highlight' && o.mode === 'smart'
        ? { ...o, spans: o.spans.map((span) => {
            if (!('wireId' in span) || !ids.has(span.wireId)) return span;
            const original = span.wireId === a.id ? a : b;
            const points = sliceHighlightRoute(wirePoints(original, previous), span.start, span.end);
            return { wireId: a.id, start: projectHighlight(route, points[0]).ratio,
              end: projectHighlight(route, points.at(-1)!).ratio };
          }) } : o),
    };
  }
  return result;
}
/** Quick Junction: split all incident wires, preserving terminal references at endpoints. */
export function insertJunction(
  doc: CircuitDocument,
  point: Point,
): { doc: CircuitDocument; junction: Junction } {
  const existing = doc.objects.find(
    (o): o is Junction => o.kind === 'junction' && distance(o, point) < 0.001,
  );
  const used = new Set(doc.objects.filter((o) => o.kind === 'junction').map((o) => o.label.text));
  let index = 0;
  const name = (n: number) => (n < 26 ? String.fromCharCode(65 + n) : `N${n - 25}`);
  while (used.has(name(index))) index++;
  const junction = existing ?? placeNodeLabel(createJunction(point, name(index)), doc);
  const ep: Endpoint = { kind: 'junction', junctionId: junction.id },
    objects: CircuitObject[] = [];
  const linked = new Set<string>();
  let changed = !existing;
  const bridge = (endpoint: Endpoint, wire: Wire) => {
    if (
      endpoint.kind === 'free' ||
      (endpoint.kind === 'junction' && endpoint.junctionId === junction.id)
    )
      return;
    const key = JSON.stringify(endpoint);
    if (linked.has(key)) return;
    linked.add(key);
    objects.push({
      ...wire,
      id: makeId(),
      startEndpoint: endpoint,
      endEndpoint: ep,
      vertices: [],
    });
  };
  const splitIds = new Map<string, string[]>();
  for (const o of doc.objects) {
    const before = objects.length;
    if (o.kind !== 'wire') {
      objects.push(o);
      continue;
    }
    const pts = wirePoints(o, doc);
    const segment = pts.findIndex(
      (a, i) =>
        i < pts.length - 1 && distance(point, projectOnSegment(point, a, pts[i + 1])) < 0.001,
    );
    if (segment < 0) {
      objects.push(o);
      continue;
    }
    if (
      (distance(point, pts[0]) < 0.001 &&
        o.startEndpoint.kind === 'junction' &&
        o.startEndpoint.junctionId === junction.id) ||
      (distance(point, pts[pts.length - 1]) < 0.001 &&
        o.endEndpoint.kind === 'junction' &&
        o.endEndpoint.junctionId === junction.id)
    ) {
      objects.push(o);
      continue;
    }
    changed = true;
    if (distance(point, pts[0]) < 0.001) {
      bridge(o.startEndpoint, o);
      objects.push({ ...o, startEndpoint: ep });
    } else if (distance(point, pts[pts.length - 1]) < 0.001) {
      bridge(o.endEndpoint, o);
      objects.push({ ...o, endEndpoint: ep });
    } else {
      objects.push({
        ...o,
        endEndpoint: ep,
        vertices: pts.slice(1, segment + 1),
      });
      objects.push({
        ...o,
        id: makeId(),
        startEndpoint: ep,
        vertices: pts.slice(segment + 1, -1),
      });
    }
    splitIds.set(
      o.id,
      objects
        .slice(before)
        .filter((x) => x.kind === 'wire')
        .map((x) => x.id),
    );
  }
  if (!changed) return { doc, junction };
  const next = normalizeDocumentWires({
    ...doc,
    objects: existing ? objects : [...objects, junction],
  });
  return {
    doc: remapHighlightSpans(doc, remapSplitWireCurrents(doc, next, splitIds), splitIds),
    junction,
  };
}

/** Keep current annotations on the corresponding physical branch after a wire is split. */
export function remapSplitWireCurrents(
  doc: CircuitDocument,
  next: CircuitDocument,
  splitIds: Map<string, string[]>,
): CircuitDocument {
  const originalObjects = new Map(doc.objects.map((o) => [o.id, o]));
  return {
    ...next,
    objects: next.objects.map((o) => {
      const original = originalObjects.get(o.id);
      if (
        o.kind !== 'electrical' ||
        original?.kind !== 'electrical' ||
        !original.wireId ||
        !splitIds.has(original.wireId)
      )
        return o;
      // Earlier normalization may already have rebound the shortened first
      // fragment. Resolve the selected branch from the original annotation,
      // never combine its new segment index with the old unsplit wire route.
      const center = currentWireAnchor(original, doc);
      const ids = new Set(splitIds.get(original.wireId));
      const candidate = nearestWire(
        center,
        next,
        Infinity,
        new Set(next.objects.filter((x) => !ids.has(x.id)).map((x) => x.id)),
      { snapToGrid: false },
      );
      if (!candidate) return o;
      const attached = createCurrent(candidate.wire, center, next);
      return {
        ...o,
        wireId: attached.wireId,
        ratio: attached.ratio,
        wireSegment: attached.wireSegment,
        start: attached.start,
        end: attached.end,
      };
    }),
  };
}

/** Split only the chosen wire. A style continuation never joins an unrelated crossing. */
export function splitWireAtPoint(
  doc: CircuitDocument,
  id: string,
  point: Point,
  connection?: Endpoint,
): { doc: CircuitDocument; secondId: string } | null {
  const wire = doc.objects.find((o) => o.id === id);
  if (wire?.kind !== 'wire') return null;
  const pts = wirePoints(wire, doc);
  const segment = pts.findIndex(
    (a, i) => i < pts.length - 1 && distance(point, projectOnSegment(point, a, pts[i + 1])) < 0.001,
  );
  if (segment < 0 || distance(point, pts[0]) < 0.001 || distance(point, pts.at(-1)!) < 0.001)
    return null;
  if (
    !connection &&
    (nearestTarget(point, doc, 0.01) || nearestWire(point, doc, 0.01, new Set([id])))
  )
    return null;
  const ep: Endpoint = connection ?? {
    kind: 'free',
    point: { ...point },
    connectionId: makeId(),
  };
  const first: Wire = {
    ...wire,
    endEndpoint: ep,
    vertices: pts.slice(1, segment + 1),
  };
  const second: Wire = {
    ...wire,
    id: makeId(),
    startEndpoint: ep,
    vertices: pts.slice(segment + 1, -1),
  };
  const next = {
    ...doc,
    objects: doc.objects.flatMap((o) => (o.id === id ? [first, second] : [o])),
  };
  return {
    doc: remapHighlightSpans(
      doc,
      remapSplitWireCurrents(doc, next, new Map([[id, [id, second.id]]])),
      new Map([[id, [id, second.id]]]),
    ),
    secondId: second.id,
  };
}
