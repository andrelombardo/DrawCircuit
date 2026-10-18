import { symbolText } from '../../model/symbolGeometry';
import type { ComponentType } from '../../model/types';
import { componentRegistry } from '../../model/catalog';
import { CIRCUIT_FONT } from '../../model/fonts';
export function Symbol({
  type,
  color = '#171a20',
  width = 2,
  bodyText,
}: {
  type: ComponentType;
  color?: string;
  width?: number;
  bodyText?: string;
}) {
  return (
    <g stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {componentRegistry[type].shapes.map((shape, i) => {
        if (shape.kind === 'path')
          return (
            <path
              key={i}
              d={shape.d}
              fill={shape.fill ?? 'none'}
              strokeDasharray={shape.dashed ? '4 4' : undefined}
            />
          );
        if (shape.kind === 'circle')
          return (
            <circle key={i} cx={shape.x} cy={shape.y} r={shape.r}
              fill={shape.fill === 'currentColor' ? color : (shape.fill ?? 'none')} />
          );
        if (shape.kind === 'rect')
          return (
            <rect
              key={i}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              fill={shape.fill ?? 'none'}
            />
          );
        const { value, size } = symbolText(shape, bodyText);
        return (
          <text
            key={i}
            x={shape.x}
            y={shape.y}
            dominantBaseline="middle"
            textAnchor="middle"
            stroke="none"
            fill={color}
            style={{
              fontFamily: CIRCUIT_FONT,
            }}
            fontSize={size}
          >
            {value}
          </text>
        );
      })}
    </g>
  );
}
