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
  Copy,
  Scissors,
  ClipboardPaste,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ArrowLeftRight,
  BookmarkPlus,
  Replace,
  Image,
  Trash2,
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
import { reverseLoop } from '../../utils/loops';
import { supportsPolarity } from '../../model/capabilities';
import { createPolarity } from '../../annotations/electrical';
import { currentOnSelectedWire } from './annotationActions';
import { CurrentInlineIcon, PolarityIcon } from '../toolbar/DrawingIcons';
import { createPersonalBlock, usePersonalBlocks } from '../../personalBlocks/library';
import { BlockNameDialog } from '../toolbar/BlockNameDialog';
import { ReplaceDialog } from './ReplaceDialog';
import { copyPNG } from '../../png/exporter';
import { getExportSelection } from '../../tikz/selection';
import { SelectionStyle } from './SelectionStyle';
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
  const [blockDialog, setBlockDialog] = useState(false),
    [replaceDialog, setReplaceDialog] = useState(false),
    [pngBusy, setPngBusy] = useState(false);
  const [distribution, setDistribution] = useState<DistributionMode>('centers');
  const [spacing, setSpacing] = useState('120'),
    [spacingAxis, setSpacingAxis] = useState<Axis>('x');
  const state = () => useEditorStore.getState();
  const apply = (fn: (o: CircuitObject) => CircuitObject) => state().updateSelection(fn);
  const doc = state().document;
  const o = objects.length === 1 ? objects[0] : null;
  const components = objects.filter((o) => o.kind === 'component');
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
  const png = async () => {
    if (pngBusy) return;
    setPngBusy(true);
    try {
      await copyPNG(getExportSelection(state().document, state().selection));
      state().notify('PNG copiato');
    } catch (error) {
      state().notify(error instanceof Error ? error.message : 'Impossibile copiare il PNG.');
    } finally {
      setPngBusy(false);
    }
  };
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
      <InspectorSection title="Generale">
        <div className="inspector-type">
          {o?.kind === 'component'
            ? componentRegistry[o.type].name
            : o
              ? names[o.kind]
              : `${objects.length} elementi`}
          {activeLabel && <span>Etichetta selezionata</span>}
        </div>
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
        {(!!rotatables.length || !!labelTarget) &&
          (labelTarget || rotatables.some((o) => o.kind === 'component' || o.kind === 'text') ? (
            <PropertySelect
              label="Rotazione"
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
              numeric
              value={rotation === undefined ? undefined : Number(rotation.toFixed(2))}
              onCommit={(v) => setRotation(Number(v))}
            />
          ))}
        {o?.kind === 'component' && componentRegistry[o.type].internalText !== undefined && (
          <PropertyField
            label="Testo interno"
            value={o.bodyText ?? '='}
            onCommit={(bodyText) => apply((o) => (o.kind === 'component' ? { ...o, bodyText } : o))}
          />
        )}
      </InspectorSection>
      <InspectorSection title="Aspetto">
        <SelectionStyle objects={objects} apply={apply} />
        {!!lineObjects.length && (
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
        {lineObjects.some((o) => o.lineStyle === 'dashed') && (
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
                  .map((o) => o.dashGap ?? (o.kind === 'rectangle' ? o.strokeWidth : o.width) * 2),
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
        {!!rectangles.length && (
          <PropertySelect
            label="Riempimento"
            value={commonValue(rectangles.map((o) => (o.fill === 'none' ? 'none' : 'color')))}
            onChange={(v) =>
              apply((o) =>
                o.kind === 'rectangle'
                  ? { ...o, fill: v === 'none' ? 'none' : o.fill === 'none' ? '#2463cb' : o.fill }
                  : o,
              )
            }
          >
            <option value="none">Nessun riempimento</option>
            <option value="color">Colore</option>
          </PropertySelect>
        )}
      </InspectorSection>
      {(objects.length > 1 || objects.some((o) => !['component', 'junction'].includes(o.kind))) && (
        <InspectorSection title="Geometria">
          {!!rectangles.length && (
            <div className="inspector-pair">
              {(['width', 'height'] as const).map((dimension) => (
                <PropertyField
                  key={dimension}
                  label={dimension === 'width' ? 'Larghezza' : 'Altezza'}
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
          {objects.some((o) => o.kind === 'wire') && (
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
          {objects.some((o) => o.kind === 'text') && (
            <PropertySelect
              label="Allineamento testo"
              value={commonValue(objects.flatMap((o) => (o.kind === 'text' ? [o.align] : [])))}
              onChange={(v) =>
                apply((o) =>
                  o.kind === 'text' ? { ...o, align: v as 'start' | 'middle' | 'end' } : o,
                )
              }
            >
              <option value="start">Sinistra</option>
              <option value="middle">Centro</option>
              <option value="end">Destra</option>
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
                    ['y', 'center', 'Allinea al centro verticalmente', AlignVerticalJustifyCenter],
                    ['y', 'end', 'Allinea in basso', AlignVerticalJustifyEnd],
                  ] as const
                ).map(([axis, alignment, label, Icon]) => (
                  <IconButton
                    key={label}
                    label={label}
                    onClick={() => state().align(axis as Axis, alignment as Alignment)}
                  >
                    <Icon size={17} />
                  </IconButton>
                ))}
              </div>
              <PropertySelect
                label="Distribuzione"
                value={distribution}
                onChange={(v) => setDistribution(v as DistributionMode)}
              >
                <option value="centers">Per centri</option>
                <option value="gaps">Per spazi liberi</option>
              </PropertySelect>
              <div className="inspector-distribute">
                <button
                  disabled={objects.length < 3}
                  onClick={() => state().distribute('x', distribution)}
                  aria-label="Distribuisci orizzontalmente"
                >
                  <AlignHorizontalDistributeCenter size={16} />
                  Orizzontale
                </button>
                <button
                  disabled={objects.length < 3}
                  onClick={() => state().distribute('y', distribution)}
                  aria-label="Distribuisci verticalmente"
                >
                  <AlignVerticalDistributeCenter size={16} />
                  Verticale
                </button>
              </div>
              <p className="inspector-note">Distribuzione automatica: estremi fermi.</p>
              <div className="inspector-spacing">
                <select
                  aria-label="Asse spaziatura"
                  value={spacingAxis}
                  onChange={(e) => setSpacingAxis(e.target.value as Axis)}
                >
                  <option value="x">X</option>
                  <option value="y">Y</option>
                </select>
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
                <button
                  disabled={
                    !spacing.trim() || !Number.isFinite(Number(spacing)) || Number(spacing) < 0
                  }
                  onClick={() => state().distribute(spacingAxis, distribution, Number(spacing))}
                >
                  Applica
                </button>
              </div>
              <p className="inspector-note">Distanza in u · primo elemento sull’asse fermo.</p>
            </>
          )}
        </InspectorSection>
      )}
      <InspectorSection title="Azioni">
        <div className="inspector-actions">
          {o?.kind === 'wire' && (
            <>
              <button
                aria-label="Corrente sul filo"
                onClick={() => state().add([currentOnSelectedWire(o, state().document)])}
              >
                <CurrentInlineIcon size={17} />
                Corrente sul filo
              </button>
              <button
                onClick={() => {
                  state().setSplitWire(o.id);
                  state().notify('Clicca il filo nel punto da dividere · Esc annulla.');
                }}
              >
                Dividi filo…
              </button>
            </>
          )}
          {o && supportsPolarity(o) && (
            <button
              aria-label="Polarità + / -"
              onClick={() => {
                const a = createPolarity(o);
                if (a) state().add([a]);
              }}
            >
              <PolarityIcon size={17} />
              Polarità + / -
            </button>
          )}
          {objects.some((o) => o.kind === 'brace') && (
            <button
              aria-label="Inverti lato"
              onClick={() =>
                apply((o) => (o.kind === 'brace' ? { ...o, side: o.side === 1 ? -1 : 1 } : o))
              }
            >
              <FlipHorizontal size={16} />
              Inverti lato
            </button>
          )}
          {objects.some(
            (o) => o.kind === 'arrow' || o.kind === 'electrical' || o.kind === 'loop-arrow',
          ) && (
            <button
              aria-label="Inverti freccia"
              onClick={() =>
                apply((o) =>
                  o.kind === 'arrow' || o.kind === 'electrical'
                    ? { ...o, reversed: !o.reversed }
                    : o.kind === 'loop-arrow'
                      ? reverseLoop(o)
                      : o,
                )
              }
            >
              <ArrowLeftRight size={16} />
              Inverti freccia
            </button>
          )}
          {objects.some((o) => o.kind === 'arrow' || o.kind === 'loop-arrow') && (
            <>
              <button
                aria-label="Specchia orizzontalmente"
                onClick={() => state().mirror('horizontal')}
              >
                <FlipHorizontal size={16} />
                Specchia orizzontalmente
              </button>
              <button
                aria-label="Specchia verticalmente"
                onClick={() => state().mirror('vertical')}
              >
                <FlipVertical size={16} />
                Specchia verticalmente
              </button>
            </>
          )}
          {(!o || (o.kind !== 'wire' && o.kind !== 'junction')) && (
            <button
              onClick={() => state().rotate()}
              aria-label={`Ruota ${components.length ? 45 : 90}° (R)`}
              title={`Ruota ${components.length ? 45 : 90}° (R)`}
              data-tooltip={`Ruota ${components.length ? 45 : 90}° (R)`}
            >
              <RotateCw size={16} />
              Ruota {components.length ? 45 : 90}°
            </button>
          )}
          <button
            onClick={() => state().duplicate()}
            aria-label="Duplica (⌘/Ctrl D)"
            title="Duplica (⌘/Ctrl D)"
            data-tooltip="Duplica (⌘/Ctrl D)"
          >
            <Copy size={16} />
            Duplica
          </button>
          <button onClick={() => void state().copy()} aria-label="Copia (⌘/Ctrl C)">
            <Copy size={16} />
            Copia
          </button>
          <button onClick={() => void state().cut()} aria-label="Taglia (⌘/Ctrl X)">
            <Scissors size={16} />
            Taglia
          </button>
          <button onClick={() => void state().paste()} aria-label="Incolla (⌘/Ctrl V)">
            <ClipboardPaste size={16} />
            Incolla
          </button>
          {!!components.length && (
            <button onClick={() => setReplaceDialog(true)}>
              <Replace size={16} />
              Sostituisci…
            </button>
          )}
          <button onClick={() => setBlockDialog(true)}>
            <BookmarkPlus size={16} />
            Salva come blocco
          </button>
          <button disabled={pngBusy} onClick={() => void png()}>
            <Image size={16} />
            {pngBusy ? 'Copia immagine…' : 'Copia come immagine'}
          </button>
          <button
            className="destructive-button"
            aria-label={activeLabel ? 'Elimina etichetta (Delete)' : 'Elimina (Delete)'}
            onClick={() => state().remove()}
          >
            <Trash2 size={16} />
            {activeLabel ? 'Elimina etichetta' : 'Elimina'}
          </button>
        </div>
      </InspectorSection>
      {blockDialog && (
        <BlockNameDialog
          onClose={() => setBlockDialog(false)}
          onSave={(name) =>
            usePersonalBlocks
              .getState()
              .add(createPersonalBlock(state().document, state().selection, name))
          }
        />
      )}
      {replaceDialog && !!components.length && (
        <ReplaceDialog components={components} onClose={() => setReplaceDialog(false)} />
      )}
    </div>
  );
}
