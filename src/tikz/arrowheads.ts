import type { ArrowAnnotation, CircuitDocument, LineAnnotation, LoopArrow, Point } from '../model/types';
import { distance, arcGeometry, lineCurveGeometry, linePoints, rotatePoint } from '../utils/geometry';
import { loopGeometry } from '../utils/loops';

/** Compact chevron for electrical annotations integrated into the circuit. */
export function chevron(tip: Point, tangent: Point): Point[] {
  const length = Math.hypot(tangent.x, tangent.y);
  const dx = length ? tangent.x / length : 1;
  const dy = length ? tangent.y / length : 0;
  return [
    { x: tip.x - 8 * dx - 3.5 * dy, y: tip.y - 8 * dy + 3.5 * dx },
    tip,
    { x: tip.x - 8 * dx + 3.5 * dy, y: tip.y - 8 * dy - 3.5 * dx },
  ];
}
/** Broad, gently curved pen strokes, scaled with the shaft's weight. The control
 * points are also used for conservative export bounds. */
function handwrittenHead(tip: Point, tangent: Point, width: number): Point[] {
  const length = Math.hypot(tangent.x, tangent.y);
  const dx = length ? tangent.x / length : 1;
  const dy = length ? tangent.y / length : 0;
  const scale = Math.max(1, Math.sqrt(width / 2));
  return [
    [-14, -6.5],
    [-7, -5.5],
    [0, 0],
    [-6.5, 4.5],
    [-13, 7],
  ].map(([x, y]) => ({
    x: tip.x + scale * (x * dx - y * dy),
    y: tip.y + scale * (x * dy + y * dx),
  }));
}
export function canvasArrowHead(arrow: ArrowAnnotation | LoopArrow): Point[] {
  if (arrow.kind === 'loop-arrow') {
    const g = loopGeometry(arrow);
    const angle = (g.endAngle * Math.PI) / 180;
    const sign = arrow.direction === 'clockwise' ? 1 : -1;
    return handwrittenHead(
      g.end,
      rotatePoint(
        {
          x: -sign * (arrow.width / 2) * Math.sin(angle),
          y: sign * (arrow.height / 2) * Math.cos(angle),
        },
        arrow.rotation ?? 0,
      ),
      arrow.strokeWidth,
    );
  }
  if (arrow.type === 'arc') {
    const g = arcGeometry(arrow);
    return handwrittenHead(arrow.reversed ? g.start : g.end, g.tangent, arrow.width);
  }

  const tip = arrow.reversed ? arrow.start : arrow.end;
  const candidates =
    arrow.type === 'straight'
      ? [arrow.reversed ? arrow.end : arrow.start]
      : arrow.reversed
        ? [...arrow.controlPoints, arrow.end]
        : [arrow.controlPoints[1], arrow.controlPoints[0], arrow.start];
  const from = candidates.find((p) => distance(p, tip) > 0) ?? tip;
  return handwrittenHead(tip, { x: tip.x - from.x, y: tip.y - from.y }, arrow.width);
}

function headPath(points: Point[], filled: boolean): string {
  if (!points.length) return '';
  const [start, upper, tip, lower, end] = points;
  return `M ${start.x} ${start.y} Q ${upper.x} ${upper.y} ${tip.x} ${tip.y} Q ${lower.x} ${lower.y} ${end.x} ${end.y}${filled ? ' Z' : ''}`;
}

/** Follow the final route segment or the exact Bezier endpoint tangent. */
export function lineArrowHead(line: LineAnnotation, doc?: CircuitDocument): Point[] {
  if (!line.arrowhead) return [];
  const geometry = lineCurveGeometry(line, doc);
  const points = line.controlPoints
    ? [geometry.start, ...geometry.controls, geometry.end]
    : doc ? linePoints(line, doc) : [line.start, ...(line.vertices ?? []), line.end];
  const directed = line.reversed ? points : [...points].reverse();
  const tip = directed[0];
  const from = directed.find((point) => distance(point, tip) > 0);
  return from ? handwrittenHead(tip, { x: tip.x - from.x, y: tip.y - from.y }, line.width) : [];
}

export function lineArrowHeadPath(line: LineAnnotation, doc?: CircuitDocument): string {
  return headPath(lineArrowHead(line, doc), line.arrowhead === 'filled');
}

/** Shared by the editor, placement previews and SVG/PNG output. */
export function canvasArrowHeadPath(arrow: ArrowAnnotation | LoopArrow): string {
  return headPath(canvasArrowHead(arrow), !!arrow.headFilled);
}
