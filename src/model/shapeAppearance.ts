import { BLEND_MODES } from './types';
import type { CircuitDocument, CircuitObject, ShapeAnnotation, ShapeStyle, ShapeFill, ShapeBorder } from './types';
import { MAX_COORDINATE, MAX_LINE_WIDTH } from './limits';

export const shapeFills = (o: ShapeAnnotation): ShapeFill[] => o.fills ?? (o.fill === 'none' ? [] : [
  { id: 'fill', color: o.fill, opacity: o.fillOpacity ?? 1, enabled: true },
]);
export const shapeBorders = (o: ShapeAnnotation): ShapeBorder[] => o.borders ?? [
  { id: 'border', color: o.color, opacity: o.opacity ?? 1, enabled: true, width: o.strokeWidth,
    position: 'center', lineStyle: o.lineStyle, dashLength: o.dashLength, dashGap: o.dashGap },
];
export const shapeStyle = (o: ShapeAnnotation): ShapeStyle => ({
  fills: shapeFills(o), borders: shapeBorders(o), blendMode: o.blendMode ?? 'normal',
  styleOpacity: o.styleOpacity ?? 1, cornerRadii: o.cornerRadii ?? [0, 0, 0, 0],
});
export const objectFills = (o: CircuitObject): ShapeFill[] => o.kind === 'rectangle' || o.kind === 'circle' ? shapeFills(o) :
  o.fills ?? (o.kind === 'text' || o.kind === 'junction' ? [{ id: 'fill', color: o.color, opacity: o.opacity ?? 1, enabled: true }] : []);
export const objectBorders = (o: CircuitObject): ShapeBorder[] => o.kind === 'rectangle' || o.kind === 'circle' ? shapeBorders(o) :
  o.borders ?? (o.kind === 'text' || o.kind === 'junction' ? [] : [{ id: 'border', color: o.color, opacity: o.opacity ?? 1,
    enabled: true, width: 'strokeWidth' in o ? o.strokeWidth : 'width' in o ? o.width : 2, position: 'center',
    ...('lineStyle' in o ? { lineStyle: o.lineStyle, dashLength: o.dashLength, dashGap: o.dashGap } : {}),
  }]);
export function withPaints(o: CircuitObject, border: boolean, paints: ShapeFill[] | ShapeBorder[]): CircuitObject {
  const primary = paints.find((p) => p.enabled) ?? paints[0];
  return { ...o, [border ? 'borders' : 'fills']: paints,
    ...(primary && o.kind !== 'rectangle' && o.kind !== 'circle' ? { color: primary.color, opacity: primary.opacity,
      ...(border && 'width' in primary ? ('strokeWidth' in o ? { strokeWidth: primary.width } : 'width' in o ? { width: primary.width } : {}) : {}),
    } : {}),
  } as CircuitObject;
}
/** Keep the compact annotation editors in sync with a layer's primary paint. */
export function withPrimaryPaint(o: CircuitObject, patch: Partial<ShapeBorder>): CircuitObject {
  const fill = o.kind === 'text' || o.kind === 'junction', list = fill ? o.fills : o.borders;
  if (!list?.length) return o;
  const primary = Math.max(0, list.findIndex((p) => p.enabled));
  return { ...o, [fill ? 'fills' : 'borders']: list.map((p, i) => i === primary ? { ...p, ...patch } : p) };
}
export function paintVariants(o: CircuitObject): CircuitObject[] | null {
  const fill = o.kind === 'text' || o.kind === 'junction';
  if ((fill ? o.fills : o.borders) === undefined) return null;
  return [...(fill ? objectFills(o) : objectBorders(o))].reverse().filter((p) => p.enabled).map((paint) => {
    const border = paint as ShapeBorder;
    return ({
    ...o, color: paint.color, opacity: paint.opacity, styleOpacity: 1, blendMode: 'normal',
    ...('width' in paint ? { ...('strokeWidth' in o ? { strokeWidth: border.width } : { width: border.width }),
      lineStyle: border.lineStyle, dashLength: border.dashLength, dashGap: border.dashGap } : {}),
  } as CircuitObject); });
}
export function frameSelection(doc: CircuitDocument, ids: readonly string[]): string[] {
  const included = new Set(ids);
  for (const id of included) {
    const o = doc.objects.find((o) => o.id === id);
    if (o?.kind === 'rectangle' && o.frame)
      o.frame.children.forEach((child) => included.add(child));
  }
  return [...included];
}
export const parentFrame = (doc: CircuitDocument, id: string) => doc.objects.find(
  (o) => o.kind === 'rectangle' && o.frame?.children.includes(id),
) as Extract<CircuitObject, { kind: 'rectangle' }> | undefined;

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= MAX_COORDINATE;
const nonnegative = (v: unknown) => number(v) && Number(v) >= 0;
const alpha = (v: unknown) => number(v) && Number(v) >= 0 && Number(v) <= 1;
const text = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= 200;
const paint = (v: unknown, border: boolean, maxWidth: number) => record(v) && text(v.id) &&
  typeof v.color === 'string' && /^#[\da-f]{6}$/i.test(v.color) && alpha(v.opacity) && typeof v.enabled === 'boolean' &&
  (!border || (number(v.width) && Number(v.width) > 0 && Number(v.width) <= maxWidth &&
    ['center', 'inside', 'outside'].includes(String(v.position)) &&
    (v.lineStyle === undefined || ['solid', 'dashed', 'dotted'].includes(String(v.lineStyle))) &&
    (v.dashLength === undefined || (number(v.dashLength) && Number(v.dashLength) > 0 && Number(v.dashLength) <= 1000)) &&
    (v.dashGap === undefined || (number(v.dashGap) && Number(v.dashGap) > 0 && Number(v.dashGap) <= 1000))));
