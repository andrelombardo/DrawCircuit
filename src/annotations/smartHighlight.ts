import type { CircuitDocument, Endpoint, HighlightSpan, Point } from '../model/types';
import { distance, wirePoints } from '../utils/geometry';
import {
  componentHighlightRoute,
  projectHighlight,
  routeLength,
  sliceHighlightRoute,
} from './highlight';

type Host = { wireId: string } | { componentId: string; terminalId: string };
interface Edge {
  key: string;
  host: Host;
  points: Point[];
  nodes: [string, string];
  length: number;
}
interface Network {
  edges: Map<string, Edge>;
  adjacent: Map<string, Edge[]>;
  bodyNodes: Map<string, string>;
}
export interface SmartHighlightTrace {
  network: Network;
  spans: HighlightSpan[];
  pointer: Point;
  origin: Point;
  seeds?: { edge: Edge; ratio: number }[];
}
const networks = new WeakMap<CircuitDocument, Network>();
const edgeKey = (host: Host) => JSON.stringify('wireId' in host
  ? ['wire', host.wireId] : ['component', host.componentId, host.terminalId]);
const terminalNode = (id: string, terminal: string) => JSON.stringify(['terminal', id, terminal]);

/** Highlight continuity also follows touching endpoints, independently of electrical topology.
 * Only endpoints meet here: crossing wire interiors never create a new branch. */
function networkFor(doc: CircuitDocument): Network {
  const cached = networks.get(doc);
  if (cached) return cached;
  const edges: Edge[] = [], aliases = new Map<string, string>();
  const root = (node: string): string => {
    let current = node;
    while (aliases.has(current)) current = aliases.get(current)!;
    if (current !== node) aliases.set(node, current);
    return current;
  };
  const contactTolerance = 1e-6;
  const contacts = new Map<string, { point: Point; node: string }[]>();
  const contact = (node: string, point: Point) => {
    const x = Math.round(point.x / contactTolerance),
      y = Math.round(point.y / contactTolerance);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const other of contacts.get(`${x + dx}:${y + dy}`) ?? []) {
          if (distance(point, other.point) > contactTolerance) continue;
          const a = root(node), b = root(other.node);
          if (a !== b) aliases.set(a, b);
          return;
        }
    const key = `${x}:${y}`;
    const bucket = contacts.get(key) ?? [];
    bucket.push({ point, node });
    contacts.set(key, bucket);
  };
  const add = (host: Host, points: Point[], nodes: [string, string]) => {
    const length = routeLength(points);
    if (length < 1e-7) {
      if (points.length && root(nodes[0]) !== root(nodes[1])) aliases.set(root(nodes[0]), root(nodes[1]));
    } else edges.push({ key: edgeKey(host), host, points, nodes, length });
  };
  const endpoint = (ep: Endpoint, wireId: string, side: string) =>
    ep.kind === 'terminal' ? terminalNode(ep.componentId, ep.terminalId) :
      ep.kind === 'junction' ? JSON.stringify(['junction', ep.junctionId]) :
        JSON.stringify(['free', wireId, side]);
  for (const object of doc.objects) {
    if (object.kind === 'wire') {
      const points = wirePoints(object, doc);
      const nodes: [string, string] = [
        endpoint(object.startEndpoint, object.id, 'start'),
        endpoint(object.endEndpoint, object.id, 'end'),
      ];
      contact(nodes[0], points[0]);
      contact(nodes[1], points.at(-1)!);
      add({ wireId: object.id }, points, nodes);
    } else if (object.kind === 'component') {
      for (const terminal of object.terminals) {
        const points = componentHighlightRoute(object, terminal.id);
        const node = terminalNode(object.id, terminal.id);
        contact(node, points[0]);
        add({ componentId: object.id, terminalId: terminal.id },
          points, [
            node, JSON.stringify(['body', object.id]),
          ]);
      }
    }
  }
  const network: Network = { edges: new Map(), adjacent: new Map(), bodyNodes: new Map() };
  for (const object of doc.objects)
    if (object.kind === 'component') network.bodyNodes.set(object.id, root(JSON.stringify(['body', object.id])));
  for (const edge of edges) {
    edge.nodes = edge.nodes.map(root) as [string, string];
    network.edges.set(edge.key, edge);
    for (const node of new Set(edge.nodes)) {
      if (!network.adjacent.has(node)) network.adjacent.set(node, []);
      network.adjacent.get(node)!.push(edge);
    }
  }
  networks.set(doc, network);
  return network;
}
export function nearestSmartHighlight(
  doc: CircuitDocument, point: Point, tolerance: number, componentId?: string,
): { edge: Edge; point: Point; ratio: number; distance: number } | null {
  let best: { edge: Edge; point: Point; ratio: number; distance: number } | null = null;
  const network = networkFor(doc);
  const measure = (edge: Edge) => {
    const projection = projectHighlight(edge.points, point);
    if (projection.distance < (best?.distance ?? (componentId ? Infinity : tolerance)))
      best = { ...projection, edge };
  };
  for (const edge of network.edges.values()) {
    if (componentId && (!('componentId' in edge.host) || edge.host.componentId !== componentId)) continue;
    measure(edge);
  }
  // A zero-length pin/body edge is collapsed into its connected model node.
  if (!best && componentId)
    for (const edge of network.adjacent.get(network.bodyNodes.get(componentId) ?? '') ?? []) measure(edge);
  return best;
}
export function beginSmartHighlight(
  doc: CircuitDocument, point: Point, tolerance: number, componentId?: string,
): SmartHighlightTrace | null {
  const target = nearestSmartHighlight(doc, point, tolerance, componentId);
  if (!target) return null;
  const network = networkFor(doc);
  const seeds = [...network.edges.values()].flatMap((edge) => {
    if (componentId && (!('componentId' in edge.host) || edge.host.componentId !== componentId)) return [];
    const projection = projectHighlight(edge.points, point);
    return projection.distance <= target.distance + 1e-6 ? [{ edge, ratio: projection.ratio }] : [];
  });
  return {
    network, origin: point, pointer: point,
    spans: [{ ...target.edge.host, start: target.ratio, end: target.ratio }],
    seeds: seeds.length > 1 ? seeds : undefined,
  };
}
const pointAt = (edge: Edge, ratio: number) => sliceHighlightRoute(edge.points, ratio, ratio)[0];

