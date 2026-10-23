import { t } from '../i18n';
import { lineArrowHead } from '../tikz/arrowheads';
import { highlightBounds, mapHighlight } from '../annotations/highlight';
import { braceGeometry } from '../annotations/brace';
import { electricalDrawingGeometry, electricalGeometry } from '../annotations/electrical';
import { componentRegistry } from '../model/catalog';
import { GRID } from '../model/types';
import type { SymbolBounds } from '../model/symbolBounds';
import type {
  ArrowAnnotation,
  CircuitComponent,
  CircuitDocument,
  CircuitObject,
  Endpoint,
  Point,
  LineAnnotation,
  Wire,
  WireRouting,
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
const wireConnections = new WeakMap<CircuitDocument, Map<string, Set<string>>>();
export function connectionWires(endpoint: Endpoint, doc: CircuitDocument): ReadonlySet<string> {
  if (endpoint.kind !== 'free' || !endpoint.connectionId) return new Set();
  let index = wireConnections.get(doc);
  if (!index) {
    index = new Map();
    for (const o of doc.objects) {
      if (o.kind !== 'wire') continue;
      for (const ep of [o.startEndpoint, o.endEndpoint]) {
        if (ep.kind !== 'free' || !ep.connectionId) continue;
        const wires = index.get(ep.connectionId) ?? new Set<string>();
        wires.add(o.id);
        index.set(ep.connectionId, wires);
      }
    }
    wireConnections.set(doc, index);
  }
  return index.get(endpoint.connectionId) ?? new Set();
}
export function isLooseEndpoint(endpoint: Endpoint, doc: CircuitDocument): boolean {
  return endpoint.kind === 'free' && connectionWires(endpoint, doc).size < 2;
}
export function fixedWireConnection(endpoint: Endpoint, doc: CircuitDocument, moved: Set<string>) {
  return [...connectionWires(endpoint, doc)].some((id) => !moved.has(id));
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
  throw new Error(t('Connection refers to an unknown terminal or junction.'));
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
  // Use the rotated body envelope, including the empty spaces between open
  // strokes such as the zig-zag resistor. A route must not cut through them.
  const corners = [
    { x: body.x, y: body.y },
    { x: body.x + body.width, y: body.y },
    { x: body.x, y: body.y + body.height },
    { x: body.x + body.width, y: body.y + body.height },
  ].map((p) => localToWorld(component, p)),
    x = Math.min(...corners.map((p) => p.x)),
    y = Math.min(...corners.map((p) => p.y));
  return {
    direction: rotatePoint(
      axis === 'x' ? { x: sign, y: 0 } : { x: 0, y: sign },
      component.rotation,
    ),
    bounds: { x, y, width: Math.max(...corners.map((p) => p.x)) - x,
      height: Math.max(...corners.map((p) => p.y)) - y },
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

/** Check the open body interior for every segment orientation, including free
 * and 45-degree wires. Boundaries remain available for pins and lead-outs. */
function crossesBody(a: Point, b: Point, box: SymbolBounds) {
  let enter = 0, leave = 1;
  for (const axis of ['x', 'y'] as const) {
    const min = box[axis] + 0.001,
      max = box[axis] + (axis === 'x' ? box.width : box.height) - 0.001,
      delta = b[axis] - a[axis];
    if (max <= min) return false;
    if (Math.abs(delta) < 1e-10) {
      if (a[axis] <= min || a[axis] >= max) return false;
    } else {
      const t0 = (min - a[axis]) / delta, t1 = (max - a[axis]) / delta;
      enter = Math.max(enter, Math.min(t0, t1));
      leave = Math.min(leave, Math.max(t0, t1));
      if (enter >= leave) return false;
    }
  }
  return enter < leave;
}

/** Small visibility graph around the endpoint bodies. Safe authored bends are
 * retained; only individual obstructed legs need a detour. */
function routeAroundBodies(
  start: Point,
  end: Point,
  obstacles: SymbolBounds[],
  startDirection?: Point,
  endDirection?: Point,
  routing: WireRouting = 'orthogonal',
): Point[] {
  const clear = (a: Point, b: Point) => obstacles.every((box) => !crossesBody(a, b, box));
  const outward = (a: Point, b: Point, direction?: Point) =>
    !direction || (b.x - a.x) * direction.x + (b.y - a.y) * direction.y >= -0.001;
  const dx = end.x - start.x, dy = end.y - start.y,
    direct = Math.abs(dx) < 0.001 || Math.abs(dy) < 0.001 || routing === 'free' ||
      (routing === '45' && Math.abs(Math.abs(dx) - Math.abs(dy)) < 0.001);
  if (direct && clear(start, end) && outward(start, end, startDirection) && outward(end, start, endDirection))
    return [start, end];
  const xs = [...new Set([
      start.x, end.x, start.x - GRID, start.x + GRID, end.x - GRID, end.x + GRID,
      ...obstacles.flatMap((b) => [b.x - GRID, b.x + b.width + GRID]),
    ])].sort((a, b) => a - b),
    ys = [...new Set([
      start.y, end.y, start.y - GRID, start.y + GRID, end.y - GRID, end.y + GRID,
      ...obstacles.flatMap((b) => [b.y - GRID, b.y + b.height + GRID]),
    ])].sort((a, b) => a - b),
    nodes = ys.flatMap((y) => xs.map((x) => ({ x, y }))),
    first = nodes.findIndex((p) => p.x === start.x && p.y === start.y),
    last = nodes.findIndex((p) => p.x === end.x && p.y === end.y);
  type State = { node: number; axis: 'x' | 'y' | ''; cost: number; path: number[] };
  const pending: State[] = [{ node: first, axis: '', cost: 0, path: [first] }],
    visited = new Set<string>();
  while (pending.length) {
    pending.sort((a, b) => a.cost - b.cost);
    const current = pending.shift()!, key = `${current.node}:${current.axis}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (current.node === last) return current.path.map((index) => nodes[index]);
    const x = current.node % xs.length,
      y = Math.floor(current.node / xs.length), a = nodes[current.node];
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || nx >= xs.length || ny < 0 || ny >= ys.length) continue;
      const node = ny * xs.length + nx, b = nodes[node], axis = a.x === b.x ? 'y' : 'x';
      if (!clear(a, b) ||
        (current.node === first && !outward(a, b, startDirection)) ||
        (node === last && !outward(b, a, endDirection))) continue;
      pending.push({ node, axis,
        cost: current.cost + distance(a, b) + (current.axis && current.axis !== axis ? 0.01 : 0),
        path: [...current.path, node],
      });
    }
  }
  // A different component can overlap a fixed endpoint. Keep its electrical
  // connection rather than silently moving it to another pin.
  return [start, end];
}

function cleanRoute(points: Point[]): Point[] {
  const result: Point[] = [];
  for (const point of points) {
    if (result.length && distance(point, result.at(-1)!) < 0.001) continue;
    while (result.length > 1 &&
      distance(result.at(-2)!, result.at(-1)!) + distance(result.at(-1)!, point) -
        distance(result.at(-2)!, point) < 0.001) result.pop();
    result.push(point);
  }
  return result;
}

/** Apply the same terminal protection to rendering, editing, movement and export.
 * A bend swallowed by a moving symbol is discarded, while outside bends stay put. */
function terminalSafeRoute(original: Point[], wire: Wire, doc: CircuitDocument): Point[] {
  const startExit = terminalExit(wire.startEndpoint, doc),
    endExit = terminalExit(wire.endEndpoint, doc),
    obstacles = [startExit?.bounds, endExit?.bounds].filter((b) => b !== undefined),
    points = original.filter((p, i) => i === 0 || distance(p, original[i - 1]) > 0.001);
  if (points.length < 2 || !obstacles.length) return points;
  const start = points[0], end = points.at(-1)!;
  const follows = (from: Point, to: Point, exit: ReturnType<typeof terminalExit>) => {
    if (!exit) return true;
    const dx = to.x - from.x, dy = to.y - from.y, d = exit.direction;
    return dx * d.x + dy * d.y > 0.001 &&
      (wire.routing === 'free' || wire.routing === '45' || Math.abs(dx * d.y - dy * d.x) < 0.001);
  };
  // Lead-outs may lie inside the AABB of a diagonal symbol even though they are
  // outside its actual body. Test those two short segments in local coordinates.
  const clear = (a: Point, b: Point) => [wire.startEndpoint, wire.endEndpoint].every((ep) => {
    if (ep.kind !== 'terminal') return true;
    const component = objectIndex(doc).get(ep.componentId);
    if (component?.kind !== 'component') return true;
    const local = (p: Point) => rotatePoint({ x: p.x - component.x, y: p.y - component.y }, -component.rotation);
    return !crossesBody(local(a), local(b), componentRegistry[component.type].measurementBounds);
  });
  if (follows(start, points[1], startExit) && follows(end, points.at(-2)!, endExit) &&
    points.slice(1).every((p, i) => clear(points[i], p))) return points;
  const lead = (point: Point, exit: NonNullable<ReturnType<typeof terminalExit>>) => {
    const d = exit.direction, b = exit.bounds;
    const outside = Math.min(...(['x', 'y'] as const).flatMap((axis) => d[axis] ? [
      ((d[axis] > 0 ? b[axis] + (axis === 'x' ? b.width : b.height) : b[axis]) - point[axis]) / d[axis],
    ] : []));
    return add(point, { x: d.x * Math.max(GRID, outside + GRID / 2), y: d.y * Math.max(GRID, outside + GRID / 2) });
  };
  const inside = (p: Point) => obstacles.some((box) => crossesBody(p, p, box)),
    retained = [start, ...points.slice(1, -1).filter((p) => !inside(p) &&
      distance(p, start) > 0.001 && distance(p, end) > 0.001), end];
  // A short connection may become straight again when an obsolete interior bend
  // is removed. Do not add lead-outs that would overshoot its other endpoint.
  if (follows(start, retained[1], startExit) && follows(end, retained.at(-2)!, endExit) &&
    retained.slice(1).every((b, i) => {
      const a = retained[i], dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y);
      return clear(a, b) && (wire.routing === 'free' || dx < 0.001 || dy < 0.001 ||
        (wire.routing === '45' && Math.abs(dx - dy) < 0.001));
    })) return cleanRoute(retained);
  const first = startExit ? lead(start, startExit) : start,
    last = endExit ? lead(end, endExit) : end,
    anchors = [first, ...retained.slice(1, -1), last],
    result = [start, first];
  for (let i = 1; i < anchors.length; i++)
    result.push(...routeAroundBodies(anchors[i - 1], anchors[i], obstacles,
      i === 1 ? startExit?.direction : undefined,
      i === anchors.length - 1 ? endExit?.direction : undefined, wire.routing).slice(1));
  return cleanRoute([...result, end]);
}
const lineRoutes = new WeakMap<LineAnnotation, Wire>();
/** Reuse wire transforms while keeping graphics out of electrical indexes.
 * Curve controls act as vertices only during these geometric transforms. */
export function lineAsWire(line: LineAnnotation): Wire {
  let wire = lineRoutes.get(line);
  if (!wire) {
    wire = { ...line, kind: 'wire',
      startEndpoint: line.startEndpoint?.kind === 'free' ? { kind: 'free', point: line.startEndpoint.point }
        : line.startEndpoint ?? { kind: 'free', point: line.start },
      endEndpoint: line.endEndpoint?.kind === 'free' ? { kind: 'free', point: line.endEndpoint.point }
        : line.endEndpoint ?? { kind: 'free', point: line.end },
      vertices: line.controlPoints ?? line.vertices ?? [], routing: line.controlPoints ? 'free' : line.routing ?? 'free',
    };
    lineRoutes.set(line, wire);
  }
  return wire;
}
const resolvedLineCurves = new WeakMap<CircuitDocument, WeakMap<LineAnnotation, Point[]>>();
export function linePoints(line: LineAnnotation, doc: CircuitDocument): Point[] {
  if (line.controlPoints) {
    let curves = resolvedLineCurves.get(doc);
    if (!curves) { curves = new WeakMap(); resolvedLineCurves.set(doc, curves); }
    const cached = curves.get(line);
    if (cached) return cached;
    const { start, end, controls } = lineCurveGeometry(line, doc);
    // Sample only for snapping and bounds; rendering and exports use the cubic path.
    const count = Math.min(512, Math.max(32, Math.ceil((distance(start, controls[0]) +
      distance(controls[0], controls[1]) + distance(controls[1], end)) / 4)));
    const times = Array.from({ length: count + 1 }, (_, i) => i / count);
    // Include exact extrema so export/selection bounds cannot clip a curve.
    for (const axis of ['x', 'y'] as const) {
      const a = -start[axis] + 3 * controls[0][axis] - 3 * controls[1][axis] + end[axis],
        b = 2 * (start[axis] - 2 * controls[0][axis] + controls[1][axis]),
        c = controls[0][axis] - start[axis], discriminant = b * b - 4 * a * c;
      const roots = Math.abs(a) < 1e-10 ? Math.abs(b) < 1e-10 ? [] : [-c / b]
        : discriminant < 0 ? [] : [(-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a)];
      times.push(...roots.filter((t) => t > 0 && t < 1));
    }
    const points = [...new Set(times)].sort((a, b) => a - b).map((t) => {
      const s = 1 - t;
      return { x: s ** 3 * start.x + 3 * s ** 2 * t * controls[0].x +
        3 * s * t ** 2 * controls[1].x + t ** 3 * end.x,
      y: s ** 3 * start.y + 3 * s ** 2 * t * controls[0].y +
        3 * s * t ** 2 * controls[1].y + t ** 3 * end.y };
    });
    curves.set(line, points);
    return points;
  }
  return wirePoints(lineAsWire(line), doc);
}
export function lineCurveGeometry(line: LineAnnotation, doc?: CircuitDocument) {
  const start = doc && line.startEndpoint ? resolveEndpoint(line.startEndpoint, doc) : line.start,
    end = doc && line.endEndpoint ? resolveEndpoint(line.endEndpoint, doc) : line.end;
  const controls: [Point, Point] = line.controlPoints
    ? [add(line.controlPoints[0], { x: start.x - line.start.x, y: start.y - line.start.y }),
      add(line.controlPoints[1], { x: end.x - line.end.x, y: end.y - line.end.y })]
    : [{ x: start.x + (end.x - start.x) / 3 + (end.y - start.y) / 3,
      y: start.y + (end.y - start.y) / 3 - (end.x - start.x) / 3 },
    { x: start.x + (end.x - start.x) * 2 / 3 + (end.y - start.y) / 3,
      y: start.y + (end.y - start.y) * 2 / 3 - (end.x - start.x) / 3 }];
  return { start, end, controls };
}
export function linePath(line: LineAnnotation, doc?: CircuitDocument): string {
  if (!line.controlPoints) return pointsPath(doc ? linePoints(line, doc) : [line.start, line.end]);
  const { start, end, controls: [a, b] } = lineCurveGeometry(line, doc);
  return `M ${start.x} ${start.y} C ${a.x} ${a.y} ${b.x} ${b.y} ${end.x} ${end.y}`;
}
export function lineFromWire(line: LineAnnotation, wire: Wire, doc: CircuitDocument): LineAnnotation {
  return { ...line, start: resolveEndpoint(wire.startEndpoint, doc),
    end: resolveEndpoint(wire.endEndpoint, doc),
    ...(line.controlPoints ? { controlPoints: [wire.vertices[0], wire.vertices[1]] as [Point, Point], vertices: [] }
      : { vertices: wire.vertices }), routing: wire.routing,
    startEndpoint: wire.startEndpoint.kind === 'free' ? undefined : wire.startEndpoint,
    endEndpoint: wire.endEndpoint.kind === 'free' ? undefined : wire.endEndpoint,
  };
}
const resolvedWireRoutes = new WeakMap<CircuitDocument, WeakMap<Wire, Point[]>>();
export function wirePoints(wire: Wire, doc: CircuitDocument): Point[] {
  let routes = resolvedWireRoutes.get(doc);
  if (!routes) {
    routes = new WeakMap();
    resolvedWireRoutes.set(doc, routes);
  }
  let points = routes.get(wire);
  if (!points) {
    points = routeWire(wire, doc, false);
    routes.set(wire, points);
  }
  return points;
}

/** New connections can also constrain the exit axis of an existing wire branch. */
export interface WireExitAxes {
  start?: 'x' | 'y';
  end?: 'x' | 'y';
}
export function safeWirePoints(wire: Wire, doc: CircuitDocument, axes: WireExitAxes = {}): Point[] {
  return routeWire(wire, doc, true, axes);
}

function routeWire(wire: Wire, doc: CircuitDocument, editing: boolean, axes: WireExitAxes = {}): Point[] {
  const startPoint = resolveEndpoint(wire.startEndpoint, doc),
    endPoint = resolveEndpoint(wire.endEndpoint, doc);
  if (wire.routing === 'free') return terminalSafeRoute([startPoint, ...wire.vertices, endPoint], wire, doc);
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
        result.push({
          x: a.x + Math.sign(dx) * diagonal,
          y: a.y + Math.sign(dy) * diagonal,
        });
      if (distance(result.at(-1)!, b) > 0.001) result.push(b);
    }
    return terminalSafeRoute(result, wire, doc);
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
  const withLeads = (points: Point[]) => terminalSafeRoute(
    [startPoint, ...points, endPoint].filter(
      (p, i, all) => i === 0 || distance(p, all[i - 1]) > 0.001,
    ), wire, doc,
  );
  if (editing) {
    // Only terminal pins constrain the exit axis. Nodes and free points follow
    // the gesture instead of inheriting a horizontal pin and a middle dogleg.
    const dominant = (a: Point, b: Point) =>
      Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? 'x' : 'y';
    const startAxis = wire.startEndpoint.kind === 'terminal' ? sd : axes.start;
    const endAxis = wire.endEndpoint.kind === 'terminal' ? ed : axes.end;
    if (!wire.vertices.length) {
      const points =
        !startAxis && endAxis
          ? orthogonal(end, start, endAxis).reverse()
          : orthogonal(
              start,
              end,
              startAxis ?? dominant(start, end),
              !!startAxis && startAxis === endAxis,
            );
      return withLeads(points);
    }
    const result: Point[] = [start];
    for (const [i, point] of wire.vertices.entries()) {
      const previous = result.at(-1)!;
      result.push(
        ...orthogonal(previous, point,
          i === 0 && startAxis ? startAxis : dominant(previous, point)).slice(1),
      );
    }
    const previous = result.at(-1)!;
    const tail =
      endAxis
        ? orthogonal(end, previous, endAxis).reverse()
        : orthogonal(previous, end, dominant(previous, end));
    result.push(...tail.slice(1));
    return withLeads(result);
  }
  if (!wire.vertices.length)
    return withLeads(
      orthogonal(start, end, sd, sd === ed),
    );
  const result: Point[] = [start];
  wire.vertices.forEach((p, i) =>
    result.push(
      ...orthogonal(result[result.length - 1], p, i === 0 ? sd : 'x').slice(1),
    ),
  );
  result.push(
    ...orthogonal(end, result[result.length - 1], ed)
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
        best = {
          point: { x: o.x, y: o.y },
          endpoint: { kind: 'junction', junctionId: o.id },
        };
      }
    }
    if (o.kind === 'component')
      for (const t of o.terminals) {
        const point = localToWorld(o, { x: t.localX, y: t.localY }),
          d = distance(p, point);
        if (d < closest) {
          closest = d;
          best = {
            point,
            endpoint: { kind: 'terminal', componentId: o.id, terminalId: t.id },
          };
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
  options: { snapToGrid?: boolean } = {},
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
      const q = options.snapToGrid !== false && distance(p, gridPoint) < threshold
        ? gridPoint : projection;
      const tie = Math.abs(d - min) < 0.001;
      if (d < min - 0.001 || (result && tie && o.id.localeCompare(result.wire.id) < 0)) {
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
    o.kind === 'rectangle' ||
    o.kind === 'circle'
  )
    return { ...o, x: o.x + delta.x, y: o.y + delta.y };
  if (o.kind === 'highlight') return mapHighlight(o, (p) => add(p, delta));
  if (o.kind === 'electrical') {
    const attached =
      (o.wireId && !moved.has(o.wireId)) || (o.componentId && !moved.has(o.componentId));
    return attached
      ? { ...o, offset: add(o.offset, delta) }
      : { ...o, start: add(o.start, delta), end: add(o.end, delta) };
  }
  if (o.kind === 'line')
    return { ...o, start: add(o.start, delta), end: add(o.end, delta),
      ...(o.controlPoints ? { controlPoints: [add(o.controlPoints[0], delta), add(o.controlPoints[1], delta)] as [Point, Point] } : {}),
      vertices: o.vertices?.map((p) => add(p, delta)) };
  if (o.kind === 'brace')
    return { ...o, start: add(o.start, delta), end: add(o.end, delta) };
  if (o.kind === 'arrow')
    return {
      ...o,
      start: add(o.start, delta),
      end: add(o.end, delta),
      controlPoints: [add(o.controlPoints[0], delta), add(o.controlPoints[1], delta)],
    };
  const moveEp = (ep: Endpoint): Endpoint =>
    ep.kind === 'free' ? { ...ep, point: add(ep.point, delta) } : ep;
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
export const add = (a: Point, b: Point): Point => ({
  x: a.x + b.x || 0,
  y: a.y + b.y || 0,
});
export const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});
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
  } else if (o.kind === 'rectangle' || o.kind === 'circle')
    return { x: o.x, y: o.y, width: o.width, height: o.height };
  else if (o.kind === 'line') points = [...linePoints(o, doc), ...lineArrowHead(o, doc)];
  else if (o.kind === 'wire') points = wirePoints(o, doc);
  else if (o.kind === 'loop-arrow') {
    const angle = ((o.rotation ?? 0) * Math.PI) / 180;
    const width = Math.hypot(o.width * Math.cos(angle), o.height * Math.sin(angle));
    const height = Math.hypot(o.width * Math.sin(angle), o.height * Math.cos(angle));
    return {
      x: o.x + (o.width - width) / 2,
      y: o.y + (o.height - height) / 2,
      width,
      height,
    };
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
