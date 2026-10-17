import { useEffect, useRef } from 'react';
import { Highlighter, Trash2, Unlink } from 'lucide-react';
import type { Highlight, HighlightStyle } from '../../model/types';
import { detachHighlight, HIGHLIGHT_COLORS, routeLength } from '../../annotations/highlight';
import { useEditorStore } from '../../store/editorStore';
import { objectCenter } from '../../utils/selectionGeometry';
import { wirePoints } from '../../utils/geometry';
import { commonValue } from './commonValue';
import {
  InspectorSection,
  PropertyField,
  PropertyRow,
  PropertySelect,
} from './PropertyControls';
import { SelectionGeometry } from './SelectionGeometry';

/** One set of controls edits either the next stroke or the common selected style. */
export function HighlightProperties({ objects = [] }: { objects?: Highlight[] }) {
  const settings = useEditorStore((s) => s.highlightSettings);
  const ownsGesture = useRef(false);
  const editing = objects.length > 0;
  const values = editing ? objects : [settings];
  const state = () => useEditorStore.getState();
  const apply = (patch: Partial<HighlightStyle>) => {
    if (editing)
      state().updateObjects(
        objects.map((o) => o.id),
        (o) => (o.kind === 'highlight' ? { ...o, ...patch } : o),
      );
    else state().setHighlightSettings(patch);
  };
  const begin = () => {
    if (editing && !ownsGesture.current) {
      ownsGesture.current = true;
      state().beginGesture();
    }
  };
  const finish = () => {
    if (ownsGesture.current) {
      ownsGesture.current = false;
      state().endGesture();
    }
  };
  useEffect(
    () => () => {
      if (ownsGesture.current) useEditorStore.getState().endGesture();
    },
    [],
  );
  const single = objects.length === 1 ? objects[0] : null;
  const color = commonValue(values.map((o) => o.color));
  const slider = (
    property: 'opacity' | 'width',
    caption: string,
    max: number,
    step: number,
    unit: string,
  ) => {
    const factor = property === 'opacity' ? 100 : 1;
    const value = commonValue(values.map((o) => o[property] * factor));
    return (
      <div className="highlight-range">
        <PropertyRow caption={caption}>
          <input
            type="range"
            aria-label={`${caption} evidenziatore`}
            min={property === 'width' ? 1 : 0}
            max={max}
            step={step}
            value={value ?? (property === 'width' ? 12 : 40)}
            aria-valuetext={value === undefined ? 'Valori misti' : `${value}${unit}`}
            onPointerDown={begin}
            onPointerUp={finish}
            onPointerCancel={() => {
              if (ownsGesture.current) {
                ownsGesture.current = false;
                state().cancelGesture();
              }
            }}
            onBlur={finish}
            onKeyDown={(e) => {
              if (
                [
                  'ArrowLeft',
                  'ArrowRight',
                  'ArrowUp',
                  'ArrowDown',
                  'Home',
                  'End',
                  'PageUp',
                  'PageDown',
                ].includes(e.key)
              )
                begin();
              if (e.key === 'Escape' && ownsGesture.current) {
                ownsGesture.current = false;
                state().cancelGesture();
              }
            }}
            onKeyUp={finish}
            onChange={(e) => apply({ [property]: Number(e.target.value) / factor })}
          />
          <PropertyField
            label={`${caption} evidenziatore numerico`}
            caption=""
            numeric
            min={property === 'width' ? 1 : 0}
            max={max}
            unit={unit}
            value={value === undefined ? undefined : Number(value.toFixed(2))}
            onCommit={(v) => apply({ [property]: Number(v) / factor })}
          />
        </PropertyRow>
      </div>
    );
  };
  return (
    <div className="inspector-properties">
      <div className="inspector-selection">
        <span className="inspector-object-icon">
          <Highlighter size={16} />
        </span>
        <div className="inspector-type">
          <span>
            {objects.length > 1 ? `${objects.length} evidenziazioni` : 'Evidenziatore'}
          </span>
          <small>
            {editing
              ? single?.mode === 'smart'
                ? 'Associato al filo'
                : single
                  ? 'Tratto libero'
                  : 'Proprietà comuni'
              : 'Impostazioni del prossimo tratto'}
          </small>
        </div>
      </div>
      {!editing && (
        <InspectorSection title="Tratto">
          <PropertySelect
            label="Modalità evidenziatore"
            caption="Modalità"
            value={settings.mode}
            onChange={(v) =>
              state().setHighlightSettings({
                mode: v === 'free' ? 'free' : 'smart',
              })
            }
          >
            <option value="smart">Intelligente</option>
            <option value="free">Libera</option>
          </PropertySelect>
          <p className="inspector-geometry-note">
            {settings.mode === 'smart'
              ? 'Inizia su un filo e seguilo, anche solo per una piccola porzione.'
              : 'Trascina ovunque sul foglio per evidenziare a mano libera.'}
          </p>
        </InspectorSection>
      )}
      <InspectorSection title="Aspetto">
        <PropertyRow caption="Colore">
          <div className="highlight-palette" role="group" aria-label="Colori evidenziatore">
            {Object.entries(HIGHLIGHT_COLORS).map(([name, hex]) => (
              <button
                key={name}
                type="button"
                aria-label={`Evidenziatore ${name.toLowerCase()}`}
                title={name}
                aria-pressed={color?.toLowerCase() === hex.toLowerCase()}
                style={{ backgroundColor: hex }}
                onClick={() => apply({ color: hex })}
              />
            ))}
            <input
              type="color"
              aria-label="Colore evidenziatore personalizzato"
              title="Colore personalizzato"
              value={color ?? '#FACC15'}
              onPointerDown={begin}
              onInput={(e) => apply({ color: e.currentTarget.value })}
              onChange={finish}
              onBlur={finish}
            />
          </div>
        </PropertyRow>
        <PropertyField
          label="Colore evidenziatore HEX"
          caption="HEX"
          value={color?.toUpperCase()}
          onCommit={(v) => {
            if (/^#[\da-f]{6}$/i.test(v)) apply({ color: v.toUpperCase() });
          }}
        />
        {slider('opacity', 'Opacità', 100, 1, '%')}
        {slider('width', 'Spessore', 200, 0.5, 'u')}
      </InspectorSection>
      {single && (
        <InspectorSection title="Geometria">
          {single.mode === 'smart' ? (
            <>
              {(['start', 'end'] as const).map((side) => {
                const index = side === 'start' ? 0 : single.spans.length - 1,
                  span = single.spans[index];
                const doc = state().document,
                  wire = doc.objects.find((o) => o.id === span.wireId);
                const length = wire?.kind === 'wire' ? routeLength(wirePoints(wire, doc)) : 0;
                return (
                  <PropertyField
                    key={side}
                    label={side === 'start' ? 'Inizio sul filo' : 'Fine sul filo'}
                    caption={side === 'start' ? 'Inizio' : 'Fine'}
                    numeric
                    min={0}
                    max={length}
                    unit="u"
                    value={Number((span[side] * length).toFixed(2))}
                    onCommit={(v) =>
                      state().update(single.id, (o) =>
                        o.kind === 'highlight' && o.mode === 'smart'
                          ? {
                              ...o,
                              spans: o.spans.map((s, i) =>
                                i === index
                                  ? {
                                      ...s,
                                      [side]: length ? Number(v) / length : 0,
                                    }
                                  : s,
                              ),
                            }
                          : o,
                      )
                    }
                  />
                );
              })}
              <p className="inspector-geometry-note">
                Segue il percorso del filo. Gli estremi mantengono la posizione proporzionale se
                cambia la lunghezza.
              </p>
            </>
          ) : (
            <>
              <PropertyField
                label="Posizione evidenziazione X"
                caption="X"
                numeric
                value={Math.min(...single.points.map((p) => p.x))}
                onCommit={(v) =>
                  state().position(
                    'x',
                    Number(v) +
                      objectCenter(single, state().document).x -
                      Math.min(...single.points.map((p) => p.x)),
                  )
                }
              />
              <PropertyField
                label="Posizione evidenziazione Y"
                caption="Y"
                numeric
                value={Math.min(...single.points.map((p) => p.y))}
                onCommit={(v) =>
                  state().position(
                    'y',
                    Number(v) +
                      objectCenter(single, state().document).y -
                      Math.min(...single.points.map((p) => p.y)),
                  )
                }
              />
            </>
          )}
          <p className="inspector-geometry-note">
            Trascina gli handle per modificare gli estremi. Option-clic seleziona gli oggetti
            sovrapposti.
          </p>
        </InspectorSection>
      )}
      {objects.length > 1 && objects.every((o) => o.mode === 'free') && (
        <InspectorSection title="Geometria">
          <SelectionGeometry objects={objects} />
        </InspectorSection>
      )}
      {editing && (
        <InspectorSection title="Azioni">
          {objects.some((o) => o.mode === 'smart') && (
            <button
              className="inspector-property-action"
              onClick={() => {
                const doc = state().document;
                state().updateSelection((o) =>
                  o.kind === 'highlight' ? detachHighlight(o, doc) : o,
                );
              }}
            >
              <Unlink size={14} /> Scollega dal filo
            </button>
          )}
          <button className="inspector-property-action" onClick={() => state().remove()}>
            <Trash2 size={14} /> Elimina
          </button>
        </InspectorSection>
      )}
    </div>
  );
}
