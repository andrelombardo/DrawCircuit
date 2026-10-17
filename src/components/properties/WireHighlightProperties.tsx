import type { CircuitObject, Wire, WireHighlight } from '../../model/types';
import { DEFAULT_WIRE_HIGHLIGHT } from '../../model/types';
import { commonValue } from './commonValue';
import { InspectorSection, PropertyField, PropertySelect } from './PropertyControls';
import { ColorControl } from './SelectionStyle';

export function WireHighlightProperties({
  wires,
  apply,
}: {
  wires: Wire[];
  apply: (fn: (o: CircuitObject) => CircuitObject) => void;
}) {
  const enabled = commonValue(wires.map((wire) => (wire.highlight ? 'on' : 'off')));
  const highlights = wires.flatMap((wire) => (wire.highlight ? [wire.highlight] : []));
  const update = (changes: Partial<WireHighlight>) =>
    apply((o) =>
      o.kind === 'wire' && o.highlight
        ? { ...o, highlight: { ...o.highlight, ...changes } }
        : o,
    );
  const opacity = commonValue(highlights.map((h) => h.opacity));
  return (
    <InspectorSection title="Evidenziazione">
      <PropertySelect
        label="Evidenziazione fili"
        caption="Evidenziatore"
        value={enabled}
        onChange={(value) =>
          apply((o) =>
            o.kind === 'wire'
              ? {
                  ...o,
                  highlight:
                    value === 'on'
                      ? (o.highlight ?? { ...DEFAULT_WIRE_HIGHLIGHT })
                      : undefined,
                }
              : o,
          )
        }
      >
        <option value="off">Disattivato</option>
        <option value="on">Attivato</option>
      </PropertySelect>
      {enabled === 'on' && (
        <>
          <ColorControl
            label="Evidenziatore"
            value={commonValue(highlights.map((h) => h.color))}
            onChange={(color) => update({ color })}
          >
            <PropertyField
              label="Opacità evidenziatore"
              caption=""
              numeric
              min={0}
              max={100}
              unit="%"
              value={opacity === undefined ? undefined : Math.round(opacity * 100)}
              onCommit={(value) => update({ opacity: Number(value) / 100 })}
            />
          </ColorControl>
          <PropertyField
            label="Spessore evidenziatore"
            caption="Spessore"
            numeric
            min={1}
            max={100}
            unit="px"
            value={commonValue(highlights.map((h) => h.width))}
            onCommit={(value) => update({ width: Number(value) })}
          />
        </>
      )}
    </InspectorSection>
  );
}
