import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
function DraftInput({
  value,
  label,
  numeric,
  min,
  max,
  unit,
  onCommit,
}: {
  value: string | number | undefined;
  label: string;
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
      className="property-text"
      type={numeric ? 'number' : 'text'}
      step={numeric ? 'any' : undefined}
      min={min}
      max={max}
      value={draft}
      aria-label={label}
      aria-valuetext={
        numeric ? (value === undefined ? 'Valori misti' : `${value}${unit ?? ''}`) : undefined
      }
      placeholder={value === undefined ? (numeric ? '—' : 'Valori misti') : label}
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
export function PropertyField(props: Parameters<typeof DraftInput>[0] & { caption?: ReactNode }) {
  return (
    <label className={`inspector-field${props.numeric ? ' inspector-number' : ''}`}>
      <span className="inspector-field-caption">{props.caption ?? props.label}</span>
      <span className="inspector-input">
        <DraftInput key={`${props.label}:${props.value}`} {...props} />
        {props.unit && (
          <span className="inspector-unit" aria-hidden="true">
            {props.unit}
          </span>
        )}
      </span>
    </label>
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
  return (
    <label className="inspector-field">
      <span className="inspector-field-caption">{caption ?? label}</span>
      <select aria-label={label} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {value === undefined && (
          <option value="" disabled>
            Valori misti
          </option>
        )}
        {children}
      </select>
    </label>
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
