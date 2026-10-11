import { makeId } from './catalog';
import { COLORS } from './types';
import type {
  Endpoint,
  Junction,
  Point,
  TextAnnotation,
  Wire,
  WireRouting,
  RectangleAnnotation,
  LineAnnotation,
} from './types';

export function createJunction(point: Point, text: string): Junction {
  return {
    kind: 'junction',
    id: makeId(),
    ...point,
    color: COLORS.ink,
    label: { text, offset: { x: 0, y: -24 }, color: COLORS.red, fontSize: 24, rotation: 0 },
  };
}

export function createWire(
  start: Endpoint,
  end: Endpoint,
  vertices: Point[] = [],
  routing: WireRouting = 'orthogonal',
): Wire {
  return {
    kind: 'wire',
    id: makeId(),
    startEndpoint: start,
    endEndpoint: end,
    vertices,
    routing,
    color: COLORS.ink,
    width: 2,
  };
}

export function createTextAnnotation(point: Point, text = 'Testo'): TextAnnotation {
  return {
    kind: 'text',
    id: makeId(),
    ...point,
    text,
    color: COLORS.red,
    fontSize: 24,
    align: 'start',
    rotation: 0,
  };
}

/** Graphic annotations deliberately contain no electrical endpoints. */
export function createRectangle(a: Point, b: Point): RectangleAnnotation {
  return {
    kind: 'rectangle',
    id: makeId(),
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.max(1, Math.abs(b.x - a.x)),
    height: Math.max(1, Math.abs(b.y - a.y)),
    color: COLORS.ink,
    strokeWidth: 2,
    fill: 'none',
  };
}
export function createLine(start: Point, end: Point): LineAnnotation {
  return { kind: 'line', id: makeId(), start, end, color: COLORS.ink, width: 2 };
}
