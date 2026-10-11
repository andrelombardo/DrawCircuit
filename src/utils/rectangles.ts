import type { Point, RectangleAnnotation } from '../model/types';
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
export function resizeRectangle(
  o: RectangleAnnotation,
  handle: string,
  point: Point,
  square = false,
): RectangleAnnotation {
  const opposite = {
    x: handle.endsWith('W') ? o.x + o.width : o.x,
    y: handle.includes('N') ? o.y + o.height : o.y,
  };
  return {
    ...o,
    ...rectangleFromDrag(opposite, point, square),
    id: o.id,
    color: o.color,
    strokeWidth: o.strokeWidth,
    fill: o.fill,
    fillOpacity: o.fillOpacity,
    opacity: o.opacity,
    lineStyle: o.lineStyle,
    dashLength: o.dashLength,
    dashGap: o.dashGap,
  };
}
