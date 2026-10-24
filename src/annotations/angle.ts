import { makeId } from '../model/catalog';
import { COLORS } from '../model/types';
import type { AngleAnnotation, Point } from '../model/types';

export const normalizeAngle = (degrees: number) => ((degrees % 360) + 360) % 360;
export const angleAt = (vertex: Point, point: Point) =>
  normalizeAngle(Math.atan2(vertex.y - point.y, point.x - vertex.x) * 180 / Math.PI);

export function createAngle(vertex: Point, first: Point, last?: Point): AngleAnnotation {
  const startAngle = angleAt(vertex, first);
  return {
    kind: 'angle', id: makeId(), ...vertex,
    radius: Math.max(8, Math.hypot(first.x - vertex.x, first.y - vertex.y)),
    startAngle, sweepAngle: last ? normalizeAngle(angleAt(vertex, last) - startAngle) || 360 : 45,
    showRays: true, color: COLORS.blue, width: 2,
    label: { text: '\\varphi', offset: { x: 0, y: 0 }, color: COLORS.blue, fontSize: 22, rotation: 0 },
  };
}

/** Shared exact circular geometry for the editor, selection and exports. */
export function angleGeometry(o: AngleAnnotation) {
  const point = (degrees: number, radius = o.radius): Point => ({
    x: o.x + radius * Math.cos(degrees * Math.PI / 180),
    y: o.y - radius * Math.sin(degrees * Math.PI / 180),
  });
  const start = point(o.startAngle), end = point(o.startAngle + o.sweepAngle);
  const sweepFlag = o.sweepAngle > 0 ? 0 : 1;
  // Two arcs also represent a full circle without coincident-endpoint ambiguity.
  const middle = point(o.startAngle + o.sweepAngle / 2);
  const arc = Math.abs(o.sweepAngle) >= 359.999999
    ? `M ${start.x} ${start.y} A ${o.radius} ${o.radius} 0 0 ${sweepFlag} ${middle.x} ${middle.y} A ${o.radius} ${o.radius} 0 0 ${sweepFlag} ${end.x} ${end.y}`
    : `M ${start.x} ${start.y} A ${o.radius} ${o.radius} 0 ${Math.abs(o.sweepAngle) > 180 ? 1 : 0} ${sweepFlag} ${end.x} ${end.y}`;
  const d = arc + (o.showRays ? ` M ${start.x} ${start.y} L ${o.x} ${o.y} L ${end.x} ${end.y}` : '');
  const points = [start, end, ...(o.showRays ? [{ x: o.x, y: o.y }] : [])];
  for (let quadrant = 0; quadrant < 4; quadrant++) {
    const degrees = quadrant * 90;
    const travel = normalizeAngle(o.sweepAngle > 0 ? degrees - o.startAngle : o.startAngle - degrees);
    if (travel <= Math.abs(o.sweepAngle)) points.push(point(degrees));
  }
  const labelAnchor = point(o.startAngle + o.sweepAngle / 2, o.radius + o.label.fontSize * 0.85);
  return { d, arc, start, end, middle, points, labelPoint: {
    x: labelAnchor.x + o.label.offset.x, y: labelAnchor.y + o.label.offset.y,
  } };
}

export function resizeAngle(o: AngleAnnotation, handle: string, point: Point): AngleAnnotation {
  if (handle === 'angleRadius')
    return { ...o, radius: Math.max(8, Math.hypot(point.x - o.x, point.y - o.y)) };
  const degrees = angleAt(o, point);
  if (handle === 'angleStart') {
    const sweep = normalizeAngle(o.sweepAngle > 0 ? o.startAngle + o.sweepAngle - degrees : degrees - o.startAngle - o.sweepAngle);
    return { ...o, startAngle: degrees, sweepAngle: (o.sweepAngle > 0 ? 1 : -1) * Math.max(0.1, sweep) };
  }
  const sweep = normalizeAngle(o.sweepAngle > 0 ? degrees - o.startAngle : o.startAngle - degrees);
  return { ...o, sweepAngle: (o.sweepAngle > 0 ? 1 : -1) * Math.max(0.1, sweep) };
}
