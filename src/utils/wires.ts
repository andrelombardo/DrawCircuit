import { createCurrent, currentWireAnchor } from '../annotations/electrical';
import { placeNodeLabel } from './nodeLabels';
import { makeId } from '../model/catalog';
import { createJunction, createWire } from '../model/factories';
import { GRID } from '../model/types';
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
  localToWorld,
  nearestTarget,
  nearestWire,
  projectOnSegment,
  resolveEndpoint,
  snapPoint,
  safeWirePoints,
  wirePoints,
} from './geometry';
export type WireCandidate =
  | { point: Point; endpoint: Endpoint; kind: 'terminal' | 'junction' | 'grid' }
  | { point: Point; kind: 'wire'; wireId: string };
export interface WireDraft {
  routing?: WireRouting;
  start: Endpoint;
  vertices: Point[];
}
export const TERMINAL_DRAG_THRESHOLD = 5;

export interface WireSnapContext {
  anchor: Point;
  routing?: WireRouting;
}

/** Use the authored axis before the absolute grid, including off-grid pins/nodes. */
function alignedWirePoint(p: Point, zoom: number, context?: WireSnapContext): Point {
  const point = snapPoint(p);
  if (!context || context.routing === 'free') return point;
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
      : undefined,
  );
}

export function wireEndpointCandidate(
  p: Point,
  wire: Wire,
  side: 'start' | 'end',
  doc: CircuitDocument,
  zoom: number,
): WireCandidate {
  const anchor =
    side === 'start'
      ? (wire.vertices[0] ?? resolveEndpoint(wire.endEndpoint, doc))
      : (wire.vertices.at(-1) ?? resolveEndpoint(wire.startEndpoint, doc));
  return wireCandidate(p, doc, zoom, new Set([wire.id]), {
    anchor,
    routing: wire.routing,
  });
}

/** A wire target is resolved only on begin/commit, so hover never changes topology. */
export function resolveWireCandidate(doc: CircuitDocument, candidate: WireCandidate) {
  if (candidate.kind !== 'wire') return { doc, endpoint: candidate.endpoint };
  const result = insertJunction(doc, candidate.point);
  return {
    doc: result.doc,
    endpoint: { kind: 'junction', junctionId: result.junction.id } as Endpoint,
  };
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
    draft: { start: resolved.endpoint, vertices: [], routing } as WireDraft,
  };
}

function routeNewWire(wire: Wire, doc: CircuitDocument): Wire {
  const original = wirePoints(wire, doc),
    safe = safeWirePoints(wire, doc);
  return original.length === safe.length &&
    original.every((point, i) => distance(point, safe[i]) < 0.001)
    ? wire
    : { ...wire, vertices: safe.slice(1, -1) };
}

export function wirePreview(
  draft: WireDraft,
  candidate: WireCandidate,
  doc: CircuitDocument,
): Wire {
  return routeNewWire(
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
  );
}

/** Commit all auto-created nodes/splits and the new wire as one document change. */
export function commitWire(doc: CircuitDocument, draft: WireDraft, candidate: WireCandidate) {
  const resolved = resolveWireCandidate(doc, candidate),
    wire = routeNewWire(
      createWire(draft.start, resolved.endpoint, draft.vertices, draft.routing),
      resolved.doc,
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
    doc: normalizeDocumentWires({ ...resolved.doc, objects: [...resolved.doc.objects, wire] }),
    wireId: wire.id,
  };
}
export function wireCandidate(
  p: Point,
  doc: CircuitDocument,
  zoom: number,
  excluded = new Set<string>(),
  context?: WireSnapContext,
): WireCandidate {
  // All distances are screen pixels. Close terminals win before junctions, wires and grid.
  let terminal: WireCandidate | null = null,
    closest = 10 / zoom;
  for (const o of doc.objects)
    if (o.kind === 'component' && !excluded.has(o.id))
      for (const t of o.terminals) {
        const q = localToWorld(o, { x: t.localX, y: t.localY }),
          d = distance(p, q);
        if (d < closest) {
          closest = d;
          terminal = {
            kind: 'terminal',
            point: q,
            endpoint: { kind: 'terminal', componentId: o.id, terminalId: t.id },
          };
        }
      }
  if (terminal) return terminal;
  const target = nearestTarget(p, doc, 14 / zoom, excluded);
  if (target)
    return { ...target, kind: target.endpoint.kind === 'terminal' ? 'terminal' : 'junction' };
  const hit = nearestWire(p, doc, 12 / zoom, excluded);
  if (hit) {
    const a = hit.points[hit.segment],
      b = hit.points[hit.segment + 1];
    const aligned = alignedWirePoint(p, zoom, context);
    if (context && context.routing !== 'free') {
      if (a.x === b.x && Math.abs(p.y - context.anchor.y) <= 10 / zoom) aligned.x = a.x;
      if (a.y === b.y && Math.abs(p.x - context.anchor.x) <= 10 / zoom) aligned.y = a.y;
    }
    const point = projectOnSegment(aligned, a, b);
    // Alignment may choose a point only on the actual segment under the pointer.
    return {
      kind: 'wire',
      point:
        context &&
        context.routing !== 'free' &&
        distance(aligned, point) < 0.001 &&
        distance(p, point) < 14 / zoom
          ? point
          : hit.point,
      wireId: hit.wire.id,
    };
  }
  const point = alignedWirePoint(p, zoom, context);
  return { kind: 'grid', point, endpoint: { kind: 'free', point } };
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
    const candidate = { ...result, vertices: result.vertices.filter((_, n) => n !== i) };
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
  return normalizedIds.size ? remapSplitWireCurrents(doc, { ...doc, objects }, normalizedIds) : doc;
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
    objects.push({ ...wire, id: makeId(), startEndpoint: endpoint, endEndpoint: ep, vertices: [] });
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
      objects.push({ ...o, endEndpoint: ep, vertices: pts.slice(1, segment + 1) });
      objects.push({ ...o, id: makeId(), startEndpoint: ep, vertices: pts.slice(segment + 1, -1) });
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
  return { doc: remapSplitWireCurrents(doc, next, splitIds), junction };
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
): { doc: CircuitDocument; secondId: string } | null {
  const wire = doc.objects.find((o) => o.id === id);
  if (wire?.kind !== 'wire') return null;
  const pts = wirePoints(wire, doc);
  const segment = pts.findIndex(
    (a, i) => i < pts.length - 1 && distance(point, projectOnSegment(point, a, pts[i + 1])) < 0.001,
  );
  if (segment < 0 || distance(point, pts[0]) < 0.001 || distance(point, pts.at(-1)!) < 0.001)
    return null;
  if (nearestTarget(point, doc, 0.01) || nearestWire(point, doc, 0.01, new Set([id]))) return null;
  const junction = createJunction(point, ''),
    ep: Endpoint = { kind: 'junction', junctionId: junction.id };
  const first: Wire = { ...wire, endEndpoint: ep, vertices: pts.slice(1, segment + 1) };
  const second: Wire = {
    ...wire,
    id: makeId(),
    startEndpoint: ep,
    vertices: pts.slice(segment + 1, -1),
  };
  const next = {
    ...doc,
    objects: doc.objects.flatMap((o) => (o.id === id ? [first, second] : [o])).concat(junction),
  };
  return {
    doc: remapSplitWireCurrents(doc, next, new Map([[id, [id, second.id]]])),
    secondId: second.id,
  };
}
