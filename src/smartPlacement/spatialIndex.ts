import type { CircuitComponent, CircuitDocument, Point } from '../model/types';
import { localToWorld, objectBounds, wirePoints } from '../utils/geometry';
import type { ConnectionTarget, WireSegment } from './types';

const CELL = 160;
type Bounds = { x: number; y: number; width: number; height: number };
function cells(b: Bounds): string[] {
  const keys: string[] = [];
  for (let x = Math.floor(b.x / CELL); x <= Math.floor((b.x + b.width) / CELL); x++)
    for (let y = Math.floor(b.y / CELL); y <= Math.floor((b.y + b.height) / CELL); y++)
      keys.push(`${x}:${y}`);
  return keys;
}
function add<T>(map: Map<string, T[]>, key: string, item: T) {
  const list = map.get(key);
  if (list) list.push(item);
  else map.set(key, [item]);
}
function query<T>(map: Map<string, T[]>, bounds: Bounds): T[] {
  const found = new Set<T>();
  for (const key of cells(bounds)) for (const item of map.get(key) ?? []) found.add(item);
  return [...found];
}
const cache = new WeakMap<CircuitDocument, PlacementIndex>();
export class PlacementIndex {
  private targets = new Map<string, ConnectionTarget[]>();
  private segments = new Map<string, WireSegment[]>();
  private longSegments: WireSegment[] = [];
  private centers = new Map<string, Point[]>();
  private components = new Map<string, CircuitComponent[]>();
  private wireEnds = new Map<string, { wireId: string; side: number; point: Point }[]>();
  constructor(doc: CircuitDocument) {
    const occupied = new Set<string>();
    for (const o of doc.objects)
      if (o.kind === 'wire') {
        occupied.add(JSON.stringify(o.startEndpoint));
        occupied.add(JSON.stringify(o.endEndpoint));
      }
    for (const o of doc.objects) {
      if (o.kind === 'component' || o.kind === 'junction') {
        if (o.kind === 'component')
          for (const key of cells(objectBounds(o, doc))) add(this.components, key, o);
        add(this.centers, cells({ ...o, width: 0, height: 0 })[0], { x: o.x, y: o.y });
        const targets: ConnectionTarget[] =
          o.kind === 'junction'
            ? [
                {
                  key: `j:${o.id}`,
                  kind: 'junction',
                  point: { x: o.x, y: o.y },
                  endpoint: { kind: 'junction', junctionId: o.id },
                  connected: false,
                },
              ]
            : o.terminals.map((t) => ({
                key: `t:${o.id}:${t.id}`,
                kind: 'terminal',
                point: localToWorld(o, { x: t.localX, y: t.localY }),
                endpoint: { kind: 'terminal', componentId: o.id, terminalId: t.id },
                connected: false,
              }));
        for (const target of targets) {
          target.connected = occupied.has(JSON.stringify(target.endpoint));
          add(this.targets, cells({ ...target.point, width: 0, height: 0 })[0], target);
        }
      } else if (o.kind === 'wire') {
        [o.startEndpoint, o.endEndpoint].forEach((endpoint, side) => {
          if (endpoint.kind !== 'free') return;
          add(this.wireEnds, cells({ ...endpoint.point, width: 0, height: 0 })[0], {
            wireId: o.id, side, point: endpoint.point,
          });
        });
        const points = wirePoints(o, doc);
        points.slice(0, -1).forEach((a, segment) => {
          const b = points[segment + 1];
          const item: WireSegment = { key: `${o.id}:${segment}`, wire: o, points, segment, a, b };
          const bounds = {
            x: Math.min(a.x, b.x),
            y: Math.min(a.y, b.y),
            width: Math.abs(a.x - b.x),
            height: Math.abs(a.y - b.y),
          };
          // A very long imported wire must not allocate unbounded buckets.
          if ((bounds.width / CELL + 2) * (bounds.height / CELL + 2) > 256)
            this.longSegments.push(item);
          else for (const key of cells(bounds)) add(this.segments, key, item);
        });
      }
    }
  }
  targetsIn(bounds: Bounds): ConnectionTarget[] {
    return query(this.targets, bounds).filter(
      (t) =>
        t.point.x >= bounds.x &&
        t.point.x <= bounds.x + bounds.width &&
        t.point.y >= bounds.y &&
        t.point.y <= bounds.y + bounds.height,
    );
  }
  nearbyTargets(p: Point, radius: number) {
    return this.targetsIn({
      x: p.x - radius,
      y: p.y - radius,
      width: radius * 2,
      height: radius * 2,
    });
  }
  nearbySegments(p: Point, radius: number): WireSegment[] {
    return [
      ...query(this.segments, {
        x: p.x - radius,
        y: p.y - radius,
        width: radius * 2,
        height: radius * 2,
      }),
      ...this.longSegments.filter(
        (s) =>
          p.x + radius >= Math.min(s.a.x, s.b.x) &&
          p.x - radius <= Math.max(s.a.x, s.b.x) &&
          p.y + radius >= Math.min(s.a.y, s.b.y) &&
          p.y - radius <= Math.max(s.a.y, s.b.y),
      ),
    ];
  }
  nearbyWireEnds(p: Point, radius: number) {
    return query(this.wireEnds, {
      x: p.x - radius, y: p.y - radius, width: radius * 2, height: radius * 2,
    });
  }
  nearbyCenters(p: Point, radius: number): Point[] {
    return query(this.centers, {
      x: p.x - radius,
      y: p.y - radius,
      width: radius * 2,
      height: radius * 2,
    });
  }
  nearbyComponents(p: Point, radius: number): CircuitComponent[] {
    return query(this.components, {
      x: p.x - radius,
      y: p.y - radius,
      width: radius * 2,
      height: radius * 2,
    });
  }
}
export function placementIndex(doc: CircuitDocument): PlacementIndex {
  let index = cache.get(doc);
  if (!index) {
    index = new PlacementIndex(doc);
    cache.set(doc, index);
  }
  return index;
}
