import { canvasTextLayout, type CanvasTextLayout } from '../tikz/canvasText';

const cache = new Map<string, CanvasTextLayout>();

/** WebKit misplaces KaTeX's positioned HTML inside transformed foreignObjects.
 * Reuse the vector export layout so native labels follow SVG zoom and rotation.
 * Font readiness is part of the key; dragging never triggers new measurements. */
export function vectorMathLayout(source: string, size: number): CanvasTextLayout | null {
  const key = `${document.fonts?.status}:${size}:${source}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const layout = canvasTextLayout(source, size);
  if (layout) {
    if (cache.size >= 256) cache.delete(cache.keys().next().value!);
    cache.set(key, layout);
  }
  return layout;
}
