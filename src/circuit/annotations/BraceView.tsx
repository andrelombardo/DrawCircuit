import type { BraceAnnotation } from '../../model/types';
import { braceGeometry } from '../../annotations/brace';
import { MathText } from './MathText';

export function BraceView({
  object: o,
  zoom,
  labelSelected = false,
  hideLabel = false,
}: {
  object: BraceAnnotation;
  zoom: number;
  labelSelected?: boolean;
  hideLabel?: boolean;
}) {
  const g = braceGeometry(o);
  return (
    <g data-object={o.id} className="circuit-object">
      <path d={g.d} fill="none" stroke="transparent" strokeWidth={14 / zoom} />
      <path
        d={g.d}
        fill="none"
        opacity={o.opacity}
        stroke={o.color}
        strokeWidth={o.width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!hideLabel && (
        <MathText
          text={o.label.text}
          x={g.labelPoint.x}
          y={g.labelPoint.y}
          color={o.label.color}
          opacity={o.label.opacity}
          fontSize={o.label.fontSize}
          rotation={o.label.rotation}
          labelId={o.id}
          selected={labelSelected}
        />
      )}
    </g>
  );
}
