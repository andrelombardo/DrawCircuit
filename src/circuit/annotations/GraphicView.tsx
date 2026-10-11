import { memo } from 'react';
import type { LineAnnotation, RectangleAnnotation } from '../../model/types';
import { dashPattern } from '../../utils/strokeStyle';
import { pointsPath } from '../../utils/geometry';
export const GraphicView = memo(function GraphicView({
  object: o,
}: {
  object: LineAnnotation | RectangleAnnotation;
}) {
  const width = o.kind === 'rectangle' ? o.strokeWidth : o.width;
  const stroke = {
    fill: 'none',
    stroke: o.color,
    strokeWidth: width,
    opacity: o.opacity,
    strokeDasharray: dashPattern(o, width)?.join(' '),
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <g data-object={o.id} className="circuit-object">
      {o.kind === 'rectangle' ? (
        <>
          {o.fill !== 'none' && (
            <rect
              x={o.x}
              y={o.y}
              width={o.width}
              height={o.height}
              fill={o.fill}
              fillOpacity={o.fillOpacity ?? 1}
              stroke="none"
            />
          )}
          <rect
            x={o.x}
            y={o.y}
            width={o.width}
            height={o.height}
            fill="none"
            stroke="transparent"
            strokeWidth={14}
            vectorEffect="non-scaling-stroke"
            pointerEvents="stroke"
          />
          <rect
            x={o.x}
            y={o.y}
            width={o.width}
            height={o.height}
            {...stroke}
            pointerEvents="none"
          />
        </>
      ) : (
        <>
          <path
            d={pointsPath([o.start, o.end])}
            fill="none"
            stroke="transparent"
            strokeWidth={16}
            vectorEffect="non-scaling-stroke"
          />
          <path d={pointsPath([o.start, o.end])} {...stroke} pointerEvents="none" />
        </>
      )}
    </g>
  );
});
