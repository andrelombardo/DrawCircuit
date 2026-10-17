import { useCallback, useEffect, useRef } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { commonValue } from './commonValue';
import { COLORS } from '../../model/types';
import type { CircuitObject } from '../../model/types';
import { ActionMenu } from '../toolbar/ActionMenu';
import { PropertyField, PropertySelect, PropertyRow } from './PropertyControls';

const colorNames = { ink: 'Nero', blue: 'Blu', red: 'Rosso', green: 'Verde', purple: 'Viola' };
const labeled = (o: CircuitObject) => 'label' in o;
const stroked = (o: CircuitObject) => 'width' in o || 'strokeWidth' in o;

function ColorControl({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | undefined;
  onChange: (color: string) => void;
  children: ReactNode;
}) {
  const lastColor = useRef(value);
  const ownsGesture = useRef(false);
  const picker = useRef<HTMLInputElement>(null);
  const finish = useCallback(() => {
    if (ownsGesture.current) {
      ownsGesture.current = false;
      useEditorStore.getState().endGesture();
    }
  }, []);
  useEffect(
    () => () => {
      if (ownsGesture.current) useEditorStore.getState().endGesture();
    },
    [],
  );
  useEffect(() => {
    lastColor.current = value;
  }, [value]);
  // Native confirmation can follow an identical React input value.
  useEffect(() => {
    const input = picker.current;
    const confirm = () => {
      if (input && input.value !== lastColor.current) {
        lastColor.current = input.value;
        onChange(input.value);
      }
      finish();
    };
    input?.addEventListener('change', confirm);
    return () => input?.removeEventListener('change', confirm);
  }, [onChange, finish]);
  const chooseCustom = (event: FormEvent<HTMLInputElement>) => {
    const color = event.currentTarget.value;
    if (color === lastColor.current) return;
    lastColor.current = color;
    onChange(color);
  };
  const begin = () => {
    if (!ownsGesture.current) {
      useEditorStore.getState().beginGesture();
      ownsGesture.current = true;
    }
  };
  return (
    <PropertyRow caption={label} secondary={children} secondaryCaption="Opacità">
      <div className="inspector-color">
        <ActionMenu
          label={'Colore ' + label.toLowerCase()}
          className="inspector-color-trigger"
          icon={
            <>
              <span
                className={'inspector-swatch' + (value === undefined ? ' mixed-swatch' : '')}
                style={{ backgroundColor: value }}
              />
              <span className="inspector-hex">
                {value === undefined ? 'Misto' : value.toUpperCase()}
              </span>
            </>
          }
          items={[
            ...Object.entries(COLORS).map(([name, color]) => ({
              id: name,
              label: label + ': ' + colorNames[name as keyof typeof colorNames],
              icon: <span className="inspector-swatch" style={{ backgroundColor: color }} />,
              onSelect: () => onChange(color),
            })),
            {
              id: 'custom',
              label: 'Colore personalizzato…',
              separatorBefore: true,
              onSelect: () => {
                begin();
                picker.current?.click();
              },
            },
          ]}
        />
        <input
          ref={picker}
          className="inspector-native-color"
          type="color"
          tabIndex={-1}
          value={value ?? COLORS.ink}
          aria-label={'Colore ' + label.toLowerCase() + ' personalizzato'}
          onPointerDown={begin}
          onInput={chooseCustom}
          onChange={chooseCustom}
          onBlur={finish}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && ownsGesture.current) {
              e.stopPropagation();
              ownsGesture.current = false;
              useEditorStore.getState().cancelGesture();
            }
          }}
        />
      </div>
    </PropertyRow>
  );
}

export function OpacityControl({
  objects,
  label,
  labelOpacity = false,
  fillOpacity = false,
  apply,
}: {
  objects: CircuitObject[];
  label: string;
  labelOpacity?: boolean;
  fillOpacity?: boolean;
  apply: (fn: (o: CircuitObject) => CircuitObject) => void;
}) {
  const value = commonValue(
    objects.map((o) =>
      fillOpacity && o.kind === 'rectangle'
        ? (o.fillOpacity ?? 1)
        : labelOpacity && 'label' in o
          ? (o.label.opacity ?? 1)
          : (o.opacity ?? 1),
    ),
  );
  return (
    <PropertyField
      label={label}
      caption=""
      numeric
      unit="%"
      min={0}
      max={100}
      value={value === undefined ? undefined : Math.round(value * 100)}
      onCommit={(raw) => {
        const opacity = Number(raw) / 100;
        apply((o) =>
          fillOpacity && o.kind === 'rectangle'
            ? { ...o, fillOpacity: opacity }
            : labelOpacity && 'label' in o
              ? { ...o, label: { ...o.label, opacity } }
              : { ...o, opacity },
        );
      }}
    />
  );
}

