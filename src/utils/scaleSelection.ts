import type { CircuitDocument, CircuitObject, Endpoint, Point } from '../model/types';
import { detachHighlight, mapHighlight, highlightSpanHost } from '../annotations/highlight';
import { detachElectrical } from '../annotations/electrical';
import { frameSelection } from '../model/shapeAppearance';
import { fixedWireConnection, midpoint, wirePoints } from './geometry';
import { measurementBounds } from './measurementGeometry';
import { unionBounds } from './visualBounds';

/** Uniformly scales authored geometry, typography and stroke weights in one
 * edit. External electrical anchors remain attached to their original hosts. */
export function scaleSelection(doc: CircuitDocument, ids: string[], factor: number): CircuitDocument {
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return doc;
  const selected = new Set(frameSelection(doc, ids));
  const b = unionBounds(doc.objects.filter((o) => selected.has(o.id)).map((o) => measurementBounds(o, doc)));
  const center = { x: b.x+b.width/2, y: b.y+b.height/2 };
  const point = (p: Point): Point => ({ x: center.x+(p.x-center.x)*factor, y: center.y+(p.y-center.y)*factor });
  const vector = (p: Point): Point => ({ x: p.x*factor, y: p.y*factor });
  const endpoint = (ep: Endpoint): Endpoint => ep.kind === 'free' && !fixedWireConnection(ep, doc, selected) ? { ...ep, point: point(ep.point) } : ep;
  const length = (n: number | undefined) => n === undefined ? undefined : n*factor;
  return { ...doc, objects: doc.objects.map((original): CircuitObject => {
    if (!selected.has(original.id)) {
      if (original.kind === 'wire' && (!original.routing || original.routing === 'orthogonal') && !original.vertices.length &&
        [original.startEndpoint, original.endEndpoint].some((ep) => ep.kind === 'terminal' && selected.has(ep.componentId))) {
        const route = wirePoints(original, doc), vertices = route.slice(1, -1);
        return { ...original, vertices: vertices.length ? vertices : [midpoint(route[0], route.at(-1)!)] };
      }
      return original;
    }
    let o = original;
    if (o.kind === 'electrical' && ((o.componentId && !selected.has(o.componentId)) || (o.wireId && !selected.has(o.wireId)))) o = detachElectrical(o, doc);
    if (o.kind === 'highlight' && ((o.mode === 'component' && !selected.has(o.componentId)) || (o.mode === 'smart' && !o.spans.every((span) => selected.has(highlightSpanHost(span)))))) o = detachHighlight(o, doc);
    if (o.borders) o = { ...o, borders: o.borders.map((paint) => ({ ...paint, width: paint.width*factor, dashLength: length(paint.dashLength), dashGap: length(paint.dashGap) })) };
    const label = 'label' in o ? { label: { ...o.label, offset: vector(o.label.offset), fontSize: o.label.fontSize*factor } } : {};
    if (o.kind === 'component') return { ...o, ...point(o), ...label, scale: (o.scale ?? 1)*factor, width: o.width*factor };
    if (o.kind === 'angle') return { ...o, ...point(o), ...label, radius: o.radius*factor, width: o.width*factor,
      dashLength: length(o.dashLength), dashGap: length(o.dashGap) };
    if (o.kind === 'junction') return { ...o, ...point(o), ...label, radius: (o.radius ?? 4.5)*factor };
    if (o.kind === 'text') return { ...o, ...point(o), fontSize: o.fontSize*factor };
    if (o.kind === 'rectangle' || o.kind === 'circle') return { ...o, ...point(o), width: o.width*factor, height: o.height*factor,
      strokeWidth: o.borders ? o.strokeWidth : o.strokeWidth*factor, dashLength: o.borders ? o.dashLength : length(o.dashLength), dashGap: o.borders ? o.dashGap : length(o.dashGap),
      cornerRadii: o.cornerRadii?.map((r) => r*factor) as typeof o.cornerRadii,
      ...(o.kind === 'rectangle' && o.frame ? { frame: { ...o.frame, gap: o.frame.gap*factor, padding: o.frame.padding.map((p) => p*factor) as typeof o.frame.padding } } : {}),
    };
    if (o.kind === 'loop-arrow') return { ...o, ...point(o), width: o.width*factor, height: o.height*factor, strokeWidth: o.strokeWidth*factor };
    if (o.kind === 'highlight') {
      const next = mapHighlight(o, point);
      return { ...next, width: next.width*factor, ...(next.mode === 'free' ? { widthOffsets: next.widthOffsets?.map((v) => v*factor) } : {}) };
    }
    if (o.kind === 'wire') return { ...o, startEndpoint: endpoint(o.startEndpoint), endEndpoint: endpoint(o.endEndpoint), vertices: o.vertices.map(point), width: o.width*factor,
      dashLength: length(o.dashLength), dashGap: length(o.dashGap) };
    if (o.kind === 'line') return { ...o, start: point(o.start), end: point(o.end), startEndpoint: o.startEndpoint && endpoint(o.startEndpoint), endEndpoint: o.endEndpoint && endpoint(o.endEndpoint),
      controlPoints: o.controlPoints?.map(point) as typeof o.controlPoints, vertices: o.vertices?.map(point), width: o.width*factor,
      dashLength: length(o.dashLength), dashGap: length(o.dashGap) };
    if (o.kind === 'arrow') return { ...o, start: point(o.start), end: point(o.end), controlPoints: o.controlPoints.map(point) as typeof o.controlPoints, width: o.width*factor };
    if (o.kind === 'electrical') return { ...o, start: point(o.start), end: point(o.end), offset: vector(o.offset), ...label, width: o.width*factor };
    return { ...o, start: point(o.start), end: point(o.end), ...label, width: o.width*factor };
  }) };
}
