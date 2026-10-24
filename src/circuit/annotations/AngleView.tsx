import type { AngleAnnotation } from '../../model/types';
import { angleGeometry } from '../../annotations/angle';
import { dashPattern } from '../../utils/strokeStyle';
import { MathText } from './MathText';

export function AngleView({ object: o, zoom, hideLabel = false }: {
  object: AngleAnnotation; zoom: number; hideLabel?: boolean;
}) {
  const g = angleGeometry(o);
  return <g data-object={o.id} className="circuit-object">
    <path className="object-hit" d={g.d} fill="none" stroke="transparent" strokeWidth={14 / zoom} />
    <path d={g.d} fill="none" stroke={o.color} opacity={o.opacity} strokeWidth={o.width}
      strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashPattern(o, o.width)?.join(' ')} />
    {!hideLabel && <MathText text={o.label.text} x={g.labelPoint.x} y={g.labelPoint.y}
      color={o.label.color} opacity={o.label.opacity} fontSize={o.label.fontSize}
      rotation={o.label.rotation} labelId={o.id} />}
  </g>;
}