/** A delayed fork remains undecided while sibling routes have an identical prefix. */
function sharesPrefix(edge: Edge, other: Edge, from: number, end: number, node: string) {
  const otherStart = other.nodes[0] === node ? 0 : 1;
  const oldEnd = pointAt(edge, end);
  const projection = projectHighlight(other.points, oldEnd, otherStart);
  if (projection.distance > 1e-6 ||
    Math.abs(Math.abs(end - from) * edge.length - Math.abs(projection.ratio - otherStart) * other.length) > 1e-5)
    return false;
  const a = sliceHighlightRoute(edge.points, from, end);
  const b = sliceHighlightRoute(other.points, otherStart, projection.ratio);
  return a.every((p) => projectHighlight(b, p).distance < 1e-6) &&
    b.every((p) => projectHighlight(a, p).distance < 1e-6);
}
function advanceSample(trace: SmartHighlightTrace, point: Point, tolerance: number, hysteresis: number) {
  const spans = trace.spans;
  const last = spans.at(-1)!;
  const edge = trace.network.edges.get(edgeKey(last))!;
  const current = projectHighlight(edge.points, point, last.end);
  if (spans.length === 1 && last.start === last.end && edge.nodes[0] === edge.nodes[1] &&
    (last.start === 0 || last.start === 1) && Math.abs(current.ratio - last.start) > 0.5) {
    last.start = last.end = 1 - last.start;
  }
  if (edge.nodes[0] === edge.nodes[1] && Math.abs(current.ratio - last.end) > 0.5) {
    const boundary = last.end > 0.5 ? 1 : 0;
    if (last.start === boundary) {
      const previous = spans.at(-2);
      if (previous && edgeKey(previous) === edge.key && previous.end === 1 - boundary) {
        spans.pop();
        previous.end = current.ratio;
        return;
      }
      last.start = last.end = 1 - boundary;
    } else if (spans.length < 1000) {
      last.end = boundary;
      spans.push({ ...edge.host, start: 1 - boundary, end: current.ratio });
      return;
    }
  }
  const tip = pointAt(edge, last.end);
  let choice = { edge, projection: current, node: '', exit: 0, replace: false };
  const consider = (other: Edge, node: string, exit: number, replace = false) => {
    if (other === edge) return;
    let start = other.nodes[0] === node ? 0 : 1;
    const projection = projectHighlight(other.points, point, start);
    if (other.nodes[0] === other.nodes[1]) start = projection.ratio < 0.5 ? 0 : 1;
    if (projection.distance > tolerance || Math.abs(projection.ratio - start) * other.length < hysteresis) return;
    if (projection.distance < choice.projection.distance - hysteresis)
      choice = { edge: other, projection, node, exit, replace };
  };
  for (const side of [0, 1] as const) {
    if (edge.nodes[0] === edge.nodes[1] && side !== (last.end > 0.5 ? 1 : 0)) continue;
    const nodePoint = side ? edge.points.at(-1)! : edge.points[0];
    if (distance(point, nodePoint) > tolerance || distance(tip, nodePoint) > tolerance) continue;
    for (const other of trace.network.adjacent.get(edge.nodes[side]) ?? [])
      consider(other, edge.nodes[side], side);
  }
  // Two connected wires can overlap before a fork. Resolve their common lead
  // using the pointer after the divergence, rather than locking the first wire.
  if (spans.length > 1 && (last.start === 0 || last.start === 1)) {
    const node = edge.nodes[last.start];
    for (const other of trace.network.adjacent.get(node) ?? [])
      if (other !== edge && sharesPrefix(edge, other, last.start, last.end, node))
        consider(other, node, last.start, true);
  }
  if (choice.projection.distance > tolerance) return;
  if (choice.edge === edge) {
    last.end = current.ratio;
    return;
  }
  const next = choice.edge;
  const entry = next.nodes[0] === next.nodes[1] ? (choice.projection.ratio < 0.5 ? 0 : 1) :
    next.nodes[0] === choice.node ? 0 : 1;
  const exit = choice.exit;
  if (choice.replace) {
    spans[spans.length - 1] = { ...next.host, start: entry, end: choice.projection.ratio };
    return;
  }
  last.end = exit;
  // Also discard an untouched starting branch when the pointer chooses its neighbor.
  if (last.start === exit) spans.pop();
  const previous = spans.at(-1);
  if (previous && edgeKey(previous) === next.key && previous.end === entry) previous.end = choice.projection.ratio;
  else if (spans.length < 1000) spans.push({ ...next.host, start: entry, end: choice.projection.ratio });
}

