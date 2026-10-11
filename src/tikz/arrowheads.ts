import type { ArrowAnnotation, LoopArrow, Point } from '../model/types';
import { distance, arcGeometry, rotatePoint } from '../utils/geometry';
import { loopGeometry } from '../utils/loops';

/** SVG marker viewBox="0 -4 9 8", refX=8, path="M0 -3.5 L8 0 L0 3.5". */
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
export function canvasArrowHead(arrow: ArrowAnnotation | LoopArrow): Point[] {
  if (arrow.kind === 'loop-arrow') {
    const g = loopGeometry(arrow);
    const angle = (g.endAngle * Math.PI) / 180;
    const sign = arrow.direction === 'clockwise' ? 1 : -1;
    return chevron(
      g.end,
      rotatePoint(
        {
          x: -sign * (arrow.width / 2) * Math.sin(angle),
          y: sign * (arrow.height / 2) * Math.cos(angle),
        },
        arrow.rotation ?? 0,
      ),
    );
  }
  if (arrow.type === 'arc') {
    const g = arcGeometry(arrow);
    return chevron(arrow.reversed ? g.start : g.end, g.tangent);
  }

  const tip = arrow.reversed ? arrow.start : arrow.end;
  const candidates =
    arrow.type === 'straight'
      ? [arrow.reversed ? arrow.end : arrow.start]
      : arrow.reversed
        ? [...arrow.controlPoints, arrow.end]
        : [arrow.controlPoints[1], arrow.controlPoints[0], arrow.start];
  const from = candidates.find((p) => distance(p, tip) > 0) ?? tip;
  return chevron(tip, { x: tip.x - from.x, y: tip.y - from.y });
}
