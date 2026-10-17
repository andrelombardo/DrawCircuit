import { componentRegistry } from '../model/catalog';
import type { CircuitObject, Endpoint, Point } from '../model/types';
import { isRotation } from '../model/types';
import { validStroke } from '../utils/strokeStyle';
import { localToWorld } from '../utils/geometry';

/** Export-only validation: never repair or mutate the editor's document. */
export const finitePoint = (p: unknown): p is Point =>
  !!p &&
  typeof p === 'object' &&
  'x' in p &&
  'y' in p &&
  Number.isFinite(p.x) &&
  Number.isFinite(p.y);
const positive = (n: number) => Number.isFinite(n) && n > 0;
const rotation = isRotation;
const opacity = (v: number | undefined) =>
  v === undefined || (Number.isFinite(v) && v >= 0 && v <= 1);

export function normalizeHex(color: string): string | null {
  if (typeof color !== 'string') return null;
  const hex = color.trim().replace(/^#/, '');
  if (/^[\da-f]{3}$/i.test(hex)) return hex.replace(/./g, (digit) => digit + digit).toUpperCase();
  return /^[\da-f]{6}$/i.test(hex) ? hex.toUpperCase() : null;
}

const endpoint = (e: Endpoint) =>
  e?.kind === 'free'
    ? finitePoint(e.point)
    : e?.kind === 'terminal'
      ? typeof e.componentId === 'string' && typeof e.terminalId === 'string'
      : e?.kind === 'junction' && typeof e.junctionId === 'string';

export function isExportableObject(o: CircuitObject): boolean {
  if (!o || typeof o.id !== 'string' || !o.id || !normalizeHex(o.color)) return false;
  if (!opacity(o.opacity) || ('label' in o && o.label && !opacity(o.label.opacity))) return false;
  switch (o.kind) {
    case 'component': {
      if (
        !Object.hasOwn(componentRegistry, o.type) ||
        !finitePoint(o) ||
        !rotation(o.rotation) ||
        !positive(o.width) ||
        (o.bodyText !== undefined && typeof o.bodyText !== 'string') ||
        !Array.isArray(o.terminals)
      )
        return false;
      const expected = componentRegistry[o.type].terminals;
      return (
        o.terminals.length === expected.length &&
        expected.every((pin, i) => {
          const t = o.terminals[i];
          return (
            t?.id === pin.id &&
            Number.isFinite(t.localX) &&
            Number.isFinite(t.localY) &&
            finitePoint(localToWorld(o, { x: t.localX, y: t.localY }))
          );
        })
      );
    }
    case 'brace':
      return (
        ['brace', 'bracket'].includes(o.type) &&
        finitePoint(o.start) &&
        finitePoint(o.end) &&
        (o.start.x === o.end.x || o.start.y === o.end.y) &&
        (o.side === 1 || o.side === -1) &&
        positive(o.width) &&
        !!o.label &&
        typeof o.label.text === 'string' &&
        finitePoint(o.label.offset) &&
        !!normalizeHex(o.label.color) &&
        positive(o.label.fontSize) &&
        rotation(o.label.rotation)
      );
    case 'electrical':
      return (
        ['current', 'polarity', 'voltage'].includes(o.mode) &&
        finitePoint(o.start) &&
        finitePoint(o.end) &&
        finitePoint(o.offset) &&
        positive(o.width) &&
        Number.isFinite(o.ratio) &&
        o.ratio >= 0 &&
        o.ratio <= 1 &&
        (o.currentPlacement === undefined ||
          (o.mode === 'current' && ['external', 'inline'].includes(o.currentPlacement))) &&
        (o.wireSegment === undefined ||
          (o.mode === 'current' &&
            !!o.wireId &&
            Number.isInteger(o.wireSegment.index) &&
            o.wireSegment.index >= 0 &&
            Number.isFinite(o.wireSegment.ratio) &&
            o.wireSegment.ratio >= 0 &&
            o.wireSegment.ratio <= 1)) &&
        typeof o.reversed === 'boolean' &&
        !!o.label &&
        typeof o.label.text === 'string' &&
        finitePoint(o.label.offset) &&
        !!normalizeHex(o.label.color) &&
        positive(o.label.fontSize) &&
        rotation(o.label.rotation)
      );
    case 'highlight':
      return (
        positive(o.width) &&
        o.width <= (o.mode === 'component' ? 200 : 1000) &&
        o.opacity !== undefined &&
        (o.mode === 'free'
          ? (o.smoothing === undefined || typeof o.smoothing === 'boolean') &&
            (o.widthOffsets === undefined || (Array.isArray(o.widthOffsets) &&
              o.widthOffsets.length === (o.breaks?.length ?? 0) + 1 &&
              o.widthOffsets.every((width) => Number.isFinite(width) && width >= 0 && width <= 1000))) &&
            Array.isArray(o.points) &&
            o.points.length >= 2 &&
            o.points.every(finitePoint) &&
            (o.breaks === undefined ||
              (Array.isArray(o.breaks) && o.breaks.every((index, i, all) =>
                Number.isInteger(index) && index > 0 && index < o.points.length &&
                (!i || index > all[i - 1]))))
          : o.mode === 'component' ? typeof o.componentId === 'string' && !!o.componentId
          : o.mode === 'smart' &&
            Array.isArray(o.spans) &&
            o.spans.length > 0 &&
            o.spans.every(
              (s) =>
                !!s && typeof s === 'object' &&
                ('wireId' in s ? typeof s.wireId === 'string' && !!s.wireId :
                  typeof s.componentId === 'string' && !!s.componentId && typeof s.terminalId === 'string' && !!s.terminalId) &&
                Number.isFinite(s.start) &&
                Number.isFinite(s.end) &&
                s.start >= 0 &&
                s.start <= 1 &&
                s.end >= 0 &&
                s.end <= 1,
            ))
      );
    case 'junction':
      return finitePoint(o);
    case 'text':
      return (
        finitePoint(o) &&
        typeof o.text === 'string' &&
        positive(o.fontSize) &&
        rotation(o.rotation) &&
        ['start', 'middle', 'end'].includes(o.align)
      );
    case 'rectangle':
      return (
        finitePoint(o) &&
        positive(o.width) &&
        positive(o.height) &&
        positive(o.strokeWidth) &&
        (o.fill === 'none' || !!normalizeHex(o.fill)) &&
        opacity(o.fillOpacity) &&
        validStroke(o)
      );
    case 'line':
      return finitePoint(o.start) && finitePoint(o.end) && positive(o.width) && validStroke(o);
    case 'wire':
      return (
        (o.routing === undefined || ['orthogonal', '45', 'free'].includes(o.routing)) &&
        positive(o.width) &&
        validStroke(o) &&
        endpoint(o.startEndpoint) &&
        endpoint(o.endEndpoint) &&
        Array.isArray(o.vertices) &&
        o.vertices.every(finitePoint)
      );
    case 'arrow':
      return (
        (o.arcRotation === undefined || Number.isFinite(o.arcRotation)) &&
        (o.arcMirrored === undefined || typeof o.arcMirrored === 'boolean') &&
        ['straight', 'curve', 'arc'].includes(o.type) &&
        finitePoint(o.start) &&
        finitePoint(o.end) &&
        positive(o.width) &&
        typeof o.reversed === 'boolean' &&
        (o.type !== 'curve' ||
          (Array.isArray(o.controlPoints) &&
            o.controlPoints.length === 2 &&
            o.controlPoints.every(finitePoint)))
      );
    case 'loop-arrow':
      return (
        (o.rotation === undefined || Number.isFinite(o.rotation)) &&
        finitePoint(o) &&
        positive(o.width) &&
        positive(o.height) &&
        positive(o.strokeWidth) &&
        Number.isFinite(o.arrowPosition) &&
        ['clockwise', 'counterclockwise'].includes(o.direction)
      );
    default:
      return false;
  }
}
