import { t } from '../i18n';
import { createComponent } from '../model/catalog';
import { createJunction, createTextAnnotation, createWire } from '../model/factories';
import type { CircuitDocument, CircuitObject, Endpoint, Point, Rotation } from '../model/types';
import { add, rotatePoint, snapPoint } from '../utils/geometry';
import type { CircuitPreset, PresetEndpoint } from './types';

const canonicalLabel = (label: string) =>
  label
    .trim()
    .replace(/^\$(.*)\$$/, '$1')
    .split('=')[0]
    .trim()
    .replace(/\s+/g, '')
    .replace(/_\{([^{}]+)\}/g, '_$1')
    .replace(/^([A-Za-z]+)(\d+)$/, '$1_$2');

function labelAllocator(doc: CircuitDocument) {
  const used = new Set(
    doc.objects.flatMap((o) =>
      o.kind === 'component' || o.kind === 'junction'
        ? [canonicalLabel(o.label.text)]
        : o.kind === 'text'
          ? [canonicalLabel(o.text)]
          : [],
    ),
  );
  return (source: string): string => {
    if (!source) return '';
    const numeric = /^([A-Za-z]+)_\{?(\d+)\}?$/.exec(source);
    let result = source;
    let index = 1;
    if (numeric) {
      result = `${numeric[1]}_${index}`;
      while (used.has(canonicalLabel(result))) result = `${numeric[1]}_${++index}`;
    } else {
      while (used.has(canonicalLabel(result))) {
        index++;
        result = /^[A-Za-z]+$/.test(source) ? `${source}_${index}` : `${source}^{(${index})}`;
      }
    }
    used.add(canonicalLabel(result));
    return result;
  };
}

/** Instantiate a detached set of ordinary objects. No preset metadata enters the document. */
export function instantiatePreset(
  preset: CircuitPreset,
  point: Point,
  rotation: Rotation,
  existing: CircuitDocument,
): CircuitObject[] {
  const origin = snapPoint(point);
  const position = (p: Point) => add(origin, rotatePoint(p, rotation));
  const label = labelAllocator(existing);
  const objects: CircuitObject[] = [];
  const ids = new Map<string, string>();
  for (const spec of preset.components) {
    const component = createComponent(spec.type, position(spec));
    component.rotation = (((spec.rotation ?? 0) + rotation) % 360) as Rotation;
    component.label.text = label(spec.label);
    component.label.offset = rotatePoint(
      spec.labelOffset ?? rotatePoint(component.label.offset, spec.rotation ?? 0),
      rotation,
    );
    if (spec.bodyText !== undefined) component.bodyText = spec.bodyText;
    ids.set(spec.key, component.id);
    objects.push(component);
  }
  for (const spec of preset.junctions) {
    const junction = createJunction(position(spec), label(spec.label));
    junction.label.offset = rotatePoint(spec.labelOffset ?? junction.label.offset, rotation);
    ids.set(spec.key, junction.id);
    objects.push(junction);
  }
  const endpoint = (spec: PresetEndpoint): Endpoint => {
    if ('component' in spec) {
      const id = ids.get(spec.component);
      const component = objects.find((o) => o.id === id);
      if (
        component?.kind !== 'component' ||
        !component.terminals.some((t) => t.id === spec.terminal)
      )
        throw new Error(
          t('Unknown block terminal: {terminal}', {
            terminal: `${spec.component}.${spec.terminal}`,
          }),
        );
      return {
        kind: 'terminal',
        componentId: component.id,
        terminalId: spec.terminal,
      };
    }
    const id = ids.get(spec.junction);
    if (!id || !objects.some((o) => o.id === id && o.kind === 'junction'))
      throw new Error(t('Unknown block junction: {junction}', { junction: spec.junction }));
    return { kind: 'junction', junctionId: id };
  };
  for (const wire of preset.wires)
    objects.push(
      createWire(endpoint(wire.start), endpoint(wire.end), (wire.vertices ?? []).map(position)),
    );
  for (const text of preset.annotations ?? [])
    objects.push({
      ...createTextAnnotation(position(text), text.text),
      rotation,
    });
  return objects;
}
