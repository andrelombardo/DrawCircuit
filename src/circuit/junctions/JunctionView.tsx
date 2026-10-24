import { memo } from 'react';
import type { Junction } from '../../model/types';
export const JunctionView = memo(function JunctionView({
  object: o,
  selected = false,
}: {
  object: Junction;
  selected?: boolean;
}) {
  return (
    <g data-object={o.id} className="circuit-object">
      <circle
        cx={o.x}
        cy={o.y}
        r={0.01}
        fill="transparent"
        stroke="transparent"
        vectorEffect="non-scaling-stroke"
        strokeWidth={24}
      />
      <circle
        cx={o.x}
        cy={o.y}
        r={o.radius ?? 4.5}
        fill={o.color}
        opacity={o.opacity}
        className={selected ? 'selected-symbol' : undefined}
        data-selected={selected || undefined}
      />
    </g>
  );
});
