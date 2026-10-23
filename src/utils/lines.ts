import type { CircuitDocument, Endpoint, LineAnnotation, Point, WireRouting } from '../model/types';
import { createLine } from '../model/factories';
import { add, distance, lineAsWire, lineCurveGeometry, lineFromWire, linePath, linePoints, projectOnSegment, resolveEndpoint, wirePoints } from './geometry';
import { normalizeWire, routeEditedWire } from './wires';
import type { WireCandidate, WireDraft } from './wires';
import type { WireExitAxes } from './geometry';

export function graphicEndpoint(candidate: WireCandidate): Endpoint {
  return candidate.kind === 'wire' || candidate.endpoint.kind === 'free'
    ? { kind: 'free', point: { ...candidate.point } }
    : candidate.endpoint;
}
export function beginLine(candidate: WireCandidate, routing: WireRouting, curve = false): WireDraft {
  return { kind: 'line', curve, start: graphicEndpoint(candidate), vertices: [], routing: curve ? 'free' : routing,
    startAxis: candidate.kind === 'wire' ? candidate.exitAxis : undefined };
}
export function routeEditedLine(line: LineAnnotation, doc: CircuitDocument, axes: WireExitAxes = {}) {
  if (line.controlPoints) {
    const { start, end, controls } = lineCurveGeometry(line, doc);
    return { ...line, start, end, controlPoints: controls, vertices: [], routing: 'free' as const };
  }
  return lineFromWire(line, routeEditedWire(lineAsWire(line), doc, axes), doc);
}
export function setLineRouting(line: LineAnnotation, routing: WireRouting | 'curve', doc: CircuitDocument): LineAnnotation {
  const start = linePoints(line, doc)[0], end = linePoints(line, doc).at(-1)!;
  if (routing === 'curve') return routeEditedLine({ ...line, start, end,
    controlPoints: lineCurveGeometry(line, doc).controls }, doc);
  return routeEditedLine({ ...line, start, end, controlPoints: undefined, routing }, doc);
}
export function moveLineEndpoint(line: LineAnnotation, side: 'start' | 'end', endpoint: Endpoint,
  doc: CircuitDocument): LineAnnotation {
  const point = resolveEndpoint(endpoint, doc), geometry = lineCurveGeometry(line, doc),
    controls: [Point, Point] = [...geometry.controls], index = side === 'start' ? 0 : 1;
  controls[index] = add(controls[index], { x: point.x - geometry[side].x, y: point.y - geometry[side].y });
  return { ...line, start: geometry.start, end: geometry.end, [side]: point,
    ...(line.controlPoints ? { controlPoints: controls } : {}),
    [side === 'start' ? 'startEndpoint' : 'endEndpoint']: endpoint.kind === 'free' ? undefined : endpoint };
}
export function linePreviewPath(draft: WireDraft, candidate: WireCandidate, doc: CircuitDocument) {
  const line = createLine(resolveEndpoint(draft.start, doc), candidate.point);
  return linePath({ ...line, controlPoints: lineCurveGeometry(line).controls });
}
export function commitLine(doc: CircuitDocument, draft: WireDraft, candidate: WireCandidate) {
  const start = resolveEndpoint(draft.start, doc), end = graphicEndpoint(candidate),
    line = routeEditedLine({ ...createLine(start, resolveEndpoint(end, doc)),
      startEndpoint: draft.start, endEndpoint: end, vertices: draft.vertices, routing: draft.routing },
      doc, { start: draft.startAxis, end: candidate.kind === 'wire' ? candidate.exitAxis : undefined });
  const finalLine = draft.curve ? setLineRouting(line, 'curve', doc) : line;
  const points = linePoints(finalLine, doc);
  if (points.every((point) => distance(point, points[0]) < 0.001)) return null;
  return { doc: { ...doc, objects: [...doc.objects, normalizeLine(finalLine, doc)] }, wireId: line.id };
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
    lineFromWire(line, { ...wire, startEndpoint, endEndpoint,
      vertices: line.controlPoints ? lineCurveGeometry(line, doc).controls : wirePoints(wire, doc).slice(1, -1) }, doc);
}

export function normalizeLine(line: LineAnnotation, doc: CircuitDocument) {
  if (line.controlPoints) return routeEditedLine(line, doc);
  return lineFromWire(line, normalizeWire(lineAsWire(line), doc), doc);
}
