import { t } from '../i18n';
import { componentRegistry, terminalsFor } from './catalog';
import type { CircuitComponent, CircuitDocument, ComponentType, Endpoint } from './types';
export function compatibleReplacements(c: CircuitComponent): ComponentType[] {
  const pairs: ComponentType[][] = [
    ['npn', 'pnp'],
    ['nmos', 'pmos'],
    ['njfet', 'pjfet'],
    ['opAmp', 'comparator'],
  ];
  const group = pairs.find((types) => types.includes(c.type));
  const originalPins = componentRegistry[c.type].terminals;
  return Object.keys(componentRegistry).filter((type): type is ComponentType => {
    if (type === c.type) return false;
    if (group) return group.includes(type as ComponentType);
    const pins = componentRegistry[type as ComponentType].terminals;
    return (
      c.terminals.length === 2 &&
      pins.length === 2 &&
      pins.every(
        (t, i) =>
          t.localX === c.terminals[i].localX &&
          t.localY === c.terminals[i].localY &&
          t.direction === (c.terminals[i].direction ?? originalPins[i]?.direction),
      )
    );
  });
}
export function replaceComponent(
  doc: CircuitDocument,
  id: string,
  type: ComponentType,
): CircuitDocument {
  const old = doc.objects.find((o) => o.id === id);
  if (old?.kind !== 'component' || !compatibleReplacements(old).includes(type))
    throw new Error(t('Incompatible replacement.'));
  const pins = terminalsFor(type);
  const mapping = new Map(old.terminals.map((t, i) => [t.id, pins[i].id]));
  const remap = (ep: Endpoint): Endpoint => ep.kind === 'terminal' && ep.componentId === id
    ? { ...ep, terminalId: mapping.get(ep.terminalId)! } : ep;
  const component: CircuitComponent = { ...old, type, terminals: pins };
  // Labels have no explicit provenance: preserve them rather than guessing.
  if (componentRegistry[type].internalText === undefined) delete component.bodyText;
  else component.bodyText = old.bodyText ?? componentRegistry[type].internalText;
  return {
    ...doc,
    objects: doc.objects.map((o) =>
      o.id === id
        ? component
        : o.kind === 'highlight' && o.mode === 'smart'
          ? {
              ...o,
              spans: o.spans.map((span) =>
                'componentId' in span && span.componentId === id
                  ? { ...span, terminalId: mapping.get(span.terminalId)! }
                  : span,
              ),
            }
          : o.kind === 'line'
            ? { ...o, startEndpoint: o.startEndpoint && remap(o.startEndpoint),
                endEndpoint: o.endEndpoint && remap(o.endEndpoint) }
          : o.kind === 'wire'
            ? {
                ...o,
                startEndpoint:
                  o.startEndpoint.kind === 'terminal' && o.startEndpoint.componentId === id
                    ? {
                        ...o.startEndpoint,
                        terminalId: mapping.get(o.startEndpoint.terminalId)!,
                      }
                    : o.startEndpoint,
                endEndpoint:
                  o.endEndpoint.kind === 'terminal' && o.endEndpoint.componentId === id
                    ? {
                        ...o.endEndpoint,
                        terminalId: mapping.get(o.endEndpoint.terminalId)!,
                      }
                    : o.endEndpoint,
              }
            : o,
    ),
  };
}

export function commonReplacements(components: CircuitComponent[]): ComponentType[] {
  if (!components.length) return [];
  const types = Object.keys(componentRegistry) as ComponentType[];
  let candidates = new Set(types);
  const originals = new Set<ComponentType>();
  for (const component of components) {
    originals.add(component.type);
    const allowed = new Set([component.type, ...compatibleReplacements(component)]);
    candidates = new Set([...candidates].filter((type) => allowed.has(type)));
    if (!candidates.size) return [];
  }
  return types.filter(
    (type) => candidates.has(type) && (originals.size > 1 || !originals.has(type)),
  );
}

export function replaceComponents(
  doc: CircuitDocument,
  ids: string[],
  type: ComponentType,
): CircuitDocument {
  const selected = new Set(ids);
  const components = doc.objects.filter(
    (o): o is CircuitComponent => o.kind === 'component' && selected.has(o.id),
  );
  if (!commonReplacements(components).includes(type))
    throw new Error(
      t(
        'No replacement is compatible with all selected components: terminal geometry or functions differ.',
      ),
    );
  return components.reduce(
    (next, c) => (c.type === type ? next : replaceComponent(next, c.id, type)),
    doc,
  );
}
