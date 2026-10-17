import { highlightPath } from '../annotations/highlight';
import { dashPattern } from '../utils/strokeStyle';
import type { StrokeStyle } from '../model/types';
import { drawingWireGaps, translucentCrossing } from '../utils/wireRendering';
import { braceGeometry } from '../annotations/brace';
import { bridgeGeometry, wireCrossings } from '../utils/crossings';
import { electricalDrawingGeometry, wireDrawingPaths } from '../annotations/electrical';
import { mathContent, normalizeLatex, renderLatex } from '../math/latex';
import { symbolText } from '../model/symbolGeometry';
import type { CircuitDocument, Label, Point, Rotation } from '../model/types';
import { isRotation } from '../model/types';
import { arcGeometry, localToWorld, wirePoints } from '../utils/geometry';
import { loopGeometry, wrapPosition } from '../utils/loops';
import { componentRegistry } from '../model/catalog';
import { geometryTikz, svgPathToTikz } from './symbolGeometry';
import { finitePoint, isExportableObject, normalizeHex } from './validation';
import { canvasArrowHead } from './arrowheads';
import {
  canvasTextLayout,
  canvasTextTikz,
  CANVAS_TEXT_PREAMBLE,
  COMPACT_CANVAS_TEXT_PREAMBLE,
} from './canvasText';
import { OBSIDIAN_FONT_DEFINITIONS, obsidianFontDefinitions } from './fonts';
import { compactTikzLines } from './compact';
import { CANVAS_UNITS_PER_CM, NATIVE_UNITS_PER_CM, editorToPt, formatNumber } from './units';
export const PIXELS_PER_CM = NATIVE_UNITS_PER_CM;
const fmt = formatNumber;
export function svgToTikz(p: Point, scale = PIXELS_PER_CM): Point {
  return { x: p.x / scale, y: -p.y / scale };
}
export function tikzCoordinate(p: Point): string {
  if (!finitePoint(p)) throw new Error('Invalid TikZ coordinate.');
  const t = svgToTikz(p);
  return `(${fmt(t.x)},${fmt(t.y)})`;
}
export const escapeTex = (s: string) =>
  s.replace(
    /[\\{}%&#$^_~]/g,
    (c) =>
      ({
        '\\': '\\textbackslash{}',
        '{': '\\{',
        '}': '\\}',
        '%': '\\%',
        '&': '\\&',
        '#': '\\#',
        $: '\\$',
        '^': '\\textasciicircum{}',
        _: '\\_',
        '~': '\\textasciitilde{}',
      })[c]!,
  );
export function texText(raw: string, formula = false): string {
  const result = renderLatex(raw, formula);
  // KaTeX accepts comments and ignores their remainder: wrapping such a source in
  // $...$ would comment out the closing delimiter and the TikZ node terminator.
  const unescaped = raw.replace(/\\./g, '');
  const unsafe =
    /[%#]/.test(unescaped) ||
    (unescaped.includes('&') &&
      !/\\begin\{(?:[pbBvV]?matrix|aligned|alignedat|gathered|cases|split)\}/.test(raw));
  return result.kind === 'math' && !unsafe
    ? `$${mathContent(normalizeLatex(raw, formula))}$`
    : escapeTex(raw);
}
export function exportTikz(source: CircuitDocument): string {
  return generateTikz(source, false);
}
/** One traversal owns validation, colors, wires, labels and object order for both modes. */
function generateTikz(source: CircuitDocument, canvas: boolean, compact = false): string {
  const unitsPerCm = canvas ? CANVAS_UNITS_PER_CM : PIXELS_PER_CM;
  const pixelsToPt = (value: number) => fmt(editorToPt(value, unitsPerCm));
  const tikzCoordinate = (point: Point) => {
    if (!finitePoint(point)) throw new Error('Invalid TikZ coordinate.');
    return `(${fmt(point.x / unitsPerCm)},${fmt(-point.y / unitsPerCm)})`;
  };
  const dash = (style: StrokeStyle, width: number) => {
    const pattern = dashPattern(style, width);
    return pattern
      ? `, dash pattern=on ${pixelsToPt(pattern[0])}pt off ${pixelsToPt(pattern[1])}pt`
      : '';
  };
  const ids = new Set<string>();
  const doc = {
    ...source,
    objects: source.objects.filter((o) => {
      if (!isExportableObject(o) || ids.has(o.id)) return false;
      ids.add(o.id);
      return true;
    }),
  };
  // Register colors only when emitting visible geometry or text.
  const colorNames = new Map<string, string>();
  const col = (color: string) => {
    const hex = normalizeHex(color)!;
    if (!colorNames.has(hex)) colorNames.set(hex, `dcColor${colorNames.size}`);
    return colorNames.get(hex)!;
  };
  const lines = [
    '\\begin{circuitikz}[european resistors, american inductors, american ports, line cap=round, line join=round]',
    ...(canvas ? [] : ['\\ctikzset{bipoles/length=1.4cm}']),
  ];
  let usesCanvasText = false;
  const textFragments: string[] = [];
  const node = (
    text: string,
    p: Point,
    color: string,
    size: number,
    rotation: Rotation = 0,
    align: 'start' | 'middle' | 'end' = 'middle',
    formula = false,
    plain = false,
    opacity = 1,
  ) => {
    if (
      typeof text !== 'string' ||
      !text.trim() ||
      !finitePoint(p) ||
      !normalizeHex(color) ||
      !Number.isFinite(size) ||
      size <= 0 ||
      !isRotation(rotation)
    )
      return;
    if (opacity !== 1) lines.push(`\\begin{scope}[opacity=${fmt(opacity)}, transparency group]`);
    const anchor = align === 'start' ? 'west' : align === 'end' ? 'east' : 'center';
    text.split('\n').forEach((line, i) => {
      if (!line.trim()) return;
      const value = plain ? escapeTex(line) : texText(line, formula);
      const offset = i * size * 1.35;
      const angle = canvas ? (rotation * Math.PI) / 180 : 0;
      const position = { x: p.x - offset * Math.sin(angle), y: p.y + offset * Math.cos(angle) };
      const layout = canvas ? canvasTextLayout(line, size, formula, plain) : null;
      if (layout) {
        usesCanvasText = true;
        textFragments.push(layout.svg);
        col(color);
        lines.push(
          ...canvasTextTikz(
            layout,
            value,
            position,
            `#${normalizeHex(color)}`,
            col(color),
            size,
            rotation,
            align,
            tikzCoordinate,
            compact,
          ),
        );
        return;
      }
      lines.push(
        `\\node[text=${col(color)}, anchor=${anchor}, inner sep=0pt, rotate=${-rotation}, font=\\fontsize{${pixelsToPt(size)}}{${pixelsToPt(size * 1.3)}}\\selectfont${canvas ? '\\sffamily' : ''}] at ${tikzCoordinate(position)} {${value}};`,
      );
    });
    if (opacity !== 1) lines.push('\\end{scope}');
  };
  const label = (o: { x: number; y: number; label: Label }) => {
    if (!o.label || !finitePoint(o.label.offset)) return;
    node(
      o.label.text,
      { x: o.x + o.label.offset.x, y: o.y + o.label.offset.y },
      o.label.color,
      o.label.fontSize,
      o.label.rotation,
      'middle',
      false,
      false,
      o.label.opacity,
    );
  };
  for (const o of doc.objects)
    if (o.kind === 'highlight') {
      const path = svgPathToTikz(highlightPath(o, doc), tikzCoordinate);
      if (path)
        lines.push(
          `\\draw[draw=${col(o.color)}, opacity=${fmt(o.opacity)}, line width=${pixelsToPt(o.width)}pt] ${path};`,
        );
    }
  // Graphic annotations sit behind the electrical circuit, matching the canvas.
  for (const o of doc.objects) {
    if (o.kind === 'rectangle') {
      const end = { x: o.x + o.width, y: o.y + o.height };
      if (o.fill !== 'none')
        lines.push(
          `\\path[fill=${col(o.fill)}, fill opacity=${fmt(o.fillOpacity ?? 1)}] ${tikzCoordinate(o)} rectangle ${tikzCoordinate(end)};`,
        );
      lines.push(
        `\\draw[draw=${col(o.color)}, opacity=${fmt(o.opacity ?? 1)}, line width=${pixelsToPt(o.strokeWidth)}pt${dash(o, o.strokeWidth)}] ${tikzCoordinate(o)} rectangle ${tikzCoordinate(end)};`,
      );
    } else if (o.kind === 'line')
      lines.push(
        `\\draw[draw=${col(o.color)}, opacity=${fmt(o.opacity ?? 1)}, line width=${pixelsToPt(o.width)}pt${dash(o, o.width)}] ${tikzCoordinate(o.start)} -- ${tikzCoordinate(o.end)};`,
      );
  }
  // Wires first: native component bodies then cover their own interiors.
  const wires = new Set<string>();
  const currentGaps = drawingWireGaps(doc);
  for (const o of doc.objects)
    if (o.kind === 'wire') {
      let points: Point[];
      try {
        points = wirePoints(o, doc);
      } catch {
        // A dangling endpoint must not prevent the rest of a circuit being exported.
        continue;
      }
      if (points.length < 2 || !points.every(finitePoint)) continue;
      for (const subpath of wireDrawingPaths(points, currentGaps.get(o.id))) {
        const path = subpath.map(tikzCoordinate).filter((p, i, all) => !i || p !== all[i - 1]);
        if (path.length < 2) continue;
        const line = `\\draw[draw=${col(o.color)}${o.opacity !== undefined ? `, opacity=${fmt(o.opacity)}` : ''}, line width=${pixelsToPt(o.width)}pt${dash(o, o.width)}] ${path.join(' -- ')};`;
        if (!wires.has(line)) lines.push(line);
        wires.add(line);
      }
    }
  for (const c of wireCrossings(doc)) {
    const g = bridgeGeometry(c),
      whiteWidth = pixelsToPt(Math.max(c.horizontal.width, c.vertical.width) + 4);
    if (translucentCrossing(c)) {
      lines.push(
        `\\draw[draw=${col(g.overWire.color)},opacity=${fmt(g.overWire.opacity ?? 1)},line width=${pixelsToPt(g.overWire.width)}pt${dash(g.overWire, g.overWire.width)}] ${tikzCoordinate(g.start)} .. controls ${tikzCoordinate(g.controlA)} and ${tikzCoordinate(g.controlB)} .. ${tikzCoordinate(g.end)};`,
      );
      continue;
    }
    lines.push(`% Unconnected wire crossing: ${c.bridgeAxis} bridge`);
    lines.push(
      `\\draw[draw=white,line width=${whiteWidth}pt] ${tikzCoordinate(g.start)} -- ${tikzCoordinate(g.end)};`,
    );
    lines.push(
      `\\draw[draw=${col(g.underWire.color)},line width=${pixelsToPt(g.underWire.width)}pt${dash(g.underWire, g.underWire.width)}] ${tikzCoordinate(g.underStart)} -- ${tikzCoordinate(g.underEnd)};`,
    );
    for (const [color, width] of [
      ['white', whiteWidth],
      [col(g.overWire.color), pixelsToPt(g.overWire.width)],
    ])
      lines.push(
        `\\draw[draw=${color},line width=${width}pt${color === 'white' ? '' : dash(g.overWire, g.overWire.width)}] ${tikzCoordinate(g.start)} .. controls ${tikzCoordinate(g.controlA)} and ${tikzCoordinate(g.controlB)} .. ${tikzCoordinate(g.end)};`,
      );
  }
  let index = 0;
  const rank = (o: CircuitDocument['objects'][number]) =>
    o.kind === 'component' ? 0 : o.kind === 'junction' ? 1 : 2;
  const labels: (() => void)[] = [];
  for (const o of [...doc.objects]
    .filter((o) => o.kind !== 'highlight' && o.kind !== 'rectangle' && o.kind !== 'line')
    .sort((a, b) => rank(a) - rank(b))) {
    if (rank(o) === 2 && labels.length) {
      labels.splice(0).forEach((draw) => draw());
    }
    const translucent =
      o.kind !== 'wire' && o.kind !== 'text' && o.opacity !== undefined && o.opacity !== 1;
    if (translucent) lines.push(`\\begin{scope}[opacity=${fmt(o.opacity!)}, transparency group]`);
    if (o.kind === 'component') {
      const mapping = componentRegistry[o.type].tikz,
        style = `draw=${col(o.color)}, line width=${pixelsToPt(o.width)}pt`,
        name = `dcComponent${index++}`;
      lines.push(`% Component: ${o.type}`);
      if (canvas) {
        lines.push(
          ...geometryTikz(o, style, tikzCoordinate, pixelsToPt, texText, {
            dashed: `dash pattern=on ${pixelsToPt(4)}pt off ${pixelsToPt(4)}pt`,
            text: (value, position, size) => {
              const before = lines.length;
              node(value, position, o.color, size, o.rotation, 'middle', false, true);
              return lines.splice(before);
            },
          }),
        );
      } else if (mapping.kind === 'reference') {
        const t = o.terminals[0],
          terminal = localToWorld(o, { x: t.localX, y: t.localY });
        lines.push(
          `\\draw[${style}] ${tikzCoordinate(terminal)} -- ${tikzCoordinate(o)} node[${mapping.symbol}, rotate=${-o.rotation}, fill=white] {};`,
        );
      } else if (mapping.kind === 'geometry') {
        lines.push(...geometryTikz(o, style, tikzCoordinate, pixelsToPt, texText));
      } else if (mapping.kind === 'node') {
        lines.push(
          `\\node[${mapping.symbol}, ${style}, fill=white, rotate=${-o.rotation}, scale=${mapping.scale ?? 1}${mapping.mirrorY ? ', yscale=-1' : ''}, transform shape] (${name}) at ${tikzCoordinate(o)} {${texText(mapping.bodyText ?? '')}};`,
        );
        for (const t of o.terminals) {
          const anchor = mapping.anchors[t.id];
          if (!anchor) throw new Error(`Missing native anchor: ${o.type}.${t.id}`);
          lines.push(
            `\\draw[${style}] ${tikzCoordinate(localToWorld(o, { x: t.localX, y: t.localY }))} -- (${name}.${anchor});`,
          );
        }
      } else {
        const [a, b] = o.terminals,
          start = localToWorld(o, { x: a.localX, y: a.localY }),
          end = localToWorld(o, { x: b.localX, y: b.localY });
        lines.push(
          `\\draw[${style}] ${tikzCoordinate(start)} to[${mapping.symbol}, fill=white, name=${name}] ${tikzCoordinate(end)};`,
        );
        for (const [id, anchor] of Object.entries(mapping.extraAnchors ?? {})) {
          const t = o.terminals.find((t) => t.id === id)!;
          lines.push(
            `\\draw[${style}] ${tikzCoordinate(localToWorld(o, { x: t.localX, y: t.localY }))} -- (${name}.${anchor});`,
          );
        }
        if (mapping.text) {
          for (const shape of componentRegistry[o.type].shapes)
            if (shape.kind === 'text') {
              const { value, size } = symbolText(shape, o.bodyText);
              node(value, localToWorld(o, shape), o.color, size, o.rotation);
            }
        }
      }
      labels.push(() => label(o));
    } else if (o.kind === 'junction') {
      lines.push(`\\fill[${col(o.color)}] ${tikzCoordinate(o)} circle (${pixelsToPt(4.5)}pt);`);
      labels.push(() => label(o));
    } else if (o.kind === 'brace') {
      const g = braceGeometry(o);
      lines.push(
        `% Annotation: ${o.type}`,
        `\\draw[draw=${col(o.color)}, line width=${pixelsToPt(o.width)}pt] ${svgPathToTikz(g.d, tikzCoordinate)};`,
      );
      labels.push(() =>
        node(
          o.label.text,
          g.labelPoint,
          o.label.color,
          o.label.fontSize,
          o.label.rotation,
          'middle',
          false,
          false,
          o.label.opacity,
        ),
      );
    } else if (o.kind === 'electrical') {
      const g = electricalDrawingGeometry(o, doc);
      lines.push(`% Electrical annotation: ${o.mode}`);
      if (o.mode === 'polarity') {
        node(o.reversed ? '-' : '+', g.start, o.color, 22, 0, 'middle', false, true);
        node(o.reversed ? '+' : '-', g.end, o.color, 22, 0, 'middle', false, true);
      } else {
        const style = `draw=${col(o.color)},line width=${pixelsToPt(g.strokeWidth)}pt${g.inline ? ',line cap=round,line join=round' : ''}`;
        lines.push(`\\draw[${style}] ${tikzCoordinate(g.start)} -- ${tikzCoordinate(g.end)};`);
        lines.push(`\\draw[${style}] ${g.head.map(tikzCoordinate).join(' -- ')};`);
      }
      labels.push(() =>
        node(
          o.label.text,
          g.labelPoint,
          o.label.color,
          g.labelFontSize,
          o.label.rotation,
          'middle',
          false,
          false,
          o.label.opacity,
        ),
      );
    } else if (o.kind === 'text')
      node(o.text, o, o.color, o.fontSize, o.rotation, o.align, false, false, o.opacity);
    else if (o.kind === 'loop-arrow') {
      const g = loopGeometry({ ...o, rotation: 0, arrowPosition: wrapPosition(o.arrowPosition) });
      if (o.rotation)
        lines.push(
          `\\begin{scope}[rotate around={${fmt(-o.rotation)}:${tikzCoordinate({ x: o.x + o.width / 2, y: o.y + o.height / 2 })}}]`,
        );
      // Shift both angles together so normalization preserves sweep and direction.
      const endAngle = ((-g.endAngle % 360) + 360) % 360;
      const startAngle = endAngle + (g.endAngle - g.startAngle);
      lines.push(
        `\\draw[${canvas ? '' : '->, '}draw=${col(o.color)}, line width=${pixelsToPt(o.strokeWidth)}pt] ${tikzCoordinate(g.start)} arc[start angle=${fmt(startAngle)}, end angle=${fmt(endAngle)}, x radius=${fmt(o.width / (2 * unitsPerCm))}cm, y radius=${fmt(o.height / (2 * unitsPerCm))}cm];`,
      );
      if (o.rotation) lines.push('\\end{scope}');
    } else if (o.kind === 'arrow') {
      const style = `${canvas ? '' : `${o.reversed ? '<-' : '->'}, `}draw=${col(o.color)}, line width=${pixelsToPt(o.width)}pt`;
      if (o.type === 'straight')
        lines.push(`\\draw[${style}] ${tikzCoordinate(o.start)} -- ${tikzCoordinate(o.end)};`);
      else if (o.type === 'curve')
        lines.push(
          `\\draw[${style}] ${tikzCoordinate(o.start)} .. controls ${tikzCoordinate(o.controlPoints[0])} and ${tikzCoordinate(o.controlPoints[1])} .. ${tikzCoordinate(o.end)};`,
        );
      else {
        const g = arcGeometry(o);
        lines.push(
          `\\draw[${style}] ${tikzCoordinate(g.start)} arc[start angle=${fmt(-g.startAngle)}, end angle=${fmt(-g.startAngle - g.sign * 310)}, radius=${fmt(g.radius / unitsPerCm)}cm];`,
        );
      }
    }
    if (canvas && (o.kind === 'arrow' || o.kind === 'loop-arrow'))
      lines.push(
        `\\draw[draw=${col(o.color)}, line width=${pixelsToPt(o.kind === 'arrow' ? o.width : o.strokeWidth)}pt] ${canvasArrowHead(o).map(tikzCoordinate).join(' -- ')};`,
      );
    if (translucent) lines.push('\\end{scope}');
  }
  labels.forEach((draw) => draw());
  if (usesCanvasText)
    lines.splice(
      1,
      0,
      compact ? obsidianFontDefinitions(textFragments) : OBSIDIAN_FONT_DEFINITIONS,
    );
  lines.push('\\end{circuitikz}');
  return [
    ...(compact
      ? []
      : [
          canvas
            ? '% DrawCircuit WYSIWYG — 1 editor unit = 0.75 TeX pt; SVG Y axis inverted.'
            : '% DrawCircuit — coordinates in cm; SVG Y axis inverted.',
        ]),
    ...Array.from(colorNames).map(([hex, name]) => `\\definecolor{${name}}{HTML}{${hex}}`),
    ...(compact ? compactTikzLines(lines) : lines),
  ].join('\n');
}
/** Inline TikZ/TikZJax supply the document class and render editable SVG geometry. */
export function exportObsidian(doc: CircuitDocument, options: { compact?: boolean } = {}): string {
  const compact = options.compact !== false;
  const tikz = generateTikz(doc, true, compact);
  const packages = ['circuitikz'];
  if (
    /\\(?:text|operatorname|dfrac|tfrac|[dt]?binom|boxed|overset|underset|substack|xleftarrow|xrightarrow|mod|dots[bcimo]|i{2,3}nt|sideset|tag|eqref|implies|impliedby)\b|\\begin\{(?:[pbBvV]?matrix|smallmatrix|aligned|alignedat|gathered|cases|split)\}/.test(
      tikz,
    )
  )
    packages.push('amsmath');
  if (
    /\\(?:therefore|because|checkmark|varnothing|nexists|lesssim|gtrsim|leqslant|geqslant|[nN]leq|[nN]geq|square|blacksquare|lozenge|blacklozenge|triangleq)\b/.test(
      tikz,
    )
  )
    packages.push('amssymb');
  else if (/\\(?:mathbb|mathfrak|Bbb)\b/.test(tikz)) packages.push('amsfonts');
  return [
    '```tikz',
    ...packages.map((name) => `\\usepackage{${name}}`),
    ...(tikz.includes('\\node[')
      ? [compact ? COMPACT_CANVAS_TEXT_PREAMBLE : CANVAS_TEXT_PREAMBLE]
      : []),
    '\\begin{document}',
    '',
    tikz,
    '',
    '\\end{document}',
    '```',
  ].join('\n');
}
export function exportStandalone(doc: CircuitDocument): string {
  return [
    '\\documentclass[tikz,border=5pt]{standalone}',
    '\\usepackage{iftex}',
    '\\ifPDFTeX',
    '  \\usepackage[T1]{fontenc}',
    '  \\usepackage[utf8]{inputenc}',
    '\\else',
    '  \\usepackage{fontspec}',
    '  \\IfFontExistsTF{Comic Relief}{\\setmainfont{Comic Relief}}{}',
    '\\fi',
    '\\usepackage{amsmath,amssymb}',
    '\\usepackage{circuitikz}',
    '\\begin{document}',
    exportTikz(doc),
    '\\end{document}',
    '',
  ].join('\n');
}
