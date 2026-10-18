import { componentRegistry } from '../model/catalog';
import type { CircuitDocument, ComponentType, Point, Rotation, Terminal } from '../model/types';
import { add, distance, projectOnSegment, rotatePoint, snapPoint } from '../utils/geometry';
import { placementIndex } from './spatialIndex';
import type { ConnectionTarget, InlineCandidate, SnapCandidate } from './types';

export const SNAP_PX = 16;
const RELEASE_PX = 20;
const SWITCH_PX = 4;
export function needsTerminalChoice(type: ComponentType): boolean {
  const d = componentRegistry[type];
  return d.terminals.length > 2 || d.group === 'Digital' || type === 'connector2';
}
export function inlineCompatible(type: ComponentType): boolean {
  const ts = componentRegistry[type].terminals;
  return (
    !needsTerminalChoice(type) &&
    ts.length === 2 &&
    ts[0].localY === ts[1].localY &&
    Math.abs(ts[0].localX - ts[1].localX) > 1
  );
}
function eligibleTerminals(type: ComponentType, terminalId: string | null): Terminal[] {
  const ts = componentRegistry[type].terminals;
  return terminalId ? ts.filter((t) => t.id === terminalId) : ts;
}
const priority = (c: SnapCandidate) => (c.kind === 'junction' ? 0 : c.kind === 'terminal' ? 1 : 2);
export function findSnapCandidate(
  doc: CircuitDocument,
  type: ComponentType,
  position: Point,
  rotation: Rotation,
  zoom: number,
  terminalId: string | null = null,
  previous: SnapCandidate | null = null,
  disabled = false,
): SnapCandidate | null {
  if (disabled) return null;
  const index = placementIndex(doc),
    candidates: SnapCandidate[] = [];
  for (const t of eligibleTerminals(type, terminalId)) {
    const p = add(position, rotatePoint({ x: t.localX, y: t.localY }, rotation));
    for (const target of index.nearbyTargets(p, RELEASE_PX / zoom)) {
      const d = distance(p, target.point) * zoom;
      if (d <= RELEASE_PX)
        candidates.push({
          kind: target.kind,
          target,
          point: target.point,
          terminalId: t.id,
          distance: d,
          key: `${t.id}:${target.key}`,
        });
    }
    for (const segment of index.nearbySegments(p, RELEASE_PX / zoom)) {
      const point = projectOnSegment(p, segment.a, segment.b),
        d = distance(p, point) * zoom;
      if (d <= RELEASE_PX)
        candidates.push({
          kind: 'wire',
          segment,
          point,
          terminalId: t.id,
          distance: d,
          key: `${t.id}:w:${segment.key}`,
        });
    }
  }
  candidates.sort(
    (a, b) => priority(a) - priority(b) || a.distance - b.distance || a.key.localeCompare(b.key),
  );
  const best = candidates.find((c) => c.distance <= SNAP_PX) ?? null;
  const held = previous ? candidates.find((c) => c.key === previous.key) : null;
  if (
    held &&
    (!best || (priority(held) <= priority(best) && held.distance <= best.distance + SWITCH_PX))
  )
    return held;
  return best;
}
export function findAnchorTarget(
  doc: CircuitDocument,
  p: Point,
  zoom: number,
): ConnectionTarget | null {
  return (
    placementIndex(doc)
      .nearbyTargets(p, SNAP_PX / zoom)
      .filter((t) => distance(t.point, p) * zoom <= SNAP_PX)
      .sort(
        (a, b) =>
          (a.kind === 'junction' ? 0 : 1) - (b.kind === 'junction' ? 0 : 1) ||
          distance(a.point, p) - distance(b.point, p) ||
          a.key.localeCompare(b.key),
      )[0] ?? null
  );
}
export function snappedPosition(
  type: ComponentType,
  rotation: Rotation,
  candidate: SnapCandidate,
): Point {
  const t = componentRegistry[type].terminals.find((t) => t.id === candidate.terminalId)!;
  const offset = rotatePoint({ x: t.localX, y: t.localY }, rotation);
  return { x: candidate.point.x - offset.x, y: candidate.point.y - offset.y };
}
export function anchorOrientation(p: Point, target: Point, previous: Rotation): Rotation {
  const dx = p.x - target.x,
    dy = p.y - target.y;
  if (Math.hypot(dx, dy) < 10) return previous;
  // Preserve the acquired axis near the diagonal to avoid a one-pixel flip.
  if (Math.abs(Math.abs(dx) - Math.abs(dy)) < 8) return previous;
  return Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? 0 : 180) : dy >= 0 ? 90 : 270;
}
export function anchorTerminal(
  type: ComponentType,
  p: Point,
  target: Point,
  rotation: Rotation,
): string {
  return [...componentRegistry[type].terminals].sort(
    (a, b) =>
      distance(add(p, rotatePoint({ x: a.localX, y: a.localY }, rotation)), target) -
      distance(add(p, rotatePoint({ x: b.localX, y: b.localY }, rotation)), target),
  )[0].id;
}
export function findInlineCandidate(
  doc: CircuitDocument,
  type: ComponentType,
  p: Point,
  rotation: Rotation,
  zoom: number,
  manualRotation = false,
  previous: InlineCandidate | null = null,
): InlineCandidate | null {
  if (!inlineCompatible(type)) return null;
  const index = placementIndex(doc),
    threshold = previous ? RELEASE_PX : SNAP_PX;
  const ts = componentRegistry[type].terminals;
  const candidates = index.nearbySegments(p, threshold / zoom).flatMap((segment) => {
    const horizontal = Math.abs(segment.a.y - segment.b.y) < 0.001;
    if (!horizontal && Math.abs(segment.a.x - segment.b.x) >= 0.001) return [];
    const assistedRotation: Rotation = manualRotation ? rotation : horizontal ? 0 : 90;
    const offsets = ts.map((t) => rotatePoint({ x: t.localX, y: t.localY }, assistedRotation));
    if (
      horizontal
        ? Math.abs(offsets[0].y - offsets[1].y) > 0.001
        : Math.abs(offsets[0].x - offsets[1].x) > 0.001
    )
      return [];
    const projected = projectOnSegment(p, segment.a, segment.b);
    if (
      distance(p, projected) * zoom >
      (previous?.segment.key === segment.key ? RELEASE_PX : SNAP_PX)
    )
      return [];
    const center = projectOnSegment(snapPoint(projected), segment.a, segment.b);
    const position = horizontal
      ? { x: center.x, y: center.y - offsets[0].y }
      : { x: center.x - offsets[0].x, y: center.y };
    const cuts = offsets.map((o) => add(position, o)) as [Point, Point];
    if (
      cuts.some(
        (c) =>
          distance(c, projectOnSegment(c, segment.a, segment.b)) > 0.001 ||
          Math.min(distance(c, segment.a), distance(c, segment.b)) * zoom < 8,
      )
    )
      return [];
    const span = distance(cuts[0], cuts[1]),
      midpoint = {
        x: (cuts[0].x + cuts[1].x) / 2,
        y: (cuts[0].y + cuts[1].y) / 2,
      };
    // Refuse to cut through a branch, crossing, or another terminal.
    if (
      index
        .nearbyTargets(midpoint, span / 2 + 1)
        .some((t) => distance(t.point, projectOnSegment(t.point, cuts[0], cuts[1])) < 0.001)
    )
      return [];
    const crossed = index.nearbySegments(midpoint, span / 2 + 1).some((s) => {
      if (s.key === segment.key) return false;
      if (horizontal) {
        if (Math.min(s.a.y, s.b.y) > midpoint.y || Math.max(s.a.y, s.b.y) < midpoint.y)
          return false;
        return (
          Math.max(Math.min(s.a.x, s.b.x), Math.min(cuts[0].x, cuts[1].x)) <=
          Math.min(Math.max(s.a.x, s.b.x), Math.max(cuts[0].x, cuts[1].x))
        );
      }
      if (Math.min(s.a.x, s.b.x) > midpoint.x || Math.max(s.a.x, s.b.x) < midpoint.x) return false;
      return (
        Math.max(Math.min(s.a.y, s.b.y), Math.min(cuts[0].y, cuts[1].y)) <=
        Math.min(Math.max(s.a.y, s.b.y), Math.max(cuts[0].y, cuts[1].y))
      );
    });
    if (crossed) return [];
    const ordered = distance(cuts[0], segment.a) <= distance(cuts[1], segment.a) ? [0, 1] : [1, 0];
    return [
      {
        segment,
        position,
        rotation: assistedRotation,
        cuts: ordered.map((i) => cuts[i]) as [Point, Point],
        terminalIds: ordered.map((i) => ts[i].id) as [string, string],
      },
    ];
  });
  candidates.sort(
    (a, b) =>
      distance(p, a.position) - distance(p, b.position) ||
      a.segment.key.localeCompare(b.segment.key),
  );
  return candidates.find((c) => c.segment.key === previous?.segment.key) ?? candidates[0] ?? null;
}
/** Guides are finite and informational: free placement still uses the original grid. */
export function alignmentGuides(
  doc: CircuitDocument,
  type: ComponentType,
  p: Point,
  rotation: Rotation,
  zoom: number,
) {
  const index = placementIndex(doc),
    radius = 180 / zoom,
    guides: { start: Point; end: Point }[] = [];
  const points = [
    p,
    ...componentRegistry[type].terminals.map((t) =>
      add(p, rotatePoint({ x: t.localX, y: t.localY }, rotation)),
    ),
  ];
  const nearby = [
    ...index.nearbyTargets(p, radius).map((t) => t.point),
    ...index.nearbyCenters(p, radius),
  ];
  for (const axis of ['x', 'y'] as const) {
    const pairs = points.flatMap((start) =>
      nearby
        .filter(
          (end) =>
            Math.abs(start[axis] - end[axis]) < 0.001 &&
            distance(start, end) * zoom > 24 &&
            distance(start, end) * zoom < 180,
        )
        .map((end) => ({ start, end })),
    );
    pairs.sort((a, b) => distance(a.start, a.end) - distance(b.start, b.end));
    if (pairs[0]) guides.push(pairs[0]);
  }
  return guides;
}
