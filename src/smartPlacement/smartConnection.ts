import { componentRegistry, createComponent, makeId } from '../model/catalog';
import type {
  CircuitComponent,
  CircuitDocument,
  ComponentType,
  Endpoint,
  Point,
  Rotation,
  Wire,
} from '../model/types';
import { createWire } from '../model/factories';
import { rotatePoint } from '../utils/geometry';
import { resolveWireCandidate, normalizeDocumentWires, remapSplitWireCurrents } from '../utils/wires';
import type { PlacementPreview } from './types';

export function placementComponent(
  doc: CircuitDocument,
  type: ComponentType,
  position: Point,
  rotation: Rotation,
): CircuitComponent {
  const prefix = componentRegistry[type].prefix;
  const used = new Set(doc.objects.filter((o) => o.kind === 'component').map((o) => o.label.text));
  let n = 1;
  while (used.has(`${prefix}_${n}`)) n++;
  const component = createComponent(type, position, n);
  component.rotation = rotation;
  component.label.offset = rotatePoint(component.label.offset, rotation);
  return component;
}
export function connectionWire(start: Endpoint, end: Endpoint): Wire {
  return createWire(start, end);
}
/** Build a complete immutable result; the caller commits once, including all wire splits. */
export function smartPlacement(
  doc: CircuitDocument,
  type: ComponentType,
  preview: PlacementPreview,
): {
  doc: CircuitDocument;
  component: CircuitComponent;
  continueEndpoint: Endpoint | null;
} {
  const component = placementComponent(doc, type, preview.position, preview.rotation);
  const terminal = (terminalId: string): Endpoint => ({
    kind: 'terminal',
    componentId: component.id,
    terminalId,
  });
  if (preview.phase === 'inline-candidate') {
    const c = preview.candidate,
      original = c.segment.wire;
    const first: Wire = {
      ...original,
      endEndpoint: terminal(c.terminalIds[0]),
      vertices: c.segment.points.slice(1, c.segment.segment + 1),
    };
    const second: Wire = {
      ...original,
      id: makeId(),
      startEndpoint: terminal(c.terminalIds[1]),
      vertices: c.segment.points.slice(c.segment.segment + 1, -1),
    };
    const result = {
      ...doc,
      objects: doc.objects
        .flatMap((o) => (o.id === original.id ? [first, second] : [o]))
        .concat(component),
    };
    return {
      doc: remapSplitWireCurrents(
        doc,
        normalizeDocumentWires(result),
        new Map([[original.id, [first.id, second.id]]]),
      ),
      component,
      continueEndpoint: null,
    };
  }
  let target: Endpoint | null = null,
    terminalId: string | null = null,
    result = doc;
  if (preview.phase === 'snapped') {
    const c = preview.candidate;
    terminalId = c.terminalId;
    if (c.kind === 'wire') {
      const connection = resolveWireCandidate(doc, {
        kind: 'wire', wireId: c.segment.wire.id, point: c.point,
      });
      result = connection.doc;
      target = connection.endpoint;
    } else target = c.target.endpoint;
  } else if (preview.phase === 'anchored') {
    target = preview.target.endpoint;
    terminalId = preview.terminalId;
  }
  result = {
    ...result,
    objects: [
      ...result.objects,
      component,
      ...(target && terminalId ? [connectionWire(target, terminal(terminalId))] : []),
    ],
  };
  const free =
    component.terminals.length === 2 && terminalId
      ? component.terminals.find((t) => t.id !== terminalId)
      : null;
  return { doc: result, component, continueEndpoint: free ? terminal(free.id) : null };
}
