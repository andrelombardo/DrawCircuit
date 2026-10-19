import { memo } from 'react';
import type { LoopArrow } from '../../model/types';
import { loopPath } from '../../utils/loops';
import { canvasArrowHeadPath } from '../../tikz/arrowheads';
export const LoopArrowView = memo(function LoopArrowView({
  object: o,
  zoom = 1,
}: {
  object: LoopArrow;
  zoom?: number;
}) {
  return (
    <g data-object={o.id} className="circuit-object">
      <path
        d={loopPath(o)}
        stroke="transparent"
        strokeWidth={Math.min(18, 20 * zoom)}
        vectorEffect="non-scaling-stroke"
        fill="none"
      />
      <g
        opacity={o.opacity}
        stroke={o.color}
        strokeWidth={o.strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={loopPath(o)} />
        <path d={canvasArrowHeadPath(o)} />
      </g>
    </g>
  );
});
