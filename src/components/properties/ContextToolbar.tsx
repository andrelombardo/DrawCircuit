import { createPersonalBlock, usePersonalBlocks } from '../../personalBlocks/library';
import { BlockNameDialog } from '../toolbar/BlockNameDialog';
import { ReplaceDialog } from './ReplaceDialog';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  FlipHorizontal,
  FlipVertical,
  ArrowLeftRight,
  RotateCw,
  Trash2,
  MoreHorizontal,
  SlidersHorizontal,
  BookmarkPlus,
  Replace,
  Image,
} from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { rotationHandle } from '../../utils/arrows';
import { reverseLoop } from '../../utils/loops';
import { SelectionStyle } from './SelectionStyle';
import type { CircuitObject, Viewport } from '../../model/types';
import { contentBounds, unionBounds } from '../../utils/visualBounds';
import { useEditorStore } from '../../store/editorStore';
import { IconButton } from '../toolbar/IconButton';
import { toolbarActions } from './toolbarActions';
import { replaceInlineText } from '../../utils/labels';
import { copyPNG } from '../../png/exporter';
import { getExportSelection } from '../../tikz/selection';
import { createPolarity } from '../../annotations/electrical';
import { supportsPolarity } from '../../model/capabilities';
import { currentOnSelectedWire } from './annotationActions';
import { CurrentInlineIcon, PolarityIcon } from '../toolbar/DrawingIcons';
function PropertyText({
  value,
  label,
  onChange,
}: {
  value: string;
  label: string;
  onChange: (text: string) => void;
}) {
  const [text, setText] = useState(value),
    cancel = useRef(false);
  return (
    <input
      className="property-text"
      aria-label={label}
      title={label}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (!cancel.current && text !== value) onChange(text);
        cancel.current = false;
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
          e.stopPropagation();
          cancel.current = true;
          setText(value);
          e.currentTarget.blur();
        }
      }}
      placeholder={label}
    />
  );
}
export function ContextToolbar({
  viewport,
  surfaceSize,
  svgRef,
  hidden = false,
}: {
  viewport: Viewport;
  surfaceSize: { width: number; height: number };
  svgRef: RefObject<SVGSVGElement | null>;
  hidden?: boolean;
}) {
  const selection = useEditorStore((s) => s.selection),
    doc = useEditorStore((s) => s.document),
    tool = useEditorStore((s) => s.tool),
    activeLabel = useEditorStore((s) => s.activeLabel),
    update = useEditorStore((s) => s.update);
  const root = useRef<HTMLDivElement>(null),
    more = useRef<HTMLDetailsElement>(null),
    style = useRef<HTMLDetailsElement>(null);
  const objects = doc.objects.filter((o) => selection.includes(o.id));
  const components = objects.filter((o) => o.kind === 'component');
  const o = objects.length === 1 ? objects[0] : null,
    actions = toolbarActions(o);
  const [dismissed, setDismissed] = useState(o?.kind === 'text'),
    [blockDialog, setBlockDialog] = useState(false),
    [replaceDialog, setReplaceDialog] = useState(false);
  const [pngBusy, setPngBusy] = useState(false);
  const copySelectionPNG = async () => {
    if (pngBusy) return;
    setPngBusy(true);
    if (more.current) more.current.open = false;
    try {
      const state = useEditorStore.getState();
      await copyPNG(getExportSelection(state.document, state.selection));
      state.notify('PNG copiato');
    } catch (error) {
      useEditorStore
        .getState()
        .notify(error instanceof Error ? error.message : 'Impossibile copiare il PNG.');
    } finally {
      setPngBusy(false);
    }
  };
  useLayoutEffect(() => {
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        if (more.current) more.current.open = false;
        if (style.current) style.current.open = false;
        setDismissed(true);
      }
    };
    const show = () => setDismissed(false);
    const escape = (e: KeyboardEvent) => {
      const menu = style.current?.open ? style.current : more.current?.open ? more.current : null;
      if (e.key === 'Escape' && menu) {
        e.preventDefault();
        e.stopPropagation();
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('drawcircuit:show-properties', show);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', escape, true);
      window.removeEventListener('drawcircuit:show-properties', show);
    };
  }, []);
  useLayoutEffect(() => {
    const element = root.current,
      svg = svgRef.current;
    if (!element || !svg || !objects.length || hidden || dismissed) return;
    const position = () => {
      const b = unionBounds(objects.map((obj) => contentBounds(obj, doc))),
        v = viewport;
      const screen = {
        x: b.x * v.zoom + v.x,
        y: b.y * v.zoom + v.y,
        width: b.width * v.zoom,
        height: b.height * v.zoom,
      };
      // Use actual rendered label rectangles (KaTeX, fractions, rotation) when available.
      const canvasRect = svg.getBoundingClientRect();
      for (const label of svg.querySelectorAll(
        '[data-layer="labels"] [data-object], [data-layer="annotations"] > [data-object]',
      )) {
        if (!selection.includes(label.getAttribute('data-object') ?? '')) continue;
        const r = label.getBoundingClientRect();
        if (r.width && r.height) {
          const joined = unionBounds([
            screen,
            {
              x: r.left - canvasRect.left,
              y: r.top - canvasRect.top,
              width: r.width,
              height: r.height,
            },
          ]);
          Object.assign(screen, joined);
        }
      }
      const w = element.offsetWidth || 520,
        h = element.offsetHeight || 44;
      const x = Math.max(
        8,
        Math.min(surfaceSize.width - w - 8, screen.x + screen.width / 2 - w / 2),
      );
      const clampY = (y: number) => Math.max(96, Math.min(surfaceSize.height - h - 70, y));
      const obstacles = [
        ...svg.querySelectorAll(
          '[data-layer="labels"] [data-object], [data-layer="components"] > [data-object], [data-layer="junctions"] > [data-object], [data-layer="annotations"] > [data-object]',
        ),
      ]
        .map((node) => ({
          rect: node.getBoundingClientRect(),
          selected: selection.includes(node.getAttribute('data-object') ?? ''),
        }))
        .filter(({ rect: r }) => r.width && r.height)
        .map(({ rect: r, selected }) => ({
          x: r.left - canvasRect.left,
          y: r.top - canvasRect.top,
          width: r.width,
          height: r.height,
          weight: selected ? 20 : 1,
        }));
      // Reserve the rotation handle's hit area even before hover reveals it.
      // Otherwise the contextual bar can cover the only way to rotate a curve.
      for (const object of objects) {
        if (object.kind !== 'arrow' && object.kind !== 'loop-arrow') continue;
        const handle = rotationHandle(object, v.zoom);
        obstacles.push({
          x: handle.x * v.zoom + v.x - 14,
          y: handle.y * v.zoom + v.y - 14,
          width: 28,
          height: 28,
          weight: 100,
        });
      }
      const overlap = (y: number) =>
        obstacles.reduce(
          (cost, r) =>
            cost +
            r.weight *
              Math.max(0, Math.min(x + w, r.x + r.width) - Math.max(x, r.x)) *
              Math.max(0, Math.min(y + h, r.y + r.height) - Math.max(y, r.y)),
          0,
        );
      const above = screen.y - h - 16,
        below = screen.y + screen.height + 16;
      const candidates = [above, below, above - h - 16, below + h + 16].map(clampY);
      let y = candidates[0];
      for (const candidate of candidates) if (overlap(candidate) < overlap(y)) y = candidate;
      element.dataset.position = y + h <= screen.y ? 'above' : 'below';

      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(element);
    const labels = svg.querySelector('[data-layer="labels"]');
    if (labels) observer.observe(labels);
    return () => observer.disconnect();
  }, [doc, selection, viewport, surfaceSize, svgRef, hidden, dismissed, objects]);
  if (!objects.length || tool !== 'select') return null;
  const placePopover = (details: HTMLDetailsElement) => {
    if (!details.open) return;
    const popover = details.querySelector<HTMLElement>('.context-popover');
    const surface = svgRef.current?.getBoundingClientRect();
    if (!popover || !surface) return;
    const r = details.getBoundingClientRect(),
      gap = 8,
      height = popover.offsetHeight,
      width = popover.offsetWidth;
    const below = r.bottom + gap,
      top =
        below + height <= surface.bottom - 64
          ? below
          : r.top - gap - height >= surface.top + 8
            ? r.top - gap - height
            : Math.max(surface.top + 8, surface.bottom - 64 - height);
    const left = Math.max(surface.left + 8, Math.min(surface.right - width - 8, r.right - width));
    popover.style.top = `${top - r.top}px`;
    popover.style.bottom = 'auto';
    popover.style.left = `${left - r.left}px`;
    popover.style.right = 'auto';
  };
  const apply = (fn: (obj: CircuitObject) => CircuitObject) => {
    const s = useEditorStore.getState(),
      selected = new Set(selection);
    s.commit({
      ...s.document,
      objects: s.document.objects.map((obj) => (selected.has(obj.id) ? fn(obj) : obj)),
    });
  };
  const hasLabel =
    o?.kind === 'component' ||
    o?.kind === 'junction' ||
    o?.kind === 'electrical' ||
    o?.kind === 'brace';
  return (
    <div
      ref={root}
      className="context-toolbar"
      role="toolbar"
      aria-label="Proprietà selezione"
      style={{ visibility: hidden || dismissed ? 'hidden' : 'visible' }}
    >
      {hasLabel && (
        <label className="property-control">
          <span>{o.kind === 'junction' ? 'Nodo' : 'Etichetta'}</span>
          <PropertyText
            key={`${o.id}-${o.label.text}`}
            value={o.label.text}
            label={
              o.kind === 'junction'
                ? 'Nome nodo'
                : o.kind === 'electrical' || o.kind === 'brace'
                  ? 'Etichetta annotazione'
                  : 'Etichetta componente'
            }
            onChange={(text) => update(o.id, (obj) => replaceInlineText(obj, text))}
          />
        </label>
      )}
      {!o && <span className="property-caption">{objects.length} elementi</span>}
      <details
        ref={style}
        className="context-more context-style"
        onToggle={(e) => {
          placePopover(e.currentTarget);
        }}
      >
        <summary
          role="button"
          aria-label="Stile"
          title="Stile"
          data-tooltip="Stile"
          onClick={() => {
            if (more.current) more.current.open = false;
          }}
        >
          <SlidersHorizontal size={16} />
          <span>Stile</span>
        </summary>
        <SelectionStyle objects={objects} apply={apply} />
      </details>
      <div className="toolbar-divider" />
      {o?.kind === 'wire' && (
        <IconButton
          label="Corrente sul filo"
          onClick={() => {
            const state = useEditorStore.getState();
            const wire = state.document.objects.find((object) => object.id === o.id);
            if (wire?.kind === 'wire') state.add([currentOnSelectedWire(wire, state.document)]);
          }}
        >
          <CurrentInlineIcon size={18} />
        </IconButton>
      )}
      {o && supportsPolarity(o) && (
        <IconButton
          label="Polarità + / -"
          onClick={() => {
            const state = useEditorStore.getState();
            const component = state.document.objects.find((object) => object.id === o.id);
            const annotation =
              component && supportsPolarity(component) ? createPolarity(component) : null;
            if (annotation) state.add([annotation]);
          }}
        >
          <PolarityIcon size={18} />
        </IconButton>
      )}
      {o?.kind === 'brace' && (
        <IconButton
          label="Inverti lato"
          onClick={() =>
            update(o.id, (obj) =>
              obj.kind === 'brace' ? { ...obj, side: obj.side === 1 ? -1 : 1 } : obj,
            )
          }
        >
          <FlipHorizontal size={17} />
        </IconButton>
      )}
      {actions.primary.includes('reverse') && o && (
        <IconButton
          label="Inverti freccia"
          onClick={() =>
            update(o.id, (obj) =>
              obj.kind === 'arrow' || obj.kind === 'electrical'
                ? { ...obj, reversed: !obj.reversed }
                : obj.kind === 'loop-arrow'
                  ? reverseLoop(obj)
                  : obj,
            )
          }
        >
          <ArrowLeftRight size={17} />
        </IconButton>
      )}
      {objects.some((o) => o.kind === 'arrow' || o.kind === 'loop-arrow') && (
        <>
          <IconButton
            label="Specchia orizzontalmente"
            onClick={() => useEditorStore.getState().mirror('horizontal')}
          >
            <FlipHorizontal size={17} />
          </IconButton>
          <IconButton
            label="Specchia verticalmente"
            onClick={() => useEditorStore.getState().mirror('vertical')}
          >
            <FlipVertical size={17} />
          </IconButton>
        </>
      )}
      {actions.primary.includes('rotate') && (
        <IconButton
          label={`Ruota ${objects.some((object) => object.kind === 'component') ? 45 : 90}° (R)`}
          onClick={() => useEditorStore.getState().rotate()}
        >
          <RotateCw size={17} />
        </IconButton>
      )}
      <IconButton label="Duplica (⌘/Ctrl D)" onClick={() => useEditorStore.getState().duplicate()}>
        <Copy size={17} />
      </IconButton>
      {blockDialog && (
        <BlockNameDialog
          onClose={() => setBlockDialog(false)}
          onSave={(name) =>
            usePersonalBlocks.getState().add(createPersonalBlock(doc, selection, name))
          }
        />
      )}
      {replaceDialog && components.length > 0 && (
        <ReplaceDialog components={components} onClose={() => setReplaceDialog(false)} />
      )}
      {!!actions.secondary.length && (
        <details
          ref={more}
          className="context-more"
          onToggle={(e) => {
            placePopover(e.currentTarget);
          }}
        >
          <summary
            role="button"
            onClick={() => {
              if (style.current) style.current.open = false;
            }}
            aria-label="Altre proprietà"
            title="Altre proprietà"
            data-tooltip="Altre proprietà"
          >
            <MoreHorizontal size={18} />
          </summary>
          <div className="context-popover">
            {components.length > 0 && (
              <button
                className="secondary-property"
                onClick={() => {
                  if (more.current) more.current.open = false;
                  setReplaceDialog(true);
                }}
              >
                <Replace size={16} />
                Sostituisci…
              </button>
            )}
            <button
              className="secondary-property"
              onClick={() => {
                if (more.current) more.current.open = false;
                setBlockDialog(true);
              }}
            >
              <BookmarkPlus size={16} />
              Salva come blocco
            </button>
            <button
              className="secondary-property"
              disabled={pngBusy}
              onClick={() => void copySelectionPNG()}
            >
              <Image size={16} />
              {pngBusy ? 'Copia immagine…' : 'Copia come immagine'}
            </button>
            {o?.kind === 'electrical' && (
              <>
                <label className="property-control">
                  Offset X
                  <input
                    aria-label="Offset annotazione X"
                    type="number"
                    value={o.offset.x}
                    onChange={(e) => {
                      const x = Number(e.target.value);
                      if (Number.isFinite(x))
                        update(o.id, (obj) =>
                          obj.kind === 'electrical'
                            ? { ...obj, offset: { ...obj.offset, x } }
                            : obj,
                        );
                    }}
                  />
                </label>
                <label className="property-control">
                  Offset Y
                  <input
                    aria-label="Offset annotazione Y"
                    type="number"
                    value={o.offset.y}
                    onChange={(e) => {
                      const y = Number(e.target.value);
                      if (Number.isFinite(y))
                        update(o.id, (obj) =>
                          obj.kind === 'electrical'
                            ? { ...obj, offset: { ...obj.offset, y } }
                            : obj,
                        );
                    }}
                  />
                </label>
              </>
            )}
            {actions.secondary.includes('bodyText') && o?.kind === 'component' && (
              <label className="property-control">
                <span>Testo interno</span>
                <PropertyText
                  key={`${o.id}-body-${o.bodyText}`}
                  label="Testo interno"
                  value={o.bodyText ?? '='}
                  onChange={(bodyText) =>
                    update(o.id, (obj) => (obj.kind === 'component' ? { ...obj, bodyText } : obj))
                  }
                />
              </label>
            )}
            {actions.secondary.includes('alignment') && o?.kind === 'text' && (
              <div className="alignment-buttons">
                {(['start', 'middle', 'end'] as const).map((align, i) => (
                  <IconButton
                    key={align}
                    label={['Allinea a sinistra', 'Centra testo', 'Allinea a destra'][i]}
                    active={o.align === align}
                    onClick={() =>
                      update(o.id, (obj) => (obj.kind === 'text' ? { ...obj, align } : obj))
                    }
                  >
                    {i === 0 ? (
                      <AlignLeft size={16} />
                    ) : i === 1 ? (
                      <AlignCenter size={16} />
                    ) : (
                      <AlignRight size={16} />
                    )}
                  </IconButton>
                ))}
              </div>
            )}
            {actions.secondary.includes('arrowType') && o?.kind === 'arrow' && (
              <label className="property-control">
                <span>Forma</span>
                <select
                  aria-label="Tipo freccia"
                  title="Tipo freccia"
                  value={o.type}
                  onChange={(e) =>
                    update(o.id, (obj) =>
                      obj.kind === 'arrow'
                        ? { ...obj, type: e.target.value as 'straight' | 'curve' | 'arc' }
                        : obj,
                    )
                  }
                >
                  <option value="straight">Dritta</option>
                  <option value="curve">Curva</option>
                  <option value="arc">Maglia</option>
                </select>
              </label>
            )}
            <button
              className="secondary-property destructive-button"
              title={
                activeLabel
                  ? 'Elimina etichetta (Delete) · Shift+Delete elimina l’oggetto'
                  : 'Elimina (Delete)'
              }
              aria-label={activeLabel ? 'Elimina etichetta (Delete)' : 'Elimina (Delete)'}
              onClick={() => useEditorStore.getState().remove()}
            >
              <Trash2 size={16} />
              {activeLabel ? 'Elimina etichetta' : 'Elimina'}
            </button>
          </div>
        </details>
      )}
    </div>
  );
}
