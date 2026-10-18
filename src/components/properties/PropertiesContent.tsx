import { HighlightProperties } from './HighlightProperties';
import { commonValue } from './commonValue';
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
  component: 'Componente',
  junction: 'Nodo',
  wire: 'Filo elettrico',
  text: 'Testo',
  arrow: 'Freccia',
  'loop-arrow': 'Maglia',
  electrical: 'Annotazione elettrica',
  brace: 'Graffa / Staffa',
  rectangle: 'Rettangolo',
  line: 'Linea decorativa',
  highlight: 'Evidenziazione',
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
        !(
          hasComponent && ['brace', 'rectangle'].includes(item.kind)
        ) &&
        (item.kind !== 'wire' ||
          [item.startEndpoint, item.endEndpoint].every(
            (ep) =>
              ep.kind === 'free' ||
              selectedIds.has(ep.kind === 'terminal' ? ep.componentId : ep.junctionId),
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
        label="Rotazione"
        caption="Rotazione"
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
        label="Rotazione"
        caption="Rotazione"
        numeric
        unit="°"
        value={rotation === undefined ? undefined : Number(rotation.toFixed(2))}
        onCommit={(v) => setRotation(Number(v))}
      />
    ));
  if (tool === 'highlight') return <HighlightProperties key="highlight-tool" />;
  if (objects.length && objects.every((o) => o.kind === 'highlight'))
    return (
      <HighlightProperties key={objects.map((o) => o.id).join(',')} objects={objects} />
    );
  if (!objects.length)
    return (
      <div className="inspector-empty">
        <p>Seleziona un elemento</p>
        <span>Le proprietà del circuito appariranno qui.</span>
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
              ? componentRegistry[o.type].name
              : o
                ? names[o.kind]
                : objects.length + ' elementi selezionati'}
          </span>
          {activeLabel && <small>Etichetta selezionata</small>}
          {!o && !objects.every((item) => item.kind === objects[0].kind) && (
            <small>Proprietà comuni</small>
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
                    ? 'Nome nodo'
                    : o.kind === 'component'
                      ? 'Etichetta componente'
                      : o.kind === 'text'
                        ? 'Contenuto testo'
                        : 'Etichetta annotazione'
                }
                caption={o.kind === 'text' ? 'Contenuto' : 'Etichetta'}
                value={o.kind === 'text' ? o.text : 'label' in o ? o.label.text : ''}
                onCommit={(text) => apply((o) => replaceInlineText(o, text))}
              />
            )}
            {objects.length > 1 && objects.every((o) => 'label' in o) && (
              <PropertyField
                label="Etichetta comune"
                caption="Etichetta"
                value={commonValue(objects.map((o) => ('label' in o ? o.label.text : '')))}
                onCommit={(text) => apply((o) => replaceInlineText(o, text))}
              />
            )}
            {objects.length > 1 && objects.every((o) => o.kind === 'text') && (
              <PropertyField
                label="Contenuto comune"
                caption="Contenuto"
                value={commonValue(objects.map((o) => (o.kind === 'text' ? o.text : '')))}
                onCommit={(text) => apply((o) => replaceInlineText(o, text))}
              />
            )}
            {o?.kind === 'component' && componentRegistry[o.type].internalText !== undefined && (
              <PropertyField
                label="Testo interno"
                value={o.bodyText ?? '='}
                onCommit={(bodyText) =>
                  apply((o) => (o.kind === 'component' ? { ...o, bodyText } : o))
                }
              />
            )}
          </div>
        )}
      <InspectorSection title="Posizione">
        <div className="inspector-pair">
          {(['x', 'y'] as const).map((axis) => (
            <PropertyField
              key={axis}
              label={`Posizione ${axis.toUpperCase()}`}
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
            title="Angolo superiore sinistro dei limiti geometrici della selezione, in unità canvas indipendenti dallo zoom."
          >
            X/Y: angolo superiore sinistro · u
          </p>
        )}
      </InspectorSection>
      {!electricalOnly && (
        <InspectorSection title="Aspetto">
          <SelectionStyle
            objects={objects}
            apply={apply}
            labelOnly={!!labelTarget}
            typography={objects.every((o) => 'label' in o || o.kind === 'text')}
          />
          {!labelTarget && lineObjects.length === objects.length && (
            <PropertySelect
              label="Stile linea"
              value={commonValue(lineObjects.map((o) => o.lineStyle ?? 'solid'))}
              onChange={(v) =>
                apply((o) =>
                  o.kind === 'wire' || o.kind === 'line' || o.kind === 'rectangle'
                    ? { ...o, lineStyle: v as LineStyle }
                    : o,
                )
              }
            >
              <option value="solid">Continua</option>
              <option value="dashed">Tratteggiata</option>
              <option value="dotted">Puntinata</option>
            </PropertySelect>
          )}
          {!labelTarget &&
            lineObjects.length === objects.length &&
            lineObjects.every((o) => o.lineStyle === 'dashed') && (
              <div className="inspector-style-fields">
                <PropertyField
                  label="Lunghezza trattino"
                  caption="Trattino"
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
                  label="Spazio trattini"
                  caption="Intervallo"
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
        <InspectorSection title="Trasformazioni">
          {groupRotation && !absoluteRotation && (
            <div className="inspector-rotation">
              <button
                className="inspector-property-action"
                aria-label={`Ruota ${objects.length > 1 ? 'gruppo ' : ''}di ${rotatables.some((o) => o.kind === 'component') ? 45 : 90}° (R)`}
                title="Ruota la selezione attorno al suo centro (R)"
                onClick={() => state().rotate()}
              >
                <RotateCw size={14} />
                Ruota {objects.length > 1 ? 'gruppo ' : ''}di{' '}
                {rotatables.some((o) => o.kind === 'component') ? 45 : 90}°
              </button>
            </div>
          )}
          {objects.every((item) => item.kind === 'arrow' || item.kind === 'loop-arrow') && (
            <PropertyRow caption="Specchia">
              <div className="inspector-segmented">
                <button
                  className="inspector-property-action"
                  aria-label="Specchia orizzontalmente"
                  title="Specchia orizzontalmente"
                  onClick={() => state().mirror('horizontal')}
                >
                  <FlipHorizontal size={14} />
                  Orizzontale
                </button>
                <button
                  className="inspector-property-action"
                  aria-label="Specchia verticalmente"
                  title="Specchia verticalmente"
                  onClick={() => state().mirror('vertical')}
                >
                  <FlipVertical size={14} />
                  Verticale
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
          <InspectorSection title="Geometria">
            {objects.every((item) => item.kind === 'brace') && (
              <PropertyRow caption="Lato">
                <button
                  className="inspector-property-action"
                  onClick={() =>
                    apply((item) =>
                      item.kind === 'brace' ? { ...item, side: item.side === 1 ? -1 : 1 } : item,
                    )
                  }
                >
                  <FlipHorizontal size={14} /> Inverti lato
                </button>
              </PropertyRow>
            )}
            {objects.every((item) => ['arrow', 'loop-arrow'].includes(item.kind)) && (
              <PropertyRow caption="Direzione">
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
                  <ArrowLeftRight size={14} /> Inverti freccia
                </button>
              </PropertyRow>
            )}
            {rectangles.length === objects.length && (
              <div className="inspector-pair">
                {(['width', 'height'] as const).map((dimension) => (
                  <PropertyField
                    key={dimension}
                    label={dimension === 'width' ? 'Larghezza' : 'Altezza'}
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
                    label={dimension === 'width' ? 'Larghezza' : 'Altezza'}
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
                label="Routing filo"
                value={commonValue(
                  objects.flatMap((o) => (o.kind === 'wire' ? [o.routing ?? 'orthogonal'] : [])),
                )}
                onChange={(v) =>
                  apply((o) => (o.kind === 'wire' ? { ...o, routing: v as WireRouting } : o))
                }
              >
                <option value="orthogonal">Ortogonale</option>
                <option value="45">45°</option>
                <option value="free">Libero</option>
              </PropertySelect>
            )}
            {o?.kind === 'arrow' && (
              <PropertySelect
                label="Tipo freccia"
                caption="Forma"
                value={o.type}
                onChange={(v) =>
                  apply((o) =>
                    o.kind === 'arrow' ? { ...o, type: v as 'straight' | 'curve' | 'arc' } : o,
                  )
                }
              >
                <option value="straight">Dritta</option>
                <option value="curve">Curva</option>
                <option value="arc">Maglia</option>
              </PropertySelect>
            )}
            {o?.kind === 'line' &&
              (['start', 'end'] as const).map((end) => (
                <div className="inspector-style-fields" key={end}>
                  {(['x', 'y'] as const).map((axis) => (
                    <PropertyField
                      key={axis}
                      label={`${end === 'start' ? 'Inizio' : 'Fine'} ${axis.toUpperCase()}`}
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
          <InspectorSection title="Annotazioni elettriche">
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
                ? 'Inverti polarità'
                : objects[0].kind === 'electrical' && objects[0].mode === 'current'
                  ? 'Inverti verso corrente'
                  : 'Inverti freccia tensione'}
            </button>
          </InspectorSection>
        )}
    </div>
  );
}
