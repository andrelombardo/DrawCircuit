import type { CircuitDocument, Endpoint, LineAnnotation, Point, WireRouting } from '../model/types';
import { createLine } from '../model/factories';
import { distance, lineAsWire, lineFromWire, linePoints, projectOnSegment, resolveEndpoint, wirePoints } from './geometry';
import { normalizeWire, routeEditedWire } from './wires';
import type { WireCandidate, WireDraft } from './wires';
import type { WireExitAxes } from './geometry';

export function graphicEndpoint(candidate: WireCandidate): Endpoint {
  return candidate.kind === 'wire' || candidate.endpoint.kind === 'free'
    ? { kind: 'free', point: { ...candidate.point } }
    : candidate.endpoint;
}
export function beginLine(candidate: WireCandidate, routing: WireRouting): WireDraft {
  return { kind: 'line', start: graphicEndpoint(candidate), vertices: [], routing,
    startAxis: candidate.kind === 'wire' ? candidate.exitAxis : undefined };
}
export function routeEditedLine(line: LineAnnotation, doc: CircuitDocument, axes: WireExitAxes = {}) {
  return lineFromWire(line, routeEditedWire(lineAsWire(line), doc, axes), doc);
}
export function commitLine(doc: CircuitDocument, draft: WireDraft, candidate: WireCandidate) {
  const start = resolveEndpoint(draft.start, doc), end = graphicEndpoint(candidate),
    line = routeEditedLine({ ...createLine(start, resolveEndpoint(end, doc)),
      startEndpoint: draft.start, endEndpoint: end, vertices: draft.vertices, routing: draft.routing },
      doc, { start: draft.startAxis, end: candidate.kind === 'wire' ? candidate.exitAxis : undefined });
  const points = linePoints(line, doc);
  if (points.every((point) => distance(point, points[0]) < 0.001)) return null;
  return { doc: { ...doc, objects: [...doc.objects, normalizeLine(line, doc)] }, wireId: line.id };
}
export function nearestLinePoint(point: Point, line: LineAnnotation, doc: CircuitDocument) {
  const points = linePoints(line, doc);
  let gap = Infinity, segment = 0, projected = points[0];
  for (let i = 1; i < points.length; i++) {
    const p = projectOnSegment(point, points[i - 1], points[i]), d = distance(point, p);
    if (d < gap) { gap = d; segment = i - 1; projected = p; }
  }
  return { points, segment, point: projected, gap };
}
export function detachLineEndpoints(line: LineAnnotation, detach: (endpoint: Endpoint) => Endpoint, doc: CircuitDocument) {
  const wire = lineAsWire(line), startEndpoint = detach(wire.startEndpoint), endEndpoint = detach(wire.endEndpoint);
  return startEndpoint === wire.startEndpoint && endEndpoint === wire.endEndpoint ? line :
    lineFromWire(line, { ...wire, startEndpoint, endEndpoint, vertices: wirePoints(wire, doc).slice(1, -1) }, doc);
}

export function normalizeLine(line: LineAnnotation, doc: CircuitDocument) {
  return lineFromWire(line, normalizeWire(lineAsWire(line), doc), doc);
}
