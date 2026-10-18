import {
  detachHighlight,
  highlightPoints,
  highlightSpanHost,
  mapHighlight,
} from '../annotations/highlight';
import { detachElectrical } from '../annotations/electrical';
import { rotateArrow } from './arrows';
import { makeId } from '../model/catalog';
import {
  add,
  moveObject,
  objectBounds,
  resolveEndpoint,
  rotatePoint,
  wirePoints,
  midpoint,
  fixedWireConnection,
} from './geometry';
import type { CircuitDocument, CircuitObject, Endpoint, Point, Rotation } from '../model/types';
export function extractSelection(doc: CircuitDocument, ids: string[]): CircuitDocument {
  const selected = new Set(ids);
  const ep = (e: Endpoint): Endpoint =>
    (e.kind === 'terminal' && !selected.has(e.componentId)) ||
    (e.kind === 'junction' && !selected.has(e.junctionId))
      ? { kind: 'free', point: resolveEndpoint(e, doc) }
      : e;
  return {
    ...doc,
    objects: doc.objects
      .filter((o) => selected.has(o.id))
      .map((o) =>
        o.kind === 'highlight' &&
        ((o.mode === 'smart' && o.spans.some((s) => !selected.has(highlightSpanHost(s)))) ||
          (o.mode === 'component' && !selected.has(o.componentId)))
          ? detachHighlight(o, doc)
          : o.kind === 'electrical' &&
              ((o.wireId && !selected.has(o.wireId)) ||
                (o.componentId && !selected.has(o.componentId)))
            ? detachElectrical(o, doc)
            : o.kind === 'wire'
              ? detachWireEndpoints(o, ep, doc)
              : o,
      ),
  };
}
export function cloneObjects(
  doc: CircuitDocument,
  delta: Point,
  existing: CircuitDocument = doc,
): CircuitObject[] {
  const ids = new Map(doc.objects.map((o) => [o.id, makeId()]));
  const connections = new Map<string, string>();
  const paintGroups = new Map<string, string>();
  const remap = (e: Endpoint): Endpoint => {
    if (e.kind === 'terminal') return { ...e, componentId: ids.get(e.componentId)! };
    if (e.kind === 'junction') return { ...e, junctionId: ids.get(e.junctionId)! };
    if (!e.connectionId) return e;
    const id = connections.get(e.connectionId) ?? makeId();
    connections.set(e.connectionId, id);
    return { ...e, connectionId: id };
  };
  const labels = new Set(
    existing.objects.filter((o) => o.kind === 'component').map((o) => o.label.text),
  );
  return doc.objects.map((o) => {
    const copy = structuredClone(o);
    copy.id = ids.get(o.id)!;
    if (copy.kind === 'highlight' && copy.paintGroup) {
      const group = paintGroups.get(copy.paintGroup) ?? makeId();
      paintGroups.set(copy.paintGroup, group);
      copy.paintGroup = group;
    }
    if (copy.kind === 'component') {
      const auto = /^(.*?)([_]?)(\d+)$/.exec(copy.label.text);
      if (auto) {
        let index = Number(auto[3]) + 1;
        while (labels.has(`${auto[1]}${auto[2]}${index}`)) index++;
        copy.label.text = `${auto[1]}${auto[2]}${index}`;
        labels.add(copy.label.text);
      }
    }
    if (copy.kind === 'highlight' && copy.mode === 'smart')
      copy.spans = copy.spans.map((s) =>
        'wireId' in s
          ? { ...s, wireId: ids.get(s.wireId)! }
          : { ...s, componentId: ids.get(s.componentId)! },
      );
    if (copy.kind === 'highlight' && copy.mode === 'component')
      copy.componentId = ids.get(copy.componentId)!;
    if (copy.kind === 'electrical') {
      if (copy.wireId) copy.wireId = ids.get(copy.wireId);
      if (copy.componentId) copy.componentId = ids.get(copy.componentId);
    }
    if (copy.kind === 'wire') {
      copy.startEndpoint = remap(copy.startEndpoint);
      copy.endEndpoint = remap(copy.endEndpoint);
    }
    return moveObject(copy, delta, new Set(ids.values()));
  });
}
export function removeObjects(doc: CircuitDocument, ids: string[]): CircuitDocument {
  const removed = new Set(ids);
  const ep = (e: Endpoint): Endpoint =>
    (e.kind === 'terminal' && removed.has(e.componentId)) ||
    (e.kind === 'junction' && removed.has(e.junctionId))
      ? { kind: 'free', point: resolveEndpoint(e, doc) }
      : e;
  return {
    ...doc,
    objects: doc.objects
      .filter((o) => !removed.has(o.id))
      .map((o) =>
        o.kind === 'highlight' &&
        ((o.mode === 'smart' && o.spans.some((s) => removed.has(highlightSpanHost(s)))) ||
          (o.mode === 'component' && removed.has(o.componentId)))
          ? detachHighlight(o, doc)
          : o.kind === 'electrical' &&
              ((o.wireId && removed.has(o.wireId)) || (o.componentId && removed.has(o.componentId)))
            ? detachElectrical(o, doc)
            : o.kind === 'wire'
              ? detachWireEndpoints(o, ep, doc)
              : o,
      ),
  };
}
/** Freeze the visible route before terminal direction is lost on detachment. */
function detachWireEndpoints(
  wire: Extract<CircuitObject, { kind: 'wire' }>,
  detach: (endpoint: Endpoint) => Endpoint,
  doc: CircuitDocument,
) {
  const startEndpoint = detach(wire.startEndpoint),
    endEndpoint = detach(wire.endEndpoint);
  return {
    ...wire,
    startEndpoint,
    endEndpoint,
    vertices:
      startEndpoint !== wire.startEndpoint || endEndpoint !== wire.endEndpoint
        ? wirePoints(wire, doc).slice(1, -1)
        : wire.vertices,
  };
}
/** Shared geometric move used by pointer dragging and keyboard nudging. */
export function moveSelection(doc: CircuitDocument, ids: string[], delta: Point): CircuitDocument {
  const selected = new Set(ids);
  const attachedToSelection = (ep: Endpoint) =>
    ep.kind === 'terminal'
      ? selected.has(ep.componentId)
      : ep.kind === 'junction' && selected.has(ep.junctionId);
  return {
    ...doc,
    objects: doc.objects.map((o) => {
      if (!selected.has(o.id)) {
        if (
          o.kind === 'wire' &&
          (!o.routing || o.routing === 'orthogonal') &&
          !o.vertices.length &&
          (delta.x || delta.y) &&
          (attachedToSelection(o.startEndpoint) || attachedToSelection(o.endEndpoint))
        ) {
          // Auto-routing has no stored bends: freeze the existing path before an
          // attached object moves, so the distant branch stays where it was.
          const points = wirePoints(o, doc);
          if (points.length > 2) {
            const vertices = points.slice(1, -1).map((point) => ({ ...point }));
            if (attachedToSelection(o.startEndpoint)) {
              const axis = points[0].x === points[1].x ? 'x' : 'y';
              vertices[0][axis] += delta[axis];
            }
            if (attachedToSelection(o.endEndpoint)) {
              const axis = points.at(-1)!.x === points.at(-2)!.x ? 'x' : 'y';
              vertices.at(-1)![axis] += delta[axis];
            }
            return { ...o, vertices };
          }
          const first = points[0],
            last = points.at(-1)!;
          if ((first.x === last.x && delta.x !== 0) || (first.y === last.y && delta.y !== 0))
            return { ...o, vertices: [midpoint(first, last)] };
        }
        return o;
      }
      if (o.kind === 'wire') {
        const fixed = (ep: Endpoint) =>
          ep.kind === 'terminal'
            ? !selected.has(ep.componentId)
            : ep.kind === 'junction'
              ? !selected.has(ep.junctionId)
              : fixedWireConnection(ep, doc, selected);
        const startFixed = fixed(o.startEndpoint),
          endFixed = fixed(o.endEndpoint);
        let source = o;
        if (!o.vertices.length && (startFixed || endFixed)) {
          const pts = wirePoints(o, doc);
          const vertices =
            pts.length > 2 ? pts.slice(1, -1) : [midpoint(pts[0], pts[pts.length - 1])];
          source = { ...o, vertices };
        }
        const moved = moveObject(source, delta, selected);
        if (moved.kind !== 'wire') return moved;
        return {
          ...moved,
          startEndpoint: startFixed ? o.startEndpoint : moved.startEndpoint,
          endEndpoint: endFixed ? o.endEndpoint : moved.endEndpoint,
        };
      }
      return moveObject(o, delta, selected);
    }),
  };
}
export function rotateObjects(
  doc: CircuitDocument,
  ids: string[],
  increment?: Rotation,
): CircuitDocument {
  const selected = new Set(ids),
    objects = doc.objects.filter((o) => selected.has(o.id));
  if (!objects.length || increment === 0) return doc;
  if (objects.length === 1 && objects[0].kind === 'circle') return doc;
  const angle: Rotation = increment ?? (objects.some((o) => o.kind === 'component') ? 45 : 90);
  const boxes = objects.map((o) => objectBounds(o, doc));
  const minX = Math.min(...boxes.map((b) => b.x)),
    maxX = Math.max(...boxes.map((b) => b.x + b.width)),
    minY = Math.min(...boxes.map((b) => b.y)),
    maxY = Math.max(...boxes.map((b) => b.y + b.height));
  const anchors = objects.map((o): Point => {
    if ('x' in o)
      return o.kind === 'loop-arrow' || o.kind === 'circle'
        ? { x: o.x + o.width / 2, y: o.y + o.height / 2 }
        : { x: o.x, y: o.y };
    if (o.kind === 'wire')
      return midpoint(resolveEndpoint(o.startEndpoint, doc), resolveEndpoint(o.endEndpoint, doc));
    if (o.kind === 'highlight') {
      const p = highlightPoints(o, doc);
      return midpoint(p[0], p.at(-1)!);
    }
    return midpoint(o.start, o.end);
  });
  const center =
    objects.length === 1 && objects[0].kind === 'component'
      ? { x: objects[0].x, y: objects[0].y }
      : objects.length === 1 && objects[0].kind === 'brace'
        ? midpoint(objects[0].start, objects[0].end)
        : angle === 45
          ? {
              x: anchors.reduce((sum, p) => sum + p.x, 0) / anchors.length,
              y: anchors.reduce((sum, p) => sum + p.y, 0) / anchors.length,
            }
          : { x: Math.round((minX + maxX) / 40) * 20, y: Math.round((minY + maxY) / 40) * 20 };
  const rp = (p: Point) =>
    add(rotatePoint({ x: p.x - center.x, y: p.y - center.y }, angle), center);
  const next = (r: Rotation) => ((r + angle) % 360) as Rotation;
  const ep = (e: Endpoint): Endpoint =>
    e.kind === 'free' && !fixedWireConnection(e, doc, selected) ? { ...e, point: rp(e.point) } : e;
  return {
    ...doc,
    objects: doc.objects.map((o) => {
      if (!selected.has(o.id)) {
        if (
          o.kind === 'wire' &&
          (!o.routing || o.routing === 'orthogonal') &&
          !o.vertices.length &&
          [o.startEndpoint, o.endEndpoint].some(
            (endpoint) => endpoint.kind === 'terminal' && selected.has(endpoint.componentId),
          )
        ) {
          // Keep the distant branch stable as its terminal rotates. Stored
          // waypoints remain authored geometry; only the endpoint route adapts.
          const points = wirePoints(o, doc),
            vertices = points.slice(1, -1);
          return {
            ...o,
            vertices: vertices.length ? vertices : [midpoint(points[0], points.at(-1)!)],
          };
        }
        return o;
      }
      if (o.kind === 'highlight') {
        if (o.mode === 'smart' && o.spans.every((s) => selected.has(highlightSpanHost(s))))
          return o;
        if (o.mode === 'component' && selected.has(o.componentId)) return o;
        const free = detachHighlight(o, doc);
        return mapHighlight(free, rp);
      }
      if (o.kind === 'component')
        return {
          ...o,
          ...rp(o),
          rotation: next(o.rotation),
          label: { ...o.label, offset: rotatePoint(o.label.offset, angle) },
        };
      if (o.kind === 'junction') return { ...o, ...rp(o) };
      if (o.kind === 'text') return { ...o, ...rp(o), rotation: next(o.rotation) };
      if (o.kind === 'loop-arrow') return rotateArrow(o, angle, center);
      if (o.kind === 'electrical') {
        const attached =
          (o.wireId && !selected.has(o.wireId)) || (o.componentId && !selected.has(o.componentId));
        const base = attached ? detachElectrical(o, doc) : o;
        return {
          ...base,
          start: rp(base.start),
          end: rp(base.end),
          offset: rotatePoint(base.offset, angle),
          label: { ...base.label, offset: rotatePoint(base.label.offset, angle) },
        };
      }
      if (o.kind === 'brace') {
        // Brace baselines retain their supported orthogonal orientation while
        // their center follows a mixed component selection through 45 degrees.
        const originalCenter = midpoint(o.start, o.end),
          rotatedCenter = rp(originalCenter),
          baseline = (p: Point) =>
            add(
              rotatePoint({ x: p.x - originalCenter.x, y: p.y - originalCenter.y }, 90),
              rotatedCenter,
            );
        return {
          ...o,
          start: baseline(o.start),
          end: baseline(o.end),
          label: { ...o.label, offset: rotatePoint(o.label.offset, 90) },
        };
      }
      if (o.kind === 'rectangle' || o.kind === 'circle') {
        // Rectangles stay axis aligned; quarter turns exchange dimensions.
        const c = rp({ x: o.x + o.width / 2, y: o.y + o.height / 2 });
        const width = angle === 90 ? o.height : o.width,
          height = angle === 90 ? o.width : o.height;
        return { ...o, x: c.x - width / 2, y: c.y - height / 2, width, height };
      }
      if (o.kind === 'line') return { ...o, start: rp(o.start), end: rp(o.end) };
      if (o.kind === 'arrow') return rotateArrow(o, angle, center);
      return {
        ...o,
        startEndpoint: ep(o.startEndpoint),
        endEndpoint: ep(o.endEndpoint),
        vertices: o.vertices.map(rp),
      };
    }),
  };
}
