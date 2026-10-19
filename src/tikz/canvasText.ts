import { renderLatex } from '../math/latex';
import { primeGlyphPaths } from '../math/primeGlyph';
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
    content.innerHTML = result.html;
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
    const colorAttribute = (element: Element) => {
      for (
        let current: Element | null = element;
        current && current !== content;
        current = current.parentElement
      ) {
        if ((current as HTMLElement | SVGElement).style?.color)
          return ` fill="${attribute(getComputedStyle(current).color)}"`;
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
      if (parent.classList.contains('math-prime')) {
        const size = parseFloat(css.fontSize);
        const bold = Number(css.fontWeight) >= 600 || css.fontWeight === 'bold';
        chunks.push(
          `<g data-math-prime="${value.length}" transform="translate(${fmt(rect.x - origin.x)} ${fmt(rect.bottom - descent - origin.y)}) scale(${size / 1000})"${colorAttribute(parent)}>${primeGlyphPaths(value.length, bold)}</g>`,
        );
        continue;
      }
      chunks.push(
        `<text x="${fmt(rect.x - origin.x)}" y="${fmt(rect.bottom - descent - origin.y)}" font-family="${attribute(css.fontFamily)}" font-size="${fmt(parseFloat(css.fontSize))}" font-style="${css.fontStyle}" font-weight="${css.fontWeight}"${colorAttribute(parent)}>${xmlText(value)}</text>`,
      );
    }
    // Fractions/overlines are CSS rules; radicals and extensible symbols are SVG paths.
    for (const element of root.querySelectorAll('*')) {
      if (element.closest('svg')) continue;
      const css = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      for (const edge of ['Top', 'Bottom'] as const) {
        const width = parseFloat(css[`border${edge}Width`]);
        if (width > 0 && css[`border${edge}Style`] !== 'none')
          chunks.push(
            `<rect x="${fmt(rect.x - origin.x)}" y="${fmt((edge === 'Top' ? rect.y : rect.bottom - width) - origin.y)}" width="${fmt(rect.width)}" height="${fmt(width)}"${element.classList.contains('frac-line') ? ` rx="${fmt(width / 2)}"` : ''}${colorAttribute(element)}/>`,
          );
      }
    }
    for (const svg of root.querySelectorAll('svg')) {
      const rect = svg.getBoundingClientRect();
      // Only KaTeX-authored path geometry is copied; never user HTML, links or scripts.
      const paths = [...svg.querySelectorAll('path')]
        .map((p) => `<path d="${attribute(p.getAttribute('d') ?? '')}"${colorAttribute(p)}/>`)
        .join('');
      chunks.push(
        `<svg x="${fmt(rect.x - origin.x)}" y="${fmt(rect.y - origin.y)}" width="${fmt(rect.width)}" height="${fmt(rect.height)}" viewBox="${attribute(svg.getAttribute('viewBox') ?? '')}" preserveAspectRatio="${attribute(svg.getAttribute('preserveAspectRatio') ?? 'xMidYMid meet')}">${paths}</svg>`,
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
