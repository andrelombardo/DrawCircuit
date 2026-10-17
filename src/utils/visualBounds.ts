import { braceGeometry } from '../annotations/brace';
import { componentRegistry } from '../model/catalog';
import type { CircuitDocument, CircuitObject, Point } from '../model/types';
import { localToWorld, objectBounds, rotatePoint } from './geometry';
import { svgPathToTikz } from '../tikz/symbolGeometry';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function unionBounds(boxes: Bounds[]): Bounds {
  if (!boxes.length) return { x: 0, y: 0, width: 0, height: 0 };
  const x = Math.min(...boxes.map((b) => b.x)),
    y = Math.min(...boxes.map((b) => b.y));
  return {
    x,
    y,
    width: Math.max(...boxes.map((b) => b.x + b.width)) - x,
    height: Math.max(...boxes.map((b) => b.y + b.height)) - y,
  };
}
function pointBounds(points: Point[]): Bounds {
  return unionBounds(points.map((p) => ({ ...p, width: 0, height: 0 })));
}
/** Geometry only: excludes the registry's padded hit area and attached labels.
 * The authored path parser includes Bezier control extents, conservatively.
 * Junction spacing is measured node-to-node, as with terminal-to-terminal gaps. */
export function visualBounds(o: CircuitObject, doc: CircuitDocument): Bounds {
  if (o.kind === 'junction') return { x: o.x, y: o.y, width: 0, height: 0 };
  if (o.kind !== 'component') return objectBounds(o, doc);
  const points: Point[] = [];
  for (const s of componentRegistry[o.type].shapes) {
    if (s.kind === 'path')
      svgPathToTikz(s.d, (p) => {
        points.push(p);
        return '';
      });
    else if (s.kind === 'circle')
      points.push({ x: s.x - s.r, y: s.y - s.r }, { x: s.x + s.r, y: s.y + s.r });
    else if (s.kind === 'rect') points.push(s, { x: s.x + s.width, y: s.y + s.height });
  }
  points.push(...o.terminals.map((t) => ({ x: t.localX, y: t.localY })));
  const b = pointBounds(points);
  return pointBounds(
    [
      b,
      { x: b.x + b.width, y: b.y },
      { x: b.x, y: b.y + b.height },
      { x: b.x + b.width, y: b.y + b.height },
    ].map((p) => localToWorld(o, p)),
  );
}
/** Conservative fallback for positioning UI when SVG text cannot be measured. */
export function contentBounds(o: CircuitObject, doc: CircuitDocument): Bounds {
  const b = visualBounds(o, doc);
  if ((o.kind !== 'component' && o.kind !== 'junction' && o.kind !== 'brace') || !o.label.text)
    return b;
  const label = o.label,
    w = Math.max(label.fontSize, label.text.length * label.fontSize * 0.65),
    h = label.fontSize * Math.max(1.6, label.text.split('\n').length * 1.4);
  const center =
    o.kind === 'brace'
      ? braceGeometry(o).labelPoint
      : { x: o.x + label.offset.x, y: o.y + label.offset.y };
  const corners = [
    { x: -w / 2, y: -h / 2 },
    { x: w / 2, y: -h / 2 },
    { x: -w / 2, y: h / 2 },
    { x: w / 2, y: h / 2 },
  ].map((p) => {
    const r = rotatePoint(p, label.rotation);
    return { x: r.x + center.x, y: r.y + center.y };
  });
  return unionBounds([b, pointBounds(corners)]);
}
