import { memo } from 'react';
import { shapeFills, shapeBorders } from '../../model/shapeAppearance';
import { shapeBorderWidth, shapePath, shapeTransform } from '../../utils/shapes';
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
  const stroke = {
    fill: 'none',
    stroke: o.color,
    strokeWidth: width,
    strokeDasharray: dashPattern(o, width)?.join(' '),
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <g data-object={o.id} className="circuit-object" opacity={o.kind === 'line' ? o.styleOpacity : undefined} style={o.kind === 'line' ? { mixBlendMode: o.blendMode ?? 'normal' } : undefined}>
      {o.kind !== 'line' ? (
        <>
          <g transform={shapeTransform(o)} opacity={o.styleOpacity ?? 1} style={{ mixBlendMode: o.blendMode ?? 'normal' }}>
            {[...shapeFills(o)].reverse().filter((p) => p.enabled).map((paint) => (
              <path key={paint.id} d={shapePath(o)} fill={paint.color} fillOpacity={paint.opacity} stroke="none" />
            ))}
            {[...shapeBorders(o)].reverse().filter((p) => p.enabled).map((paint) => (
              <path key={paint.id} d={shapePath(o, paint)} fill="none" stroke={paint.color}
                strokeWidth={shapeBorderWidth(o, paint)} opacity={paint.opacity} strokeDasharray={dashPattern(paint, paint.width)?.join(' ')}
                strokeLinejoin="round" strokeLinecap="round" pointerEvents="none" />
            ))}
          </g>
          <path
            d={shapePath(o)} transform={shapeTransform(o)}
            fill="none"
            stroke="transparent"
            strokeWidth={14}
            vectorEffect="non-scaling-stroke"
            pointerEvents={shapeFills(o).some((p) => p.enabled) ? 'all' : 'stroke'}
            className="object-hit"
          />
          {o.kind === 'rectangle' && o.frame && (
            <text x={o.x} y={o.y-10} className="frame-canvas-name" fill="var(--ui-accent)" fontSize={12}>
              {o.frame.name}
            </text>
          )}
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
