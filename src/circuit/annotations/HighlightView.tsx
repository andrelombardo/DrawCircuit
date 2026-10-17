import type { CircuitDocument, Highlight } from '../../model/types';
import { highlightPath, highlightStrokeWidth } from '../../annotations/highlight';
export function HighlightView({
  object,
  doc,
  interactive = true,
}: {
  object: Highlight;
  doc: CircuitDocument;
  interactive?: boolean;
}) {
  return (
    <path
      data-object={object.id}
      className="circuit-object highlight-stroke"
      d={highlightPath(object, doc)}
      fill="none"
      stroke={object.color}
      opacity={object.opacity}
      strokeWidth={highlightStrokeWidth(object, doc)}
      strokeLinecap="round"
      strokeLinejoin="round"
      pointerEvents={interactive ? 'stroke' : 'none'}
    />
  );
}
