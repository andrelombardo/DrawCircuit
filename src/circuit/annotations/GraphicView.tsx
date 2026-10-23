import { memo } from 'react';
import type { CircuitDocument, LineAnnotation, ShapeAnnotation } from '../../model/types';
import { dashPattern } from '../../utils/strokeStyle';
import { linePath } from '../../utils/geometry';
import { lineArrowHeadPath } from '../../tikz/arrowheads';
export const GraphicView = memo(function GraphicView({
  object: o,
  doc,
}: {
  object: LineAnnotation | ShapeAnnotation;
  doc?: CircuitDocument;
}) {
  const width = o.kind === 'line' ? o.width : o.strokeWidth;
  const Shape = o.kind === 'circle' ? 'circle' : 'rect';
  const geometry =
    o.kind === 'line'
      ? {}
      : o.kind === 'circle'
        ? { cx: o.x + o.width / 2, cy: o.y + o.height / 2, r: o.width / 2 }
        : { x: o.x, y: o.y, width: o.width, height: o.height };
  const stroke = {
    fill: 'none',
    stroke: o.color,
    strokeWidth: width,
    strokeDasharray: dashPattern(o, width)?.join(' '),
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <g data-object={o.id} className="circuit-object">
      {o.kind !== 'line' ? (
        <>
          {o.fill !== 'none' && (
            <Shape {...geometry} fill={o.fill} fillOpacity={o.fillOpacity ?? 1} stroke="none" />
          )}
          <Shape
            {...geometry}
            fill="none"
            stroke="transparent"
            strokeWidth={14}
            vectorEffect="non-scaling-stroke"
            pointerEvents="stroke"
          />
          <Shape {...geometry} {...stroke} opacity={o.opacity} pointerEvents="none" />
        </>
      ) : (
        <>
          <path
            d={linePath(o, doc)}
            fill="none"
            stroke="transparent"
            strokeWidth={16}
            vectorEffect="non-scaling-stroke"
          />
          <g opacity={o.opacity}>
            <path d={linePath(o, doc)} {...stroke} pointerEvents="none" />
            {o.arrowhead && (
              <path
                d={lineArrowHeadPath(o, doc)}
                {...stroke}
                strokeDasharray={undefined}
                fill={o.arrowhead === 'filled' ? o.color : 'none'}
              />
            )}
          </g>
        </>
      )}
    </g>
  );
});
