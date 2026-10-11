import type { StrokeStyle } from '../model/types';
/** Dash lengths scale with geometry, like stroke width, in every renderer. */
export function dashPattern(style: StrokeStyle, width: number): number[] | undefined {
  if (style.lineStyle === 'dashed')
    return [style.dashLength ?? width * 4, style.dashGap ?? width * 2];
  if (style.lineStyle === 'dotted') return [0, style.dashGap ?? width * 3];
  return undefined;
}
export function validStroke(style: StrokeStyle): boolean {
  return (
    (style.lineStyle === undefined || ['solid', 'dashed', 'dotted'].includes(style.lineStyle)) &&
    [style.dashLength, style.dashGap].every(
      (v) => v === undefined || (Number.isFinite(v) && v > 0 && v <= 1000),
    )
  );
}
