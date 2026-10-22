import { lineAsWire } from './geometry';
import type { CircuitDocument, CircuitObject, Endpoint, Point } from '../model/types';
import { localToWorld, snap, wirePoints } from './geometry';
import { contentBounds, visualBounds, unionBounds } from './visualBounds';
import type { Bounds } from './visualBounds';
import { measurementBounds } from './measurementGeometry';
import { simplifyPolyline } from './wires';

export interface GuideItem {
  id: string;
  family: 'node' | 'annotation' | 'reference';
  spacingFamily: 'component' | 'junction' | 'annotation';
  bounds: Bounds;
  alignmentBounds?: Bounds;
  displayBounds?: Bounds;
  anchor: Point;
  pins: Point[];
  baseline?: number;
  referenceKind?: DistanceGuide['referenceKind'];
  /** Measuring axis perpendicular to an actual cardinal line segment. */
  segmentAxis?: 'x' | 'y';
}
export interface DistanceGuide {
  axis: 'x' | 'y';
  from: number;
  to: number;
  at: number;
  value: number;
  equal: boolean;
  neighborId: string;
  referenceKind?: 'component' | 'junction' | 'bend' | 'endpoint' | 'wire' | 'line';
  /** Dimension rail is offset from the measured branch; witnesses end at `at`. */
  displayAt?: number;
  measurement?: 'centers' | 'gaps';
}
export interface MoveGuides {
  delta: Point;
  alignment: { x?: number; y?: number };
  distances: DistanceGuide[];
  target: Point | null;
}
const CELL = 160,
  RANGE = 800;
function segmentAxis(a: Point, b: Point): 'x' | 'y' | undefined {
  if (a.x === b.x && a.y !== b.y) return 'x';
  if (a.y === b.y && a.x !== b.x) return 'y';
}
const belongsTo = (ep: Endpoint, ids: Set<string>) =>
  ep.kind === 'terminal'
    ? ids.has(ep.componentId)
    : ep.kind === 'junction' && ids.has(ep.junctionId);
