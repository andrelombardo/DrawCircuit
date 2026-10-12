import { createCurrent, createPolarity } from '../../annotations/electrical';
import { supportsPolarity } from '../../model/capabilities';
import type { CircuitDocument, CircuitObject, ElectricalAnnotation, Wire } from '../../model/types';
import { distance, midpoint, wirePoints } from '../../utils/geometry';

/** A selection names the whole Wire. Choose its longest rendered branch, then
 * retain the usual segment association so endpoint edits keep the annotation attached. */
export function currentOnSelectedWire(wire: Wire, doc: CircuitDocument) {
  const points = wirePoints(wire, doc);
  let segment = 0;
  for (let i = 1; i < points.length - 1; i++) {
    if (distance(points[i], points[i + 1]) > distance(points[segment], points[segment + 1]))
      segment = i;
  }
  return createCurrent(wire, midpoint(points[segment], points[segment + 1]), doc);
}

export function annotationsForHost(host: CircuitObject, doc: CircuitDocument) {
  return doc.objects.filter(
    (o): o is ElectricalAnnotation =>
      o.kind === 'electrical' &&
      (host.kind === 'wire'
        ? o.mode === 'current' && o.wireId === host.id
        : supportsPolarity(host) && o.mode === 'polarity' && o.componentId === host.id),
  );
}

/** Keep the host selected, and reuse any annotation already attached to it. */
export function withHostAnnotation(host: CircuitObject, doc: CircuitDocument): CircuitDocument {
  if (annotationsForHost(host, doc).length) return doc;
  const annotation =
    host.kind === 'wire'
      ? currentOnSelectedWire(host, doc)
      : supportsPolarity(host)
        ? createPolarity(host)
        : null;
  return annotation ? { ...doc, objects: [...doc.objects, annotation] } : doc;
}
