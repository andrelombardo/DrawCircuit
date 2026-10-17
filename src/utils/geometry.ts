import { highlightBounds } from '../annotations/highlight';
import { braceGeometry } from '../annotations/brace';
import { electricalDrawingGeometry, electricalGeometry } from '../annotations/electrical';
import { componentRegistry } from '../model/catalog';
import { GRID } from '../model/types';
import { getMeasurementBounds } from './measurementGeometry';
import type {
  ArrowAnnotation,
  CircuitComponent,
  CircuitDocument,
  CircuitObject,
  Endpoint,
  Point,
  Wire,
} from '../model/types';
export const snap = (n: number) => Math.round(n / GRID) * GRID;
export const snapPoint = (p: Point): Point => ({ x: snap(p.x), y: snap(p.y) });
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export function rotatePoint(p: Point, rotation: number): Point {
  rotation = ((rotation % 360) + 360) % 360;
  switch (rotation) {
    case 90:
      return { x: -p.y, y: p.x };
    case 180:
      return { x: -p.x, y: -p.y };
    case 270:
      return { x: p.y, y: -p.x };
    case 0:
      return { ...p };
    default: {
      // Preserve exact cardinal coordinates and use the real transform for the
      // intermediate steps. Equal diagonal sine/cosine avoids axis jitter.
      if (rotation % 45 !== 0) {
        const angle = (rotation * Math.PI) / 180;
        return {
          x: p.x * Math.cos(angle) - p.y * Math.sin(angle),
          y: p.x * Math.sin(angle) + p.y * Math.cos(angle),
        };
      }
      const diagonal = Math.SQRT1_2;
      const cos = rotation === 45 || rotation === 315 ? diagonal : -diagonal;
      const sin = rotation === 45 || rotation === 135 ? diagonal : -diagonal;
      return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos };
    }
  }
}
export function localToWorld(component: CircuitComponent, p: Point): Point {
  const r = rotatePoint(p, component.rotation);
  return { x: component.x + r.x, y: component.y + r.y };
}
const indices = new WeakMap<CircuitDocument, Map<string, CircuitObject>>();
function objectIndex(doc: CircuitDocument) {
  let index = indices.get(doc);
  if (!index) {
    index = new Map(doc.objects.map((o) => [o.id, o]));
    indices.set(doc, index);
  }
  return index;
}
export function resolveEndpoint(endpoint: Endpoint, doc: CircuitDocument): Point {
  if (endpoint.kind === 'free') return endpoint.point;
  if (endpoint.kind === 'junction') {
    const j = objectIndex(doc).get(endpoint.junctionId);
    if (j?.kind === 'junction') return { x: j.x, y: j.y };
  } else {
    const c = objectIndex(doc).get(endpoint.componentId);
    if (c?.kind === 'component') {
      const t = c.terminals.find((t) => t.id === endpoint.terminalId);
      if (t) return localToWorld(c, { x: t.localX, y: t.localY });
    }
  }
  throw new Error('Collegamento a un terminale o nodo inesistente.');
}
export function endpointDirection(ep: Endpoint, doc: CircuitDocument): 'x' | 'y' {
  if (ep.kind !== 'terminal') return 'x';
  const c = objectIndex(doc).get(ep.componentId);
  if (c?.kind !== 'component') return 'x';
  const t = c.terminals.find((t) => t.id === ep.terminalId);
  if (!t) return 'x';
  const axis =
    t.direction ?? componentRegistry[c.type].terminals.find((pin) => pin.id === t.id)?.direction;
  const direction =
    axis === 'x' ? { x: 1, y: 0 } : axis === 'y' ? { x: 0, y: 1 } : { x: t.localX, y: t.localY };
  const d = rotatePoint(direction, c.rotation);
  return Math.abs(d.x) >= Math.abs(d.y) ? 'x' : 'y';
}
function orthogonal(a: Point, b: Point, direction: 'x' | 'y', both = false): Point[] {
  if (a.x === b.x || a.y === b.y) return [a, b];
  if (both) {
    if (direction === 'x') {
      const x = snap((a.x + b.x) / 2);
      return [a, { x, y: a.y }, { x, y: b.y }, b];
    }
    const y = snap((a.y + b.y) / 2);
    return [a, { x: a.x, y }, { x: b.x, y }, b];
  }
  return [a, direction === 'x' ? { x: b.x, y: a.y } : { x: a.x, y: b.y }, b];
}