function pins(o: CircuitObject): Point[] {
  return o.kind === 'component'
    ? o.terminals.map((t) => localToWorld(o, { x: t.localX, y: t.localY }))
    : o.kind === 'junction'
      ? [{ x: o.x, y: o.y }]
      : [];
}
function item(o: CircuitObject, doc: CircuitDocument): GuideItem {
  const bounds = measurementBounds(o, doc);
  return {
    id: o.id,
    family: o.kind === 'component' || o.kind === 'junction' ? 'node' : 'annotation',
    spacingFamily:
      o.kind === 'component' ? 'component' : o.kind === 'junction' ? 'junction' : 'annotation',
    bounds,
    alignmentBounds: visualBounds(o, doc),
    displayBounds: contentBounds(o, doc),
    anchor:
      o.kind === 'component' || o.kind === 'junction'
        ? { x: o.x, y: o.y }
        : { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
    pins: pins(o),
    ...(o.kind === 'component' || o.kind === 'junction' ? { referenceKind: o.kind } : {}),
    ...(o.kind === 'line' && !o.vertices?.length
      ? { segmentAxis: segmentAxis(o.start, o.end), referenceKind: 'line' as const }
      : {}),
    ...(o.kind === 'text' ? { baseline: o.y } : {}),
  };
}
/** Built once against the gesture's immutable source. Very large objects use a
 * bounded fallback list instead of allocating unlimited spatial buckets. */
export class GuideIndex {
  private cells = new Map<string, GuideItem[]>();
  private large: GuideItem[] = [];
  constructor(doc: CircuitDocument, excluded: Set<string>) {
    for (const o of doc.objects) {
      if (excluded.has(o.id)) continue;
      if (o.kind === 'wire' || o.kind === 'line') {
        const wire = o.kind === 'line' ? lineAsWire(o) : o;
        // Incident routes change with the selection. Their immutable straight
        // branch references are handled separately, never as static obstacles.
        if (belongsTo(wire.startEndpoint, excluded) || belongsTo(wire.endEndpoint, excluded)) continue;
        const points = simplifyPolyline(wirePoints(wire, doc));
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1],
            b = points[i],
            axis = segmentAxis(a, b);
          if (!axis) continue;
          const bounds = {
            x: Math.min(a.x, b.x),
            y: Math.min(a.y, b.y),
            width: Math.abs(b.x - a.x),
            height: Math.abs(b.y - a.y),
          };
          this.add({
            id: o.id,
            family: 'reference',
            spacingFamily: 'annotation',
            bounds,
            anchor: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
            pins: [],
            segmentAxis: axis,
            referenceKind: o.kind,
          });
        }
        continue;
      }
      this.add(item(o, doc));
    }
  }
  private add(entry: GuideItem) {
    const b = entry.displayBounds ?? entry.bounds;
    if ((b.width / CELL + 2) * (b.height / CELL + 2) > 256) {
      this.large.push(entry);
      return;
    }
    for (let x = Math.floor(b.x / CELL); x <= Math.floor((b.x + b.width) / CELL); x++)
      for (let y = Math.floor(b.y / CELL); y <= Math.floor((b.y + b.height) / CELL); y++) {
        const key = `${x}:${y}`,
          list = this.cells.get(key);
        if (list) list.push(entry);
        else this.cells.set(key, [entry]);
      }
  }
  nearby(b: Bounds): GuideItem[] {
    const found = new Set<GuideItem>();
    // Query around edges too, without walking all cells inside a large group.
    const query = (x0: number, y0: number, x1: number, y1: number) => {
      for (let x = Math.floor(x0 / CELL); x <= Math.floor(x1 / CELL); x++)
        for (let y = Math.floor(y0 / CELL); y <= Math.floor(y1 / CELL); y++)
          for (const e of this.cells.get(`${x}:${y}`) ?? []) found.add(e);
    };
    const cx = b.x + b.width / 2,
      cy = b.y + b.height / 2;
    query(b.x - RANGE, cy - CELL, b.x + CELL, cy + CELL);
    query(b.x + b.width - CELL, cy - CELL, b.x + b.width + RANGE, cy + CELL);
    query(cx - CELL, b.y - RANGE, cx + CELL, b.y + CELL);
    query(cx - CELL, b.y + b.height - CELL, cx + CELL, b.y + b.height + RANGE);
    for (const e of this.large) {
      const a = e.bounds;
      if (
        a.x <= b.x + b.width + RANGE &&
        a.x + a.width >= b.x - RANGE &&
        a.y <= b.y + b.height + RANGE &&
        a.y + a.height >= b.y - RANGE
      )
        found.add(e);
    }
    return [...found].sort((a, b) => a.id.localeCompare(b.id));
  }
  /** Line query used only when preparing connected branches, never per frame. */
  along(a: Point, b: Point): GuideItem[] {
    const found = new Set<GuideItem>(this.large);
    for (
      let x = Math.floor(Math.min(a.x, b.x) / CELL);
      x <= Math.floor(Math.max(a.x, b.x) / CELL);
      x++
    )
      for (
        let y = Math.floor(Math.min(a.y, b.y) / CELL);
        y <= Math.floor(Math.max(a.y, b.y) / CELL);
        y++
      )
        for (const entry of this.cells.get(`${x}:${y}`) ?? []) found.add(entry);
    return [...found];
  }
}
interface BranchReference {
  axis: 'x' | 'y';
  side: -1 | 1;
  at: number;
  boundary: number;
  neighborId: string;
  kind: NonNullable<DistanceGuide['referenceKind']>;
}
export interface MoveContext {
  index: GuideIndex;
  moving: GuideItem;
  branches: BranchReference[];
}
export function createMoveContext(doc: CircuitDocument, ids: string[]): MoveContext {
  const selected = new Set(ids),
    objects = doc.objects.filter((o) => selected.has(o.id));
  const entries = objects.map((o) => item(o, doc)),
    bounds = unionBounds(entries.map((e) => e.bounds));
  const index = new GuideIndex(doc, selected);
  return {
    index,
    branches:
      entries.length === 1 && entries[0].family === 'node'
        ? connectedBranches(doc, selected, index)
        : [],
    moving:
      entries.length === 1
        ? entries[0]
        : {
            id: 'selection',
            family: entries.some((e) => e.family === 'node') ? 'node' : 'annotation',
            spacingFamily: entries.some((e) => e.spacingFamily === 'component')
              ? 'component'
              : entries.some((e) => e.spacingFamily === 'junction')
                ? 'junction'
                : 'annotation',
            bounds,
            alignmentBounds: unionBounds(entries.map((e) => e.alignmentBounds ?? e.bounds)),
            displayBounds: unionBounds(entries.map((e) => e.displayBounds ?? e.bounds)),
            anchor: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
            pins: entries.flatMap((e) => e.pins),
          },
  };
}
/** Resolve topology and first straight runs once against the immutable gesture
 * document. A bend always ends a branch, including an automatically routed one.
 * Crossings have no semantic endpoint and are never promoted to Junctions. */
