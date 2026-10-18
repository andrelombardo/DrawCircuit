import { EraserProperties } from './EraserProperties';
import { t } from '../../i18n';
import { HighlightProperties } from './HighlightProperties';
import { commonValue } from './commonValue';
import { fixedWireConnection } from '../../utils/geometry';
import { useShallow } from 'zustand/react/shallow';
import {
  RotateCw,
  ArrowLeftRight,
  FlipHorizontal,
  FlipVertical,
  Square,
  Spline,
  CircleDot,
  Type,
  Layers,
  ArrowRight,
  Braces,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { componentRegistry } from '../../model/catalog';
import { ROTATIONS } from '../../model/types';
import type { CircuitObject, Rotation, WireRouting, LineStyle } from '../../model/types';
import { unionBounds } from '../../utils/visualBounds';
import { measurementBounds } from '../../utils/measurementGeometry';
import { objectCenter } from '../../utils/selectionGeometry';
import type { Axis } from '../../utils/selectionGeometry';
import { arrowOrientation, rotateArrow } from '../../utils/arrows';
import { inlineTextTarget, replaceInlineText } from '../../utils/labels';
import { SelectionStyle } from './SelectionStyle';
import { rotateObjects } from '../../utils/operations';
import { ElectricalProperties } from './ElectricalProperties';
import { SelectionGeometry } from './SelectionGeometry';
import { ComponentPreview } from '../palette/ComponentPreview';
import { reverseLoop } from '../../utils/loops';
import { InspectorSection, PropertyField, PropertySelect, PropertyRow } from './PropertyControls';
const names: Record<CircuitObject['kind'], string> = {
  component: 'Component',
  junction: 'Junction',
  wire: 'Electrical wire',
  text: 'Text',
  arrow: 'Arrow',
  'loop-arrow': 'Loop',
  electrical: 'Electrical annotation',
  brace: 'Brace / Bracket',
  rectangle: 'Rectangle',
  line: 'Decorative line',
  highlight: 'Highlight',
};
export function PropertiesContent() {
  // Local input drafts live in the fields. Unrelated object edits preserve this selector's result.
  const objects = useEditorStore(
    useShallow((s) => {
      const ids = new Set(s.selection);
      return s.document.objects.filter((o) => ids.has(o.id));
    }),
  );
  const tool = useEditorStore((s) => s.tool);
  const activeLabel = useEditorStore((s) => s.activeLabel);
  const state = () => useEditorStore.getState();
  const apply = (fn: (o: CircuitObject) => CircuitObject) => state().updateSelection(fn);
  const doc = state().document;
  const o = objects.length === 1 ? objects[0] : null;
  const bounds = unionBounds(objects.map((o) => measurementBounds(o, doc)));
  const labelTarget = activeLabel && o ? inlineTextTarget(o, doc) : null;
  const position = (axis: Axis) =>
    labelTarget
      ? labelTarget.point[axis]
      : o
        ? 'x' in o
          ? o[axis]
          : objectCenter(o, doc)[axis]
        : bounds[axis];
  const rotatables = objects.filter(
    (o) =>
      o.kind === 'component' || o.kind === 'text' || o.kind === 'arrow' || o.kind === 'loop-arrow',
  );
  const rotation =
    labelTarget && o && 'label' in o
      ? o.label.rotation
      : commonValue(
          rotatables.map((o) =>
            o.kind === 'arrow' ? arrowOrientation(o) : 'rotation' in o ? (o.rotation ?? 0) : 0,
          ),
        );
  const lineObjects = objects.filter(
    (o) => o.kind === 'wire' || o.kind === 'line' || o.kind === 'rectangle',
  );
  const independentRotation = rotatables.length === objects.length;
  const selectedIds = new Set(objects.map((object) => object.id));
  const hasComponent = objects.some((object) => object.kind === 'component');
  const groupRotation =
    objects.every(
      (item) =>
        [
          'component',
          'text',
          'arrow',
          'loop-arrow',
          'junction',
          'wire',
          'brace',
          'rectangle',
          'line',
        ].includes(item.kind) &&
        !(hasComponent && ['brace', 'rectangle'].includes(item.kind)) &&
        (item.kind !== 'wire' ||
          [item.startEndpoint, item.endEndpoint].every((ep) =>
            ep.kind === 'free'
              ? !fixedWireConnection(ep, doc, selectedIds)
              : selectedIds.has(ep.kind === 'terminal' ? ep.componentId : ep.junctionId),
          )),
    ) && objects.some((item) => !['wire', 'junction'].includes(item.kind));
  const electricalOnly = o?.kind === 'electrical' && !labelTarget;
  const absoluteRotation = !!labelTarget || (!!o && independentRotation);
  const rectangles = objects.filter((o) => o.kind === 'rectangle');
  const setRotation = (value: number) => {
    if (!labelTarget && o?.kind === 'component') {
      if (value === o.rotation) return;
      // Share the keyboard operation's routing preservation when setting an
      // absolute component angle; a dropdown must not reroute distant branches.
      state().commit(
        rotateObjects(state().document, [o.id], ((value - o.rotation + 360) % 360) as Rotation),
      );
      return;
    }
    apply((o) => {
      if (labelTarget && 'label' in o)
        return { ...o, label: { ...o.label, rotation: value as Rotation } };
      if (o.kind === 'text') return { ...o, rotation: value as Rotation };
      if (o.kind === 'arrow' || o.kind === 'loop-arrow')
        return rotateArrow(
          o,
          value - (o.kind === 'arrow' ? arrowOrientation(o) : (o.rotation ?? 0)),
        );
      return o;
    });
  };
  const rotationControl =
    absoluteRotation &&
    (labelTarget || rotatables.some((o) => o.kind === 'component' || o.kind === 'text') ? (
      <PropertySelect
        label={t('Rotation')}
        caption={t('Rotation')}
        value={rotation}
        onChange={(v) => setRotation(Number(v))}
      >
        {ROTATIONS.map((r) => (
          <option key={r} value={r}>
            {r}°
          </option>
        ))}
      </PropertySelect>
    ) : (
      <PropertyField
        label={t('Rotation')}
        caption={t('Rotation')}
        numeric
        unit="°"
        value={rotation === undefined ? undefined : Number(rotation.toFixed(2))}
        onCommit={(v) => setRotation(Number(v))}
      />
    ));
  if (tool === 'highlight-eraser') return <EraserProperties />;
  if (tool === 'highlight') return <HighlightProperties key="highlight-tool" />;
  if (objects.length && objects.every((o) => o.kind === 'highlight'))
    return <HighlightProperties key={objects.map((o) => o.id).join(',')} objects={objects} />;
  if (!objects.length)
    return (
      <div className="inspector-empty">
        <p>{t('Select an element')}</p>
        <span>{t('Circuit properties will appear here.')}</span>
      </div>
    );
  return (
    <div className="inspector-properties" key={objects.map((o) => o.id).join(',')}>
      <div className="inspector-selection">
        <span className="inspector-object-icon" aria-hidden="true">
          {o?.kind === 'component' ? (
            <ComponentPreview component={componentRegistry[o.type]} />
          ) : o?.kind === 'rectangle' ? (
            <Square size={16} />
          ) : o?.kind === 'wire' || o?.kind === 'line' ? (
            <Spline size={16} />
          ) : o?.kind === 'junction' ? (
            <CircleDot size={16} />
          ) : o?.kind === 'text' ? (
            <Type size={16} />
          ) : o?.kind === 'brace' ? (
            <Braces size={16} />
          ) : o ? (
            <ArrowRight size={16} />
          ) : (
            <Layers size={16} />
          )}
        </span>
        <div className="inspector-type">
          <span>
            {o?.kind === 'component'
              ? t(componentRegistry[o.type].name)
              : o
                ? t(names[o.kind])
                : t('{count} selected elements', { count: objects.length })}
          </span>
          {activeLabel && <small>{t('Selected label')}</small>}
          {!o && !objects.every((item) => item.kind === objects[0].kind) && (
            <small>{t('Shared properties')}</small>
          )}
        </div>
      </div>
      {!electricalOnly &&
        ((o && ('label' in o || o.kind === 'text')) ||
          objects.every((o) => 'label' in o) ||
          objects.every((o) => o.kind === 'text')) && (
          <div className="inspector-general">
            {o && ('label' in o || o.kind === 'text') && (
              <PropertyField
                label={
                  o.kind === 'junction'
                    ? t('Junction name')
                    : o.kind === 'component'
                      ? t('Component label')
                      : o.kind === 'text'
                        ? t('Text content')
                        : t('Annotation label')
                }
                caption={o.kind === 'text' ? t('Content') : t('Label')}
                value={o.kind === 'text' ? o.text : 'label' in o ? o.label.text : ''}
                onCommit={(text) => apply((o) => replaceInlineText(o, text))}
              />
            )}
            {objects.length > 1 && objects.every((o) => 'label' in o) && (
              <PropertyField
                label={t('Shared label')}
                caption={t('Label')}
                value={commonValue(objects.map((o) => ('label' in o ? o.label.text : '')))}
                onCommit={(text) => apply((o) => replaceInlineText(o, text))}
              />
            )}
            {objects.length > 1 && objects.every((o) => o.kind === 'text') && (
              <PropertyField
                label={t('Shared content')}
                caption={t('Content')}
                value={commonValue(objects.map((o) => (o.kind === 'text' ? o.text : '')))}
                onCommit={(text) => apply((o) => replaceInlineText(o, text))}
              />
            )}
            {o?.kind === 'component' && componentRegistry[o.type].internalText !== undefined && (
              <PropertyField
                label={t('Internal text')}
                value={o.bodyText ?? '='}
                onCommit={(bodyText) =>
                  apply((o) => (o.kind === 'component' ? { ...o, bodyText } : o))
                }
              />
            )}
          </div>
        )}
      <InspectorSection title={t('Position')}>
        <div className="inspector-pair">
          {(['x', 'y'] as const).map((axis) => (
            <PropertyField
              key={axis}
              label={t('Position {axis}', { axis: axis.toUpperCase() })}
              caption={axis.toUpperCase()}
              numeric
              value={Number(position(axis).toFixed(3))}
              min={-1e7}
              max={1e7}
              onCommit={(v) => state().position(axis, Number(v))}
            />
          ))}
        </div>
        {rotationControl}
        {objects.length > 1 && (
          <p
            className="inspector-note"
            title={t(
              "Top-left corner of the selection's geometric bounds, in canvas units independent of zoom.",
            )}
          >
            {t('X/Y: top-left corner · u')}{' '}
          </p>
        )}
      </InspectorSection>
      {!electricalOnly && (
        <InspectorSection title={t('Appearance')}>
          <SelectionStyle
            objects={objects}
            apply={apply}
            labelOnly={!!labelTarget}
            typography={objects.every((o) => 'label' in o || o.kind === 'text')}
          />
          {!labelTarget && lineObjects.length === objects.length && (
            <PropertySelect
              label={t('Line style')}
              value={commonValue(lineObjects.map((o) => o.lineStyle ?? 'solid'))}
              onChange={(v) =>
                apply((o) =>
                  o.kind === 'wire' || o.kind === 'line' || o.kind === 'rectangle'
                    ? { ...o, lineStyle: v as LineStyle }
                    : o,
                )
              }
            >
              <option value="solid">{t('Solid')}</option>
              <option value="dashed">{t('Dashed')}</option>
              <option value="dotted">{t('Dotted')}</option>
            </PropertySelect>
          )}
          {!labelTarget &&
            lineObjects.length === objects.length &&
            lineObjects.every((o) => o.lineStyle === 'dashed') && (
              <div className="inspector-style-fields">
                <PropertyField
                  label={t('Dash length')}
                  caption={t('Dash')}
                  numeric
                  min={0.1}
                  max={1000}
                  value={commonValue(
                    lineObjects
                      .filter((o) => o.lineStyle === 'dashed')
                      .map(
                        (o) =>
                          o.dashLength ?? (o.kind === 'rectangle' ? o.strokeWidth : o.width) * 4,
                      ),
                  )}
                  onCommit={(v) =>
                    apply((o) =>
                      (o.kind === 'wire' || o.kind === 'line' || o.kind === 'rectangle') &&
                      o.lineStyle === 'dashed'
                        ? { ...o, dashLength: Number(v) }
                        : o,
                    )
                  }
                />
                <PropertyField
                  label={t('Dash spacing')}
                  caption={t('Gap')}
                  numeric
                  min={0.1}
                  max={1000}
                  value={commonValue(
                    lineObjects
                      .filter((o) => o.lineStyle === 'dashed')
                      .map(
                        (o) => o.dashGap ?? (o.kind === 'rectangle' ? o.strokeWidth : o.width) * 2,
                      ),
                  )}
                  onCommit={(v) =>
                    apply((o) =>
                      (o.kind === 'wire' || o.kind === 'line' || o.kind === 'rectangle') &&
                      o.lineStyle === 'dashed'
                        ? { ...o, dashGap: Number(v) }
                        : o,
                    )
                  }
                />
              </div>
            )}
        </InspectorSection>
      )}
      {((groupRotation && !absoluteRotation) ||
        objects.every((item) => item.kind === 'arrow' || item.kind === 'loop-arrow')) && (
        <InspectorSection title={t('Transforms')}>
          {groupRotation && !absoluteRotation && (
            <div className="inspector-rotation">
              <button
                className="inspector-property-action"
                aria-label={
                  t(objects.length > 1 ? 'Rotate group by {angle}°' : 'Rotate by {angle}°', {
                    angle: rotatables.some((o) => o.kind === 'component') ? 45 : 90,
                  }) + ' (R)'
                }
                title={t('Rotate selection around its center (R)')}
                onClick={() => state().rotate()}
              >
                <RotateCw size={14} />
                {t(objects.length > 1 ? 'Rotate group by {angle}°' : 'Rotate by {angle}°', {
                  angle: rotatables.some((o) => o.kind === 'component') ? 45 : 90,
                })}
              </button>
            </div>
          )}
          {objects.every((item) => item.kind === 'arrow' || item.kind === 'loop-arrow') && (
            <PropertyRow caption={t('Mirror')}>
              <div className="inspector-segmented">
                <button
                  className="inspector-property-action"
                  aria-label={t('Mirror horizontally')}
                  title={t('Mirror horizontally')}
                  onClick={() => state().mirror('horizontal')}
                >
                  <FlipHorizontal size={14} />
                  {t('Horizontal')}{' '}
                </button>
                <button
                  className="inspector-property-action"
                  aria-label={t('Mirror vertically')}
                  title={t('Mirror vertically')}
                  onClick={() => state().mirror('vertical')}
                >
                  <FlipVertical size={14} />
                  {t('Vertical')}{' '}
                </button>
              </div>
            </PropertyRow>
          )}
        </InspectorSection>
      )}
      {!labelTarget &&
        (objects.length > 1 ||
          objects.some((o) =>
            ['rectangle', 'line', 'wire', 'arrow', 'loop-arrow', 'brace'].includes(o.kind),
          )) && (
          <InspectorSection title={t('Geometry')}>
            {objects.every((item) => item.kind === 'brace') && (
              <PropertyRow caption={t('Side')}>
                <button
                  className="inspector-property-action"
                  onClick={() =>
                    apply((item) =>
                      item.kind === 'brace' ? { ...item, side: item.side === 1 ? -1 : 1 } : item,
                    )
                  }
                >
                  <FlipHorizontal size={14} /> {t('Flip side')}{' '}
                </button>
              </PropertyRow>
            )}
            {objects.every((item) => ['arrow', 'loop-arrow'].includes(item.kind)) && (
              <PropertyRow caption={t('Direction')}>
                <button
                  className="inspector-property-action"
                  onClick={() =>
                    apply((item) =>
                      item.kind === 'arrow' || item.kind === 'electrical'
                        ? { ...item, reversed: !item.reversed }
                        : item.kind === 'loop-arrow'
                          ? reverseLoop(item)
                          : item,
                    )
                  }
                >
                  <ArrowLeftRight size={14} /> {t('Reverse arrow')}{' '}
                </button>
              </PropertyRow>
            )}
            {rectangles.length === objects.length && (
              <div className="inspector-pair">
                {(['width', 'height'] as const).map((dimension) => (
                  <PropertyField
                    key={dimension}
                    label={dimension === 'width' ? t('Width') : t('Height')}
                    caption={dimension === 'width' ? 'W' : 'H'}
                    numeric
                    min={1}
                    max={1e7}
                    value={commonValue(rectangles.map((o) => o[dimension]))}
                    onCommit={(v) =>
                      apply((o) => (o.kind === 'rectangle' ? { ...o, [dimension]: Number(v) } : o))
                    }
                  />
                ))}
              </div>
            )}
            {o?.kind === 'loop-arrow' && (
              <div className="inspector-pair">
                {(['width', 'height'] as const).map((dimension) => (
                  <PropertyField
                    key={dimension}
                    label={dimension === 'width' ? t('Width') : t('Height')}
                    caption={dimension === 'width' ? 'W' : 'H'}
                    numeric
                    min={1}
                    max={1e7}
                    value={o[dimension]}
                    onCommit={(v) =>
                      apply((o) => (o.kind === 'loop-arrow' ? { ...o, [dimension]: Number(v) } : o))
                    }
                  />
                ))}
              </div>
            )}
            {objects.every((o) => o.kind === 'wire') && (
              <PropertySelect
                label={t('Wire routing')}
                value={commonValue(
                  objects.flatMap((o) => (o.kind === 'wire' ? [o.routing ?? 'orthogonal'] : [])),
                )}
                onChange={(v) =>
                  apply((o) => (o.kind === 'wire' ? { ...o, routing: v as WireRouting } : o))
                }
              >
                <option value="orthogonal">{t('Orthogonal')}</option>
                <option value="45">45°</option>
                <option value="free">{t('Free')}</option>
              </PropertySelect>
            )}
            {o?.kind === 'arrow' && (
              <PropertySelect
                label={t('Arrow type')}
                caption={t('Shape')}
                value={o.type}
                onChange={(v) =>
                  apply((o) =>
                    o.kind === 'arrow' ? { ...o, type: v as 'straight' | 'curve' | 'arc' } : o,
                  )
                }
              >
                <option value="straight">{t('Straight')}</option>
                <option value="curve">{t('Curved')}</option>
                <option value="arc">{t('Loop')}</option>
              </PropertySelect>
            )}
            {o?.kind === 'line' &&
              (['start', 'end'] as const).map((end) => (
                <div className="inspector-style-fields" key={end}>
                  {(['x', 'y'] as const).map((axis) => (
                    <PropertyField
                      key={axis}
                      label={`${end === 'start' ? t('Start') : t('End')} ${axis.toUpperCase()}`}
                      numeric
                      value={o[end][axis]}
                      onCommit={(v) =>
                        apply((o) =>
                          o.kind === 'line' ? { ...o, [end]: { ...o[end], [axis]: Number(v) } } : o,
                        )
                      }
                    />
                  ))}
                </div>
              ))}
            {objects.length > 1 && <SelectionGeometry objects={objects} />}
          </InspectorSection>
        )}
      {!labelTarget && o && <ElectricalProperties object={o} />}
      {!labelTarget &&
        objects.length > 1 &&
        objects.every(
          (item) =>
            item.kind === 'electrical' &&
            objects[0].kind === 'electrical' &&
            item.mode === objects[0].mode,
        ) && (
          <InspectorSection title={t('Electrical annotations')}>
            <button
              className="inspector-property-action"
              onClick={() =>
                apply((item) =>
                  item.kind === 'electrical' ? { ...item, reversed: !item.reversed } : item,
                )
              }
            >
              <ArrowLeftRight size={14} />{' '}
              {objects[0].kind === 'electrical' && objects[0].mode === 'polarity'
                ? t('Reverse polarity')
                : objects[0].kind === 'electrical' && objects[0].mode === 'current'
                  ? t('Reverse current direction')
                  : t('Reverse voltage arrow')}
            </button>
          </InspectorSection>
        )}
    </div>
  );
}
