import { t } from '../../i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Blend, Type } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { commonValue } from './commonValue';
import { COLORS } from '../../model/types';
import { MAX_FONT_SIZE, MAX_LINE_WIDTH } from '../../model/limits';
import type { CircuitObject } from '../../model/types';
import { ActionMenu } from '../toolbar/ActionMenu';
import type { MenuAction } from '../toolbar/ActionMenu';
import { PropertyField, PropertySelect, PropertyRow } from './PropertyControls';
import { normalizeHex } from '../../tikz/validation';
import { withPrimaryPaint } from '../../model/shapeAppearance';

function HexColorField({ value, label, onChange }: { value: string | undefined; label: string; onChange: (color: string) => void }) {
  const [draft, setDraft] = useState(value?.replace('#', '').toUpperCase() ?? '');
  const [invalid, setInvalid] = useState(false);
  const cancel = useRef(false);
  const commit = () => {
    const hex = normalizeHex(draft);
    if (!cancel.current && hex) onChange(`#${hex}`);
    setDraft(value?.replace('#', '').toUpperCase() ?? '');
    setInvalid(false);
    cancel.current = false;
  };
  return <span className="inspector-hex-field"><span aria-hidden="true">#</span><input
    aria-label={label} value={draft} placeholder={t('Mixed')} aria-invalid={invalid || undefined}
    maxLength={7} spellCheck={false} onChange={(e) => { setDraft(e.target.value); setInvalid(!normalizeHex(e.target.value)); }}
    onBlur={commit} onKeyDown={(e) => {
      if (e.key === 'Escape') { cancel.current = true; e.currentTarget.blur(); }
      if (e.key === 'Enter' && normalizeHex(draft)) e.currentTarget.blur();
    }} /></span>;
}

const colorNames = {
  ink: 'Black',
  blue: 'Blue',
  red: 'Red',
  orange: 'Orange',
  green: 'Green',
  purple: 'Purple',
};
const labeled = (o: CircuitObject) => 'label' in o;
const stroked = (o: CircuitObject) => 'width' in o || 'strokeWidth' in o;

export function ColorControl({
  label,
  caption = label,
  value,
  onChange,
  children,
  colors = COLORS,
  gesture = true,
  paint = true,
  leading,
  actions = [],
  valueControl,
  outlineSwatch = false,
}: {
  label: string;
  caption?: string;
  value: string | undefined;
  onChange: (color: string) => void;
  children: ReactNode;
  colors?: Readonly<Record<string, string>>;
  gesture?: boolean;
  paint?: boolean;
  leading?: ReactNode;
  actions?: MenuAction[];
  valueControl?: ReactNode;
  outlineSwatch?: boolean;
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
  const control = (
      <div className="inspector-color">
        <ActionMenu
          label={colorLabel}
          className="inspector-color-trigger"
          icon={
            <>
              <span
                className={'inspector-swatch' + (value === undefined ? ' mixed-swatch' : '') + (outlineSwatch ? ' inspector-swatch-outline' : '')}
                style={outlineSwatch ? { borderColor: value } : { backgroundColor: value }}
              />
              {!paint && <span className="inspector-hex">
                {value === undefined ? t('Mixed') : value.toUpperCase()}
              </span>}
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
            ...actions,
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
  );
  const paintRow = <div className="inspector-paint-row">
    {leading}{control}{valueControl ?? <HexColorField key={value ?? 'mixed'} value={value} label={t('{label} hex color', { label })} onChange={onChange} />}{children}
  </div>;
  return paint ? leading ? paintRow : <div className="inspector-paint-field"><span className="inspector-field-caption">{caption}</span>{paintRow}</div>
    : <PropertyRow caption={caption} secondary={children}>{control}</PropertyRow>;
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
      icon={<Blend size={12} />}
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
              : withPrimaryPaint({ ...o, opacity }, { opacity }),
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
  labelAppearance = true,
}: {
  objects: CircuitObject[];
  apply: (fn: (o: CircuitObject) => CircuitObject) => void;
  labelOnly?: boolean;
  typography?: boolean;
  labelAppearance?: boolean;
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
          onChange={(color) => apply((o) => withPrimaryPaint({ ...o, color }, { color }))}
        >
          <OpacityControl
            objects={objects}
            apply={apply}
            label={o?.kind === 'text' ? t('Text opacity') : t('Symbol opacity')}
          />
        </ColorControl>
      )}
      {hasLabel && labelAppearance && <LabelAppearance objects={objects} apply={apply} />}
      {(hasStroke || typography) && (
        <div className="inspector-style-fields">
          {hasStroke && (
            <PropertySelect
              label={t('Line width')}
              caption={t('Thickness')}
              numeric={{ min: 0, exclusiveMin: true, max: MAX_LINE_WIDTH, unit: 'px' }}
              value={width}
              onChange={(v) =>
                apply((o) =>
                  'strokeWidth' in o
                    ? withPrimaryPaint({ ...o, strokeWidth: Number(v) }, { width: Number(v) })
                    : 'width' in o
                      ? withPrimaryPaint({ ...o, width: Number(v) }, { width: Number(v) })
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

export function LabelAppearance({ objects, apply, caption }: {
  objects: CircuitObject[];
  apply: (fn: (o: CircuitObject) => CircuitObject) => void;
  caption?: string;
}) {
  return (
    <ColorControl
      label={t('Label')}
      caption={caption}
      value={commonValue(objects.map((o) => ('label' in o ? o.label.color : '')))}
      onChange={(color) => apply((o) => 'label' in o ? { ...o, label: { ...o.label, color } } : o)}
    >
      <OpacityControl objects={objects} apply={apply} label={t('Label opacity')} labelOpacity />
    </ColorControl>
  );
}

export function SelectionTypography({
  objects,
  apply,
  controls = 'all',
}: {
  objects: CircuitObject[];
  apply: (fn: (o: CircuitObject) => CircuitObject) => void;
  controls?: 'all' | 'size' | 'alignment';
}) {
  const size = commonValue(
    objects.map((o) => (o.kind === 'text' ? o.fontSize : 'label' in o ? o.label.fontSize : 0)),
  );
  return (
    <>
      {controls !== 'alignment' && <PropertySelect
        label={t('Text size')}
        caption={<Type size={14} aria-hidden="true" />}
        embedded
        numeric={{ min: 0, exclusiveMin: true, max: MAX_FONT_SIZE, unit: 'px' }}
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
      </PropertySelect>}
      {controls !== 'size' && objects.every((o) => o.kind === 'text') && (
        <div className="inspector-text-alignment" role="group" aria-label={t('Text alignment')}>
          {([
            ['start', 'Left', AlignLeft],
            ['middle', 'Center', AlignCenter],
            ['end', 'Right', AlignRight],
          ] as const).map(([alignment, label, Icon]) => (
            <button
              key={alignment}
              aria-label={t(label)}
              title={t(label)}
              aria-pressed={commonValue(objects.map((object) => object.kind === 'text' ? object.align : 'start')) === alignment}
              onClick={() => apply((object) => object.kind === 'text' ? { ...object, align: alignment } : object)}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
