import { angleGeometry } from '../annotations/angle';
import { highlightDrawing, highlightPaintGroups } from '../annotations/highlight';
import { objectBorders, objectFills, paintVariants, parentFrame, shapeFills, shapeBorders } from '../model/shapeAppearance';
import { shapeBorderWidth, shapeBounds, shapePath, shapeTransform } from '../utils/shapes';
import { dashPattern } from '../utils/strokeStyle';
import type { StrokeStyle } from '../model/types';
import { drawingWireGaps, translucentCrossing } from '../utils/wireRendering';
import { braceGeometry } from '../annotations/brace';
import { componentRegistry } from '../model/catalog';
import { symbolText } from '../model/symbolGeometry';
import { bridgePaths, wireCrossings } from '../utils/crossings';
import type { CircuitDocument, CircuitObject, Point, Rotation } from '../model/types';
import { canvasTextLayout, xmlText } from '../tikz/canvasText';
import { isExportableObject } from '../tikz/validation';
import { canvasArrowHead, canvasArrowHeadPath, lineArrowHeadPath } from '../tikz/arrowheads';
import { arrowPath, pointsPath, linePath, wirePoints } from '../utils/geometry';
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
  const bodyById = new Map<string, string>(), labelById = new Map<string, string>(), bridgesById = new Map<string, string>();
  const capture = (id: string, firstPart: number, firstLabel = labels.length) => {
    if (parts.length > firstPart) bodyById.set(id, parts.splice(firstPart).join(''));
    if (labels.length > firstLabel) labelById.set(id, labels.splice(firstLabel).join(''));
  };
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
        return `<g opacity="${f(opacity)}" transform="translate(${f(p.x)} ${f(p.y)}) rotate(${rotation})" fill="${color}" color="${color}"><g transform="translate(${f(shift)} ${f(y)})">${content}</g></g>`;
      })
      .join('');
  };
  const path = (
    d: string,
    color: string,
    width: number,
    cap = 'round',
    style: StrokeStyle = {},
    fill = 'none',
  ) =>
    `<path d="${attr(d)}" fill="${fill}" stroke="${color}" stroke-width="${f(width)}" stroke-linecap="${cap}" stroke-linejoin="round"${dashPattern(style, width) ? ` stroke-dasharray="${dashPattern(style, width)!.map(f).join(' ')}"` : ''}/>`;
  const paintMarkup = (o: CircuitObject, content: string): string => {
    const variants = paintVariants(o), borders = [...objectBorders(o)].reverse().filter((p) => p.enabled);
    const painted = variants === null ? `<g opacity="${f(o.opacity ?? 1)}">${content}</g>` : variants.map((variant, i) => {
      const width = 'strokeWidth' in variant ? variant.strokeWidth : 'width' in variant ? variant.width : undefined;
      let markup = content.replaceAll(o.color, variant.color);
      if (width !== undefined) markup = markup.replace(/stroke-width="[^"]*"/g, `stroke-width="${f(width/(variant.kind === 'component' ? variant.scale ?? 1 : 1))}"`);
      if (variant.kind === 'arrow' || variant.kind === 'loop-arrow') {
        const weight = variant.kind === 'arrow' ? variant.width : variant.strokeWidth;
        markup = path(variant.kind === 'arrow' ? arrowPath(variant) : loopPath(variant), variant.color, weight)+
          path(canvasArrowHeadPath(variant), variant.color, weight, 'round', {}, variant.headFilled ? variant.color : 'none');
        boxes.push(unionBounds(canvasArrowHead(variant).map((p) => ({ x: p.x-weight/2, y: p.y-weight/2, width: weight, height: weight }))));
      } else if (variant.kind === 'line') {
        const head = lineArrowHeadPath(variant, doc);
        markup = path(linePath(variant, doc), variant.color, variant.width)+
          (head ? path(head, variant.color, variant.width, 'round', {}, variant.arrowhead === 'filled' ? variant.color : 'none') : '');
        boxes.push(visualBounds(variant, doc));
      }
      const border = borders[i];
      if (border?.lineStyle !== undefined) markup = markup.replace(/ stroke-dasharray="[^"]*"/g, '');
      const dash = border && dashPattern(border, border.width);
      return `<g opacity="${f(variant.opacity ?? 1)}"${dash ? ` stroke-dasharray="${dash.map(f).join(' ')}"` : ''}>${markup}</g>`;
    }).join('');
    return `<g opacity="${f(o.styleOpacity ?? 1)}" style="mix-blend-mode:${o.blendMode ?? 'normal'}">${painted}</g>`;
  };
  for (const group of highlightPaintGroups(doc)) {
    const first = group[0], paints = first.borders ? [...first.borders].reverse().filter((p) => p.enabled) : [{ id: 'stroke', color: first.color, width: first.width, opacity: first.opacity }];
    const content = paints.map((paint) => `<g opacity="${f(paint.opacity)}">${group
      .map((original) => {
        const object = { ...original, color: paint.color, width: paint.width };
        boxes.push(visualBounds(object, doc));
        return highlightDrawing(object, doc)
          .map((stroke) => path(stroke.d, object.color, stroke.width))
          .join('');
      })
      .join('')}</g>`).join('');
    if (content) bodyById.set(first.id, `<g opacity="${f(first.styleOpacity ?? 1)}" style="mix-blend-mode:${first.blendMode ?? 'normal'}">${content}</g>`);
  }
  for (const o of doc.objects) {
    const firstPart = parts.length;
    if (o.kind === 'rectangle' || o.kind === 'circle') {
      boxes.push(shapeBounds(o, true));
      const fills = [...shapeFills(o)].reverse().filter((p) => p.enabled).map((p) =>
        `<path d="${shapePath(o)}" fill="${p.color}" fill-opacity="${f(p.opacity)}"/>`).join('');
      const borders = [...shapeBorders(o)].reverse().filter((p) => p.enabled).map((p) =>
        `<path d="${shapePath(o, p)}" fill="none" stroke="${p.color}" stroke-width="${f(shapeBorderWidth(o, p))}" opacity="${f(p.opacity)}" stroke-linejoin="round" stroke-linecap="round"${dashPattern(p, p.width) ? ` stroke-dasharray="${dashPattern(p, p.width)!.map(f).join(' ')}"` : ''}/>`).join('');
      const frame = o.kind === 'rectangle' && o.frame;
      parts.push(`<g transform="${shapeTransform(o)}" opacity="${f(frame ? 1 : o.styleOpacity ?? 1)}" style="mix-blend-mode:${frame ? 'normal' : o.blendMode ?? 'normal'}">${fills}${borders}</g>`);
    } else if (o.kind === 'line') {
      const bounds = visualBounds(o, doc);
      boxes.push({
        x: bounds.x - o.width / 2,
        y: bounds.y - o.width / 2,
        width: bounds.width + o.width,
        height: bounds.height + o.width,
      });
      const head = lineArrowHeadPath(o, doc);
      parts.push(
        paintMarkup(o, path(linePath(o, doc), o.color, o.width, 'round', o)+(head ? path(head, o.color, o.width, 'round', {}, o.arrowhead === 'filled' ? o.color : 'none') : '')),
      );
    }
    capture(o.id, firstPart);
  }
  const currentGaps = drawingWireGaps(doc, options.transparent);
  for (const o of doc.objects.filter((o) => o.kind === 'wire')) {
    const firstPart = parts.length;
    try {
      const paths = wireDrawingPaths(wirePoints(o, doc), currentGaps.get(o.id));
      parts.push(
        paintMarkup(o, path(paths.map(pointsPath).join(' '), o.color, o.width, 'round', o)),
      );
      boxes.push(visualBounds(o, doc));
    } catch {
      /* Skip a dangling invalid wire like TikZ does. */
    }
    capture(o.id, firstPart);
  }
  for (const c of wireCrossings(doc)) {
    const p = bridgePaths(c),
      w = Math.max(c.horizontal.width, c.vertical.width) + 4;
    const addBridge = (...content: string[]) => bridgesById.set(p.overWire.id, (bridgesById.get(p.overWire.id) ?? '')+
      `<g opacity="${f(p.overWire.styleOpacity ?? 1)}" style="mix-blend-mode:${p.overWire.blendMode ?? 'normal'}">${content.join('')}</g>`);
    if (options.transparent || translucentCrossing(c)) {
      addBridge(
        `<g opacity="${f(p.overWire.opacity ?? 1)}">${path(p.arc, p.overWire.color, p.overWire.width, 'round', p.overWire)}</g>`,
      );
      continue;
    }
    addBridge(
      path(p.gap, 'white', w),
      path(p.under, p.underWire.color, p.underWire.width, 'round', p.underWire),
      path(p.arc, 'white', w),
      path(p.arc, p.overWire.color, p.overWire.width, 'round', p.overWire),
    );
  }
  for (const o of doc.objects.filter(
    (o) =>
      o.kind !== 'highlight' &&
      o.kind !== 'wire' &&
      o.kind !== 'rectangle' &&
      o.kind !== 'circle' &&
      o.kind !== 'line',
  )) {
    const firstPart = parts.length;
    const firstLabel = labels.length;
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
        `<g transform="translate(${f(o.x)} ${f(o.y)}) rotate(${o.rotation}) scale(${f(o.scale ?? 1)})" color="${o.color}" stroke="${o.color}" stroke-width="${f(o.width/(o.scale ?? 1))}" fill="none" stroke-linecap="round" stroke-linejoin="round">${shapes}</g>`,
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
      const radius = o.radius ?? 4.5;
      boxes.push({ x: o.x-radius, y: o.y-radius, width: radius*2, height: radius*2 });
      parts.push(`<circle cx="${f(o.x)}" cy="${f(o.y)}" r="${f(o.radius ?? 4.5)}" fill="${o.color}"/>`);
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
      labels.push([...objectFills(o)].reverse().filter((paint) => paint.enabled).map((paint) => text(o.text, o, paint.color, o.fontSize, o.rotation, o.align, paint.opacity)).join(''));
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
        path(canvasArrowHeadPath(o), o.color, width, 'round', {}, o.headFilled ? o.color : 'none'),
      );
    } else if (o.kind === 'angle') {
      const g = angleGeometry(o);
      parts.push(path(g.d, o.color, o.width, 'round', o));
      labels.push(text(o.label.text, g.labelPoint, o.label.color, o.label.fontSize, o.label.rotation, 'middle', o.label.opacity));
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
    if (parts.length > firstPart)
      parts.splice(
        firstPart,
        parts.length - firstPart,
        paintMarkup(o, parts.slice(firstPart).join('')),
      );
    if (labels.length > firstLabel) labels.splice(firstLabel, labels.length-firstLabel,
      `<g opacity="${f(o.styleOpacity ?? 1)}" style="mix-blend-mode:${o.blendMode ?? 'normal'}">${labels.slice(firstLabel).join('')}</g>`);
    capture(o.id, firstPart, firstLabel);
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
  const renderScope = (scope?: string, depth = 0): string => {
    if (depth > 32) return '';
    const parent = scope && doc.objects.find((o) => o.id === scope);
    const children = parent && parent.kind === 'rectangle' && parent.frame ? new Set(parent.frame.children) : null;
    const objects = doc.objects.filter((o) => children ? children.has(o.id) : !parentFrame(doc, o.id));
    const body = (o: typeof doc.objects[number]) => bodyById.get(o.id) ?? '';
    return objects.filter((o) => o.kind === 'highlight').map(body).join('')+
      objects.filter((o) => o.kind === 'rectangle' || o.kind === 'circle' || o.kind === 'line').map((o) =>
        o.kind === 'rectangle' && o.frame ? `<g opacity="${f(o.styleOpacity ?? 1)}" style="mix-blend-mode:${o.blendMode ?? 'normal'}">${body(o)}${renderScope(o.id, depth+1)}</g>` : body(o)).join('')+
      objects.filter((o) => o.kind === 'wire').map(body).join('')+
      objects.map((o) => bridgesById.get(o.id) ?? '').join('')+
      objects.filter((o) => !['highlight', 'rectangle', 'circle', 'line', 'wire'].includes(o.kind)).map(body).join('')+
      objects.map((o) => labelById.get(o.id) ?? '').join('');
  };
  const content = renderScope();
  const fonts = content.includes('Comic Relief') ? EMBEDDED_CIRCUIT_FONTS : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(x)} ${f(y)} ${f(width)} ${f(height)}" width="${f(width)}" height="${f(height)}"><title>${xmlText(doc.title)}</title>${fonts}${background}${content}</svg>`;
}