function connectedBranches(
  doc: CircuitDocument,
  selected: Set<string>,
  index: GuideIndex,
): BranchReference[] {
  const objects = new Map(doc.objects.map((o) => [o.id, o]));
  const references: BranchReference[] = [];
  for (const wire of doc.objects) {
    if (wire.kind !== 'wire' || selected.has(wire.id)) continue;
    const fromStart = belongsTo(wire.startEndpoint, selected),
      fromEnd = belongsTo(wire.endEndpoint, selected);
    if (fromStart === fromEnd) continue;
    const route = simplifyPolyline(wirePoints(wire, doc));
    if (!fromStart) route.reverse();
    if (route.length < 2) continue;
    const origin = route[0],
      limit = route[1];
    const axis = origin.x === limit.x ? 'y' : 'x',
      cross = axis === 'x' ? 'y' : 'x';
    const side = limit[axis] > origin[axis] ? 1 : -1;
    let boundary = limit[axis],
      neighborId = wire.id,
      kind: BranchReference['kind'] = 'bend';
    if (route.length === 2) {
      const endpoint = fromStart ? wire.endEndpoint : wire.startEndpoint;
      kind = 'endpoint';
      if (endpoint.kind === 'terminal') {
        const object = objects.get(endpoint.componentId);
        if (object?.kind === 'component') {
          const bounds = measurementBounds(object, doc);
          boundary = side === 1 ? bounds[axis] : end(bounds, axis);
          neighborId = object.id;
          kind = 'component';
        }
      } else if (endpoint.kind === 'junction') {
        neighborId = endpoint.junctionId;
        kind = 'junction';
      }
    }
    // An unsplit imported node/body on this run still blocks more remote refs.
    // Only the line's spatial buckets are inspected during gesture preparation.
    for (const candidate of index.along(origin, limit)) {
      if (candidate.family !== 'node') continue;
      const box = candidate.bounds;
      if (origin[cross] < box[cross] - 0.001 || origin[cross] > end(box, cross) + 0.001) continue;
      const edge = side === 1 ? box[axis] : end(box, axis);
      if ((edge - origin[axis]) * side < -0.001 || (edge - boundary) * side > 0.001) continue;
      boundary = edge;
      neighborId = candidate.id;
      kind = candidate.spacingFamily === 'junction' ? 'junction' : 'component';
    }
    references.push({ axis, side, at: origin[cross], boundary, neighborId, kind });
  }
  return references;
}
const center = (b: Bounds, axis: 'x' | 'y') =>
  axis === 'x' ? b.x + b.width / 2 : b.y + b.height / 2;