function terminalExit(endpoint: Endpoint | null, doc: CircuitDocument) {
  if (endpoint?.kind !== 'terminal') return null;
  const component = objectIndex(doc).get(endpoint.componentId);
  if (component?.kind !== 'component') return null;
  const terminal = component.terminals.find((t) => t.id === endpoint.terminalId);
  if (!terminal) return null;
  const body = componentRegistry[component.type].measurementBounds,
    axis =
      terminal.direction ??
      componentRegistry[component.type].terminals.find((t) => t.id === terminal.id)?.direction ??
      (Math.abs(terminal.localX) >= Math.abs(terminal.localY) ? 'x' : 'y'),
    coordinate =
      axis === 'x'
        ? terminal.localX - body.x - body.width / 2
        : terminal.localY - body.y - body.height / 2,
    sign = Math.sign(coordinate) || 1;
  return {
    direction: rotatePoint(
      axis === 'x' ? { x: sign, y: 0 } : { x: 0, y: sign },
      component.rotation,
    ),
    bounds: getMeasurementBounds(component),
  };
}

/** A short lead follows a diagonal pin before the existing orthogonal route.
 * Its length clears the rotated body bounds, including multi-pin symbols. */
function diagonalLead(endpoint: Endpoint, point: Point, doc: CircuitDocument): Point | null {
  const exit = terminalExit(endpoint, doc);
  if (!exit || !exit.direction.x || !exit.direction.y) return null;
  const { direction, bounds } = exit;
  const outside = Math.min(
    ((direction.x > 0 ? bounds.x + bounds.width : bounds.x) - point.x) / direction.x,
    ((direction.y > 0 ? bounds.y + bounds.height : bounds.y) - point.y) / direction.y,
  );
  const length = Math.max(GRID, outside + GRID / 2);
  return add(point, { x: direction.x * length, y: direction.y * length });
}

/** Preserve familiar routes; only reroute when a terminal would point inward or
 * the connection would cross one of its own symbol bodies. The small visibility
 * graph concerns at most the two endpoint bodies, not a document-wide router. */
