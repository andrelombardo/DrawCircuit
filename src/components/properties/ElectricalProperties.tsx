import { t } from '../../i18n';
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

export function AnnotationReverseAction({ mode, onClick }: {
  mode: ElectricalAnnotation['mode']; onClick: () => void;
}) {
  const label = t(mode === 'polarity' ? 'Reverse polarity' : mode === 'current' ? 'Reverse current direction' : 'Reverse voltage arrow');
  return <button className="inspector-inline-action inspector-reverse-action" aria-label={label} title={label} onClick={onClick}>
    <ArrowLeftRight size={18} aria-hidden="true" />
  </button>;
}

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
          label={current ? t('Current label') : t('Voltage label')}
          caption={current ? t('Current label') : t('Voltage label')}
          value={annotation.label.text}
          onCommit={(text) => update((o) => ({ ...o, label: { ...o.label, text } }))}
        />
        <AnnotationReverseAction
          mode={annotation.mode}
          onClick={() => update((o) => ({ ...o, reversed: !o.reversed }))}
        />
      </div>
      {current && segments > 0 && (
        <>
          {segments > 1 && (
            <PropertySelect
              label={t('Current reference')}
              value={annotation.wireSegment?.index ?? ''}
              onChange={(v) =>
                update((o) => ({
                  ...o,
                  wireSegment:
                    v === ''
                      ? undefined
                      : {
                          index: Number(v),
                          ratio: o.wireSegment?.ratio ?? o.ratio,
                        },
                  offset: { x: 0, y: 0 },
                }))
              }
            >
              <option value="">{t('Along the wire')}</option>
              {Array.from({ length: segments }, (_, i) => (
                <option key={i} value={i}>
                  {t('Segment')} {i + 1}
                </option>
              ))}
            </PropertySelect>
          )}
          <PropertyField
            label={annotation.wireSegment ? t('Position on segment') : t('Position on wire')}
            caption={annotation.wireSegment ? t('On segment') : t('On wire')}
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
                  ? {
                      wireSegment: { ...o.wireSegment, ratio: Number(v) / 100 },
                    }
                  : {}),
                offset: { x: 0, y: 0 },
              }))
            }
          />
        </>
      )}
      <InspectorDisclosure title={t('Position')}>
      {(!current || !annotation.wireId) && (
        <div className="inspector-offsets" role="group" aria-label={t('Annotation position')}>
          <h4 title={t('Offset from the component or reference geometry, in canvas units.')}>
            {t('Annotation offset')}{' '}
          </h4>
          <div className="inspector-pair">
            {(['x', 'y'] as const).map((axis) => (
              <PropertyField
                key={axis}
                label={t('Annotation offset {axis}', {
                  axis: axis.toUpperCase(),
                })}
                caption={axis.toUpperCase()}
                numeric
                unit="u"
                value={annotation.offset[axis]}
                onCommit={(v) =>
                  update((o) => ({
                    ...o,
                    offset: { ...o.offset, [axis]: Number(v) },
                  }))
                }
              />
            ))}
          </div>
        </div>
      )}
      <div className="inspector-offsets" role="group" aria-label={t('Label position')}>
        <h4 title={t('Text offset from the annotation, in canvas units.')}>{t('Label offset')} </h4>
        <div className="inspector-pair">
          {(['x', 'y'] as const).map((axis) => (
            <PropertyField
              key={axis}
              label={t('Label offset {axis}', { axis: axis.toUpperCase() })}
              caption={axis.toUpperCase()}
              numeric
              unit="u"
              value={annotation.label.offset[axis]}
              onCommit={(v) =>
                update((o) => ({
                  ...o,
                  label: {
                    ...o.label,
                    offset: { ...o.label.offset, [axis]: Number(v) },
                  },
                }))
              }
            />
          ))}
        </div>
      </div>
      </InspectorDisclosure>
      <InspectorDisclosure
        title={t('Annotation style')}
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
  return (
    <InspectorSection
      title={t('Electrical annotations')}
      actions={hosted && (
        <label className="inspector-enable">
          <input
            type="checkbox"
            role="switch"
            aria-label={t('Electrical annotations')}
            checked={annotations.length > 0}
            onChange={(event) => {
              const s = useEditorStore.getState();
              const ids = new Set(annotationsForHost(object, s.document).map((annotation) => annotation.id));
              const doc = event.target.checked
                ? withHostAnnotation(object, s.document)
                : { ...s.document, objects: s.document.objects.filter((item) => !ids.has(item.id)) };
              if (doc !== s.document) s.commit(doc);
            }}
          />
        </label>
      )}
    >
      {annotations.map((annotation, index) => (
        <div
          className="inspector-annotation"
          role="group"
          aria-label={`${annotation.mode === 'current' ? t('Current') : t('Polarity and voltage')}${annotations.length > 1 ? ` ${index + 1}` : ''}`}
          key={annotation.id}
        >
          {!hosted && (
            <PropertyRow caption={t('Type')}>
              <span>
                {annotation.mode === 'polarity'
                  ? t('Polarity + / −')
                  : annotation.mode === 'current'
                    ? t('Current')
                    : t('Voltage')}
              </span>
            </PropertyRow>
          )}
          <AnnotationFields annotation={annotation} />
        </div>
      ))}
    </InspectorSection>
  );
}
