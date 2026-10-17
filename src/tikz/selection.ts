import { detachHighlight } from '../annotations/highlight';
import { detachElectrical } from '../annotations/electrical';
import type { CircuitDocument, Endpoint, Wire } from '../model/types';
import { moveObject, resolveEndpoint, wirePoints } from '../utils/geometry';
import { contentBounds, unionBounds } from '../utils/visualBounds';
import { exportTikz, exportObsidian } from './exporter';

/** Selection closure uses model IDs only. Labels are owned by their objects;
 * internal connections may pass through unselected Junctions, never through
 * an unselected component or a coincident, unconnected wire crossing. */
export function getExportSelection(doc: CircuitDocument, ids: readonly string[]): CircuitDocument {
  const objectsById = new Map(doc.objects.map((o) => [o.id, o]));
  const selected = new Set(ids.filter((id) => objectsById.has(id))),
    included = new Set(selected),
    anchors = new Set<string>();
  const key = (ep: Endpoint): string | null => {
    if (ep.kind === 'terminal' && selected.has(ep.componentId))
      return `terminal:${ep.componentId}:${ep.terminalId}`;
    if (ep.kind === 'junction' && objectsById.get(ep.junctionId)?.kind === 'junction')
      return `junction:${ep.junctionId}`;
    return null;
  };
  for (const o of doc.objects) {
    if (o.kind === 'component' && selected.has(o.id))
      for (const t of o.terminals) anchors.add(`terminal:${o.id}:${t.id}`);
    if (o.kind === 'junction' && selected.has(o.id)) anchors.add(`junction:${o.id}`);
    if (o.kind === 'wire' && selected.has(o.id))
      for (const ep of [o.startEndpoint, o.endEndpoint])
        if (ep.kind === 'junction' && objectsById.has(ep.junctionId)) {
          included.add(ep.junctionId);
          anchors.add(`junction:${ep.junctionId}`);
        }
  }
  // Prune dangling, unselected Junction branches from the induced connection
  // graph. Retain a region only when it joins at least two included endpoints.
  const graph = new Map<string, Set<Wire>>();
  const nodes = new Map<Wire, [string, string]>();
  for (const o of doc.objects) {
    if (o.kind !== 'wire') continue;
    const a = key(o.startEndpoint),
      b = key(o.endEndpoint);
    if (!a || !b) continue;
    nodes.set(o, [a, b]);
    for (const n of [a, b]) {
      if (!graph.has(n)) graph.set(n, new Set());
      graph.get(n)!.add(o);
    }
  }
  const queue = [...graph.keys()].filter((n) => !anchors.has(n) && graph.get(n)!.size < 2);
  for (let i = 0; i < queue.length; i++) {
    const n = queue[i];
    for (const edge of graph.get(n) ?? []) {
      for (const other of nodes.get(edge)!) {
        if (other === n) continue;
        const edges = graph.get(other);
        if (edges?.delete(edge) && !anchors.has(other) && edges.size === 1) queue.push(other);
      }
    }
    graph.delete(n);
  }
  const visited = new Set<string>();
  for (const n of graph.keys()) {
    if (visited.has(n)) continue;
    const region = [n],
      edges = new Set<Wire>();
    visited.add(n);
    let count = 0;
    for (let i = 0; i < region.length; i++) {
      const node = region[i];
      if (anchors.has(node)) count++;
      for (const edge of graph.get(node) ?? []) {
        edges.add(edge);
        for (const other of nodes.get(edge)!)
          if (!visited.has(other)) {
            visited.add(other);
            region.push(other);
          }
      }
    }
    if (count < 2) continue;
    for (const edge of edges) included.add(edge.id);
    for (const node of region)
      if (node.startsWith('junction:')) included.add(node.slice('junction:'.length));
  }
  // Current/polarity annotations have an explicit semantic host in the model.
  for (const o of doc.objects)
    if (
      (o.kind === 'highlight' &&
        ((o.mode === 'smart' && o.spans.every((s) => included.has(s.wireId))) ||
          (o.mode === 'component' && included.has(o.componentId)))) ||
      (o.kind === 'electrical' &&
        ((o.componentId && included.has(o.componentId)) ||
          (o.wireId && included.has(o.wireId))))
    )
      included.add(o.id);
  const endpoint = (ep: Endpoint): Endpoint =>
    ep.kind === 'terminal' && !included.has(ep.componentId)
      ? { kind: 'free', point: resolveEndpoint(ep, doc) }
      : ep;
  const objects = doc.objects
    .filter((o) => included.has(o.id))
    .map((o) => {
      if (
        o.kind === 'highlight' &&
        ((o.mode === 'smart' && o.spans.some((s) => !included.has(s.wireId))) ||
          (o.mode === 'component' && !included.has(o.componentId)))
      )
        return detachHighlight(o, doc);
      if (
        o.kind === 'electrical' &&
        ((o.wireId && !included.has(o.wireId)) || (o.componentId && !included.has(o.componentId)))
      )
        return detachElectrical(o, doc);
      if (o.kind !== 'wire') return o;
      const startEndpoint = endpoint(o.startEndpoint),
        endEndpoint = endpoint(o.endEndpoint);
      // Preserve an explicitly selected wire's route when external pins become free.
      return {
        ...o,
        startEndpoint,
        endEndpoint,
        vertices:
          startEndpoint !== o.startEndpoint || endEndpoint !== o.endEndpoint
            ? wirePoints(o, doc).slice(1, -1)
            : o.vertices,
      };
    });
  if (!objects.length) return { ...doc, objects: [] };
  const subset = { ...doc, objects },
    bounds = unionBounds(objects.map((o) => contentBounds(o, subset)));
  return {
    ...subset,
    objects: objects.map((o) => moveObject(o, { x: -bounds.x, y: -bounds.y }, included)),
  };
}
/** Kept as the existing public name for callers and export helpers. */
export const selectionDocument = getExportSelection;
export const exportSelectionTikz = (doc: CircuitDocument, ids: string[]) =>
  exportTikz(selectionDocument(doc, ids));
export const exportSelectionObsidian = (doc: CircuitDocument, ids: string[]) =>
  exportObsidian(selectionDocument(doc, ids));