/** Resample fast/coalesced input so one event can cross several short connected objects. */
export function advanceSmartHighlight(trace: SmartHighlightTrace, point: Point, zoom: number, width: number) {
  const tolerance = Math.max(14 / zoom, width / 2);
  let from = trace.pointer;
  // At the initial crossing, movement chooses which stroke the user intends.
  // Once drawing has a direction, disconnected crossings never switch hosts.
  if (trace.seeds && trace.spans.length === 1 && distance(trace.origin, point) >= 3 / zoom) {
    const candidates = trace.seeds.map((seed) => ({ ...seed,
      distance: projectHighlight(seed.edge.points, point, seed.ratio).distance,
    })).sort((a, b) => a.distance - b.distance);
    if (candidates[0].distance + 0.25 / zoom < candidates[1].distance) {
      const seed = candidates[0];
      if (edgeKey(trace.spans[0]) !== seed.edge.key) {
        trace.spans = [{ ...seed.edge.host, start: seed.ratio, end: seed.ratio }];
        from = trace.origin;
      }
      trace.seeds = undefined;
    }
  }
  if (trace.spans.length > 1) trace.seeds = undefined;
  const steps = Math.min(4096, Math.max(1, Math.ceil(distance(from, point) / Math.min(6, 3 / zoom))));
  // Clone before updating: React's previous preview must remain immutable.
  trace.spans = trace.spans.map((span) => ({ ...span }));
  for (let i = 1; i <= steps; i++) advanceSample(trace, {
    x: from.x + (point.x - from.x) * i / steps,
    y: from.y + (point.y - from.y) * i / steps,
  }, tolerance, 0.25 / zoom);
  trace.pointer = point;
  return trace.spans;
}
