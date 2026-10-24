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
  const scale = component.scale ?? 1;
  return { x: bounds.x*scale + component.x, y: bounds.y*scale + component.y, width: bounds.width*scale, height: bounds.height*scale };
}

export function measurementBounds(object: CircuitObject, document: CircuitDocument): Bounds {
  return object.kind === 'component'
    ? getMeasurementBounds(object)
    : visualBounds(object, document);
}
