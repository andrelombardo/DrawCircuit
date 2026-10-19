interface InkBounds {
  top: number;
  bottom: number;
}

/** Measure visible ink rather than the line boxes inherited from KaTeX's fonts. */
function inkBounds(root: Element, context: CanvasRenderingContext2D): InkBounds | null {
  let top = Infinity;
  let bottom = -Infinity;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let leaf: Node | null;
  while ((leaf = walker.nextNode())) {
    const text = leaf.textContent ?? '';
    if (!text.replace(/[\s\u200b]/gu, '') || leaf.parentElement?.closest('svg')) continue;
    const css = getComputedStyle(leaf.parentElement!);
    context.font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
    const metrics = context.measureText(text);
    if (!Number.isFinite(metrics.fontBoundingBoxDescent)) return null;
    const range = document.createRange();
    range.selectNodeContents(leaf);
    const baseline = range.getBoundingClientRect().bottom - metrics.fontBoundingBoxDescent;
    top = Math.min(top, baseline - metrics.actualBoundingBoxAscent);
    bottom = Math.max(bottom, baseline + metrics.actualBoundingBoxDescent);
  }
  for (const drawing of root.querySelectorAll(
    'svg, .frac-line, .overline-line, .underline-line, .katex-rule',
  )) {
    const box = drawing.getBoundingClientRect();
    top = Math.min(top, box.top);
    bottom = Math.max(bottom, box.bottom);
  }
  return Number.isFinite(top) && Number.isFinite(bottom) ? { top, bottom } : null;
}

const cache = new Map<string, string>();

/** Keep fraction gaps balanced with the bundled circuit font. Measure outside
 * the SVG so camera zoom and label rotation cannot change the result. Editor
 * and image export consume the same adjusted HTML; stored TeX stays intact. */
export function layoutCircuitMath(html: string, fontSize: number): string {
  if (!html.includes('class="mfrac"') || typeof document === 'undefined' || !document.body)
    return html;
  const key = `${fontSize}:${html}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const host = document.createElement('div');
  host.className = 'math-label';
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;';
  const content = document.createElement('div');
  content.className = 'math-label-content';
  content.style.fontSize = `${fontSize}px`;
  content.innerHTML = html;
  host.append(content);
  document.body.append(host);
  try {
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return html;
    // Inner numerators move first so their parents measure the final ink bounds.
    for (const fraction of [...content.querySelectorAll('.mfrac')].reverse()) {
      const stack = fraction.querySelector(':scope > .vlist-t > .vlist-r > .vlist');
      const parts = [...(stack?.children ?? [])] as HTMLElement[];
      const ruleIndex = parts.findIndex((part) => part.querySelector(':scope > .frac-line'));
      const numerator = parts[ruleIndex + 1];
      const denominator = parts[ruleIndex - 1];
      const rule = parts[ruleIndex]?.querySelector('.frac-line');
      if (!numerator || !denominator || !rule) continue;
      const above = inkBounds(numerator, context);
      const below = inkBounds(denominator, context);
      if (!above || !below) continue;
      const bar = rule.getBoundingClientRect();
      const em = parseFloat(getComputedStyle(rule).fontSize);
      const gap = Math.max(em * 0.1, Math.min(em * 0.18, below.top - bar.bottom));
      const shift = bar.top - above.bottom - gap;
      if (shift > 0.01)
        numerator.style.top = `${parseFloat(getComputedStyle(numerator).top) + shift}px`;
    }
    const result = content.innerHTML;
    if (document.fonts?.status === 'loaded') {
      if (cache.size >= 128) cache.delete(cache.keys().next().value!);
      cache.set(key, result);
    }
    return result;
  } finally {
    host.remove();
  }
}
