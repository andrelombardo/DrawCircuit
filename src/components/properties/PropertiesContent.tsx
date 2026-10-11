import { commonValue } from './commonValue';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Check,
  RotateCw,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { componentRegistry } from '../../model/catalog';
import { ROTATIONS } from '../../model/types';
import type { CircuitObject, Rotation, WireRouting, LineStyle } from '../../model/types';
import { rotatePoint } from '../../utils/geometry';
import { unionBounds } from '../../utils/visualBounds';
import { measurementBounds } from '../../utils/measurementGeometry';
import { objectCenter } from '../../utils/selectionGeometry';
import type { Axis, Alignment, DistributionMode } from '../../utils/selectionGeometry';
import { arrowOrientation, rotateArrow } from '../../utils/arrows';
import { inlineTextTarget, replaceInlineText } from '../../utils/labels';
import { SelectionStyle, SelectionTypography } from './SelectionStyle';
import { SelectionActions } from './SelectionActions';
import { IconButton } from '../toolbar/IconButton';
import { InspectorSection, PropertyField, PropertySelect } from './PropertyControls';
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
};
export function PropertiesContent() {
  // Local input drafts live in the fields. Unrelated object edits preserve this selector's result.
  const objects = useEditorStore(
    useShallow((s) => {
      const ids = new Set(s.selection);
      return s.document.objects.filter((o) => ids.has(o.id));
    }),
  );
  const activeLabel = useEditorStore((s) => s.activeLabel),
    grid = useEditorStore((s) => s.grid),
    snapEnabled = useEditorStore((s) => s.snapEnabled);
  const [distribution, setDistribution] = useState<DistributionMode>('centers');
  const [spacing, setSpacing] = useState('120'),
    [spacingAxis, setSpacingAxis] = useState<Axis>('x');
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
  const rectangles = objects.filter((o) => o.kind === 'rectangle');
  const setRotation = (value: number) =>
    apply((o) => {
      if (labelTarget && 'label' in o)
        return { ...o, label: { ...o.label, rotation: value as Rotation } };
      if (o.kind === 'component')
        return {
          ...o,
          rotation: value as Rotation,
          label: { ...o.label, offset: rotatePoint(o.label.offset, value - o.rotation) },
        };
      if (o.kind === 'text') return { ...o, rotation: value as Rotation };
      if (o.kind === 'arrow' || o.kind === 'loop-arrow')
        return rotateArrow(
          o,
          value - (o.kind === 'arrow' ? arrowOrientation(o) : (o.rotation ?? 0)),
        );
      return o;
    });
  if (!objects.length)
    return (
      <>
        <div className="inspector-empty">
          <p>Seleziona un elemento</p>
          <span>Le proprietà del circuito appariranno qui.</span>
        </div>
        <InspectorSection title="Canvas">
          <label className="inspector-check">
            <input type="checkbox" checked={grid} onChange={() => state().toggleGrid()} />
            Mostra griglia
          </label>
          <label className="inspector-check">
            <input type="checkbox" checked={snapEnabled} onChange={() => state().toggleSnap()} />
            Aggancia durante spostamento
          </label>
          <p className="inspector-note">
            Quote in unità documento · griglia 20 u<br />
            Durante uno spostamento: Shift mostra altre quote, Option/Alt libera lo snapping.
          </p>
        </InspectorSection>
      </>
    );
  return (
    <div className="inspector-properties" key={objects.map((o) => o.id).join(',')}>
      <div className="inspector-selection">
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
        <SelectionActions objects={objects} />
      </div>
      {((o && ('label' in o || o.kind === 'text')) ||
        objects.every((o) => 'label' in o) ||
        objects.every((o) => o.kind === 'text')) && (
        <InspectorSection title="Generale">
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
        </InspectorSection>
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
        <div className="inspector-rotation">
          {(rotatables.length === objects.length || !!labelTarget) &&
            (labelTarget || rotatables.some((o) => o.kind === 'component' || o.kind === 'text') ? (
              <PropertySelect
                label="Rotazione"
                caption={<RotateCw size={14} aria-hidden="true" />}
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
                caption={<RotateCw size={14} aria-hidden="true" />}
                numeric
                unit="°"
                value={rotation === undefined ? undefined : Number(rotation.toFixed(2))}
                onCommit={(v) => setRotation(Number(v))}
              />
            ))}
        </div>
      </InspectorSection>
      <InspectorSection title="Aspetto">
        <SelectionStyle objects={objects} apply={apply} labelOnly={!!labelTarget} />
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
            <div className="inspector-pair">
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
                      (o) => o.dashLength ?? (o.kind === 'rectangle' ? o.strokeWidth : o.width) * 4,
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
      {objects.every((o) => 'label' in o || o.kind === 'text') && (
        <InspectorSection title="Testo">
          <SelectionTypography objects={objects} apply={apply} />
        </InspectorSection>
      )}
      {!labelTarget &&
        (objects.length > 1 ||
          objects.some((o) =>
            ['rectangle', 'line', 'wire', 'arrow', 'loop-arrow', 'electrical'].includes(o.kind),
          )) && (
          <InspectorSection title="Geometria">
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
            {o?.kind === 'electrical' && (
              <div className="inspector-pair">
                {(['x', 'y'] as const).map((axis) => (
                  <PropertyField
                    key={axis}
                    label={`Offset annotazione ${axis.toUpperCase()}`}
                    caption={`Offset ${axis.toUpperCase()}`}
                    numeric
                    value={o.offset[axis]}
                    onCommit={(v) =>
                      apply((o) =>
                        o.kind === 'electrical'
                          ? { ...o, offset: { ...o.offset, [axis]: Number(v) } }
                          : o,
                      )
                    }
                  />
                ))}
              </div>
            )}
            {o?.kind === 'line' &&
              (['start', 'end'] as const).map((end) => (
                <div className="inspector-pair" key={end}>
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
            {objects.length > 1 && (
              <>
                <div className="inspector-align" role="group" aria-label="Allinea selezione">
                  {(['x', 'y'] as const).map((groupAxis) => (
                    <div className="inspector-segmented" key={groupAxis}>
                      {(
                        [
                          ['x', 'start', 'Allinea a sinistra', AlignHorizontalJustifyStart],
                          [
                            'x',
                            'center',
                            'Allinea al centro orizzontalmente',
                            AlignHorizontalJustifyCenter,
                          ],
                          ['x', 'end', 'Allinea a destra', AlignHorizontalJustifyEnd],
                          ['y', 'start', 'Allinea in alto', AlignVerticalJustifyStart],
                          [
                            'y',
                            'center',
                            'Allinea al centro verticalmente',
                            AlignVerticalJustifyCenter,
                          ],
                          ['y', 'end', 'Allinea in basso', AlignVerticalJustifyEnd],
                        ] as const
                      )
                        .filter(([axis]) => axis === groupAxis)
                        .map(([axis, alignment, label, Icon]) => (
                          <IconButton
                            key={label}
                            label={label}
                            onClick={() => state().align(axis as Axis, alignment as Alignment)}
                          >
                            <Icon size={17} />
                          </IconButton>
                        ))}
                    </div>
                  ))}
                </div>
                <div className="inspector-distribution-row">
                  <PropertySelect
                    label="Distribuzione"
                    value={distribution}
                    onChange={(v) => setDistribution(v as DistributionMode)}
                  >
                    <option value="centers">Per centri</option>
                    <option value="gaps">Per spazi liberi</option>
                  </PropertySelect>
                  <div className="inspector-distribute">
                    <IconButton
                      disabled={objects.length < 3}
                      onClick={() => state().distribute('x', distribution)}
                      label="Distribuisci orizzontalmente"
                    >
                      <AlignHorizontalDistributeCenter size={16} />
                    </IconButton>
                    <IconButton
                      disabled={objects.length < 3}
                      onClick={() => state().distribute('y', distribution)}
                      label="Distribuisci verticalmente"
                    >
                      <AlignVerticalDistributeCenter size={16} />
                    </IconButton>
                  </div>
                </div>
                <div className="inspector-spacing">
                  <select
                    aria-label="Asse spaziatura"
                    value={spacingAxis}
                    onChange={(e) => setSpacingAxis(e.target.value as Axis)}
                  >
                    <option value="x">X</option>
                    <option value="y">Y</option>
                  </select>
                  <label className="inspector-input inspector-spacing-value">
                    <span className="inspector-unit">Spazio</span>
                    <input
                      aria-label="Distanza esatta"
                      type="number"
                      min="0"
                      max="10000000"
                      step="any"
                      value={spacing}
                      onChange={(e) => setSpacing(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && spacing.trim() && Number(spacing) >= 0) {
                          e.preventDefault();
                          state().distribute(spacingAxis, distribution, Number(spacing));
                        }
                      }}
                    />
                    <span className="inspector-unit">u</span>
                  </label>
                  <button
                    aria-label="Applica"
                    title="Applica distanza esatta"
                    disabled={
                      !spacing.trim() || !Number.isFinite(Number(spacing)) || Number(spacing) < 0
                    }
                    onClick={() => state().distribute(spacingAxis, distribution, Number(spacing))}
                  >
                    <Check size={16} />
                  </button>
                </div>
                <p className="inspector-note">
                  Automatica: estremi fermi. Esatta: primo elemento fermo.
                </p>
              </>
            )}
          </InspectorSection>
        )}
    </div>
  );
}
