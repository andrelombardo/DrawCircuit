import type { CircleAnnotation, Point, ShapeAnnotation } from '../model/types';
import { createRectangle } from '../model/factories';
/** Both drawing directions, Shift square and Option centred drawing share normalization. */
export function rectangleFromDrag(origin: Point, end: Point, square = false, centered = false) {
  const delta = { x: end.x - origin.x, y: end.y - origin.y };
  if (square) {
    const size = Math.max(Math.abs(delta.x), Math.abs(delta.y));
    delta.x = (Math.sign(delta.x) || 1) * size;
    delta.y = (Math.sign(delta.y) || 1) * size;
  }
  return createRectangle(centered ? { x: origin.x - delta.x, y: origin.y - delta.y } : origin, {
    x: origin.x + delta.x,
    y: origin.y + delta.y,
  });
}
export function circleFromDrag(origin: Point, end: Point, centered = false): CircleAnnotation {
  return { ...rectangleFromDrag(origin, end, true, centered), kind: 'circle' };
}
export function resizeShape(
  o: ShapeAnnotation,
  handle: string,
  point: Point,
  square = false,
): ShapeAnnotation {
  const opposite = {
    x: handle.endsWith('W') ? o.x + o.width : o.x,
    y: handle.includes('N') ? o.y + o.height : o.y,
  };
  const bounds = rectangleFromDrag(opposite, point, o.kind === 'circle' || square);
  return {
    ...o,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  };
}
