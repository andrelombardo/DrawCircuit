import { componentRegistry } from '../model/catalog';
import { symbolMeasurementBounds } from '../model/symbolBounds';
import type { CircuitComponent, CircuitDocument, CircuitObject } from '../model/types';
import { rotatePoint } from './geometry';
import { visualBounds } from './visualBounds';
import type { Bounds } from './visualBounds';

const rotatedBodyBounds = new Map<string, Bounds>();

/** Exact rotated world bounds of the authored symbol body; independent of leads, hit padding,
 * label offsets and document/export bounds. */
export function getMeasurementBounds(component: CircuitComponent): Bounds {
  const key = `${component.type}:${component.rotation}`;
  let bounds = rotatedBodyBounds.get(key);
  if (!bounds) {
    bounds = symbolMeasurementBounds(componentRegistry[component.type].shapes, (p) =>
      rotatePoint(p, component.rotation),
    );
    rotatedBodyBounds.set(key, bounds);
  }
  return { ...bounds, x: bounds.x + component.x, y: bounds.y + component.y };
}

export function measurementBounds(object: CircuitObject, document: CircuitDocument): Bounds {
  // A decorative line can have zero extent on one axis. Hit-area padding must
  // not shift its geometric center or introduce a fictional alignment edge.
  if (object.kind === 'line')
    return {
      x: Math.min(object.start.x, object.end.x),
      y: Math.min(object.start.y, object.end.y),
      width: Math.abs(object.end.x - object.start.x),
      height: Math.abs(object.end.y - object.start.y),
    };
  return object.kind === 'component'
    ? getMeasurementBounds(object)
    : visualBounds(object, document);
}
