import type { CircuitDocument, Point, ShapeAnnotation, ShapeBorder } from '../model/types';
import { shapeBorders } from '../model/shapeAppearance';

export const shapeCenter = (o: ShapeAnnotation): Point => ({ x: o.x + o.width / 2, y: o.y + o.height / 2 });
export const shapeAngle = (o: ShapeAnnotation) => o.kind === 'rectangle' ? o.rotation ?? 0 : 0;
export function shapePoint(o: ShapeAnnotation, p: Point, inverse = false): Point {
  const c = shapeCenter(o), angle = shapeAngle(o) * Math.PI / 180 * (inverse ? -1 : 1);
  return { x: c.x + (p.x - c.x) * Math.cos(angle) - (p.y - c.y) * Math.sin(angle),
    y: c.y + (p.x - c.x) * Math.sin(angle) + (p.y - c.y) * Math.cos(angle) };
}
export const shapeTransform = (o: ShapeAnnotation) => `rotate(${shapeAngle(o)} ${shapeCenter(o).x} ${shapeCenter(o).y})`;
export function mirrorShapes(doc: CircuitDocument, ids: string[], axis: 'horizontal' | 'vertical'): CircuitDocument {
  const selected = new Set(ids);
  return { ...doc, objects: doc.objects.map((o) => {
    if (!selected.has(o.id) || o.kind !== 'rectangle' || o.frame) return o;
    const [tl, tr, br, bl] = o.cornerRadii ?? [0, 0, 0, 0];
    return { ...o, rotation: (360-(o.rotation ?? 0))%360,
      cornerRadii: (axis === 'horizontal' ? [tr, tl, bl, br] : [bl, br, tr, tl]) as [number, number, number, number] };
  }) };
}
export function shapeBounds(o: ShapeAnnotation, includeStroke = false) {
  const padding = includeStroke ? Math.max(0, ...shapeBorders(o).filter((b) => b.enabled).map(
    (b) => b.width * (b.position === 'outside' ? 1 : b.position === 'inside' ? 0 : 0.5),
  )) : 0;
  const points = [
    { x: o.x - padding, y: o.y - padding }, { x: o.x + o.width + padding, y: o.y - padding },
    { x: o.x + o.width + padding, y: o.y + o.height + padding }, { x: o.x - padding, y: o.y + o.height + padding },
  ].map((p) => shapePoint(o, p));
  const x = Math.min(...points.map((p) => p.x)), y = Math.min(...points.map((p) => p.y));
  return { x, y, width: Math.max(...points.map((p) => p.x)) - x, height: Math.max(...points.map((p) => p.y)) - y };
}
/** The canvas and all image exports use the same rounded paths. */
export const shapeBorderWidth = (o: ShapeAnnotation, border: ShapeBorder) => border.position === 'inside'
  ? Math.min(border.width, Math.min(o.width, o.height)/2) : border.width;
export function shapePath(o: ShapeAnnotation, border?: ShapeBorder): string {
  const inset = border ? shapeBorderWidth(o, border) / 2 * (border.position === 'inside' ? 1 : border.position === 'outside' ? -1 : 0) : 0;
  const x = o.x + inset, y = o.y + inset, w = Math.max(0.001, o.width - inset * 2), h = Math.max(0.001, o.height - inset * 2);
  if (o.kind === 'circle') {
    const r = w / 2, cx = x + r, cy = y + h / 2;
    return `M${cx-r} ${cy}a${r} ${r} 0 1 0 ${w} 0a${r} ${r} 0 1 0 ${-w} 0Z`;
  }
  let radii = (o.cornerRadii ?? [0, 0, 0, 0]).map((r) => Math.max(0, r - inset));
  const [a, b, c, d] = radii;
  const ratio = Math.min(1, w / Math.max(0.001, a+b), w / Math.max(0.001, c+d),
    h / Math.max(0.001, a+d), h / Math.max(0.001, b+c));
  radii = radii.map((r) => r * ratio);
  const [tl, tr, br, bl] = radii;
  const arc = (radius: number, endX: number, endY: number) => radius ? `A${radius} ${radius} 0 0 1 ${endX} ${endY}` : `L${endX} ${endY}`;
  return `M${x+tl} ${y}H${x+w-tr}${arc(tr, x+w, y+tr)}V${y+h-br}${arc(br, x+w-br, y+h)}H${x+bl}${arc(bl, x, y+h-bl)}V${y+tl}${arc(tl, x+tl, y)}Z`;
}
