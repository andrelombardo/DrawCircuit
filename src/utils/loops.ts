import { add, rotatePoint } from './geometry';
import type { LoopArrow, Point } from '../model/types';
export const LOOP_SWEEP = 324;
export const wrapPosition = (p: number) => ((p % 1) + 1) % 1;
export function loopGeometry(o: LoopArrow) {
  const endAngle = o.arrowPosition * 360 - 90;
  const sign = o.direction === 'clockwise' ? 1 : -1;
  const startAngle = endAngle - sign * LOOP_SWEEP;
  const center = { x: o.x + o.width / 2, y: o.y + o.height / 2 };
  const point = (angle: number) =>
    add(
      center,
      rotatePoint(
        {
          x: (o.width / 2) * Math.cos((angle * Math.PI) / 180),
          y: (o.height / 2) * Math.sin((angle * Math.PI) / 180),
        },
        o.rotation ?? 0,
      ),
    );
  return { startAngle, endAngle, start: point(startAngle), end: point(endAngle), sign };
}
export function loopPath(o: LoopArrow) {
  const g = loopGeometry(o);
  return `M ${g.start.x} ${g.start.y} A ${o.width / 2} ${o.height / 2} ${o.rotation ?? 0} 1 ${g.sign === 1 ? 1 : 0} ${g.end.x} ${g.end.y}`;
}
export function loopPositionAt(o: LoopArrow, p: Point) {
  p = add(
    { x: o.x + o.width / 2, y: o.y + o.height / 2 },
    rotatePoint({ x: p.x - o.x - o.width / 2, y: p.y - o.y - o.height / 2 }, -(o.rotation ?? 0)),
  );
  return wrapPosition(
    (Math.atan2(
      (p.y - o.y - o.height / 2) / (o.height / 2),
      (p.x - o.x - o.width / 2) / (o.width / 2),
    ) +
      Math.PI / 2) /
      (2 * Math.PI),
  );
}
export function reverseLoop(o: LoopArrow): LoopArrow {
  return {
    ...o,
    direction: o.direction === 'clockwise' ? 'counterclockwise' : 'clockwise',
    arrowPosition: wrapPosition((loopGeometry(o).startAngle + 90) / 360),
  };
}

export function resizeLoop(o: LoopArrow, corner: 'loopNW' | 'loopSE', pointer: Point): LoopArrow {
  const center = { x: o.x + o.width / 2, y: o.y + o.height / 2 };
  const local = add(
    center,
    rotatePoint({ x: pointer.x - center.x, y: pointer.y - center.y }, -(o.rotation ?? 0)),
  );
  const x = corner === 'loopNW' ? Math.min(local.x, o.x + o.width - 20) : o.x;
  const y = corner === 'loopNW' ? Math.min(local.y, o.y + o.height - 20) : o.y;
  const width = corner === 'loopNW' ? o.x + o.width - x : Math.max(20, local.x - x);
  const height = corner === 'loopNW' ? o.y + o.height - y : Math.max(20, local.y - y);
  const movedCenter = add(
    center,
    rotatePoint({ x: x + width / 2 - center.x, y: y + height / 2 - center.y }, o.rotation ?? 0),
  );
  return { ...o, x: movedCenter.x - width / 2, y: movedCenter.y - height / 2, width, height };
}
