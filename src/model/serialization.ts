import { COLORS, componentTypes, isRotation } from './types';
import { componentRegistry, terminalsFor } from './catalog';
import type { CircuitDocument } from './types';
import { resolveEndpoint } from '../utils/geometry';
const fail = (): never => {
  throw new Error('JSON non valido: controlla formato, oggetti e collegamenti.');
};
function record(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return fail();
  return v as Record<string, unknown>;
}
const str = (v: unknown) => typeof v === 'string' && v.length <= 10000;
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 1e7;
const color = (v: unknown) => typeof v === 'string' && /^#[a-fA-F0-9]{6}$/.test(v);
const rotation = isRotation;
const opacity = (v: unknown) => v === undefined || (num(v) && Number(v) >= 0 && Number(v) <= 1);
const point = (v: unknown) => {
  const p = record(v);
  return num(p.x) && num(p.y);
};
const positive = (v: unknown, max = 100) => num(v) && Number(v) > 0 && Number(v) <= max;
function label(v: unknown): boolean {
  const l = record(v);
  return (
    str(l.text) &&
    point(l.offset) &&
    color(l.color) &&
    opacity(l.opacity) &&
    positive(l.fontSize, 200) &&
    rotation(l.rotation) &&
    (l.fontFamily === undefined || str(l.fontFamily))
  );
}
function endpoint(v: unknown): boolean {
  const e = record(v);
  return e.kind === 'free'
    ? point(e.point)
    : e.kind === 'terminal'
      ? str(e.componentId) && str(e.terminalId)
      : e.kind === 'junction'
        ? str(e.junctionId)
        : false;
}
export function serializeDocument(doc: CircuitDocument): string {
  return JSON.stringify(doc, null, 2);
}
export function deserializeDocument(raw: string): CircuitDocument {
  if (raw.length > 10_000_000) throw new Error('Il file supera il limite di 10 MB.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return fail();
  }
  const root = record(parsed);
  if (
    root.version !== 1 ||
    !str(root.title) ||
    !Array.isArray(root.objects) ||
    root.objects.length > 10000
  )
    fail();
  const ids = new Set<string>();
  for (const entry of root.objects as unknown[]) {
    const o = record(entry);
    if (!str(o.id) || !o.id || ids.has(String(o.id))) fail();
    ids.add(String(o.id));
    if (!opacity(o.opacity)) fail();
    if (
      ['wire', 'rectangle', 'line'].includes(String(o.kind)) &&
      ((o.lineStyle !== undefined &&
        !['solid', 'dashed', 'dotted'].includes(String(o.lineStyle))) ||
        (o.dashLength !== undefined && !positive(o.dashLength, 1000)) ||
        (o.dashGap !== undefined && !positive(o.dashGap, 1000)))
    )
      fail();
    if (o.kind === 'component') {
      const definition = componentRegistry[o.type as (typeof componentTypes)[number]];
      if (definition && (o.label === undefined || typeof o.label === 'string')) {
        o.label = {
          text: o.label ?? '',
          offset: { ...definition.labelOffset },
          color: COLORS.blue,
          fontSize: 22,
          rotation: 0,
        };
      }
      const legacyLabel = record(o.label);
      if (legacyLabel.text === undefined) legacyLabel.text = '';
      if (
        !componentTypes.includes(o.type as (typeof componentTypes)[number]) ||
        !num(o.x) ||
        !num(o.y) ||
        !rotation(o.rotation) ||
        !label(o.label) ||
        (o.value !== undefined && !str(o.value)) ||
        (o.bodyText !== undefined &&
          (!str(o.bodyText) ||
            componentRegistry[o.type as (typeof componentTypes)[number]]?.internalText ===
              undefined)) ||
        !color(o.color) ||
        !positive(o.width, 20) ||
        !Array.isArray(o.terminals)
      )
        fail();
      const expected = terminalsFor(o.type as (typeof componentTypes)[number]);
      if (expected.length !== (o.terminals as unknown[]).length) fail();
      expected.forEach((t, i) => {
        const actual = record((o.terminals as unknown[])[i]);
        if (
          actual.id !== t.id ||
          actual.localX !== t.localX ||
          actual.localY !== t.localY ||
          (actual.name !== undefined && actual.name !== t.name) ||
          (actual.direction !== undefined && actual.direction !== t.direction)
        )
          fail();
      });
    } else if (o.kind === 'rectangle') {
      if (
        !num(o.x) ||
        !num(o.y) ||
        !positive(o.width, 1e7) ||
        !positive(o.height, 1e7) ||
        !color(o.color) ||
        !positive(o.strokeWidth, 20) ||
        (o.fill !== 'none' && !color(o.fill)) ||
        !opacity(o.fillOpacity)
      )
        fail();
    } else if (o.kind === 'line') {
      if (!point(o.start) || !point(o.end) || !color(o.color) || !positive(o.width, 20)) fail();
    } else if (o.kind === 'junction') {
      if (!num(o.x) || !num(o.y) || !label(o.label) || !color(o.color)) fail();
    } else if (o.kind === 'wire') {
      if (o.highlight !== undefined) {
        const h = record(o.highlight);
        if (
          !color(h.color) ||
          h.opacity === undefined ||
          !opacity(h.opacity) ||
          !positive(h.width, 100)
        )
          fail();
      }
      if (
        (o.routing !== undefined && !['orthogonal', '45', 'free'].includes(String(o.routing))) ||
        !endpoint(o.startEndpoint) ||
        !endpoint(o.endEndpoint) ||
        !Array.isArray(o.vertices) ||
        o.vertices.length > 1000 ||
        !o.vertices.every(point) ||
        !color(o.color) ||
        !positive(o.width, 20)
      )
        fail();
    } else if (o.kind === 'brace') {
      if (
        !['brace', 'bracket'].includes(String(o.type)) ||
        !point(o.start) ||
        !point(o.end) ||
        (o.side !== 1 && o.side !== -1) ||
        !label(o.label) ||
        !color(o.color) ||
        !positive(o.width, 20) ||
        (record(o.start).x !== record(o.end).x && record(o.start).y !== record(o.end).y)
      )
        fail();
    } else if (o.kind === 'electrical') {
      if (
        !['current', 'polarity', 'voltage'].includes(String(o.mode)) ||
        !point(o.start) ||
        !point(o.end) ||
        !point(o.offset) ||
        !label(o.label) ||
        !num(o.ratio) ||
        Number(o.ratio) < 0 ||
        Number(o.ratio) > 1 ||
        typeof o.reversed !== 'boolean' ||
        !color(o.color) ||
        !positive(o.width, 20) ||
        (o.wireId !== undefined && (o.mode !== 'current' || !str(o.wireId) || !o.wireId)) ||
        (o.currentPlacement !== undefined &&
          (o.mode !== 'current' || !['external', 'inline'].includes(String(o.currentPlacement)))) ||
        (o.wireSegment !== undefined &&
          (o.mode !== 'current' ||
            o.wireId === undefined ||
            !Number.isInteger(record(o.wireSegment).index) ||
            Number(record(o.wireSegment).index) < 0 ||
            !num(record(o.wireSegment).ratio) ||
            Number(record(o.wireSegment).ratio) < 0 ||
            Number(record(o.wireSegment).ratio) > 1)) ||
        (o.componentId !== undefined &&
          (o.mode !== 'polarity' || !str(o.componentId) || !o.componentId)) ||
        (o.wireId !== undefined && o.componentId !== undefined)
      )
        fail();
    } else if (o.kind === 'text') {
      if (
        !num(o.x) ||
        !num(o.y) ||
        !str(o.text) ||
        !color(o.color) ||
        !positive(o.fontSize, 200) ||
        (o.fontFamily !== undefined && !str(o.fontFamily)) ||
        !['start', 'middle', 'end'].includes(String(o.align)) ||
        !rotation(o.rotation)
      )
        fail();
    } else if (o.kind === 'loop-arrow') {
      if (o.rotation !== undefined && !num(o.rotation)) fail();
      if (
        !num(o.x) ||
        !num(o.y) ||
        !positive(o.width, 1e7) ||
        !positive(o.height, 1e7) ||
        !['clockwise', 'counterclockwise'].includes(String(o.direction)) ||
        !num(o.arrowPosition) ||
        Number(o.arrowPosition) < 0 ||
        Number(o.arrowPosition) >= 1 ||
        !color(o.color) ||
        !positive(o.strokeWidth, 20)
      )
        fail();
    } else if (o.kind === 'arrow') {
      if (
        (o.arcRotation !== undefined && !num(o.arcRotation)) ||
        (o.arcMirrored !== undefined && typeof o.arcMirrored !== 'boolean')
      )
        fail();
      if (
        !['straight', 'curve', 'arc'].includes(String(o.type)) ||
        !point(o.start) ||
        !point(o.end) ||
        !Array.isArray(o.controlPoints) ||
        o.controlPoints.length !== 2 ||
        !o.controlPoints.every(point) ||
        !color(o.color) ||
        !positive(o.width, 20) ||
        typeof o.reversed !== 'boolean'
      )
        fail();
    } else fail();
    if (o.kind === 'component' || o.kind === 'junction') {
      const l = record(o.label);
      if (o.kind === 'component' && !String(l.text).trim() && typeof o.value === 'string')
        l.text = o.value;
      delete l.fontFamily;
      delete o.value;
    }
    if (o.kind === 'electrical' && o.mode === 'current') o.currentPlacement = 'inline';
    if (o.kind === 'text') delete o.fontFamily;
  }
  const doc = root as unknown as CircuitDocument;
  for (const o of doc.objects)
    if (o.kind === 'wire') {
      resolveEndpoint(o.startEndpoint, doc);
      resolveEndpoint(o.endEndpoint, doc);
    }
  for (const o of doc.objects)
    if (o.kind === 'electrical') {
      if (o.wireId && !doc.objects.some((t) => t.id === o.wireId && t.kind === 'wire')) fail();
      if (
        o.componentId &&
        !doc.objects.some(
          (t) => t.id === o.componentId && t.kind === 'component' && t.terminals.length === 2,
        )
      )
        fail();
    }
  return doc;
}
