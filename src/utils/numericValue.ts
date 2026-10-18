export interface NumericLimits {
  min: number;
  max: number;
  exclusiveMin?: boolean;
  step?: number;
  unit?: string;
}

/** Accept decimal commas and pasted units, but never coerce empty or malformed input to zero. */
export function numericValue(
  raw: string,
  limits: NumericLimits,
): { value: number; error?: never } | { error: 'number' | 'range' | 'step'; value?: never } {
  let text = raw.trim();
  if (limits.unit && text.toLowerCase().endsWith(limits.unit.toLowerCase()))
    text = text.slice(0, -limits.unit.length).trim();
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i.test(text)) return { error: 'number' };
  let value = Number(text.replace(',', '.'));
  if (!Number.isFinite(value)) return { error: 'number' };
  if ((limits.exclusiveMin ? value <= limits.min : value < limits.min) || value > limits.max)
    return { error: 'range' };
  if (limits.step) {
    const steps = (value - limits.min) / limits.step;
    if (Math.abs(steps - Math.round(steps)) > 1e-9) return { error: 'step' };
    // Persist the exact allowed step, never a nearly equal unsupported rotation.
    value = limits.min + Math.round(steps) * limits.step;
  }
  return { value };
}