const size = (b: Bounds, axis: 'x' | 'y') => (axis === 'x' ? b.width : b.height);
const end = (b: Bounds, axis: 'x' | 'y') => b[axis] + size(b, axis);
const translate = (b: Bounds, d: Point): Bounds => ({ ...b, x: b.x + d.x, y: b.y + d.y });
/** Strictly local, aligned neighbors on either side; ignores overlaps. */
export function nearestNeighbors(
  b: Bounds,
  candidates: GuideItem[],
  axis: 'x' | 'y',
  tolerance: number,
  alignedAt?: number,
) {
  const cross = axis === 'x' ? 'y' : 'x';
  let before: GuideItem | undefined, after: GuideItem | undefined;
  for (const c of candidates) {
    if (Math.abs(c.anchor[cross] - (alignedAt ?? center(b, cross))) > tolerance) continue;
    if (
      end(c.bounds, axis) <= b[axis] + 0.001 &&
      b[axis] - end(c.bounds, axis) <= RANGE &&
      (!before || end(c.bounds, axis) > end(before.bounds, axis))
    )
      before = c;
    if (
      c.bounds[axis] >= end(b, axis) - 0.001 &&
      c.bounds[axis] - end(b, axis) <= RANGE &&
      (!after || c.bounds[axis] < after.bounds[axis])
    )
      after = c;
  }
  return { before, after };
}
export function freeGap(a: Bounds, b: Bounds, axis: 'x' | 'y') {
  return b[axis] - end(a, axis);
}
function anchors(e: GuideItem, axis: 'x' | 'y'): number[] {
  const bounds = e.alignmentBounds ?? e.bounds;
  return [
    e.anchor[axis],
    bounds[axis],
    end(bounds, axis),
    ...e.pins.map((p) => p[axis]),
    ...(axis === 'y' && e.baseline !== undefined ? [e.baseline] : []),
  ];
}
function moveNeighbors(
  context: MoveContext,
  b: Bounds,
  candidates: GuideItem[],
  axis: 'x' | 'y',
  tolerance: number,
  delta: Point,
) {
  const cross = axis === 'x' ? 'y' : 'x';
  const at = context.moving.anchor[cross] + delta[cross];
  const result = nearestNeighbors(b, candidates, axis, tolerance, at);
  // Leaving the straight run suppresses its old references. The cross-axis
  // alignment snap can put the body back on the run before this is evaluated.
  if (Math.abs(delta[cross]) > tolerance) return result;
  for (const reference of context.branches) {
    if (reference.axis !== axis) continue;
    const bounds =
      axis === 'x'
        ? { x: reference.boundary, y: reference.at, width: 0, height: 0 }
        : { x: reference.at, y: reference.boundary, width: 0, height: 0 };
    const entry: GuideItem = {
      id: reference.neighborId,
      family: 'node',
      spacingFamily: reference.kind === 'junction' ? 'junction' : 'component',
      bounds,
      anchor: { ...context.moving.anchor, [cross]: at },
      pins: [],
      referenceKind: reference.kind,
    };
    if (
      reference.side === -1 &&
      reference.boundary <= b[axis] + 0.001 &&
      (!result.before || reference.boundary >= end(result.before.bounds, axis))
    )
      result.before = entry;
    if (
      reference.side === 1 &&
      reference.boundary >= end(b, axis) - 0.001 &&
      (!result.after || reference.boundary <= result.after.bounds[axis])
    )
      result.after = entry;
  }
  return result;
}

/** Line clearances are feedback only: they never introduce a snap or a node.
 * A connected straight run keeps its semantic endpoint ahead of crossings. */
function distanceNeighbors(
  context: MoveContext,
  b: Bounds,
  candidates: GuideItem[],
  segments: GuideItem[],
  axis: 'x' | 'y',
  tolerance: number,
  delta: Point,
) {
  const result = moveNeighbors(context, b, candidates, axis, tolerance, delta);
  const cross = axis === 'x' ? 'y' : 'x',
    at = context.moving.anchor[cross] + delta[cross];
  if (
    Math.abs(delta[cross]) <= tolerance &&
    context.branches.some((branch) => branch.axis === axis)
  )
    return result;
  for (const segment of segments) {
    const box = segment.bounds;
    // Test the real segment span, not its midpoint or a polyline's union box.
    if (segment.segmentAxis !== axis || at < box[cross] - 0.001 || at > end(box, cross) + 0.001)
      continue;
    const boundary = box[axis];
    if (
      boundary <= b[axis] + 0.001 &&
      b[axis] - boundary <= RANGE &&
      (!result.before || boundary > end(result.before.bounds, axis))
    )
      result.before = segment;
    if (
      boundary >= end(b, axis) - 0.001 &&
      boundary - end(b, axis) <= RANGE &&
      (!result.after || boundary < result.after.bounds[axis])
    )
      result.after = segment;
  }
  return result;
}

function chipBounds(guide: DistanceGuide, rail: number, zoom: number): Bounds {
  const value =
    Math.abs(guide.value - Math.round(guide.value)) < 0.01
      ? String(Math.round(guide.value))
      : guide.value.toFixed(1);
  const width = (value.length * 6.5 + 12) / zoom,
    height = 20 / zoom,
    mid = (guide.from + guide.to) / 2;
  return {
    x: (guide.axis === 'x' ? mid : rail) - width / 2,
    y: (guide.axis === 'x' ? rail : mid) - height / 2,
    width,
    height,
  };
}
const overlaps = (a: Bounds, b: Bounds, pad: number) =>
  a.x < b.x + b.width + pad &&
  a.x + a.width + pad > b.x &&
  a.y < b.y + b.height + pad &&
  a.y + a.height + pad > b.y;