export function SelectionStyle({
  objects,
  apply,
  labelOnly = false,
  typography = false,
}: {
  objects: CircuitObject[];
  apply: (fn: (o: CircuitObject) => CircuitObject) => void;
  labelOnly?: boolean;
  typography?: boolean;
}) {
  const o = objects.length === 1 ? objects[0] : null;
  const hasLabel = objects.every(labeled);
  const hasStroke = !labelOnly && objects.every(stroked);
  const width = commonValue(
    objects.map((o) => ('strokeWidth' in o ? o.strokeWidth : 'width' in o ? o.width : 0)),
  );
  const rectangles = objects.every((o) => o.kind === 'rectangle');
  const fillObjects = objects.filter((o) => o.kind === 'rectangle' && o.fill !== 'none');
  const symbolCaption =
    o?.kind === 'text'
      ? 'Testo'
      : o?.kind === 'wire'
        ? 'Filo'
        : o?.kind === 'rectangle' || o?.kind === 'line'
          ? 'Contorno'
          : 'Simbolo';
  return (
    <div className="inspector-style" role="group" aria-label="Stile selezione">
      {!labelOnly && (
        <ColorControl
          label={symbolCaption}
          value={commonValue(objects.map((o) => o.color))}
          onChange={(color) => apply((o) => ({ ...o, color }))}
        >
          <OpacityControl
            objects={objects}
            apply={apply}
            label={o?.kind === 'text' ? 'Opacità testo' : 'Opacità simbolo'}
          />
        </ColorControl>
      )}
      {hasLabel && (
        <ColorControl
          label="Etichetta"
          value={commonValue(objects.map((o) => ('label' in o ? o.label.color : '')))}
          onChange={(color) =>
            apply((o) => ('label' in o ? { ...o, label: { ...o.label, color } } : o))
          }
        >
          <OpacityControl objects={objects} apply={apply} label="Opacità etichetta" labelOpacity />
        </ColorControl>
      )}
      {(hasStroke || typography) && (
        <div className="inspector-style-fields">
          {hasStroke && (
            <PropertySelect
              label="Spessore linea"
              caption="Spessore"
              value={width}
              onChange={(v) =>
                apply((o) =>
                  'strokeWidth' in o
                    ? { ...o, strokeWidth: Number(v) }
                    : 'width' in o
                      ? { ...o, width: Number(v) }
                      : o,
                )
              }
            >
              {[...new Set([1, 1.5, 1.8, 2, 3, 4, ...(width === undefined ? [] : [width])])]
                .sort((a, b) => a - b)
                .map((w) => (
                  <option key={w} value={w}>
                    {w} px
                  </option>
                ))}
            </PropertySelect>
          )}
          {typography && <SelectionTypography objects={objects} apply={apply} />}
        </div>
      )}
      {rectangles && (
        <PropertySelect
          label="Riempimento"
          caption="Tipo riempimento"
          value={commonValue(
            objects.map((o) => (o.kind === 'rectangle' && o.fill !== 'none' ? 'color' : 'none')),
          )}
          onChange={(v) =>
            apply((o) =>
              o.kind === 'rectangle'
                ? { ...o, fill: v === 'none' ? 'none' : o.fill === 'none' ? COLORS.blue : o.fill }
                : o,
            )
          }
        >
          <option value="none">Nessuno</option>
          <option value="color">Colore</option>
        </PropertySelect>
      )}
      {rectangles && fillObjects.length === objects.length && (
        <ColorControl
          label="Riempimento"
          value={commonValue(fillObjects.map((o) => (o.kind === 'rectangle' ? o.fill : '')))}
          onChange={(fill) => apply((o) => (o.kind === 'rectangle' ? { ...o, fill } : o))}
        >
          <OpacityControl
            objects={fillObjects}
            apply={apply}
            label="Opacità riempimento"
            fillOpacity
          />
        </ColorControl>
      )}
    </div>
  );
}

export function SelectionTypography({
  objects,
  apply,
}: {
  objects: CircuitObject[];
  apply: (fn: (o: CircuitObject) => CircuitObject) => void;
}) {
  const size = commonValue(
    objects.map((o) => (o.kind === 'text' ? o.fontSize : 'label' in o ? o.label.fontSize : 0)),
  );
  return (
    <>
      <PropertySelect
        label="Dimensione testo"
        caption="Dimensione testo"
        value={size}
        onChange={(v) =>
          apply((o) =>
            o.kind === 'text'
              ? { ...o, fontSize: Number(v) }
              : 'label' in o
                ? { ...o, label: { ...o.label, fontSize: Number(v) } }
                : o,
          )
        }
      >
        {[
          ...new Set([
            16,
            18,
            20,
            22,
            23,
            24,
            27,
            28,
            32,
            40,
            ...(size === undefined ? [] : [size]),
          ]),
        ]
          .sort((a, b) => a - b)
          .map((s) => (
            <option key={s} value={s}>
              {s} px
            </option>
          ))}
      </PropertySelect>
      {objects.every((o) => o.kind === 'text') && (
        <PropertySelect
          label="Allineamento testo"
          caption="Allineamento"
          value={commonValue(objects.map((o) => (o.kind === 'text' ? o.align : 'start')))}
          onChange={(v) =>
            apply((o) => (o.kind === 'text' ? { ...o, align: v as 'start' | 'middle' | 'end' } : o))
          }
        >
          <option value="start">Sinistra</option>
          <option value="middle">Centro</option>
          <option value="end">Destra</option>
        </PropertySelect>
      )}
    </>
  );
}
