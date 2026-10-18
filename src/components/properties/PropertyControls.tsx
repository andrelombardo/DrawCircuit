import { Children, isValidElement, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ActionMenu } from '../toolbar/ActionMenu';
import { MAX_COORDINATE, MAX_TEXT_LENGTH } from '../../model/limits';
function DraftInput({
  value,
  label,
  id,
  numeric,
  min = -MAX_COORDINATE,
  max = MAX_COORDINATE,
  unit,
  onCommit,
}: {
  value: string | number | undefined;
  label: string;
  id?: string;
  numeric?: boolean;
  min?: number;
  max?: number;
  unit?: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value === undefined ? '' : String(value));
  const cancelled = useRef(false);
  const commit = () => {
    if (!cancelled.current && draft !== '' && draft !== String(value)) {
      const n = Number(draft);
      if (
        !numeric ||
        (Number.isFinite(n) && (min === undefined || n >= min) && (max === undefined || n <= max))
      )
        onCommit(draft);
    } else if (
      !cancelled.current &&
      !numeric &&
      draft === '' &&
      value !== undefined &&
      value !== ''
    )
      onCommit('');
    cancelled.current = false;
    setDraft(value === undefined ? '' : String(value));
  };
  return (
    <input
      id={id}
      className="property-text"
      type={numeric ? 'number' : 'text'}
      step={numeric ? 'any' : undefined}
      min={min}
      max={max}
      maxLength={numeric ? undefined : MAX_TEXT_LENGTH}
      value={draft}
      aria-label={label}
      aria-valuetext={
        numeric ? (value === undefined ? 'Valori misti' : `${value}${unit ?? ''}`) : undefined
      }
      placeholder={value === undefined ? (numeric ? 'Misto' : 'Valori misti') : label}
      onFocus={() => {
        cancelled.current = false;
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
          e.stopPropagation();
          cancelled.current = true;
          setDraft(value === undefined ? '' : String(value));
          e.currentTarget.blur();
        }
      }}
    />
  );
}
/** All property controls share one label axis and one control axis. */
export function PropertyRow({
  caption,
  children,
  secondary,
  htmlFor,
  secondaryCaption,
}: {
  caption: ReactNode;
  children: ReactNode;
  secondary?: ReactNode;
  htmlFor?: string;
  secondaryCaption?: ReactNode;
}) {
  return (
    <div className={`property-row${secondary ? ' property-row-secondary' : ''}`}>
      <label className="inspector-field-caption" htmlFor={htmlFor}>
        {caption}
      </label>
      {secondaryCaption && (
        <span className="inspector-field-caption property-secondary-caption" aria-hidden="true">
          {secondaryCaption}
        </span>
      )}
      <div className="inspector-control">{children}</div>
      {secondary && <div className="property-secondary">{secondary}</div>}
    </div>
  );
}
export function PropertyField(props: Parameters<typeof DraftInput>[0] & { caption?: ReactNode }) {
  const id = useId();
  const field = (
    <span className="inspector-input">
      <DraftInput key={`${props.label}:${props.value}`} {...props} id={id} />
      {props.unit && (
        <span className="inspector-unit" aria-hidden="true">
          {props.unit}
        </span>
      )}
    </span>
  );
  // An empty caption is an embedded secondary control (for example opacity).
  return props.caption === '' ? (
    field
  ) : (
    <PropertyRow caption={props.caption ?? props.label} htmlFor={id}>
      {field}
    </PropertyRow>
  );
}
export function PropertySelect({
  label,
  caption,
  value,
  children,
  onChange,
}: {
  label: string;
  caption?: ReactNode;
  value: string | number | undefined;
  children: ReactNode;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const options = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value: string | number; children: ReactNode; disabled?: boolean }>(child))
      return [];
    return [
      {
        value: String(child.props.value),
        label: Children.toArray(child.props.children).join(''),
        disabled: child.props.disabled,
      },
    ];
  });
  const selected = options.find((option) => option.value === String(value));
  const description = selected?.label ?? 'Valori misti';
  return (
    <PropertyRow caption={caption ?? label} htmlFor={id}>
      <ActionMenu
        triggerId={id}
        label={label}
        description={description}
        className="inspector-select-trigger"
        variant="choices"
        icon={
          <>
            <span className="inspector-select-value">{description}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </>
        }
        items={options.map((option) => ({
          id: option.value,
          label: option.label,
          disabled: option.disabled,
          checked: value !== undefined && option.value === String(value),
          onSelect: () => {
            if (option.value !== String(value)) onChange(option.value);
          },
        }))}
      />
    </PropertyRow>
  );
}
export function InspectorSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="inspector-section" aria-label={title}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

/** Advanced controls remain in the same inspector; native details keeps keyboard
 * behavior and its open state when the selected object's properties change. */
export function InspectorDisclosure({
  title,
  preview,
  children,
}: {
  title: string;
  preview?: ReactNode;
  children: ReactNode;
}) {
  return (
    <details className="inspector-disclosure">
      <summary>
        <ChevronRight size={15} aria-hidden="true" />
        <span>{title}</span>
        {preview && (
          <span className="inspector-disclosure-preview" aria-hidden="true">
            {preview}
          </span>
        )}
      </summary>
      <div className="inspector-disclosure-content">{children}</div>
    </details>
  );
}