function terminalSafeRoute(
  original: Point[],
  startEndpoint: Endpoint | null,
  endEndpoint: Endpoint | null,
  doc: CircuitDocument,
): Point[] {
  const startExit = terminalExit(startEndpoint, doc),
    endExit = terminalExit(endEndpoint, doc),
    obstacles = [startExit?.bounds, endExit?.bounds].filter((b) => b !== undefined),
    points = original.filter((p, i) => i === 0 || distance(p, original[i - 1]) > 0.001),
    start = points[0],
    end = points.at(-1)!;
  if (points.length < 2 || !obstacles.length) return points;
  // Diagonal pins already have their outward lead at this point. Continue on a
  // cardinal axis without asking the axis-aligned visibility graph to diagonalize.
  for (const exit of [startExit, endExit]) {
    if (!exit || !exit.direction.x || !exit.direction.y) continue;
    exit.direction =
      Math.abs(exit.direction.x) >= Math.abs(exit.direction.y)
        ? { x: Math.sign(exit.direction.x), y: 0 }
        : { x: 0, y: Math.sign(exit.direction.y) };
  }
  const follows = (from: Point, to: Point, direction: Point) =>
    (to.x - from.x) * direction.x + (to.y - from.y) * direction.y > 0.001 &&
    (direction.x ? to.y === from.y : to.x === from.x);
  const clear = (a: Point, b: Point) =>
    obstacles.every((box) =>
      a.x === b.x
        ? !(
            a.x > box.x + 0.001 &&
            a.x < box.x + box.width - 0.001 &&
            Math.max(a.y, b.y) > box.y + 0.001 &&
            Math.min(a.y, b.y) < box.y + box.height - 0.001
          )
        : !(
            a.y > box.y + 0.001 &&
            a.y < box.y + box.height - 0.001 &&
            Math.max(a.x, b.x) > box.x + 0.001 &&
            Math.min(a.x, b.x) < box.x + box.width - 0.001
          ),
    );
  if (
    (!startExit || follows(start, points[1], startExit.direction)) &&
    (!endExit || follows(end, points.at(-2)!, endExit.direction)) &&
    points.slice(1).every((p, i) => clear(points[i], p))
  )
    return points;
  const xs = [
      ...new Set([
        start.x,
        end.x,
        ...(startExit ? [start.x + startExit.direction.x * GRID] : []),
        ...(endExit ? [end.x + endExit.direction.x * GRID] : []),
        ...obstacles.flatMap((b) => [b.x - GRID, b.x + b.width + GRID]),
      ]),
    ].sort((a, b) => a - b),
    ys = [
      ...new Set([
        start.y,
        end.y,
        ...(startExit ? [start.y + startExit.direction.y * GRID] : []),
        ...(endExit ? [end.y + endExit.direction.y * GRID] : []),
        ...obstacles.flatMap((b) => [b.y - GRID, b.y + b.height + GRID]),
      ]),
    ].sort((a, b) => a - b),
    nodes = ys.flatMap((y) => xs.map((x) => ({ x, y }))),
    first = nodes.findIndex((p) => p.x === start.x && p.y === start.y),
    last = nodes.findIndex((p) => p.x === end.x && p.y === end.y);
  type State = { node: number; axis: 'x' | 'y' | ''; cost: number; path: number[] };
  const pending: State[] = [{ node: first, axis: '', cost: 0, path: [first] }],
    visited = new Set<string>();
  while (pending.length) {
    pending.sort((a, b) => a.cost - b.cost);
    const current = pending.shift()!,
      key = `${current.node}:${current.axis}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (current.node === last) {
      const result: Point[] = [];
      for (const index of current.path) {
        const p = nodes[index],
          a = result.at(-2),
          b = result.at(-1);
        if (a && b && ((a.x === b.x && b.x === p.x) || (a.y === b.y && b.y === p.y))) result.pop();
        result.push(p);
      }
      return result;
    }
    const x = current.node % xs.length,
      y = Math.floor(current.node / xs.length),
      a = nodes[current.node];
    for (const [nx, ny] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (nx < 0 || nx >= xs.length || ny < 0 || ny >= ys.length) continue;
      const node = ny * xs.length + nx,
        b = nodes[node],
        axis = a.x === b.x ? 'y' : 'x';
      if (
        !clear(a, b) ||
        (current.node === first && startExit && !follows(a, b, startExit.direction)) ||
        (node === last && endExit && !follows(b, a, endExit.direction))
      )
        continue;
      pending.push({
        node,
        axis,
        cost: current.cost + distance(a, b) + (current.axis && current.axis !== axis ? 0.01 : 0),
        path: [...current.path, node],
      });
    }
  }
  // Overlapping symbols or a waypoint placed inside its own body cannot be routed
  // around without moving user geometry. Preserve that authored waypoint.
  return points;
}
export function wirePoints(wire: Wire, doc: CircuitDocument): Point[] {
  return routeWire(wire, doc, false);
}

/** New connections use signed exits without changing historical automatic paths. */
export function safeWirePoints(wire: Wire, doc: CircuitDocument): Point[] {
  return routeWire(wire, doc, true);
}

function routeWire(wire: Wire, doc: CircuitDocument, protectTerminals: boolean): Point[] {
  const startPoint = resolveEndpoint(wire.startEndpoint, doc),
    endPoint = resolveEndpoint(wire.endEndpoint, doc);
  if (wire.routing === 'free') return [startPoint, ...wire.vertices, endPoint];
  if (wire.routing === '45') {
    const anchors = [startPoint, ...wire.vertices, endPoint];
    const result: Point[] = [startPoint];
    for (let i = 1; i < anchors.length; i++) {
      const a = anchors[i - 1],
        b = anchors[i],
        dx = b.x - a.x,
        dy = b.y - a.y;
      const diagonal = Math.min(Math.abs(dx), Math.abs(dy));
      if (diagonal > 0.001 && Math.abs(Math.abs(dx) - Math.abs(dy)) > 0.001)
        result.push({ x: a.x + Math.sign(dx) * diagonal, y: a.y + Math.sign(dy) * diagonal });
      if (distance(result.at(-1)!, b) > 0.001) result.push(b);
    }
    return result;
  }
  // Smart Placement uses a semantic zero-length wire at coincident terminals.
  // Diagonal lead-outs must not turn that connection into a visible loop.
  if (!wire.vertices.length && distance(startPoint, endPoint) < 0.001) return [startPoint];
  const startLead = diagonalLead(wire.startEndpoint, startPoint, doc),
    endLead = diagonalLead(wire.endEndpoint, endPoint, doc),
    start = startLead ?? startPoint,
    end = endLead ?? endPoint;
  const sd = endpointDirection(wire.startEndpoint, doc),
    ed = endpointDirection(wire.endEndpoint, doc);
  const route = (points: Point[], start: Endpoint | null, end: Endpoint | null) =>
    protectTerminals ? terminalSafeRoute(points, start, end, doc) : points;
  const withLeads = (points: Point[]) =>
    [startPoint, ...points, endPoint].filter(
      (p, i, all) => i === 0 || distance(p, all[i - 1]) > 0.001,
    );
  if (protectTerminals) {
    // Only terminal pins constrain the exit axis. Nodes and free points follow
    // the gesture instead of inheriting a horizontal pin and a middle dogleg.
    const dominant = (a: Point, b: Point) =>
      Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? 'x' : 'y';
    if (!wire.vertices.length) {
      const points =
        wire.startEndpoint.kind !== 'terminal' && wire.endEndpoint.kind === 'terminal'
          ? orthogonal(end, start, ed).reverse()
          : orthogonal(
              start,
              end,
              wire.startEndpoint.kind === 'terminal' ? sd : dominant(start, end),
              wire.startEndpoint.kind === 'terminal' &&
                wire.endEndpoint.kind === 'terminal' &&
                sd === ed,
            );
      return withLeads(route(points, wire.startEndpoint, wire.endEndpoint));
    }
    const result: Point[] = [start];
    for (const [i, point] of wire.vertices.entries()) {
      const previous = result.at(-1)!;
      result.push(
        ...route(
          orthogonal(
            previous,
            point,
            i === 0 && wire.startEndpoint.kind === 'terminal' ? sd : dominant(previous, point),
          ),
          i === 0 ? wire.startEndpoint : null,
          null,
        ).slice(1),
      );
    }
    const previous = result.at(-1)!;
    const tail =
      wire.endEndpoint.kind === 'terminal'
        ? route(orthogonal(end, previous, ed), wire.endEndpoint, null).reverse()
        : orthogonal(previous, end, dominant(previous, end));
    result.push(...tail.slice(1));
    return withLeads(result);
  }
  if (!wire.vertices.length)
    return withLeads(
      route(orthogonal(start, end, sd, sd === ed), wire.startEndpoint, wire.endEndpoint),
    );
  const result: Point[] = [start];
  wire.vertices.forEach((p, i) =>
    result.push(
      ...route(
        orthogonal(result[result.length - 1], p, i === 0 ? sd : 'x'),
        i === 0 ? wire.startEndpoint : null,
        null,
      ).slice(1),
    ),
  );
  result.push(
    ...route(orthogonal(end, result[result.length - 1], ed), wire.endEndpoint, null)
      .reverse()
      .slice(1),
  );
  return withLeads(result);
}
export const pointsPath = (points: Point[]) =>
  points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
export interface SnapTarget {
  point: Point;
  endpoint: Endpoint;
}
export function nearestTarget(
  p: Point,
  doc: CircuitDocument,
  threshold: number,
  excluded = new Set<string>(),
): SnapTarget | null {
  let best: SnapTarget | null = null,
    closest = threshold;
  for (const o of doc.objects) {
    if (excluded.has(o.id)) continue;
    if (o.kind === 'junction') {
      const d = distance(p, o);
      if (d < closest) {
        closest = d;
        best = { point: { x: o.x, y: o.y }, endpoint: { kind: 'junction', junctionId: o.id } };
      }
    }
    if (o.kind === 'component')
      for (const t of o.terminals) {
        const point = localToWorld(o, { x: t.localX, y: t.localY }),
          d = distance(p, point);
        if (d < closest) {
          closest = d;
          best = { point, endpoint: { kind: 'terminal', componentId: o.id, terminalId: t.id } };
        }
      }
  }
  return best;
}
export function projectOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    den = dx * dx + dy * dy;
  const t = den === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / den));
  return { x: a.x + t * dx, y: a.y + t * dy };
}
const wireRoutes = new WeakMap<CircuitDocument, { wire: Wire; points: Point[] }[]>();
export function nearestWire(
  p: Point,
  doc: CircuitDocument,
  threshold: number,
  excluded = new Set<string>(),
): { wire: Wire; point: Point; segment: number; points: Point[] } | null {
  let result: ReturnType<typeof nearestWire> = null,
    min = threshold;
  let routes = wireRoutes.get(doc);
  if (!routes) {
    routes = doc.objects.flatMap((o) =>
      o.kind === 'wire' ? [{ wire: o, points: wirePoints(o, doc) }] : [],
    );
    wireRoutes.set(doc, routes);
  }
  for (const { wire: o, points } of routes) {
    if (excluded.has(o.id)) continue;
    for (let i = 0; i < points.length - 1; i++) {
      const projection = projectOnSegment(p, points[i], points[i + 1]),
        gridPoint = projectOnSegment(snapPoint(projection), points[i], points[i + 1]);
      const d = distance(p, projection);
      const q = distance(p, gridPoint) < threshold ? gridPoint : projection;
      if (d < min) {
        min = d;
        result = { wire: o, point: q, segment: i, points };
      }
    }
  }
  return result;
}
export function moveObject(o: CircuitObject, delta: Point, moved: Set<string>): CircuitObject {
  if (
    o.kind === 'component' ||
    o.kind === 'junction' ||
    o.kind === 'text' ||
    o.kind === 'loop-arrow' ||
    o.kind === 'rectangle'
  )
    return { ...o, x: o.x + delta.x, y: o.y + delta.y };
  if (o.kind === 'highlight')
    return o.mode === 'free' ? { ...o, points: o.points.map((p) => add(p, delta)) } : o;
  if (o.kind === 'electrical') {
    const attached =
      (o.wireId && !moved.has(o.wireId)) || (o.componentId && !moved.has(o.componentId));
    return attached
      ? { ...o, offset: add(o.offset, delta) }
      : { ...o, start: add(o.start, delta), end: add(o.end, delta) };
  }
  if (o.kind === 'brace' || o.kind === 'line')
    return { ...o, start: add(o.start, delta), end: add(o.end, delta) };
  if (o.kind === 'arrow')
    return {
      ...o,
      start: add(o.start, delta),
      end: add(o.end, delta),
      controlPoints: [add(o.controlPoints[0], delta), add(o.controlPoints[1], delta)],
    };
  const moveEp = (ep: Endpoint): Endpoint =>
    ep.kind === 'free' ? { kind: 'free', point: add(ep.point, delta) } : ep;
  const attached = (ep: Endpoint) =>
    ep.kind === 'terminal'
      ? moved.has(ep.componentId)
      : ep.kind === 'junction'
        ? moved.has(ep.junctionId)
        : false;
  // Connected endpoints remain references. Moving a selected wire changes its route only.
  return {
    ...o,
    startEndpoint: moveEp(o.startEndpoint),
    endEndpoint: moveEp(o.endEndpoint),
    vertices: o.vertices.map((p) => add(p, delta)),
    ...(!o.vertices.length &&
    !attached(o.startEndpoint) &&
    !attached(o.endEndpoint) &&
    o.startEndpoint.kind !== 'free' &&
    o.endEndpoint.kind !== 'free'
      ? { vertices: [] }
      : {}),
  };
}
export const add = (a: Point, b: Point): Point => ({ x: a.x + b.x || 0, y: a.y + b.y || 0 });
export const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export function arrowPath(a: ArrowAnnotation): string {
  if (a.type === 'straight') return pointsPath([a.start, a.end]);
  if (a.type === 'curve')
    return `M ${a.start.x} ${a.start.y} C ${a.controlPoints[0].x} ${a.controlPoints[0].y} ${a.controlPoints[1].x} ${a.controlPoints[1].y} ${a.end.x} ${a.end.y}`;
  const g = arcGeometry(a);
  return `M ${g.start.x} ${g.start.y} A ${g.radius} ${g.radius} 0 1 ${g.sign > 0 ? 1 : 0} ${g.end.x} ${g.end.y}`;
}
export function arcGeometry(a: ArrowAnnotation) {
  const center = midpoint(a.start, a.end),
    radius = Math.max(20, distance(a.start, a.end) / 2);
  const transform = (p: Point) =>
    rotatePoint({ x: a.arcMirrored ? -p.x : p.x, y: p.y }, a.arcRotation ?? 0);
  const point = (degrees: number) =>
    add(
      center,
      transform({
        x: radius * Math.cos((degrees * Math.PI) / 180),
        y: radius * Math.sin((degrees * Math.PI) / 180),
      }),
    );
  const sign = a.arcMirrored ? -1 : 1;
  const start = point(-60),
    end = point(250);
  const angle = ((a.reversed ? -60 : 250) * Math.PI) / 180;
  const tangent = transform({
    x: -Math.sin(angle) * (a.reversed ? -1 : 1),
    y: Math.cos(angle) * (a.reversed ? -1 : 1),
  });
  return {
    center,
    radius,
    start,
    end,
    sign,
    tangent,
    startAngle: (Math.atan2(start.y - center.y, start.x - center.x) * 180) / Math.PI,
  };
}

export function objectBounds(
  o: CircuitObject,
  doc: CircuitDocument,
): { x: number; y: number; width: number; height: number } {
  let points: Point[];
  if (o.kind === 'highlight') return highlightBounds(o, doc);
  if (o.kind === 'brace') {
    const g = braceGeometry(o);
    points = g.points.flatMap((p) => [
      { x: p.x - o.width / 2, y: p.y - o.width / 2 },
      { x: p.x + o.width / 2, y: p.y + o.width / 2 },
    ]);
  } else if (o.kind === 'electrical') {
    const drawing = o.mode === 'current' ? electricalDrawingGeometry(o, doc) : null;
    const g = drawing ?? electricalGeometry(o, doc);
    const w = Math.max(24, o.label.text.length * o.label.fontSize * 0.6);
    points = [
      g.start,
      g.end,
      { x: g.labelPoint.x - w / 2, y: g.labelPoint.y - o.label.fontSize },
      { x: g.labelPoint.x + w / 2, y: g.labelPoint.y + o.label.fontSize },
    ];
    if (drawing) points.push(...drawing.head);
  } else if (o.kind === 'rectangle') return { x: o.x, y: o.y, width: o.width, height: o.height };
  else if (o.kind === 'line') points = [o.start, o.end];
  else if (o.kind === 'wire') points = wirePoints(o, doc);
  else if (o.kind === 'loop-arrow') {
    const angle = ((o.rotation ?? 0) * Math.PI) / 180;
    const width = Math.hypot(o.width * Math.cos(angle), o.height * Math.sin(angle));
    const height = Math.hypot(o.width * Math.sin(angle), o.height * Math.cos(angle));
    return { x: o.x + (o.width - width) / 2, y: o.y + (o.height - height) / 2, width, height };
  } else if (o.kind === 'arrow') {
    if (o.type === 'arc') {
      const r = Math.max(20, distance(o.start, o.end) / 2),
        c = midpoint(o.start, o.end);
      points = [
        { x: c.x - r, y: c.y - r },
        { x: c.x + r, y: c.y + r },
      ];
    } else points = o.type === 'straight' ? [o.start, o.end] : [o.start, o.end, ...o.controlPoints];
  } else if (o.kind === 'component') {
    const b = componentRegistry[o.type].bounds;
    points = [
      { x: b.x, y: b.y },
      { x: b.x + b.width, y: b.y },
      { x: b.x, y: b.y + b.height },
      { x: b.x + b.width, y: b.y + b.height },
    ].map((p) => localToWorld(o, p));
  } else if (o.kind === 'junction')
    points = [
      { x: o.x - 8, y: o.y - 8 },
      { x: o.x + 8, y: o.y + 8 },
    ];
  else {
    const w = Math.max(30, o.text.length * o.fontSize * 0.55),
      offset = o.align === 'start' ? 0 : o.align === 'middle' ? -w / 2 : -w;
    points = [
      { x: o.x + offset, y: o.y - o.fontSize },
      { x: o.x + offset + w, y: o.y + o.fontSize },
    ];
  }
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y),
    x = Math.min(...xs),
    y = Math.min(...ys);
  return {
    x,
    y,
    width: Math.max(1, Math.max(...xs) - x),
    height: Math.max(1, Math.max(...ys) - y),
  };
}
export function documentBounds(doc: CircuitDocument) {
  const boxes = doc.objects.map((o) => objectBounds(o, doc));
  if (!boxes.length) return { x: -200, y: -150, width: 400, height: 300 };
  const x = Math.min(...boxes.map((b) => b.x)) - 60,
    y = Math.min(...boxes.map((b) => b.y)) - 60;
  return {
    x,
    y,
    width: Math.max(...boxes.map((b) => b.x + b.width)) - x + 60,
    height: Math.max(...boxes.map((b) => b.y + b.height)) - y + 60,
  };
}
