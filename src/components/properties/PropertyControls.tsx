import { t } from '../../i18n';
import { Children, isValidElement, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ActionMenu } from '../toolbar/ActionMenu';
import { MAX_COORDINATE, MAX_TEXT_LENGTH } from '../../model/limits';
import { NumericCombobox } from './NumericCombobox';
import type { NumericLimits } from '../../utils/numericValue';
function DraftInput({
  value,
  label,
  id,
  numeric,
  min = -MAX_COORDINATE,
  max = MAX_COORDINATE,
  unit,
  onCommit,
  disabled,
}: {
  value: string | number | undefined;
  label: string;
  id?: string;
  numeric?: boolean;
  min?: number;
  max?: number;
  unit?: string;
  onCommit: (value: string) => void;
  disabled?: boolean;
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
      disabled={disabled}
      aria-label={label}
      aria-valuetext={
        numeric ? (value === undefined ? t('Mixed values') : `${value}${unit ?? ''}`) : undefined
      }
      placeholder={value === undefined ? (numeric ? t('Mixed') : t('Mixed values')) : label}
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
  embedded = false,
}: {
  caption: ReactNode;
  children: ReactNode;
  secondary?: ReactNode;
  htmlFor?: string;
  secondaryCaption?: ReactNode;
  embedded?: boolean;
}) {
  return (
    <div className={`property-row${secondary ? ' property-row-secondary' : ''}${embedded ? ' property-row-embedded' : ''}`}>
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
export function PropertyField(props: Parameters<typeof DraftInput>[0] & { caption?: ReactNode; embedded?: boolean; icon?: ReactNode }) {
  const id = useId();
  const field = (
    <span className="inspector-input">
      {props.icon && <span className="inspector-input-icon" aria-hidden="true">{props.icon}</span>}
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
    <PropertyRow caption={props.caption ?? props.label} htmlFor={id} embedded={props.embedded}>
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
  numeric,
  embedded = false,
}: {
  label: string;
  caption?: ReactNode;
  value: string | number | undefined;
  children: ReactNode;
  onChange: (value: string) => void;
  numeric?: NumericLimits;
  embedded?: boolean;
}) {
  const id = useId();
  const options = Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{
        value: string | number;
        children: ReactNode;
        disabled?: boolean;
      }>(child)
    )
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
  const description = selected?.label ?? t('Mixed values');
  if (numeric)
    return (
      <PropertyRow caption={caption ?? label} htmlFor={id} embedded={embedded}>
        <NumericCombobox
          id={id}
          label={label}
          value={typeof value === 'number' ? value : undefined}
          options={options.map((option) => ({ ...option, value: Number(option.value) }))}
          limits={numeric}
          onCommit={(number) => onChange(String(number))}
        />
      </PropertyRow>
    );
  return (
    <PropertyRow caption={caption ?? label} htmlFor={id} embedded={embedded}>
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
export function InspectorSection({
  title,
  children,
  className = '',
  actions,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={`inspector-section${className ? ` ${className}` : ''}`} aria-label={title}>
      <div className="inspector-section-heading"><h3>{title}</h3>{actions && <div className="inspector-section-actions">{actions}</div>}</div>
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
