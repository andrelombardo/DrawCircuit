import type { CircuitDocument, Highlight } from '../../model/types';
import { highlightDrawing } from '../../annotations/highlight';
export function HighlightView({
  object,
  doc,
  interactive = true,
  grouped = false,
}: {
  object: Highlight;
  doc: CircuitDocument;
  interactive?: boolean;
  grouped?: boolean;
}) {
  return (
    <g
      data-object={object.id}
      className="circuit-object highlight-stroke"
      fill="none"
      stroke={object.color}
      opacity={grouped ? undefined : object.opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {highlightDrawing(object, doc).map((stroke, i) => (
        <path
          key={i}
          d={stroke.d}
          strokeWidth={stroke.width}
          pointerEvents={interactive ? 'stroke' : 'none'}
        />
      ))}
    </g>
  );
}
