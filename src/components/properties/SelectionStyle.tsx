import { ChevronDown, Type, Minus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { COLORS } from '../../model/types';
import type { CircuitObject } from '../../model/types';

const colorNames = { ink: 'Nero', blue: 'Blu', red: 'Rosso', green: 'Verde', purple: 'Viola' };
function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  const lastColor = useRef(value);
  useEffect(() => {
    lastColor.current = value;
  }, [value]);
  // Native pickers emit input while choosing and change on confirmation.
  // Commit each new value once, including browsers that emit both events.
  const chooseCustom = (event: FormEvent<HTMLInputElement>) => {
    const color = event.currentTarget.value;
    if (color === lastColor.current) return;
    lastColor.current = color;
    onChange(color);
  };
  return (
    <div className="style-row">
      <span>{label}</span>
      <div className="style-colors" role="group" aria-label={`Colore ${label.toLowerCase()}`}>
        {Object.entries(COLORS).map(([name, color]) => (
          <button
            key={name}
            type="button"
            className="color-choice"
            aria-label={`${label}: ${colorNames[name as keyof typeof colorNames]}`}
            title={`${label}: ${colorNames[name as keyof typeof colorNames]}`}
            aria-pressed={value.toLowerCase() === color}
            onClick={() => onChange(color)}
          >
            <span style={{ background: color }} />
          </button>
        ))}
        <label
          className="color-choice custom-color-choice"
          title="Colore personalizzato"
          data-selected={!Object.values(COLORS).some((color) => color === value.toLowerCase())}
        >
          <span className="rgb-swatch" aria-hidden="true" />
          <input
            type="color"
            value={value}
            aria-label={`Colore ${label.toLowerCase()} personalizzato`}
            title="Colore personalizzato"
            onInput={chooseCustom}
            onChange={chooseCustom}
          />
        </label>
      </div>
    </div>
  );
}
function OpacityControl({
  objects,
  label,
  labelOpacity = false,
}: {
  objects: CircuitObject[];
  label: string;
  labelOpacity?: boolean;
}) {
  const ids = new Set(objects.map((o) => o.id));
  const values = objects.flatMap((o) =>
    labelOpacity ? ('label' in o ? [o.label.opacity ?? 1] : []) : [o.opacity ?? 1],
  );
  const value = Math.round((values[0] ?? 1) * 100);
  const mixed = values.some((v) => v !== values[0]);
  const ownsGesture = useRef(false);
  const begin = () => {
    if (!ownsGesture.current) {
      useEditorStore.getState().beginGesture();
      ownsGesture.current = true;
    }
  };
  const finish = () => {
    if (ownsGesture.current) {
      ownsGesture.current = false;
      useEditorStore.getState().endGesture();
    }
  };
  useEffect(
    () => () => {
      if (ownsGesture.current) useEditorStore.getState().endGesture();
    },
    [],
  );
  return (
    <label className="style-row opacity-row">
      <span>{label}</span>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        aria-label={label}
        aria-valuetext={mixed ? 'Valori misti' : `${value}%`}
        onPointerDown={(e) => {
          begin();
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerUp={finish}
        onPointerCancel={() => {
          ownsGesture.current = false;
          useEditorStore.getState().cancelGesture();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            ownsGesture.current = false;
            useEditorStore.getState().cancelGesture();
          } else if (
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
        }}
        onKeyUp={finish}
        onBlur={finish}
        onChange={(e) => {
          const opacity = Number(e.target.value) / 100;
          const state = useEditorStore.getState();
          const next = {
            ...state.document,
            objects: state.document.objects.map((o) =>
              !ids.has(o.id)
                ? o
                : labelOpacity
                  ? 'label' in o
                    ? { ...o, label: { ...o.label, opacity } }
                    : o
                  : { ...o, opacity },
            ),
          };
          if (ownsGesture.current) state.preview(next);
          else state.commit(next);
        }}
      />
      <output>{mixed ? '—' : `${value}%`}</output>
    </label>
  );
}
export function SelectionStyle({
  objects,
  apply,
}: {
  objects: CircuitObject[];
  apply: (fn: (o: CircuitObject) => CircuitObject) => void;
}) {
  const o = objects.length === 1 ? objects[0] : null;
  const labeled = (o: CircuitObject) =>
    o.kind === 'component' ||
    o.kind === 'junction' ||
    o.kind === 'electrical' ||
    o.kind === 'brace';
  const hasLabel = objects.some(labeled);
  const hasText = hasLabel || objects.some((o) => o.kind === 'text');
  const hasStroke = objects.some(
    (o) =>
      o.kind === 'component' ||
      o.kind === 'wire' ||
      o.kind === 'arrow' ||
      o.kind === 'loop-arrow' ||
      o.kind === 'electrical' ||
      o.kind === 'brace',
  );
  const size = o?.kind === 'text' ? o.fontSize : o && 'label' in o ? o.label.fontSize : 22;
  const width = o?.kind === 'loop-arrow' ? o.strokeWidth : o && 'width' in o ? o.width : 2;
  return (
    <div className="context-popover style-popover" role="group" aria-label="Stile selezione">
      <ColorControl
        label={o?.kind === 'text' ? 'Testo' : o?.kind === 'wire' ? 'Filo' : 'Simbolo'}
        value={o?.color ?? COLORS.ink}
        onChange={(color) => apply((o) => ({ ...o, color }))}
      />
      <OpacityControl
        objects={objects}
        label={o?.kind === 'text' ? 'Opacità testo' : 'Opacità simbolo'}
      />
      {hasLabel && (
        <ColorControl
          label="Etichetta"
          value={o && 'label' in o ? o.label.color : COLORS.blue}
          onChange={(color) =>
            apply((o) => ('label' in o ? { ...o, label: { ...o.label, color } } : o))
          }
        />
      )}
      {hasLabel && <OpacityControl objects={objects} label="Opacità etichetta" labelOpacity />}
      {hasStroke && (
        <label className="style-row" title="Spessore linea">
          <span>
            <Minus size={15} />
            Spessore
          </span>
          <span className="style-value">
            <span className="style-select">
              <select
                aria-label="Spessore linea"
                title="Spessore linea"
                value={width}
                onChange={(e) =>
                  apply((o) =>
                    o.kind === 'loop-arrow'
                      ? { ...o, strokeWidth: Number(e.target.value) }
                      : o.kind === 'component' ||
                          o.kind === 'wire' ||
                          o.kind === 'arrow' ||
                          o.kind === 'electrical' ||
                          o.kind === 'brace'
                        ? { ...o, width: Number(e.target.value) }
                        : o,
                  )
                }
              >
                {[...new Set([1, 1.5, 1.8, 2, 3, 4, width])]
                  .sort((a, b) => a - b)
                  .map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
              </select>
              <ChevronDown size={12} aria-hidden="true" />
            </span>
            <span className="style-unit">px</span>
          </span>
        </label>
      )}
      {hasText && (
        <label className="style-row" title="Dimensione testo">
          <span>
            <Type size={15} />
            Testo
          </span>
          <span className="style-value">
            <span className="style-select">
              <select
                aria-label="Dimensione testo"
                title="Dimensione testo"
                value={size}
                onChange={(e) =>
                  apply((o) =>
                    o.kind === 'text'
                      ? { ...o, fontSize: Number(e.target.value) }
                      : 'label' in o
                        ? { ...o, label: { ...o.label, fontSize: Number(e.target.value) } }
                        : o,
                  )
                }
              >
                {[...new Set([16, 18, 20, 22, 23, 24, 27, 28, 32, 40, size])]
                  .sort((a, b) => a - b)
                  .map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
              <ChevronDown size={12} aria-hidden="true" />
            </span>
            <span className="style-unit">px</span>
          </span>
        </label>
      )}
    </div>
  );
}
