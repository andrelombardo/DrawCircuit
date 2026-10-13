import { ArrowLeftRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { supportsPolarity } from '../../model/capabilities';
import type { CircuitObject, ElectricalAnnotation } from '../../model/types';
import { useEditorStore } from '../../store/editorStore';
import { wirePoints } from '../../utils/geometry';
import { annotationsForHost, withHostAnnotation } from './annotationActions';
import {
  InspectorSection,
  InspectorDisclosure,
  PropertyField,
  PropertyRow,
  PropertySelect,
} from './PropertyControls';
import { SelectionStyle } from './SelectionStyle';

function AnnotationFields({ annotation }: { annotation: ElectricalAnnotation }) {
  const state = () => useEditorStore.getState();
  const apply = (fn: (o: CircuitObject) => CircuitObject) =>
    state().updateObjects([annotation.id], fn);
  const update = (fn: (o: ElectricalAnnotation) => ElectricalAnnotation) =>
    apply((o) => (o.kind === 'electrical' ? fn(o) : o));
  const wire = useEditorStore((s) => s.document.objects.find((o) => o.id === annotation.wireId));
  const segments = wire?.kind === 'wire' ? wirePoints(wire, state().document).length - 1 : 0;
  const current = annotation.mode === 'current';
  return (
    <>
      <div className="inspector-annotation-label">
        <PropertyField
          label={current ? 'Etichetta corrente' : 'Etichetta tensione'}
          caption={current ? 'Etichetta corrente' : 'Etichetta tensione'}
          value={annotation.label.text}
          onCommit={(text) => update((o) => ({ ...o, label: { ...o.label, text } }))}
        />
        <button
          className="inspector-inline-action"
          onClick={() => update((o) => ({ ...o, reversed: !o.reversed }))}
        >
          <ArrowLeftRight size={14} />{' '}
          {annotation.mode === 'polarity'
            ? 'Inverti polarità'
            : current
              ? 'Inverti verso corrente'
              : 'Inverti freccia tensione'}
        </button>
      </div>
      {current && segments > 0 && (
        <>
          {segments > 1 && (
            <PropertySelect
              label="Tratto del filo"
              value={annotation.wireSegment?.index ?? ''}
              onChange={(v) =>
                update((o) => ({
                  ...o,
                  wireSegment: { index: Number(v), ratio: o.wireSegment?.ratio ?? 0.5 },
                  offset: { x: 0, y: 0 },
                }))
              }
            >
              {!annotation.wireSegment && (
                <option value="" disabled>
                  Lungo il filo
                </option>
              )}
              {Array.from({ length: segments }, (_, i) => (
                <option key={i} value={i}>
                  Tratto {i + 1}
                </option>
              ))}
            </PropertySelect>
          )}
          <PropertyField
            label={annotation.wireSegment ? 'Posizione sul tratto' : 'Posizione sul filo'}
            caption={annotation.wireSegment ? 'Sul tratto' : 'Sul filo'}
            numeric
            min={0}
            max={100}
            unit="%"
            value={Number(((annotation.wireSegment?.ratio ?? annotation.ratio) * 100).toFixed(2))}
            onCommit={(v) =>
              update((o) => ({
                ...o,
                ratio: Number(v) / 100,
                ...(o.wireSegment
                  ? { wireSegment: { ...o.wireSegment, ratio: Number(v) / 100 } }
                  : {}),
                offset: { x: 0, y: 0 },
              }))
            }
          />
        </>
      )}
      {(!current || !annotation.wireId) && (
        <div className="inspector-offsets" role="group" aria-label="Posizione annotazione">
          <h4 title="Spostamento rispetto al componente o alla geometria di riferimento, in unità canvas.">
            Offset annotazione
          </h4>
          <div className="inspector-pair">
            {(['x', 'y'] as const).map((axis) => (
              <PropertyField
                key={axis}
                label={`Offset annotazione ${axis.toUpperCase()}`}
                caption={axis.toUpperCase()}
                numeric
                unit="u"
                value={annotation.offset[axis]}
                onCommit={(v) =>
                  update((o) => ({ ...o, offset: { ...o.offset, [axis]: Number(v) } }))
                }
              />
            ))}
          </div>
        </div>
      )}
      <div className="inspector-offsets" role="group" aria-label="Posizione etichetta">
        <h4 title="Spostamento del testo rispetto all’annotazione, in unità canvas.">
          Offset etichetta
        </h4>
        <div className="inspector-pair">
          {(['x', 'y'] as const).map((axis) => (
            <PropertyField
              key={axis}
              label={`Offset etichetta ${axis.toUpperCase()}`}
              caption={axis.toUpperCase()}
              numeric
              unit="u"
              value={annotation.label.offset[axis]}
              onCommit={(v) =>
                update((o) => ({
                  ...o,
                  label: { ...o.label, offset: { ...o.label.offset, [axis]: Number(v) } },
                }))
              }
            />
          ))}
        </div>
      </div>
      <InspectorDisclosure
        title="Stile annotazione"
        preview={
          <>
            <span className="inspector-swatch" style={{ backgroundColor: annotation.color }} />
            <span
              className="inspector-swatch"
              style={{ backgroundColor: annotation.label.color }}
            />
          </>
        }
      >
        <SelectionStyle objects={[annotation]} apply={apply} typography />
      </InspectorDisclosure>
    </>
  );
}

export function ElectricalProperties({ object }: { object: CircuitObject }) {
  const annotations = useEditorStore(
    useShallow((s) =>
      object.kind === 'electrical' ? [object] : annotationsForHost(object, s.document),
    ),
  );
  const hosted = object.kind !== 'electrical';
  if (hosted && object.kind !== 'wire' && !supportsPolarity(object)) return null;
  const title = object.kind === 'wire' ? 'Corrente' : 'Polarità e tensione';
  return (
    <InspectorSection title="Annotazioni elettriche">
      {!annotations.length && (
        <label className="inspector-check inspector-enable">
          <span>{title}</span>
          <input
            type="checkbox"
            checked={false}
            onChange={() => {
              const s = useEditorStore.getState();
              const doc = withHostAnnotation(object, s.document);
              if (doc !== s.document) s.commit(doc);
            }}
          />
        </label>
      )}
      {annotations.map((annotation, index) => (
        <div
          className="inspector-annotation"
          role="group"
          aria-label={`${annotation.mode === 'current' ? 'Corrente' : 'Polarità e tensione'}${annotations.length > 1 ? ` ${index + 1}` : ''}`}
          key={annotation.id}
        >
          {hosted ? (
            <label className="inspector-check inspector-enable">
              <span>
                {title}
                {annotations.length > 1 ? ` ${index + 1}` : ''}
              </span>
              <input
                type="checkbox"
                checked
                onChange={() => {
                  const s = useEditorStore.getState();
                  s.commit({
                    ...s.document,
                    objects: s.document.objects.filter((o) => o.id !== annotation.id),
                  });
                }}
              />
            </label>
          ) : (
            <PropertyRow caption="Tipo">
              <span>
                {annotation.mode === 'polarity'
                  ? 'Polarità + / −'
                  : annotation.mode === 'current'
                    ? 'Corrente'
                    : 'Tensione'}
              </span>
            </PropertyRow>
          )}
          <AnnotationFields annotation={annotation} />
        </div>
      ))}
    </InspectorSection>
  );
}
