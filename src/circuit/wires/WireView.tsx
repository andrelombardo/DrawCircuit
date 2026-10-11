import { dashPattern } from '../../utils/strokeStyle';
import { memo } from 'react';
import type { Point, Wire } from '../../model/types';
import { pointsPath } from '../../utils/geometry';
export const WireView = memo(
  function WireView({
    object: o,
    points,
    paths,
  }: {
    object: Wire;
    points: Point[];
    paths?: Point[][];
  }) {
    const hitPath = pointsPath(points);
    const d = (paths ?? [points]).map(pointsPath).join(' ');
    return (
      <g data-object={o.id} className="circuit-object">
        <path
          d={hitPath}
          fill="none"
          stroke="transparent"
          strokeWidth={16}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={d}
          fill="none"
          opacity={o.opacity}
          stroke={o.color}
          strokeWidth={o.width}
          strokeDasharray={dashPattern(o, o.width)?.join(' ')}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  },
  (previous, next) => {
    // Resolve every connection, but only redraw wires whose geometry or style changed.
    return (
      previous.object === next.object &&
      previous.points.length === next.points.length &&
      previous.points.every(
        (point, index) => point.x === next.points[index].x && point.y === next.points[index].y,
      ) &&
      (previous.paths === next.paths ||
        (previous.paths?.length === next.paths?.length &&
          (previous.paths ?? []).every(
            (path, index) =>
              path.length === next.paths![index].length &&
              path.every(
                (point, i) =>
                  point.x === next.paths![index][i].x && point.y === next.paths![index][i].y,
              ),
          )))
    );
  },
);
