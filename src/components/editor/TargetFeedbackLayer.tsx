import { memo, useMemo } from 'react';
import type { CircuitDocument, Point } from '../../model/types';
import { localToWorld, linePath, pointsPath, wirePoints } from '../../utils/geometry';
import { visualBounds } from '../../utils/visualBounds';
export const TargetFeedbackLayer = memo(function TargetFeedbackLayer({
  doc,
  componentId,
  wireId,
  firstPoint,
  zoom,
}: {
  doc: CircuitDocument;
  componentId: string | null;
  wireId: string | null;
  firstPoint: Point | null;
  zoom: number;
}) {
  const objects = useMemo(() => new Map(doc.objects.map((o) => [o.id, o])), [doc]);
  const c = componentId ? objects.get(componentId) : null;
  const w = wireId ? objects.get(wireId) : null;
  return (
    <g data-layer="tool-targets" pointerEvents="none" aria-hidden="true">
      {c?.kind === 'component' && (
        <g data-polarity-hover={c.id}>
          <rect
            {...visualBounds(c, doc)}
            rx={4 / zoom}
            fill="#2463cb"
            fillOpacity={0.04}
            stroke="#2463cb"
            strokeOpacity={0.55}
            strokeWidth={1 / zoom}
          />
          {c.terminals.map((t) => {
            const p = localToWorld(c, { x: t.localX, y: t.localY });
            return (
              <circle
                key={t.id}
                cx={p.x}
                cy={p.y}
                r={4 / zoom}
                fill="white"
                stroke="#2463cb"
                strokeWidth={1 / zoom}
              />
            );
          })}
        </g>
      )}
      {(w?.kind === 'wire' || w?.kind === 'line') && (
        <path
          data-current-hover={w.id}
          d={w.kind === 'line' ? linePath(w, doc) : pointsPath(wirePoints(w, doc))}
          fill="none"
          stroke="#2463cb"
          strokeWidth={6 / zoom}
          opacity={0.25}
        />
      )}
      {firstPoint && (
        <g data-voltage-first="true">
          <circle
            cx={firstPoint.x}
            cy={firstPoint.y}
            r={7 / zoom}
            fill="white"
            stroke="#2463cb"
            strokeWidth={1.5 / zoom}
          />
          <circle cx={firstPoint.x} cy={firstPoint.y} r={2.5 / zoom} fill="#2463cb" />
          <text
            x={firstPoint.x + 11 / zoom}
            y={firstPoint.y - 10 / zoom}
            fontSize={11 / zoom}
            className="tool-point-label"
          >
            A
          </text>
        </g>
      )}
    </g>
  );
});