const paints = (v: unknown, border: boolean, maxWidth = MAX_LINE_WIDTH) => Array.isArray(v) && v.length <= 32 &&
  v.every((p) => paint(p, border, maxWidth)) && new Set(v.map((p) => p.id)).size === v.length;
const tuple = (v: unknown) => Array.isArray(v) && v.length === 4 && v.every(nonnegative);
export function validObjectAppearance(o: Record<string, unknown>): boolean {
  return (o.blendMode === undefined || (BLEND_MODES as readonly unknown[]).includes(o.blendMode)) &&
    (o.styleOpacity === undefined || alpha(o.styleOpacity)) && (o.styleId === undefined || text(o.styleId)) &&
    (o.fills === undefined || paints(o.fills, false)) && (o.borders === undefined || paints(o.borders, true, o.kind === 'highlight' ? 1000 : MAX_LINE_WIDTH));
}
export function validShapeAppearance(o: Record<string, unknown>): boolean {
  if ((o.fills !== undefined && !paints(o.fills, false)) ||
    (o.borders !== undefined && !paints(o.borders, true)) ||
    !validObjectAppearance(o) ||
    (o.cornerRadii !== undefined && !tuple(o.cornerRadii)) ||
    (o.styleId !== undefined && !text(o.styleId)) ||
    (o.aspectLocked !== undefined && typeof o.aspectLocked !== 'boolean') ||
    (o.rotation !== undefined && !number(o.rotation))) return false;
  if (o.frame === undefined) return true;
  const f = o.frame;
  return o.kind === 'rectangle' && !(o.rotation ?? 0) && record(f) && text(f.name) &&
    Array.isArray(f.children) && f.children.length <= 2000 && f.children.every(text) &&
    new Set(f.children).size === f.children.length && record(f.constraints) &&
    Object.entries(f.constraints).every(([id, c]) => f.children instanceof Array && f.children.includes(id) && record(c) &&
      ['start', 'end', 'both', 'center', 'scale'].includes(String(c.horizontal)) &&
      ['start', 'end', 'both', 'center', 'scale'].includes(String(c.vertical))) &&
    ['free', 'horizontal', 'vertical'].includes(String(f.direction)) && nonnegative(f.gap) && tuple(f.padding) &&
    ['start', 'center', 'end', 'stretch'].includes(String(f.align)) &&
    ['fixed', 'hug'].includes(String(f.widthSizing)) && ['fixed', 'hug'].includes(String(f.heightSizing));
}
export function validFrameTree(doc: CircuitDocument): boolean {
  const ids = new Set(doc.objects.map((o) => o.id)), parents = new Map<string, string>();
  for (const o of doc.objects) if (o.kind === 'rectangle' && o.frame) {
    for (const child of o.frame.children) {
      if (!ids.has(child) || parents.has(child) || child === o.id) return false;
      parents.set(child, o.id);
    }
  }
  for (const child of parents.keys()) {
    const seen = new Set([child]);
    let id = parents.get(child);
    while (id) {
      if (seen.has(id)) return false;
      seen.add(id);
      if (seen.size > 32) return false;
      id = parents.get(id);
    }
  }
  return true;
}
