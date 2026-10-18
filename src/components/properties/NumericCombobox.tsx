import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { t } from '../../i18n';
import { numericValue } from '../../utils/numericValue';
import type { NumericLimits } from '../../utils/numericValue';
import { actionMenuPosition } from '../toolbar/actionMenuPosition';

/** Editable numeric choices keep focus in the input while navigating their listbox. */
export function NumericCombobox({
  id,
  label,
  value,
  options,
  limits,
  onCommit,
}: {
  id: string;
  label: string;
  value: number | undefined;
  options: { value: number; label: string; disabled?: boolean }[];
  limits: NumericLimits;
  onCommit: (value: number) => void;
}) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLSpanElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [draft, setDraft] = useState({ base: value, text: String(value ?? ''), error: '' });
  // External edits and undo replace the displayed value without an effect or a remount.
  if (draft.base !== value) setDraft({ base: value, text: String(value ?? ''), error: '' });
  const text = draft.base === value ? draft.text : String(value ?? '');
  const error = draft.base === value ? draft.error : '';
  const choices = options.filter(
    (o) => !o.disabled && numericValue(String(o.value), limits).error === undefined,
  );
  const reset = () => setDraft({ base: value, text: String(value ?? ''), error: '' });
  const commit = () => {
    const result = numericValue(text, limits);
    if (result.error) {
      // An untouched mixed selection has no numeric value to apply.
      if (value === undefined && !text.trim()) return;
      const unit = limits.unit === '°' ? '°' : limits.unit ? ` ${limits.unit}` : '';
      const message =
        result.error === 'number'
          ? t('Enter a valid number.')
          : result.error === 'step'
            ? t('Use increments of {step}{unit}.', { step: limits.step!, unit })
            : t(
                limits.exclusiveMin
                  ? 'Enter a value greater than {min} and up to {max}{unit}.'
                  : 'Enter a value from {min} to {max}{unit}.',
                { min: limits.min, max: limits.max, unit },
              );
      setDraft({ base: value, text, error: message });
      return;
    }
    setDraft({ base: result.value, text: String(result.value), error: '' });
    if (result.value !== value) onCommit(result.value);
  };
  const choose = (number: number) => {
    setDraft({ base: number, text: String(number), error: '' });
    setOpen(false);
    setActive(null);
    if (number !== value) onCommit(number);
  };
  const show = (direction: 'first' | 'last' = 'first') => {
    const selected = choices.findIndex((o) => o.value === value);
    setActive(selected >= 0 ? selected : direction === 'first' ? 0 : choices.length - 1);
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open || !field.current || !panel.current) return;
    const anchor = field.current,
      menu = panel.current;
    const position = () => {
      const rect = anchor.getBoundingClientRect();
      menu.style.width = `${Math.min(rect.width, window.innerWidth - 16)}px`;
      const size = menu.getBoundingClientRect();
      const point = actionMenuPosition(rect, size, {
        width: window.innerWidth,
        height: window.innerHeight,
      });
      menu.style.left = `${point.left}px`;
      menu.style.top = `${point.top}px`;
    };
    position();
    const resize = new ResizeObserver(position);
    resize.observe(anchor);
    resize.observe(menu);
    // Close on scrolling: the list must never float away from its inspector field.
    const scroll = (event: Event) => {
      if (!(event.target instanceof Node) || !menu.contains(event.target)) setOpen(false);
    };
    window.addEventListener('resize', position);
    window.addEventListener('scroll', scroll, true);
    return () => {
      resize.disconnect();
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [open]);
  useLayoutEffect(() => {
    if (open && active !== null)
      document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId, open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (
        !root.current?.contains(event.target as Node) &&
        !panel.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  }, [open]);
  return (
    <div ref={root} className="numeric-combobox">
      <span ref={field} className="inspector-input" data-invalid={!!error || undefined}>
        <input
          ref={input}
          id={id}
          type="text"
          inputMode="decimal"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && active !== null ? `${listId}-${active}` : undefined}
          aria-autocomplete="none"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${listId}-error` : undefined}
          placeholder={value === undefined ? t('Mixed') : label}
          value={text}
          onChange={(e) => {
            setDraft({ base: value, text: e.target.value, error: '' });
            setActive(null);
          }}
          onBlur={() => {
            setOpen(false);
            setActive(null);
            commit();
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              e.stopPropagation();
              if (!open) show(e.key === 'ArrowDown' ? 'first' : 'last');
              else
                setActive(
                  active === null
                    ? e.key === 'ArrowDown'
                      ? 0
                      : choices.length - 1
                    : (active + (e.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length,
                );
            } else if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              if (open && active !== null && choices[active]) choose(choices[active].value);
              else e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              setActive(null);
              reset();
            } else if (open && (e.key === 'Home' || e.key === 'End')) {
              e.preventDefault();
              setActive(e.key === 'Home' ? 0 : choices.length - 1);
            }
          }}
        />
        {limits.unit && (
          <span className="inspector-unit" aria-hidden="true">
            {limits.unit}
          </span>
        )}
        <button
          type="button"
          className="numeric-combobox-toggle"
          tabIndex={-1}
          aria-label={t('Show suggested values for {label}', { label: label.toLocaleLowerCase() })}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => {
            input.current?.focus();
            if (open) setOpen(false);
            else show();
          }}
        >
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </span>
      {error && (
        <p id={`${listId}-error`} className="numeric-combobox-error" role="status">
          {error}
        </p>
      )}
      {open &&
        createPortal(
          <div
            ref={panel}
            id={listId}
            role="listbox"
            aria-label={label}
            className="action-menu-panel action-menu-options numeric-combobox-options"
          >
            {choices.map((option, index) => (
              <div
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option.value === value}
                data-active={index === active || undefined}
                className="action-menu-item"
                onPointerDown={(e) => e.preventDefault()}
                onPointerMove={() => setActive(index)}
                onClick={() => choose(option.value)}
              >
                <span className="action-menu-label">{option.label}</span>
                {option.value === value && (
                  <Check size={14} className="action-menu-check" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
