import { renderLatex } from '../math/latex';
import { layoutCircuitMath } from '../math/layout';
import { CIRCUIT_FONT } from '../model/fonts';
import { formatNumber as fmt } from './units';

export interface CanvasTextLayout {
  svg: string;
  alignWidth: number;
  bounds: { x: number; y: number; width: number; height: number };
}
const ns = 'http://www.w3.org/2000/svg';
/** Numeric entities keep user text inert inside the internal SVG image. */
export const xmlText = (value: string) =>
  Array.from(value, (c) => `&#${c.codePointAt(0)};`).join('');
const attribute = (value: string) =>
  value.replace(/[&<>"'{}%#\\^_~]/g, (c) => `&#${c.codePointAt(0)};`);

/** Measure an isolated copy using the canvas CSS and its bundled circuit font. */
export function canvasTextLayout(
  source: string,
  size: number,
  formula = false,
  plain = false,
): CanvasTextLayout | null {
  if (typeof document === 'undefined' || !document.body) return null;
  if (
    typeof SVGGraphicsElement === 'undefined' ||
    typeof SVGGraphicsElement.prototype.getBBox !== 'function'
  )
    return null;
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText =
    'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;z-index:-1;';
  document.body.append(host);
  try {
    const result = plain ? { kind: 'plain' as const } : renderLatex(source, formula);
    if (result.kind !== 'math') {
      const svg = document.createElementNS(ns, 'svg');
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('font-family', CIRCUIT_FONT);
      text.setAttribute('font-size', String(size));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.textContent = source;
      svg.append(text);
      host.append(svg);
      if (typeof text.getBBox !== 'function') return null;
      const b = text.getBBox();
      return {
        alignWidth: text.getComputedTextLength(),
        svg: `<text text-anchor="middle" dominant-baseline="middle" font-family="${attribute(CIRCUIT_FONT)}" font-size="${fmt(size)}">${xmlText(source)}</text>`,
        bounds: { x: b.x, y: b.y, width: b.width, height: b.height },
      };
    }
    host.className = 'math-label';
    const content = document.createElement('div');
    content.className = 'math-label-content';
    content.style.fontSize = `${size}px`;
    content.innerHTML = layoutCircuitMath(result.html, size);
    host.append(content);
    const root = content.querySelector('.katex-html');
    if (!root) return null;
    const box = content.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    // MathText positions its foreignObject using the integer offsetWidth/Height.
    const origin = { x: box.x + content.offsetWidth / 2, y: box.y + content.offsetHeight / 2 };
    const chunks: string[] = [];
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;
    // KaTeX color commands override the label color on individual glyphs/rules.
    // Leave uncolored content inheriting the export label's fill.
    const colorAttribute = (element: Element, fill = true) => {
      for (
        let current: Element | null = element;
        current && current !== content;
        current = current.parentElement
      ) {
        if ((current as HTMLElement | SVGElement).style?.color) {
          const color = attribute(getComputedStyle(current).color);
          return `${fill ? ` fill="${color}"` : ''} color="${color}"`;
        }
      }
      return '';
    };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let leaf: Node | null;
    while ((leaf = walker.nextNode())) {
      const value = leaf.textContent ?? '';
      if (!value || !value.replace(/[\s\u200b]/g, '')) continue;
      const parent = leaf.parentElement!;
      if (parent.closest('svg')) continue;
      const css = getComputedStyle(parent);
      const range = document.createRange();
      range.selectNodeContents(leaf);
      const rect = range.getBoundingClientRect();
      context.font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
      const metrics = context.measureText(value);
      const descent = metrics.fontBoundingBoxDescent;
      if (!Number.isFinite(descent)) return null;
      chunks.push(
        `<text x="${fmt(rect.x - origin.x)}" y="${fmt(rect.bottom - descent - origin.y)}" font-family="${attribute(css.fontFamily)}" font-size="${fmt(parseFloat(css.fontSize))}" font-style="${css.fontStyle}" font-weight="${css.fontWeight}"${colorAttribute(parent)}>${xmlText(value)}</text>`,
      );
    }
    // Fractions/overlines are CSS rules; radicals and extensible symbols are SVG paths.
    for (const element of root.querySelectorAll('*')) {
      if (element.closest('svg')) continue;
      const css = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      for (const edge of ['Top', 'Bottom', 'Left', 'Right'] as const) {
        const width = parseFloat(css[`border${edge}Width`]);
        const style = css[`border${edge}Style`];
        if (!(width > 0) || style === 'none') continue;
        const horizontal = edge === 'Top' || edge === 'Bottom';
        const x = (edge === 'Right' ? rect.right - width : rect.x) - origin.x;
        const y = (edge === 'Bottom' ? rect.bottom - width : rect.y) - origin.y;
        const length = horizontal ? rect.width : rect.height;
        // Both solid and dashed array separators/boxes must survive image copying.
        if (style === 'dashed' || style === 'dotted') {
          const offset = width / 2;
          const d = horizontal
            ? `M${fmt(x)} ${fmt(y + offset)}h${fmt(length)}`
            : `M${fmt(x + offset)} ${fmt(y)}v${fmt(length)}`;
          chunks.push(
            `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${fmt(width)}" stroke-dasharray="${fmt(width * (style === 'dotted' ? 1 : 3))} ${fmt(width * 2)}"${colorAttribute(element, false)}/>`
          );
        } else {
          chunks.push(
            `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(horizontal ? length : width)}" height="${fmt(horizontal ? width : length)}" rx="${fmt(parseFloat(css.borderRadius) ? width / 2 : 0)}"${colorAttribute(element)}/>`,
          );
        }
      }
    }
    for (const svg of root.querySelectorAll('svg')) {
      const rect = svg.getBoundingClientRect();
      let left = rect.left,
        right = rect.right,
        top = rect.top,
        bottom = rect.bottom;
      // KaTeX clips 400em arrow/brace tails inside narrow spans. Preserve that
      // viewport so a long tail cannot spill into neighbouring labels in SVG/PNG.
      for (
        let parent = svg.parentElement;
        parent && parent !== content;
        parent = parent.parentElement
      ) {
        const css = getComputedStyle(parent);
        const box = parent.getBoundingClientRect();
        if (css.overflowX === 'hidden') {
          left = Math.max(left, box.left);
          right = Math.min(right, box.right);
        }
        if (css.overflowY === 'hidden') {
          top = Math.max(top, box.top);
          bottom = Math.min(bottom, box.bottom);
        }
      }
      if (right <= left || bottom <= top) continue;
      // Only KaTeX-authored, allowlisted geometry/paint is copied, including
      // cancellation lines. Never copy user HTML, links, scripts or event handlers.
      const paths = [...svg.querySelectorAll('path, line')]
        .map((p) => {
          const attrs = [
            'd', 'x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width',
            'stroke-linecap', 'stroke-linejoin', 'paint-order',
          ];
          const geometry = attrs
            .filter((name) => p.hasAttribute(name))
            .map((name) => ` ${name}="${attribute(p.getAttribute(name)!)}"`).join('');
          return `<${p.localName}${p.localName === 'line' && !p.hasAttribute('stroke') ? ' stroke="currentColor"' : ''}${geometry}${colorAttribute(p)}/>`;
        })
        .join('');
      const viewBox = svg.getAttribute('viewBox');
      chunks.push(
        `<svg x="${fmt(left - origin.x)}" y="${fmt(top - origin.y)}" width="${fmt(right - left)}" height="${fmt(bottom - top)}" overflow="hidden"><svg x="${fmt(rect.x - left)}" y="${fmt(rect.y - top)}" width="${fmt(rect.width)}" height="${fmt(rect.height)}" font-size="${fmt(parseFloat(getComputedStyle(svg).fontSize))}"${viewBox ? ` viewBox="${attribute(viewBox)}"` : ''} preserveAspectRatio="${attribute(svg.getAttribute('preserveAspectRatio') ?? 'xMidYMid meet')}">${paths}</svg></svg>`,
      );
    }
    return {
      alignWidth: content.offsetWidth,
      svg: chunks.join(''),
      bounds: { x: box.x - origin.x, y: box.y - origin.y, width: box.width, height: box.height },
    };
  } finally {
    host.remove();
  }
}
