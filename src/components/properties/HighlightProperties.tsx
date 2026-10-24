import { t } from '../../i18n';
import { Blend, Unlink } from 'lucide-react';
import type { Highlight, HighlightStyle } from '../../model/types';
import {
  detachHighlight,
  HIGHLIGHT_COLORS,
  highlightSpanPoints,
  routeLength,
} from '../../annotations/highlight';
import { useEditorStore } from '../../store/editorStore';
import { objectCenter } from '../../utils/selectionGeometry';
import { commonValue } from './commonValue';
import { InspectorSection, PropertyField, PropertySelect } from './PropertyControls';
import { ColorControl } from './SelectionStyle';
import { SelectionGeometry } from './SelectionGeometry';
import { ObjectStyleSection } from './ObjectStyleSection';
import { ObjectPaintSection } from './PaintSections';

/** Reuse the inspector's standard color, opacity and numeric controls. */
export function HighlightProperties({ objects = [] }: { objects?: Highlight[] }) {
  const settings = useEditorStore((s) => s.highlightSettings);
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
  const single = objects.length === 1 ? objects[0] : null;
  const color = commonValue(values.map((o) => o.color));
  const opacity = commonValue(values.map((o) => Math.round(o.opacity * 100)));
  const width = commonValue(values.map((o) => o.width));
  const AppearanceSection = editing ? ObjectStyleSection : InspectorSection;
  const detachButton = (
    <button
      className="inspector-property-action"
      onClick={() => {
        const doc = state().document;
        state().updateSelection((o) => (o.kind === 'highlight' ? detachHighlight(o, doc) : o));
      }}
    >
      <Unlink size={14} />
      {single?.mode === 'component'
        ? t('Detach from component')
        : single?.mode === 'smart'
          ? t('Detach from path')
          : t('Detach from references')}
    </button>
  );
  return (
    <div className="inspector-properties">
      <p className="inspector-context-note">
            {!editing
              ? t('Settings for the next stroke')
              : single?.mode === 'smart'
                ? t('Attached to path')
                : single?.mode === 'component'
                  ? t('Attached to component')
                  : single
                    ? t('Freehand stroke')
                    : t('Shared properties')}
      </p>
      {!editing && (
        <div className="inspector-general">
          <PropertySelect
            label={t('Highlighter mode')}
            caption={t('Mode')}
            value={settings.mode}
            onChange={(v) =>
              state().setHighlightSettings({
                mode: v === 'free' ? 'free' : 'smart',
              })
            }
          >
            <option value="smart">{t('Smart')}</option>
            <option value="free">{t('Freehand')}</option>
          </PropertySelect>
          <p className="inspector-geometry-note">
            {settings.mode === 'smart'
              ? t(
                  'Drag along wires and components: choose where to start and stop, even within an element.',
                )
              : t('Drag on the sheet to highlight freehand.')}
          </p>
        </div>
      )}
      <AppearanceSection title={t('Appearance')} objects={objects} apply={(fn) => state().updateSelection(fn)}>
        {!editing && <div className="inspector-style">
          <ColorControl
            label={t('Color')}
            value={color}
            colors={HIGHLIGHT_COLORS}
            gesture={editing}
            onChange={(color) => apply({ color })}
          >
            <PropertyField
              label={t('Highlighter opacity')}
              caption=""
              icon={<Blend size={12} />}
              numeric
              unit="%"
              min={0}
              max={100}
              value={opacity}
              onCommit={(v) => apply({ opacity: Number(v) / 100 })}
            />
          </ColorControl>
          <PropertyField
            label={t('Highlighter width')}
            caption={t('Thickness')}
            numeric
            unit="u"
            min={1}
            max={objects.length && objects.every((o) => o.mode === 'free') ? 1000 : 200}
            value={width}
            onCommit={(v) => apply({ width: Number(v) })}
          />
        </div>}
      </AppearanceSection>
      {editing && <ObjectPaintSection objects={objects} apply={(fn) => state().updateSelection(fn)} border />}
      {single && (
        <InspectorSection title={t('Geometry')}>
          {single.mode === 'smart' ? (
            <>
              {(['start', 'end'] as const).map((side) => {
                const index = side === 'start' ? 0 : single.spans.length - 1,
                  span = single.spans[index];
                const length = routeLength(highlightSpanPoints(span, state().document));
                return (
                  <PropertyField
                    key={side}
                    label={side === 'start' ? t('Start on path') : t('End on path')}
                    caption={side === 'start' ? t('Start') : t('End')}
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
                {t(
                  'Follows connected wires and components. Endpoints keep their proportional position when the length changes.',
                )}{' '}
              </p>
            </>
          ) : single.mode === 'free' ? (
            <>
              <PropertyField
                label={t('Highlight position X')}
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
                label={t('Highlight position Y')}
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
          ) : (
            <p className="inspector-geometry-note">
              {t('Follows the component when you move or rotate it.')}{' '}
            </p>
          )}
          {single.mode !== 'free' && detachButton}
        </InspectorSection>
      )}
      {objects.length > 1 && objects.every((o) => o.mode === 'free') && (
        <InspectorSection title={t('Geometry')}>
          <SelectionGeometry objects={objects} />
        </InspectorSection>
      )}
      {objects.length > 1 && objects.some((o) => o.mode !== 'free') && (
        <InspectorSection title={t('Geometry')}>{detachButton}</InspectorSection>
      )}
    </div>
  );
}
