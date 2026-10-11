import type { ArrowAnnotation, CircuitDocument, LoopArrow, Point } from '../model/types';
import { add, midpoint, rotatePoint } from './geometry';
import { wrapPosition } from './loops';
export type RotatableArrow = ArrowAnnotation | LoopArrow;
export const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;
export function arrowCenter(o: RotatableArrow): Point {
  return o.kind === 'loop-arrow'
    ? { x: o.x + o.width / 2, y: o.y + o.height / 2 }
    : midpoint(o.start, o.end);
}
export function rotateArrow(
  o: RotatableArrow,
  degrees: number,
  center = arrowCenter(o),
): RotatableArrow {
  const point = (p: Point) =>
    add(center, rotatePoint({ x: p.x - center.x, y: p.y - center.y }, degrees));
  if (o.kind === 'loop-arrow') {
    const c = point(arrowCenter(o));
    return {
      ...o,
      x: c.x - o.width / 2,
      y: c.y - o.height / 2,
      rotation: normalizeAngle((o.rotation ?? 0) + degrees),
    };
  }
  return {
    ...o,
    start: point(o.start),
    end: point(o.end),
    controlPoints: [point(o.controlPoints[0]), point(o.controlPoints[1])],
    ...(o.type === 'arc'
      ? { arcRotation: normalizeAngle((o.arcRotation ?? 0) + degrees) || undefined }
      : {}),
  };
}
export function mirrorArrow(o: RotatableArrow, axis: 'horizontal' | 'vertical'): RotatableArrow {
  const c = arrowCenter(o);
  const point = (p: Point) =>
    axis === 'horizontal' ? { x: 2 * c.x - p.x, y: p.y } : { x: p.x, y: 2 * c.y - p.y };
  if (o.kind === 'loop-arrow')
    return {
      ...o,
      rotation: normalizeAngle(-(o.rotation ?? 0)),
      arrowPosition: wrapPosition(axis === 'horizontal' ? -o.arrowPosition : 0.5 - o.arrowPosition),
      direction: o.direction === 'clockwise' ? 'counterclockwise' : 'clockwise',
    };
  return {
    ...o,
    start: point(o.start),
    end: point(o.end),
    controlPoints: [point(o.controlPoints[0]), point(o.controlPoints[1])],
    ...(o.type === 'arc'
      ? {
          arcMirrored: !o.arcMirrored,
          arcRotation: normalizeAngle(-(o.arcRotation ?? 0) + (axis === 'vertical' ? 180 : 0)),
        }
      : {}),
  };
}
export function mirrorArrows(
  doc: CircuitDocument,
  ids: string[],
  axis: 'horizontal' | 'vertical',
): CircuitDocument {
  const selected = new Set(ids);
  return {
    ...doc,
    objects: doc.objects.map((o) =>
      selected.has(o.id) && (o.kind === 'arrow' || o.kind === 'loop-arrow')
        ? mirrorArrow(o, axis)
        : o,
    ),
  };
}
export function arrowOrientation(o: RotatableArrow): number {
  return o.kind === 'loop-arrow'
    ? (o.rotation ?? 0)
    : o.type === 'arc'
      ? (o.arcRotation ?? 0)
      : (Math.atan2(o.end.y - o.start.y, o.end.x - o.start.x) * 180) / Math.PI;
}
/** Delta from the pointer-down angle, always computed from the original geometry. */
export function rotationGesture(
  center: Point,
  from: Point,
  to: Point,
  snap: boolean,
  initialAngle = 0,
) {
  const degrees =
    ((Math.atan2(to.y - center.y, to.x - center.x) -
      Math.atan2(from.y - center.y, from.x - center.x)) *
      180) /
    Math.PI;
  return snap ? Math.round((initialAngle + degrees) / 15) * 15 - initialAngle : degrees;
}
export function rotationHandle(o: RotatableArrow, zoom: number) {
  const c = arrowCenter(o);
  const angle = arrowOrientation(o);
  const radius =
    o.kind === 'loop-arrow'
      ? o.height / 2
      : o.type === 'arc'
        ? Math.max(20, Math.hypot(o.end.x - o.start.x, o.end.y - o.start.y) / 2)
        : o.type === 'straight'
          ? 10
          : Math.max(
              10,
              ...o.controlPoints.map((p) =>
                Math.abs(rotatePoint({ x: p.x - c.x, y: p.y - c.y }, -angle).y),
              ),
            );
  return add(c, rotatePoint({ x: 0, y: -radius - 24 / zoom }, angle));
}