/** A shared rail keeps the pair readable. Pick its side/offset from the local
 * content boxes (labels included) and reserve earlier chips before later ones. */
function placeDistanceChips(
  context: MoveContext,
  guides: DistanceGuide[],
  delta: Point,
  zoom: number,
): DistanceGuide[] {
  if (!guides.length) return guides;
  const movingBox = translate(context.moving.displayBounds ?? context.moving.bounds, delta);
  // Query each gap's midpoint, including on very long branches; querying one
  // huge union box would miss annotations between its edge search windows.
  const local = new Set(
    guides.flatMap((guide) => context.index.nearby(chipBounds(guide, guide.at, zoom))),
  );
  const obstacles = [movingBox, ...[...local].map((entry) => entry.displayBounds ?? entry.bounds)];
  const reserved: Bounds[] = [];
  const placed = new Map<DistanceGuide, DistanceGuide>();
  for (const axis of ['x', 'y'] as const) {
    const pair = guides.filter((guide) => guide.axis === axis);
    if (!pair.length) continue;
    let chosen = 22 / zoom,
      best = Infinity;
    for (const screenOffset of [22, -22, 40, -40, 58, -58, 76, -76, 94, -94, 112, -112]) {
      const boxes: Bounds[] = [];
      let collisions = 0;
      for (const guide of pair) {
        const box = chipBounds(guide, guide.at + screenOffset / zoom, zoom);
        collisions += obstacles.filter((obstacle) => overlaps(box, obstacle, 3 / zoom)).length;
        collisions += [...reserved, ...boxes].filter((other) =>
          overlaps(box, other, 4 / zoom),
        ).length;
        boxes.push(box);
      }
      if (collisions < best) {
        chosen = screenOffset / zoom;
        best = collisions;
      }
      if (!collisions) break;
    }
    for (const guide of pair) {
      let rail = guide.at + chosen;
      // Short opposing gaps can overlap even on an empty common rail.
      for (const extra of [0, 22, -22, 44, -44, 66, -66]) {
        const candidate = guide.at + chosen + extra / zoom;
        const box = chipBounds(guide, candidate, zoom);
        if (
          reserved.some((other) => overlaps(box, other, 4 / zoom)) ||
          obstacles.some((obstacle) => overlaps(box, obstacle, 3 / zoom))
        )
          continue;
        rail = candidate;
        break;
      }
      reserved.push(chipBounds(guide, rail, zoom));
      placed.set(guide, { ...guide, displayAt: rail });
    }
  }
  return guides.map((guide) => placed.get(guide)!);
}
function centerNeighbors(
  context: MoveContext,
  candidates: GuideItem[],
  axis: 'x' | 'y',
  delta: Point,
  tolerance: number,
) {
  const moving = context.moving,
    cross = axis === 'x' ? 'y' : 'x';
  const anchor = { x: moving.anchor.x + delta.x, y: moving.anchor.y + delta.y };
  let before: GuideItem | undefined, after: GuideItem | undefined;
  for (const c of candidates) {
    if (
      c.spacingFamily !== moving.spacingFamily ||
      Math.abs(c.anchor[cross] - anchor[cross]) > tolerance
    )
      continue;
    if (c.anchor[axis] < anchor[axis] - 0.001 && (!before || c.anchor[axis] > before.anchor[axis]))
      before = c;
    if (c.anchor[axis] > anchor[axis] + 0.001 && (!after || c.anchor[axis] < after.anchor[axis]))
      after = c;
  }
  return { before, after };
}
function parallelAxis(context: MoveContext, axis: 'x' | 'y') {
  const pins = context.moving.pins,
    cross = axis === 'x' ? 'y' : 'x';
  return (
    pins.length >= 2 &&
    Math.max(...pins.map((p) => p[axis])) - Math.min(...pins.map((p) => p[axis])) < 0.001 &&
    Math.max(...pins.map((p) => p[cross])) - Math.min(...pins.map((p) => p[cross])) > 1
  );
}
export function computeMoveGuides(
  context: MoveContext,
  raw: Point,
  zoom: number,
  disabled = false,
  precision = false,
  detailed = false,
): MoveGuides {
  const delta = precision || disabled ? { ...raw } : { x: snap(raw.x), y: snap(raw.y) },
    alignment: MoveGuides['alignment'] = {};
  if (disabled) return { delta, alignment, distances: [], target: null };
  const moving = context.moving,
    original = moving.bounds,
    threshold = 7 / zoom;
  const rawBounds = translate(original, raw),
    candidates = context.index.nearby(rawBounds).filter((e) => e.family === moving.family),
    // Components and Junctions share geometric neighbors; annotations remain separate.
    spacingCandidates = candidates;
  // Terminal/Junction proximity wins; this changes geometry only, never endpoint references.
  let target: Point | null = null,
    best = threshold;
  for (const pin of precision ? [] : moving.pins)
    for (const c of candidates)
      for (const p of c.pins) {
        const d = Math.hypot(pin.x + raw.x - p.x, pin.y + raw.y - p.y);
        if (d < best) {
          best = d;
          delta.x = p.x - pin.x;
          delta.y = p.y - pin.y;
          target = p;
        }
      }
  if (!target && !precision) {
    for (const axis of ['x', 'y'] as const) {
      let best = threshold;
      const own = anchors(moving, axis);
      for (const c of candidates) {
        // Match corresponding features, avoiding arbitrary edge-to-center snaps.
        const theirs = anchors(c, axis);
        for (let i = 0; i < 3; i++) {
          const d = Math.abs(own[i] + raw[axis] - theirs[i]);
          if (d < best) {
            best = d;
            delta[axis] = theirs[i] - own[i];
            alignment[axis] = theirs[i];
          }
        }
        for (const a of moving.pins)
          for (const b of c.pins) {
            const d = Math.abs(a[axis] + raw[axis] - b[axis]);
            if (d < best) {
              best = d;
              delta[axis] = b[axis] - a[axis];
              alignment[axis] = b[axis];
            }
          }
        if (axis === 'y' && moving.baseline !== undefined && c.baseline !== undefined) {
          const d = Math.abs(moving.baseline + raw.y - c.baseline);
          if (d < best) {
            best = d;
            delta.y = c.baseline - moving.baseline;
            alignment.y = c.baseline;
          }
        }
      }
    }
    // Parallel branches use centers; branch clearance still measures authored body gaps.
    for (const axis of ['x', 'y'] as const) {
      if (!parallelAxis(context, axis) || alignment[axis] !== undefined) continue;
      const { before, after } = centerNeighbors(
        context,
        candidates,
        axis,
        { ...delta, [axis]: raw[axis] },
        threshold,
      );
      if (before && after) {
        const desired = (before.anchor[axis] + after.anchor[axis]) / 2 - moving.anchor[axis];
        if (Math.abs(desired - raw[axis]) <= threshold) delta[axis] = desired;
      }
    }
    // An existing axis/terminal alignment wins over equal spacing.
    for (const axis of ['x', 'y'] as const) {
      if (alignment[axis] !== undefined || parallelAxis(context, axis)) continue;
      // Connected bodies distribute along their branches. A perpendicular row
      // of nearby symbols must not pull a vertical component sideways off wire.
      if (context.branches.length && !context.branches.some((branch) => branch.axis === axis))
        continue;
      const b = translate(original, { ...delta, [axis]: raw[axis] });
      const { before, after } = moveNeighbors(
        context,
        b,
        spacingCandidates,
        axis,
        threshold,
        delta,
      );
      let desired: number | undefined;
      if (before && after)
        desired = (end(before.bounds, axis) + after.bounds[axis] - size(b, axis)) / 2;
      else if ((before || after) && !context.branches.some((branch) => branch.axis === axis)) {
        const neighbor = (before ?? after)!;
        const adjacent = nearestNeighbors(
          neighbor.bounds,
          spacingCandidates.filter((c) => c.id !== neighbor.id),
          axis,
          threshold,
          neighbor.anchor[axis === 'x' ? 'y' : 'x'],
        );
        const reference = before ? adjacent.before : adjacent.after;
        if (reference) {
          const gap = before
            ? freeGap(reference.bounds, neighbor.bounds, axis)
            : freeGap(neighbor.bounds, reference.bounds, axis);
          if (gap >= 0)
            desired = before
              ? end(neighbor.bounds, axis) + gap
              : neighbor.bounds[axis] - gap - size(b, axis);
        }
      }
      if (desired !== undefined && Math.abs(desired - b[axis]) <= threshold) {
        delta[axis] = desired - original[axis];
        delete alignment[axis];
      }
    }
  }
  const b = translate(original, delta),
    segments = context.index.nearby(b).filter((entry) => entry.segmentAxis !== undefined),
    distances: DistanceGuide[] = [];
  for (const axis of ['x', 'y'] as const) {
    const { before, after } = distanceNeighbors(
      context,
      b,
      spacingCandidates,
      segments,
      axis,
      threshold,
      delta,
    );
    const gaps = [
      before ? freeGap(before.bounds, b, axis) : undefined,
      after ? freeGap(b, after.bounds, axis) : undefined,
    ];
    const equal =
      gaps[0] !== undefined && gaps[1] !== undefined && Math.abs(gaps[0] - gaps[1]) < 0.01;
    const at = moving.anchor[axis === 'x' ? 'y' : 'x'] + delta[axis === 'x' ? 'y' : 'x'];
    if (before)
      distances.push({
        axis,
        from: end(before.bounds, axis),
        to: b[axis],
        at,
        value: gaps[0]!,
        equal,
        neighborId: before.id,
        referenceKind: before.referenceKind,
      });
    if (after)
      distances.push({
        axis,
        from: end(b, axis),
        to: after.bounds[axis],
        at,
        value: gaps[1]!,
        equal,
        neighborId: after.id,
        referenceKind: after.referenceKind,
      });
    // Matching a neighboring gap displays that reference too (local distribution).
    if (
      !equal &&
      (before || after) &&
      (!before || !after) &&
      !context.branches.some((branch) => branch.axis === axis) &&
      !(before ?? after)!.segmentAxis
    ) {
      const neighbor = (before ?? after)!;
      const adjacent = nearestNeighbors(
        neighbor.bounds,
        spacingCandidates.filter((c) => c.id !== neighbor.id),
        axis,
        threshold,
        neighbor.anchor[axis === 'x' ? 'y' : 'x'],
      );
      const reference = before ? adjacent.before : adjacent.after;
      if (reference) {
        const a = before ? reference : neighbor,
          c = before ? neighbor : reference,
          gap = freeGap(a.bounds, c.bounds, axis);
        const current = before ? gaps[0] : gaps[1];
        if (gap >= 0 && current !== undefined && Math.abs(gap - current) < 0.01) {
          distances
            .filter((d) => d.axis === axis)
            .forEach((d) => {
              d.equal = true;
            });
          distances.push({
            axis,
            from: end(a.bounds, axis),
            to: c.bounds[axis],
            at,
            value: gap,
            equal: true,
            neighborId: reference.id,
          });
        }
      }
    }
  }
  const centerDistances: DistanceGuide[] = [];
  for (const axis of ['x', 'y'] as const) {
    if (!parallelAxis(context, axis) && !detailed) continue;
    const { before, after } = centerNeighbors(context, candidates, axis, delta, threshold);
    const center = moving.anchor[axis] + delta[axis],
      cross = axis === 'x' ? 'y' : 'x',
      at = moving.anchor[cross] + delta[cross];
    const equal =
      !!before &&
      !!after &&
      Math.abs(center - before.anchor[axis] - (after.anchor[axis] - center)) < 0.01;
    if (before)
      centerDistances.push({
        axis,
        from: before.anchor[axis],
        to: center,
        at,
        value: center - before.anchor[axis],
        equal,
        neighborId: before.id,
        referenceKind: before.referenceKind,
        measurement: 'centers',
      });
    if (after)
      centerDistances.push({
        axis,
        from: center,
        to: after.anchor[axis],
        at,
        value: after.anchor[axis] - center,
        equal,
        neighborId: after.id,
        referenceKind: after.referenceKind,
        measurement: 'centers',
      });
  }
  // Each axis contributes its own pair. Parallel branch centers replace only
  // that axis's body gaps, leaving perpendicular line/branch clearances visible.
  const measurements = (['x', 'y'] as const).flatMap((axis) => {
    const gaps = distances.filter((guide) => guide.axis === axis),
      centers = centerDistances.filter((guide) => guide.axis === axis);
    if (parallelAxis(context, axis) && centers.length)
      return detailed ? [...centers, ...gaps] : centers;
    return detailed ? [...gaps, ...centers] : gaps;
  });
  return {
    delta,
    alignment,
    target,
    distances: target ? [] : placeDistanceChips(context, measurements, delta, zoom),
  };
}
