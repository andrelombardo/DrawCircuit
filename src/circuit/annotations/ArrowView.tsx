import { memo } from 'react';
import type { ArrowAnnotation } from '../../model/types';
import { arrowPath } from '../../utils/geometry';
export const ArrowView = memo(function ArrowView({
  object: o,
  zoom = 1,
}: {
  object: ArrowAnnotation;
  zoom?: number;
}) {
  const markerId = `arrow-${o.id}`;
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
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M0-3.5L8 0 0 3.5"
            fill="none"
            stroke={o.color}
            strokeWidth={o.width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <path
        d={arrowPath(o)}
        stroke="transparent"
        strokeWidth={Math.min(18, 20 * zoom)}
        vectorEffect="non-scaling-stroke"
        fill="none"
      />
      <path
        d={arrowPath(o)}
        opacity={o.opacity}
        stroke={o.color}
        strokeWidth={o.width}
        fill="none"
        markerEnd={!o.reversed ? `url(#${markerId})` : undefined}
        markerStart={o.reversed ? `url(#${markerId})` : undefined}
      />
    </g>
  );
});
