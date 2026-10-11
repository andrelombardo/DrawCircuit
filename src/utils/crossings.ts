import type { CircuitDocument, Point, Wire } from '../model/types';
import { distance, resolveEndpoint, wirePoints } from './geometry';
export interface WireCrossing extends Point {
  horizontal: Wire;
  vertical: Wire;
  bridgeAxis: 'horizontal' | 'vertical';
  radius: number;
  directions?: { over: Point; under: Point };
}
type Segment = { wire: Wire; a: Point; b: Point; min: number; max: number };
type Interval = { min: number; max: number };
const cache = new WeakMap<CircuitDocument, WireCrossing[]>();
const epsilon = 0.001;
const quantize = (n: number) => Math.round(n * 1000);
const key = (p: Point) => `${quantize(p.x)},${quantize(p.y)}`;
function rows(segments: Segment[], axis: 'x' | 'y') {
  const map = new Map<number, Interval[]>();
  for (const s of segments) {
    const k = quantize(s.a[axis]),
      list = map.get(k) ?? [];
    list.push({ min: s.min, max: s.max });
    map.set(k, list);
  }
  for (const [k, list] of map) {
    list.sort((a, b) => a.min - b.min);
    const merged: Interval[] = [];
    for (const interval of list) {
      const last = merged.at(-1);
      if (last && interval.min <= last.max + epsilon) last.max = Math.max(last.max, interval.max);
      else merged.push({ ...interval });
    }
    map.set(k, merged);
  }
  return map;
}
function span(list: Interval[], at: number) {
  let lo = 0,
    hi = list.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1,
      v = list[mid];
    if (at < v.min - epsilon) hi = mid - 1;
    else if (at > v.max + epsilon) lo = mid + 1;
    else return v;
  }
}
/** Index orthogonal segments by x strips and merged rows. Pan/zoom reuse the immutable document cache. */
export function wireCrossings(doc: CircuitDocument): WireCrossing[] {
  const cached = cache.get(doc);
  if (cached) return cached;
  const horizontal: Segment[] = [],
    vertical: Segment[] = [],
    diagonal: Segment[] = [];
  let minX = Infinity,
    maxX = -Infinity;
  for (const o of doc.objects)
    if (o.kind === 'wire') {
      let points: Point[];
      try {
        points = wirePoints(o, doc);
      } catch {
        continue;
      }
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i];
        minX = Math.min(minX, a.x, b.x);
        maxX = Math.max(maxX, a.x, b.x);
        if (Math.abs(a.y - b.y) < epsilon && Math.abs(a.x - b.x) > epsilon)
          horizontal.push({ wire: o, a, b, min: Math.min(a.x, b.x), max: Math.max(a.x, b.x) });
        else if (Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) > epsilon)
          vertical.push({ wire: o, a, b, min: Math.min(a.y, b.y), max: Math.max(a.y, b.y) });
        else if (distance(a, b) > epsilon)
          diagonal.push({ wire: o, a, b, min: Math.min(a.x, b.x), max: Math.max(a.x, b.x) });
      }
    }
  const hRows = rows(horizontal, 'y'),
    vRows = rows(vertical, 'x');
  const cell = Math.max(100, Number.isFinite(minX) ? (maxX - minX) / 128 : 100),
    buckets = new Map<number, Segment[]>();
  for (const s of vertical) {
    const k = Math.floor(s.a.x / cell),
      list = buckets.get(k) ?? [];
    list.push(s);
    buckets.set(k, list);
  }
  const found = new Map<string, WireCrossing>();
  for (const h of horizontal)
    for (let k = Math.floor(h.min / cell); k <= Math.floor(h.max / cell); k++)
      for (const v of buckets.get(k) ?? []) {
        const p = { x: v.a.x, y: h.a.y },
          id = key(p);
        if (
          h.wire.id === v.wire.id ||
          p.x < h.min - epsilon ||
          p.x > h.max + epsilon ||
          p.y < v.min - epsilon ||
          p.y > v.max + epsilon ||
          found.has(id)
        )
          continue;
        const nodeAt = (wire: Wire) =>
          [wire.startEndpoint, wire.endEndpoint].find(
            (e) => e.kind !== 'free' && key(resolveEndpoint(e, doc)) === id,
          );
        const hNode = nodeAt(h.wire),
          vNode = nodeAt(v.wire);
        const common = [h.wire.startEndpoint, h.wire.endEndpoint].some(
          (e) =>
            e.kind !== 'free' &&
            key(resolveEndpoint(e, doc)) === id &&
            [v.wire.startEndpoint, v.wire.endEndpoint].some(
              (f) =>
                (e.kind === 'terminal' &&
                  f.kind === 'terminal' &&
                  e.componentId === f.componentId &&
                  e.terminalId === f.terminalId) ||
                (e.kind === 'junction' && f.kind === 'junction' && e.junctionId === f.junctionId),
            ),
        );
        if (common) continue;
        const hs = span(hRows.get(quantize(p.y)) ?? [], p.x),
          vs = span(vRows.get(quantize(p.x)) ?? [], p.y);
        if (!hs || !vs) continue;
        const room = Math.min(p.x - hs.min, hs.max - p.x, p.y - vs.min, vs.max - p.y);
        // Keep the owning wire through its node; the unrelated wire jumps around it.
        const bridgeAxis = hNode && !vNode ? 'vertical' : 'horizontal',
          halo = (Math.max(h.wire.width, v.wire.width) + 4) / 2,
          // The cubic's apex is 0.75 * radius from the centre. Leave the dot
          // and its owning wire clear of the bridge's white halo as well.
          radius = hNode || vNode ? Math.max(7, (4.5 + halo + 1.5) / 0.75) : 7;
        if (room > 1)
          found.set(id, {
            ...p,
            horizontal: h.wire,
            vertical: v.wire,
            bridgeAxis,
            radius: Math.min(radius, room * 0.7),
          });
      }
  // Only oblique segments need the general intersection pass. X buckets bound the
  // candidate set; the existing indexed orthogonal path remains unchanged.
  if (diagonal.length) {
    const all = [...horizontal, ...vertical, ...diagonal];
    const strips = new Map<number, Segment[]>();
    for (const segment of all)
      for (
        let k = Math.floor(Math.min(segment.a.x, segment.b.x) / cell);
        k <= Math.floor(Math.max(segment.a.x, segment.b.x) / cell);
        k++
      ) {
        const list = strips.get(k) ?? [];
        list.push(segment);
        strips.set(k, list);
      }
    const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;
    for (const a of diagonal) {
      const checked = new Set<Segment>();
      for (let k = Math.floor(a.min / cell); k <= Math.floor(a.max / cell); k++)
        for (const b of strips.get(k) ?? []) {
          if (a.wire.id === b.wire.id || checked.has(b)) continue;
          checked.add(b);
          const u = { x: a.b.x - a.a.x, y: a.b.y - a.a.y },
            v = { x: b.b.x - b.a.x, y: b.b.y - b.a.y };
          const denominator = cross(u, v);
          if (Math.abs(denominator) < epsilon) continue;
          const offset = { x: b.a.x - a.a.x, y: b.a.y - a.a.y };
          const t = cross(offset, v) / denominator,
            q = cross(offset, u) / denominator;
          if (t < -epsilon || t > 1 + epsilon || q < -epsilon || q > 1 + epsilon) continue;
          const p = { x: a.a.x + t * u.x, y: a.a.y + t * u.y },
            id = key(p);
          if (found.has(id)) continue;
          const node = (wire: Wire) =>
            [wire.startEndpoint, wire.endEndpoint].find(
              (ep) => ep.kind !== 'free' && key(resolveEndpoint(ep, doc)) === id,
            );
          const an = node(a.wire),
            bn = node(b.wire);
          if (an && bn && JSON.stringify(an) === JSON.stringify(bn)) continue;
          const over = an && !bn ? b : a,
            under = over === a ? b : a;
          const room = Math.min(distance(p, over.a), distance(p, over.b));
          if (room <= 1) continue;
          const direction = (segment: Segment) => {
            const length = distance(segment.a, segment.b);
            return {
              x: (segment.b.x - segment.a.x) / length,
              y: (segment.b.y - segment.a.y) / length,
            };
          };
          found.set(id, {
            ...p,
            horizontal: over.wire,
            vertical: under.wire,
            bridgeAxis: 'horizontal',
            radius: Math.min(an || bn ? 16 : 7, room * 0.7),
            directions: { over: direction(over), under: direction(under) },
          });
        }
    }
  }
  const result = [...found.values()].sort((a, b) => a.x - b.x || a.y - b.y);
  cache.set(doc, result);
  return result;
}
export function bridgeGeometry(c: WireCrossing) {
  const { x, y, radius: r } = c,
    vertical = c.bridgeAxis === 'vertical',
    point = (along: number, offset: number): Point =>
      vertical ? { x: x + offset, y: y + along } : { x: x + along, y: y - offset };
  if (c.directions) {
    const { over, under } = c.directions;
    const at = (v: Point, along: number, lift = 0) => ({
      x: x + v.x * along + v.y * lift,
      y: y + v.y * along - v.x * lift,
    });
    return {
      overWire: c.horizontal,
      underWire: c.vertical,
      start: at(over, -r),
      end: at(over, r),
      controlA: at(over, -r * 0.6, r),
      controlB: at(over, r * 0.6, r),
      underStart: at(under, -r),
      underEnd: at(under, r),
    };
  }
  return {
    overWire: vertical ? c.vertical : c.horizontal,
    underWire: vertical ? c.horizontal : c.vertical,
    start: point(-r, 0),
    end: point(r, 0),
    controlA: point(-r * 0.6, r),
    controlB: point(r * 0.6, r),
    underStart: vertical ? { x: x - r, y } : { x, y: y - r },
    underEnd: vertical ? { x: x + r, y } : { x, y: y + r },
  };
}
export function bridgePaths(c: WireCrossing) {
  const g = bridgeGeometry(c),
    p = (q: Point) => `${q.x} ${q.y}`;
  return {
    overWire: g.overWire,
    underWire: g.underWire,
    gap: `M ${p(g.start)} L ${p(g.end)}`,
    under: `M ${p(g.underStart)} L ${p(g.underEnd)}`,
    arc: `M ${p(g.start)} C ${p(g.controlA)} ${p(g.controlB)} ${p(g.end)}`,
  };
}
