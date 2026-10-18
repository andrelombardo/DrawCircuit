import { t } from '../../i18n';
import { useCallback, useEffect, useRef } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { commonValue } from './commonValue';
import { COLORS } from '../../model/types';
import type { CircuitObject } from '../../model/types';
import { ActionMenu } from '../toolbar/ActionMenu';
import { PropertyField, PropertySelect, PropertyRow } from './PropertyControls';

const colorNames = {
  ink: 'Black',
  blue: 'Blue',
  red: 'Red',
  green: 'Green',
  purple: 'Purple',
};
const labeled = (o: CircuitObject) => 'label' in o;
const stroked = (o: CircuitObject) => 'width' in o || 'strokeWidth' in o;

export function ColorControl({
  label,
  value,
  onChange,
  children,
  colors = COLORS,
  gesture = true,
}: {
  label: string;
  value: string | undefined;
  onChange: (color: string) => void;
  children: ReactNode;
  colors?: Readonly<Record<string, string>>;
  gesture?: boolean;
}) {
  const colorLabel =
    label === t('Color') ? label : t('{label} color', { label: label.toLocaleLowerCase() });
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
    if (gesture && !ownsGesture.current) {
      useEditorStore.getState().beginGesture();
      ownsGesture.current = true;
    }
  };
  return (
    <PropertyRow caption={label} secondary={children} secondaryCaption={t('Opacity')}>
      <div className="inspector-color">
        <ActionMenu
          label={colorLabel}
          className="inspector-color-trigger"
          icon={
            <>
              <span
                className={'inspector-swatch' + (value === undefined ? ' mixed-swatch' : '')}
                style={{ backgroundColor: value }}
              />
              <span className="inspector-hex">
                {value === undefined ? t('Mixed') : value.toUpperCase()}
              </span>
            </>
          }
          items={[
            ...Object.entries(colors).map(([name, color]) => ({
              id: name,
              label: t(colorNames[name as keyof typeof colorNames] ?? name),
              icon: <span className="inspector-swatch" style={{ backgroundColor: color }} />,
              onSelect: () => onChange(color),
            })),
            {
              id: 'custom',
              label: t('Custom color…'),
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
          aria-label={t('Custom {label}', {
            label: colorLabel.toLocaleLowerCase(),
          })}
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
      fillOpacity && (o.kind === 'rectangle' || o.kind === 'circle')
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
          fillOpacity && (o.kind === 'rectangle' || o.kind === 'circle')
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
  const shapes = objects.every((o) => o.kind === 'rectangle' || o.kind === 'circle');
  const fillObjects = objects.filter(
    (o) => (o.kind === 'rectangle' || o.kind === 'circle') && o.fill !== 'none',
  );
  const symbolCaption =
    o?.kind === 'text'
      ? t('Text')
      : o?.kind === 'wire'
        ? t('Wire')
        : o?.kind === 'rectangle' || o?.kind === 'circle' || o?.kind === 'line'
          ? t('Outline')
          : t('Symbol');
  return (
    <div className="inspector-style" role="group" aria-label={t('Selection style')}>
      {!labelOnly && (
        <ColorControl
          label={symbolCaption}
          value={commonValue(objects.map((o) => o.color))}
          onChange={(color) => apply((o) => ({ ...o, color }))}
        >
          <OpacityControl
            objects={objects}
            apply={apply}
            label={o?.kind === 'text' ? t('Text opacity') : t('Symbol opacity')}
          />
        </ColorControl>
      )}
      {hasLabel && (
        <ColorControl
          label={t('Label')}
          value={commonValue(objects.map((o) => ('label' in o ? o.label.color : '')))}
          onChange={(color) =>
            apply((o) => ('label' in o ? { ...o, label: { ...o.label, color } } : o))
          }
        >
          <OpacityControl objects={objects} apply={apply} label={t('Label opacity')} labelOpacity />
        </ColorControl>
      )}
      {(hasStroke || typography) && (
        <div className="inspector-style-fields">
          {hasStroke && (
            <PropertySelect
              label={t('Line width')}
              caption={t('Thickness')}
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
      {shapes && (
        <PropertySelect
          label={t('Fill')}
          caption={t('Fill type')}
          value={commonValue(
            objects.map((o) =>
              (o.kind === 'rectangle' || o.kind === 'circle') && o.fill !== 'none'
                ? 'color'
                : 'none',
            ),
          )}
          onChange={(v) =>
            apply((o) =>
              o.kind === 'rectangle' || o.kind === 'circle'
                ? {
                    ...o,
                    fill: v === 'none' ? 'none' : o.fill === 'none' ? COLORS.blue : o.fill,
                  }
                : o,
            )
          }
        >
          <option value="none">{t('None')}</option>
          <option value="color">{t('Color')}</option>
        </PropertySelect>
      )}
      {shapes && fillObjects.length === objects.length && (
        <ColorControl
          label={t('Fill')}
          value={commonValue(
            fillObjects.map((o) => (o.kind === 'rectangle' || o.kind === 'circle' ? o.fill : '')),
          )}
          onChange={(fill) =>
            apply((o) => (o.kind === 'rectangle' || o.kind === 'circle' ? { ...o, fill } : o))
          }
        >
          <OpacityControl
            objects={fillObjects}
            apply={apply}
            label={t('Fill opacity')}
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
        label={t('Text size')}
        caption={t('Text size')}
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
            48,
            56,
            64,
            72,
            96,
            120,
            160,
            200,
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
          label={t('Text alignment')}
          caption={t('Alignment')}
          value={commonValue(objects.map((o) => (o.kind === 'text' ? o.align : 'start')))}
          onChange={(v) =>
            apply((o) => (o.kind === 'text' ? { ...o, align: v as 'start' | 'middle' | 'end' } : o))
          }
        >
          <option value="start">{t('Left')}</option>
          <option value="middle">{t('Center')}</option>
          <option value="end">{t('Right')}</option>
        </PropertySelect>
      )}
    </>
  );
}
