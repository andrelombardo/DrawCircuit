import type { CircleAnnotation, Point, ShapeAnnotation } from '../model/types';
import { createRectangle } from '../model/factories';
import { shapePoint } from './shapes';
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
  const local = shapePoint(o, point, true);
  const delta = { x: local.x - opposite.x, y: local.y - opposite.y };
  if (o.aspectLocked && o.kind !== 'circle' && !square) {
    const ratio = o.width / o.height;
    if (Math.abs(delta.x) / ratio > Math.abs(delta.y)) delta.y = (Math.sign(delta.y) || 1) * Math.abs(delta.x) / ratio;
    else delta.x = (Math.sign(delta.x) || 1) * Math.abs(delta.y) * ratio;
  }
  const bounds = rectangleFromDrag(opposite, { x: opposite.x+delta.x, y: opposite.y+delta.y }, o.kind === 'circle' || square);
  const center = shapePoint(o, { x: bounds.x + bounds.width/2, y: bounds.y + bounds.height/2 });
  return {
    ...o,
    x: center.x-bounds.width/2,
    y: center.y-bounds.height/2,
    width: bounds.width,
    height: bounds.height,
  };
}
