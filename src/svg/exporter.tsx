import { highlightDrawing, highlightPaintGroups } from '../annotations/highlight';
import { dashPattern } from '../utils/strokeStyle';
import type { StrokeStyle } from '../model/types';
import { drawingWireGaps, translucentCrossing } from '../utils/wireRendering';
import { braceGeometry } from '../annotations/brace';
import { componentRegistry } from '../model/catalog';
import { symbolText } from '../model/symbolGeometry';
import { bridgePaths, wireCrossings } from '../utils/crossings';
import type { CircuitDocument, Point, Rotation } from '../model/types';
import { canvasTextLayout, xmlText } from '../tikz/canvasText';
import { isExportableObject } from '../tikz/validation';
import { canvasArrowHead } from '../tikz/arrowheads';
import { arrowPath, pointsPath, wirePoints } from '../utils/geometry';
import { loopPath } from '../utils/loops';
import { visualBounds, unionBounds } from '../utils/visualBounds';
import type { Bounds } from '../utils/visualBounds';
import { electricalDrawingGeometry, wireDrawingPaths } from '../annotations/electrical';
import { CIRCUIT_FONT } from '../model/fonts';
import { EMBEDDED_CIRCUIT_FONTS } from '../fonts/embedded';
import { formatNumber as f } from '../tikz/units';
const attr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Pure vector content. Browser-measured KaTeX becomes SVG text, rules and paths, never foreignObject. */
export function exportSVG(
  source: CircuitDocument,
  options: { transparent?: boolean } = {},
): string {
  const seen = new Set<string>();
  const doc = {
    ...source,
    objects: source.objects.filter((o) => {
      if (seen.has(o.id) || !isExportableObject(o)) return false;
      seen.add(o.id);
      return true;
    }),
  };
  const boxes: Bounds[] = [],
    parts: string[] = [],
    labels: string[] = [];
  const text = (
    value: string,
    p: Point,
    color: string,
    size: number,
    rotation: Rotation = 0,
    align: 'start' | 'middle' | 'end' = 'middle',
    opacity = 1,
  ) => {
    if (!value.trim()) return '';
    return value
      .split('\n')
      .map((line, i) => {
        const layout = canvasTextLayout(line, size);
        const b = layout?.bounds ?? {
          x: -Math.max(size, line.length * size * 0.6) / 2,
          y: -size / 2,
          width: Math.max(size, line.length * size * 0.6),
          height: size * 1.6,
        };
        const shift =
          align === 'start'
            ? (layout?.alignWidth ?? b.width) / 2
            : align === 'end'
              ? -(layout?.alignWidth ?? b.width) / 2
              : 0;
        const angle = (rotation * Math.PI) / 180,
          y = i * size * 1.35;
        const corners = [
          { x: b.x + shift, y: b.y + y },
          { x: b.x + b.width + shift, y: b.y + y },
          { x: b.x + shift, y: b.y + b.height + y },
          { x: b.x + b.width + shift, y: b.y + b.height + y },
        ].map((q) => ({
          x: p.x + q.x * Math.cos(angle) - q.y * Math.sin(angle),
          y: p.y + q.x * Math.sin(angle) + q.y * Math.cos(angle),
          width: 0,
          height: 0,
        }));
        boxes.push(unionBounds(corners));
        const content =
          layout?.svg ??
          `<text text-anchor="middle" dominant-baseline="middle" font-family="${attr(CIRCUIT_FONT)}" font-size="${f(size)}">${xmlText(line)}</text>`;
        return `<g opacity="${f(opacity)}" transform="translate(${f(p.x)} ${f(p.y)}) rotate(${rotation})" fill="${color}"><g transform="translate(${f(shift)} ${f(y)})">${content}</g></g>`;
      })
      .join('');
  };
  const path = (d: string, color: string, width: number, cap = 'round', style: StrokeStyle = {}) =>
    `<path d="${attr(d)}" fill="none" stroke="${color}" stroke-width="${f(width)}" stroke-linecap="${cap}" stroke-linejoin="round"${dashPattern(style, width) ? ` stroke-dasharray="${dashPattern(style, width)!.map(f).join(' ')}"` : ''}/>`;
  for (const group of highlightPaintGroups(doc)) {
    const content = group
      .map((object) => {
        boxes.push(visualBounds(object, doc));
        return highlightDrawing(object, doc)
          .map((stroke) => path(stroke.d, object.color, stroke.width))
          .join('');
      })
      .join('');
    if (content) parts.push(`<g opacity="${f(group[0].opacity)}">${content}</g>`);
  }
  for (const o of doc.objects) {
    if (o.kind === 'rectangle') {
      boxes.push({
        x: o.x - o.strokeWidth / 2,
        y: o.y - o.strokeWidth / 2,
        width: o.width + o.strokeWidth,
        height: o.height + o.strokeWidth,
      });
      const rect = `x="${f(o.x)}" y="${f(o.y)}" width="${f(o.width)}" height="${f(o.height)}"`;
      if (o.fill !== 'none')
        parts.push(`<rect ${rect} fill="${o.fill}" fill-opacity="${f(o.fillOpacity ?? 1)}"/>`);
      parts.push(
        `<rect ${rect} fill="none" stroke="${o.color}" stroke-width="${f(o.strokeWidth)}" opacity="${f(o.opacity ?? 1)}" stroke-linejoin="round"${dashPattern(o, o.strokeWidth) ? ` stroke-dasharray="${dashPattern(o, o.strokeWidth)!.map(f).join(' ')}"` : ''} stroke-linecap="round"/>`,
      );
    } else if (o.kind === 'line') {
      boxes.push(visualBounds(o, doc));
      parts.push(
        `<g opacity="${f(o.opacity ?? 1)}">${path(pointsPath([o.start, o.end]), o.color, o.width, 'round', o)}</g>`,
      );
    }
  }
  const currentGaps = drawingWireGaps(doc, options.transparent);
  for (const o of doc.objects.filter((o) => o.kind === 'wire')) {
    try {
      const paths = wireDrawingPaths(wirePoints(o, doc), currentGaps.get(o.id));
      parts.push(
        `<g opacity="${f(o.opacity ?? 1)}">${path(paths.map(pointsPath).join(' '), o.color, o.width, 'round', o)}</g>`,
      );
      boxes.push(visualBounds(o, doc));
    } catch {
      /* Skip a dangling invalid wire like TikZ does. */
    }
  }
  for (const c of wireCrossings(doc)) {
    const p = bridgePaths(c),
      w = Math.max(c.horizontal.width, c.vertical.width) + 4;
    if (options.transparent || translucentCrossing(c)) {
      parts.push(
        `<g opacity="${f(p.overWire.opacity ?? 1)}">${path(p.arc, p.overWire.color, p.overWire.width, 'round', p.overWire)}</g>`,
      );
      continue;
    }
    parts.push(
      path(p.gap, 'white', w),
      path(p.under, p.underWire.color, p.underWire.width, 'round', p.underWire),
      path(p.arc, 'white', w),
      path(p.arc, p.overWire.color, p.overWire.width, 'round', p.overWire),
    );
  }
  for (const o of doc.objects.filter(
    (o) =>
      o.kind !== 'highlight' && o.kind !== 'wire' && o.kind !== 'rectangle' && o.kind !== 'line',
  )) {
    const firstPart = parts.length;
    if (o.kind !== 'text' && o.kind !== 'electrical') boxes.push(visualBounds(o, doc));
    if (o.kind === 'component') {
      const shapes = componentRegistry[o.type].shapes
        .map((shape) => {
          if (shape.kind === 'path')
            return `<path d="${attr(shape.d)}" fill="${shape.fill ?? 'none'}"${shape.fixedOrientation ? ` transform="rotate(${-o.rotation})"` : ''}${shape.dashed ? ' stroke-dasharray="4 4"' : ''}/>`;
          if (shape.kind === 'circle')
            return `<circle cx="${shape.x}" cy="${shape.y}" r="${shape.r}" fill="${shape.fill === 'currentColor' ? o.color : (shape.fill ?? 'none')}"/>`;
          if (shape.kind === 'rect')
            return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill ?? 'none'}"/>`;
          const { value, size } = symbolText(shape, o.bodyText);
          return `<text x="${shape.x}" y="${shape.y}" dominant-baseline="middle" text-anchor="middle" stroke="none" fill="${o.color}" font-family="${attr(CIRCUIT_FONT)}" font-size="${size}">${xmlText(value)}</text>`;
        })
        .join('');
      parts.push(
        `<g transform="translate(${f(o.x)} ${f(o.y)}) rotate(${o.rotation})" stroke="${o.color}" stroke-width="${f(o.width)}" fill="none" stroke-linecap="round" stroke-linejoin="round">${shapes}</g>`,
      );
      labels.push(
        text(
          o.label.text,
          { x: o.x + o.label.offset.x, y: o.y + o.label.offset.y },
          o.label.color,
          o.label.fontSize,
          o.label.rotation,
          'middle',
          o.label.opacity,
        ),
      );
    } else if (o.kind === 'junction') {
      parts.push(`<circle cx="${f(o.x)}" cy="${f(o.y)}" r="4.5" fill="${o.color}"/>`);
      labels.push(
        text(
          o.label.text,
          { x: o.x + o.label.offset.x, y: o.y + o.label.offset.y },
          o.label.color,
          o.label.fontSize,
          o.label.rotation,
          'middle',
          o.label.opacity,
        ),
      );
    } else if (o.kind === 'text')
      labels.push(text(o.text, o, o.color, o.fontSize, o.rotation, o.align, o.opacity));
    else if (o.kind === 'arrow' || o.kind === 'loop-arrow') {
      const width = o.kind === 'arrow' ? o.width : o.strokeWidth;
      boxes.push(
        unionBounds(
          canvasArrowHead(o).map((p) => ({
            x: p.x - width / 2,
            y: p.y - width / 2,
            width,
            height: width,
          })),
        ),
      );
      parts.push(
        path(o.kind === 'arrow' ? arrowPath(o) : loopPath(o), o.color, width),
        path(pointsPath(canvasArrowHead(o)), o.color, width),
      );
    } else if (o.kind === 'brace') {
      const g = braceGeometry(o);
      parts.push(path(g.d, o.color, o.width));
      labels.push(
        text(
          o.label.text,
          g.labelPoint,
          o.label.color,
          o.label.fontSize,
          o.label.rotation,
          'middle',
          o.label.opacity,
        ),
      );
    } else if (o.kind === 'electrical') {
      const g = electricalDrawingGeometry(o, doc);
      boxes.push({
        x: Math.min(g.start.x, g.end.x) - o.width / 2,
        y: Math.min(g.start.y, g.end.y) - o.width / 2,
        width: Math.abs(g.end.x - g.start.x) + o.width,
        height: Math.abs(g.end.y - g.start.y) + o.width,
      });
      if (o.mode === 'polarity')
        parts.push(
          text(o.reversed ? '−' : '+', g.start, o.color, 22),
          text(o.reversed ? '+' : '−', g.end, o.color, 22),
        );
      else {
        const head = g.head;
        boxes.push(
          unionBounds(
            head.map((p) => ({
              x: p.x - g.strokeWidth / 2,
              y: p.y - g.strokeWidth / 2,
              width: g.strokeWidth,
              height: g.strokeWidth,
            })),
          ),
        );
        parts.push(path(pointsPath([g.start, g.end]), o.color, g.strokeWidth));
        parts.push(path(pointsPath(head), o.color, g.strokeWidth));
      }
      labels.push(
        text(
          o.label.text,
          g.labelPoint,
          o.label.color,
          g.labelFontSize,
          o.label.rotation,
          'middle',
          o.label.opacity,
        ),
      );
    }
    if (parts.length > firstPart && o.opacity !== undefined)
      parts.splice(
        firstPart,
        parts.length - firstPart,
        `<g opacity="${f(o.opacity)}">${parts.slice(firstPart).join('')}</g>`,
      );
  }

  const bounds = unionBounds(boxes),
    padding = 12;
  const x = bounds.x - padding,
    y = bounds.y - padding,
    width = Math.max(24, bounds.width + padding * 2),
    height = Math.max(24, bounds.height + padding * 2);
  const background = options.transparent
    ? ''
    : `<rect x="${f(x)}" y="${f(y)}" width="${f(width)}" height="${f(height)}" fill="white"/>`;
  const content = parts.join('') + labels.join('');
  const fonts = content.includes('Comic Relief') ? EMBEDDED_CIRCUIT_FONTS : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(x)} ${f(y)} ${f(width)} ${f(height)}" width="${f(width)}" height="${f(height)}"><title>${xmlText(doc.title)}</title>${fonts}${background}${content}</svg>`;
}
