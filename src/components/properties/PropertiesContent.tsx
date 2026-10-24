import { moveLineEndpoint, routeEditedLine, setLineRouting } from '../../utils/lines';
import { EraserProperties } from './EraserProperties';
import { t } from '../../i18n';
import { HighlightProperties } from './HighlightProperties';
import { commonValue } from './commonValue';
import { fixedWireConnection, linePoints } from '../../utils/geometry';
import { useShallow } from 'zustand/react/shallow';
import { RotateCw, ArrowLeftRight, FlipHorizontal, FlipVertical } from 'lucide-react';
import { parentFrame } from '../../model/shapeAppearance';
import { ObjectStyleSection } from './ObjectStyleSection';
import { ShapeCorners } from './ShapeAppearance';
import { ObjectPaintSection } from './PaintSections';
import { FrameContents, FramePosition, FrameSettings, FrameSizing } from './FrameProperties';
import { SelectionSizeFields } from './ScaleSelection';
import { useEditorStore } from '../../store/editorStore';
import { componentRegistry } from '../../model/catalog';
import { ROTATIONS } from '../../model/types';
import { MAX_COORDINATE } from '../../model/limits';
import type { CircuitObject, WireRouting, LineStyle } from '../../model/types';
import { unionBounds } from '../../utils/visualBounds';
import { measurementBounds } from '../../utils/measurementGeometry';
import { objectCenter } from '../../utils/selectionGeometry';
import type { Axis } from '../../utils/selectionGeometry';
import { arrowOrientation, rotateArrow } from '../../utils/arrows';
import { inlineTextTarget, replaceInlineText } from '../../utils/labels';
import { LabelAppearance, SelectionStyle, SelectionTypography } from './SelectionStyle';
import { rotateObjects } from '../../utils/operations';
import { AnnotationReverseAction, ElectricalProperties } from './ElectricalProperties';
import { SelectionGeometry } from './SelectionGeometry';
import { reverseLoop } from '../../utils/loops';
import { InspectorDisclosure, InspectorSection, PropertyField, PropertySelect, PropertyRow } from './PropertyControls';
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
  const parent = o && !activeLabel ? parentFrame(doc, o.id) : undefined;
  const shapes = objects.filter((o) => o.kind === 'rectangle' || o.kind === 'circle');
  const shapeSelection = !!shapes.length && shapes.length === objects.length;
  const fillSelection = objects.every((o) => ['rectangle', 'circle', 'text', 'junction'].includes(o.kind));
  const strokeSelection = objects.every((o) => o.kind !== 'text' && o.kind !== 'junction');
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
      o.kind === 'component' || o.kind === 'text' || o.kind === 'arrow' || o.kind === 'loop-arrow' || (o.kind === 'rectangle' && !o.frame),
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
    (o) => o.kind === 'wire' || o.kind === 'line' || o.kind === 'rectangle' || o.kind === 'circle',
  );
  const arrows = objects.filter((o) => o.kind === 'arrow' || o.kind === 'loop-arrow');
  const independentRotation = rotatables.length === objects.length;
  const selectedIds = new Set(objects.map((object) => object.id));
  const hasComponent = objects.some((object) => object.kind === 'component');
  const groupRotation =
    !objects.some((object) => object.kind === 'rectangle' && object.frame) && objects.every(
      (item) =>
        [
          'component',
          'text',
          'arrow',
          'loop-arrow',
          'junction',
          'wire',
          'brace',
          'angle',
          'rectangle',
          'circle',
          'line',
        ].includes(item.kind) &&
        !(hasComponent && ['brace', 'rectangle'].includes(item.kind)) &&
        (item.kind !== 'wire' ||
          [item.startEndpoint, item.endEndpoint].every((ep) =>
            ep.kind === 'free'
              ? !fixedWireConnection(ep, doc, selectedIds)
              : selectedIds.has(ep.kind === 'terminal' ? ep.componentId : ep.kind === 'shape' ? ep.shapeId : ep.junctionId),
          )),
    ) && objects.some((item) => !['wire', 'junction', 'circle'].includes(item.kind));
  const electricalOnly = o?.kind === 'electrical' && !labelTarget;
  const absoluteRotation = !!labelTarget || (!!o && independentRotation);
  const rectangles = objects.filter((o) => o.kind === 'rectangle');
  const setRotation = (degrees: number) => {
    const value = ((degrees % 360) + 360) % 360;
    if (!labelTarget && o?.kind === 'component') {
      if (value === o.rotation) return;
      // Share the keyboard operation's routing preservation when setting an
      // absolute component angle; a dropdown must not reroute distant branches.
      state().commit(
        rotateObjects(state().document, [o.id], (value - o.rotation + 360) % 360),
      );
      return;
    }
    apply((o) => {
      if (labelTarget && 'label' in o)
        return { ...o, label: { ...o.label, rotation: value } };
      if (o.kind === 'text') return { ...o, rotation: value };
      if (o.kind === 'rectangle' && !o.frame) return { ...o, rotation: (value % 360 + 360) % 360 };
      if (o.kind === 'arrow' || o.kind === 'loop-arrow')
        return rotateArrow(
          o,
          value - (o.kind === 'arrow' ? arrowOrientation(o) : (o.rotation ?? 0)),
        );
      return o;
    });
  };
  const rotationControl = absoluteRotation && (
    <PropertySelect
      label={t('Rotation')}
      caption={<RotateCw size={14} aria-hidden="true" />}
      embedded
      value={rotation === undefined ? undefined : Number(rotation.toFixed(2))}
      numeric={{ min: -MAX_COORDINATE, max: MAX_COORDINATE, unit: '°' }}
      onChange={(v) => setRotation(Number(v))}
    >
      {ROTATIONS.map((r) => (
        <option key={r} value={r}>
          {r}°
        </option>
      ))}
    </PropertySelect>
  );
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
      <InspectorSection title={t('Position')} className="inspector-position">
        {o && parent ? <FramePosition object={o} frame={parent} /> : <div className="inspector-pair inspector-position-fields">
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
          {rotationControl}
        </div>}
        <div className="inspector-transform-row">
          {parent && rotationControl}
          {groupRotation && !absoluteRotation && (
            <button
              className="inspector-property-action inspector-transform-action"
              aria-label={t(objects.length > 1 ? 'Rotate group by {angle}°' : 'Rotate by {angle}°', {
                angle: rotatables.some((object) => object.kind === 'component') ? 45 : 90,
              }) + ' (R)'}
              title={t('Rotate selection around its center (R)')}
              onClick={() => state().rotate()}
            >
              <RotateCw size={16} />
            </button>
          )}
          {objects.every((object) => object.kind === 'arrow' || object.kind === 'loop-arrow' || object.kind === 'circle' || (object.kind === 'rectangle' && !object.frame)) && (
            <>
              <button
                className="inspector-property-action inspector-transform-action"
                aria-label={t('Mirror horizontally')}
                title={t('Mirror horizontally')}
                onClick={() => state().mirror('horizontal')}
              >
                <FlipHorizontal size={16} />
              </button>
              <button
                className="inspector-property-action inspector-transform-action"
                aria-label={t('Mirror vertically')}
                title={t('Mirror vertically')}
                onClick={() => state().mirror('vertical')}
              >
                <FlipVertical size={16} />
              </button>
            </>
          )}
        </div>
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
      {!labelTarget && (
          <InspectorSection title={t('Layout')} className="inspector-layout">
            {rectangles.length !== objects.length && o?.kind !== 'loop-arrow' && o?.kind !== 'angle' && <SelectionSizeFields objects={objects} />}
            {o?.kind === 'angle' && <>
              <div className="inspector-pair">
                <PropertyField label={t('Radius')} caption="R" embedded value={Number(o.radius.toFixed(2))} numeric min={8} unit="u" onCommit={(v) => apply((item) => item.kind === 'angle' ? { ...item, radius: Number(v) } : item)} />
                <PropertyField label={t('Start angle')} caption={<RotateCw size={14} />} embedded value={Number(o.startAngle.toFixed(2))} numeric unit="°" onCommit={(v) => apply((item) => item.kind === 'angle' ? { ...item, startAngle: ((Number(v)%360)+360)%360 } : item)} />
              </div>
              <PropertyField label={t('Angle amplitude')} value={Number(o.sweepAngle.toFixed(2))} numeric min={-360} max={360} unit="°" onCommit={(v) => { if (Number(v)) apply((item) => item.kind === 'angle' ? { ...item, sweepAngle: Number(v) } : item); }} />
              <label className="inspector-check inspector-enable"><span>{t('Show rays')}</span><input type="checkbox" checked={o.showRays} onChange={(e) => apply((item) => item.kind === 'angle' ? { ...item, showRays: e.target.checked } : item)} /></label>
            </>}
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
            {objects.every((item) =>
              item.kind === 'arrow' || item.kind === 'loop-arrow' ||
              (item.kind === 'line' && item.arrowhead),
            ) && (
              <PropertyRow caption={t('Direction')}>
                <button
                  className="inspector-property-action"
                  onClick={() =>
                    apply((item) =>
                      item.kind === 'arrow' || item.kind === 'electrical' || item.kind === 'line'
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
              <div className="inspector-dimensions">
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
                      apply((o) => (o.kind === 'rectangle' ? { ...o, [dimension]: Number(v),
                        ...(o.aspectLocked ? { [dimension === 'width' ? 'height' : 'width']: o[dimension === 'width' ? 'height' : 'width']*Number(v)/o[dimension] } : {}),
                        ...(o.frame ? { frame: { ...o.frame, [dimension === 'width' ? 'widthSizing' : 'heightSizing']: 'fixed', ...(o.aspectLocked ? { widthSizing: 'fixed', heightSizing: 'fixed' } : {}) } } : {}),
                      } : o))
                    }
                  />
                ))}
              </div>
            )}
            {o?.kind === 'rectangle' && o.frame && <>
              <FrameSizing object={o} />
              {o.frame.direction === 'free' && <FrameContents object={o} />}
            </>}
            {o?.kind === 'loop-arrow' && (
              <div className="inspector-dimensions">
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
            {objects.every((o) => o.kind === 'wire' || o.kind === 'line') && (
              <PropertySelect
                label={t(objects.every((o) => o.kind === 'line') ? 'Line routing' : 'Wire routing')}
                value={commonValue(
                  objects.flatMap((o) => (o.kind === 'wire' || o.kind === 'line'
                    ? [o.kind === 'line' && o.controlPoints ? 'curve' : o.routing ?? (o.kind === 'line' ? 'free' : 'orthogonal')] : [])),
                )}
                onChange={(v) =>
                  apply((o) => o.kind === 'line' ? setLineRouting(o, v as WireRouting | 'curve', doc) : o.kind === 'wire' ? { ...o, routing: v as WireRouting } : o)
                }
              >
                <option value="orthogonal">{t('Orthogonal')}</option>
                <option value="45">45°</option>
                <option value="free">{t('Free')}</option>
                {objects.every((o) => o.kind === 'line') && <option value="curve">{t('Curved')}</option>}
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
            {o?.kind === 'line' && <InspectorDisclosure title={t('Endpoints')}>
              {(['start', 'end'] as const).map((end) => (
                <div className="inspector-style-fields" key={end}>
                  {(['x', 'y'] as const).map((axis) => (
                    <PropertyField
                      key={axis}
                      label={`${end === 'start' ? t('Start') : t('End')} ${axis.toUpperCase()}`}
                      numeric
                      value={(end === 'start' ? linePoints(o, doc)[0] : linePoints(o, doc).at(-1)!)[axis]}
                      onCommit={(v) =>
                        apply((o) =>
                          o.kind === 'line' ? routeEditedLine(moveLineEndpoint(o, end, { kind: 'free',
                            point: { ...(end === 'start' ? linePoints(o, doc)[0] : linePoints(o, doc).at(-1)!), [axis]: Number(v) } }, doc), doc) : o,
                        )
                      }
                    />
                  ))}
                </div>
              ))}
            </InspectorDisclosure>}
          </InspectorSection>
        )}
      {!labelTarget && o?.kind === 'rectangle' && o.frame && <FrameSettings key={o.id} object={o} />}
      {!labelTarget && (
        <ObjectStyleSection objects={objects} apply={apply}>
          {!fillSelection && !strokeSelection && <SelectionStyle
            objects={objects}
            apply={apply}
            labelOnly={!!labelTarget}
            labelAppearance={false}
          />}
          {!labelTarget && arrows.length === objects.length && (
            <PropertySelect
              label={t('Arrowhead')}
              value={commonValue(arrows.map((arrow) => (arrow.headFilled ? 'filled' : 'open')))}
              onChange={(value) =>
                apply((arrow) =>
                  arrow.kind === 'arrow' || arrow.kind === 'loop-arrow'
                    ? { ...arrow, headFilled: value === 'filled' }
                    : arrow,
                )
              }
            >
              <option value="open">{t('Open arrowhead')}</option>
              <option value="filled">{t('Filled arrowhead')}</option>
            </PropertySelect>
          )}
          {!labelTarget && objects.every((o) => o.kind === 'line') && (
            <PropertySelect
              label={t('Arrowhead')}
              value={commonValue(
                objects.map((o) => o.kind === 'line' ? o.arrowhead ?? 'none' : 'none'),
              )}
              onChange={(value) =>
                apply((o) => o.kind === 'line'
                  ? { ...o, arrowhead: value === 'none' ? undefined : value as 'open' | 'filled' }
                  : o,
                )
              }
            >
              <option value="none">{t('None')}</option>
              <option value="open">{t('Open arrowhead')}</option>
              <option value="filled">{t('Filled arrowhead')}</option>
            </PropertySelect>
          )}
          {!strokeSelection && !shapeSelection && !labelTarget && lineObjects.length === objects.length && (
            <PropertySelect
              label={t('Line style')}
              value={commonValue(lineObjects.map((o) => o.lineStyle ?? 'solid'))}
              onChange={(v) =>
                apply((o) =>
                  o.kind === 'wire' ||
                  o.kind === 'line' ||
                  o.kind === 'rectangle' ||
                  o.kind === 'circle'
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
          {!strokeSelection && !shapeSelection && !labelTarget &&
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
                        (o) => o.dashLength ?? ('strokeWidth' in o ? o.strokeWidth : o.width) * 4,
                      ),
                  )}
                  onCommit={(v) =>
                    apply((o) =>
                      (o.kind === 'wire' ||
                        o.kind === 'line' ||
                        o.kind === 'rectangle' ||
                        o.kind === 'circle') &&
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
                      .map((o) => o.dashGap ?? ('strokeWidth' in o ? o.strokeWidth : o.width) * 2),
                  )}
                  onCommit={(v) =>
                    apply((o) =>
                      (o.kind === 'wire' ||
                        o.kind === 'line' ||
                        o.kind === 'rectangle' ||
                        o.kind === 'circle') &&
                      o.lineStyle === 'dashed'
                        ? { ...o, dashGap: Number(v) }
                        : o,
                    )
                  }
                />
              </div>
            )}
        </ObjectStyleSection>
      )}
      {shapeSelection && !labelTarget && <>
        {rectangles.length === objects.length && <ShapeCorners objects={shapes} apply={apply} />}
      </>}
      {fillSelection && !labelTarget && <ObjectPaintSection objects={objects} apply={apply} />}
      {strokeSelection && !labelTarget && <ObjectPaintSection objects={objects} apply={apply} border />}
      {!electricalOnly &&
        ((o && ('label' in o || o.kind === 'text')) ||
          objects.every((o) => 'label' in o) ||
          objects.every((o) => o.kind === 'text')) && (
          <InspectorSection title={t(o?.kind === 'text' ? 'Text' : 'Label')} className="inspector-text">
            <div className="inspector-text-content">
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
                caption=""
                value={o.kind === 'text' ? o.text : 'label' in o ? o.label.text : ''}
                onCommit={(text) => apply((o) => replaceInlineText(o, text))}
              />
            )}
            {objects.length > 1 && objects.every((o) => 'label' in o) && (
              <PropertyField
                label={t('Shared label')}
                caption=""
                value={commonValue(objects.map((o) => ('label' in o ? o.label.text : '')))}
                onCommit={(text) => apply((o) => replaceInlineText(o, text))}
              />
            )}
            {objects.length > 1 && objects.every((o) => o.kind === 'text') && (
              <PropertyField
                label={t('Shared content')}
                caption=""
                value={commonValue(objects.map((o) => (o.kind === 'text' ? o.text : '')))}
                onCommit={(text) => apply((o) => replaceInlineText(o, text))}
              />
            )}
              <div className="inspector-text-size"><SelectionTypography objects={objects} apply={apply} controls="size" /></div>
            </div>
            {o?.kind === 'component' && componentRegistry[o.type].internalText !== undefined && (
              <PropertyField
                label={t('Internal text')}
                value={o.bodyText ?? '='}
                onCommit={(bodyText) =>
                  apply((o) => (o.kind === 'component' ? { ...o, bodyText } : o))
                }
              />
            )}
            {objects.every((object) => 'label' in object) && (
              <LabelAppearance objects={objects} apply={apply} caption={t('Color')} />
            )}
            <SelectionTypography objects={objects} apply={apply} controls="alignment" />
          </InspectorSection>
        )}
      {!labelTarget && objects.length > 1 && (
        <InspectorSection title={t('Arrangement')} className="inspector-arrangement">
          <SelectionGeometry objects={objects} showAlignment={false} />
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
            <AnnotationReverseAction
              mode={objects[0].kind === 'electrical' ? objects[0].mode : 'voltage'}
              onClick={() =>
                apply((item) =>
                  item.kind === 'electrical' ? { ...item, reversed: !item.reversed } : item,
                )
              }
            />
          </InspectorSection>
        )}
    </div>
  );
}
