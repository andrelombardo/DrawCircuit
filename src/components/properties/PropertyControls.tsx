import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
function DraftInput({
  value,
  label,
  numeric,
  min,
  max,
  onCommit,
}: {
  value: string | number | undefined;
  label: string;
  numeric?: boolean;
  min?: number;
  max?: number;
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
      placeholder={value === undefined ? 'Valori misti' : label}
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
export function PropertyField(props: Parameters<typeof DraftInput>[0] & { caption?: string }) {
  return (
    <label className="inspector-field">
      <span>{props.caption ?? props.label}</span>
      <DraftInput key={`${props.label}:${props.value}`} {...props} />
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
  caption?: string;
  value: string | number | undefined;
  children: ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <label className="inspector-field">
      <span>{caption ?? label}</span>
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
