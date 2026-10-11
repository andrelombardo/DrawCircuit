import { memo } from 'react';
import type { LoopArrow } from '../../model/types';
import { loopPath } from '../../utils/loops';
export const LoopArrowView = memo(function LoopArrowView({
  object: o,
  zoom = 1,
}: {
  object: LoopArrow;
  zoom?: number;
}) {
  const markerId = `loop-${o.id}`;
  return (
    <g data-object={o.id} className="circuit-object">
      <defs>
        <marker
          id={markerId}
          viewBox="0 -4 9 8"
          refX={8}
          refY={0}
          markerWidth={9}
          markerHeight={8}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M0-3.5L8 0 0 3.5"
            fill="none"
            stroke={o.color}
            strokeWidth={o.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <path
        d={loopPath(o)}
        stroke="transparent"
        strokeWidth={Math.min(18, 20 * zoom)}
        vectorEffect="non-scaling-stroke"
        fill="none"
      />
      <path
        d={loopPath(o)}
        opacity={o.opacity}
        stroke={o.color}
        strokeWidth={o.strokeWidth}
        fill="none"
        markerEnd={`url(#${markerId})`}
      />
    </g>
  );
});
