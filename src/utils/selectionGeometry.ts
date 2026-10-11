import type { CircuitDocument, CircuitObject, Point } from '../model/types';
import { measurementBounds } from './measurementGeometry';
import { unionBounds } from './visualBounds';
import { moveSelection } from './operations';
export type Axis = 'x' | 'y';
export type DistributionMode = 'centers' | 'gaps';
export type Alignment = 'start' | 'center' | 'end';
export function objectCenter(o: CircuitObject, doc: CircuitDocument): Point {
  if (o.kind === 'component' || o.kind === 'junction') return { x: o.x, y: o.y };
  const b = measurementBounds(o, doc);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
function entries(doc: CircuitDocument, ids: string[]) {
  const selected = new Set(ids);
  return doc.objects
    .filter((o) => selected.has(o.id))
    .map((o) => ({ o, b: measurementBounds(o, doc), c: objectCenter(o, doc) }));
}
/** Reuse topology-aware moves; no connection is created by a geometric command. */
function applyMoves(doc: CircuitDocument, moves: Map<string, Point>) {
  let result = doc;
  for (const [id, delta] of moves)
    if (delta.x || delta.y) result = moveSelection(result, [id], delta);
  return result;
}
export function positionSelection(doc: CircuitDocument, ids: string[], axis: Axis, value: number) {
  if (!Number.isFinite(value)) return doc;
  const selected = entries(doc, ids);
  if (!selected.length) return doc;
  const current =
    selected.length === 1
      ? 'x' in selected[0].o
        ? selected[0].o[axis]
        : selected[0].c[axis]
      : unionBounds(selected.map((e) => e.b))[axis];
  return current === value
    ? doc
    : moveSelection(doc, ids, {
        x: axis === 'x' ? value - current : 0,
        y: axis === 'y' ? value - current : 0,
      });
}
export function alignSelection(
  doc: CircuitDocument,
  ids: string[],
  axis: Axis,
  alignment: Alignment,
) {
  const selected = entries(doc, ids);
  if (selected.length < 2 || !['start', 'center', 'end'].includes(alignment)) return doc;
  const size = axis === 'x' ? 'width' : 'height';
  const bounds = unionBounds(selected.map((e) => e.b));
  const target =
    alignment === 'start'
      ? bounds[axis]
      : alignment === 'end'
        ? bounds[axis] + bounds[size]
        : bounds[axis] + bounds[size] / 2;
  return applyMoves(
    doc,
    new Map(
      selected.map((e) => {
        const from =
          alignment === 'start'
            ? e.b[axis]
            : alignment === 'end'
              ? e.b[axis] + e.b[size]
              : e.c[axis];
        return [
          e.o.id,
          { x: axis === 'x' ? target - from : 0, y: axis === 'y' ? target - from : 0 },
        ];
      }),
    ),
  );
}
/** Automatic distribution fixes outer centers/edges. Exact spacing fixes the first object. */
export function distributeSelection(
  doc: CircuitDocument,
  ids: string[],
  axis: Axis,
  mode: DistributionMode = 'centers',
  spacing?: number,
) {
  const selected = entries(doc, ids).sort(
    (a, b) =>
      (mode === 'gaps' ? a.b[axis] - b.b[axis] : a.c[axis] - b.c[axis]) ||
      a.o.id.localeCompare(b.o.id),
  );
  if (
    selected.length < (spacing === undefined ? 3 : 2) ||
    (spacing !== undefined && (!Number.isFinite(spacing) || spacing < 0))
  )
    return doc;
  const size = axis === 'x' ? 'width' : 'height',
    first = selected[0],
    last = selected.at(-1)!;
  const step =
    spacing ??
    (mode === 'centers'
      ? (last.c[axis] - first.c[axis]) / (selected.length - 1)
      : (last.b[axis] +
          last.b[size] -
          first.b[axis] -
          selected.reduce((sum, e) => sum + e.b[size], 0)) /
        (selected.length - 1));
  let cursor = mode === 'centers' ? first.c[axis] : first.b[axis];
  const moves = new Map<string, Point>();
  selected.forEach((e, i) => {
    const delta =
      i === 0 || (spacing === undefined && i === selected.length - 1)
        ? 0
        : cursor - (mode === 'centers' ? e.c[axis] : e.b[axis]);
    moves.set(e.o.id, { x: axis === 'x' ? delta : 0, y: axis === 'y' ? delta : 0 });
    cursor += step + (mode === 'gaps' ? e.b[size] : 0);
  });
  return applyMoves(doc, moves);
}
