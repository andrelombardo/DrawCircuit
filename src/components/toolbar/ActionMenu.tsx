import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight } from 'lucide-react';
import { actionMenuPosition } from './actionMenuPosition';

export type MenuAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  onSelect?: () => void;
  children?: MenuAction[];
  separatorBefore?: boolean;
  disabled?: boolean;
  checked?: boolean;
};
type FocusRequest = { level: number; edge: 'first' | 'last' | 'selected' };
const enabledItems = '[role="menuitem"]:not(:disabled), [role="menuitemradio"]:not(:disabled)';

function MenuPanel({
  id,
  label,
  items,
  level,
  anchor,
  openItem,
  focusRequest,
  onBranch,
  onSelect,
  onBack,
  onTab,
  onHover,
  onLeave,
  cancelHover,
  rowRefs,
  matchTriggerWidth,
}: {
  id: string;
  label: string;
  items: MenuAction[];
  level: number;
  anchor:
    RefObject<HTMLButtonElement | null> | HTMLButtonElement | { x: number; y: number } | undefined;
  openItem?: string;
  focusRequest: FocusRequest | null;
  onBranch: (item: MenuAction, keyboard: boolean) => void;
  onSelect: (item: MenuAction) => void;
  onBack: () => void;
  onTab: () => void;
  onHover: (item: MenuAction) => void;
  onLeave: () => void;
  cancelHover: () => void;
  rowRefs: Map<string, HTMLButtonElement>;
  matchTriggerWidth?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = panel.current;
    const trigger = anchor && ('current' in anchor ? anchor.current : anchor);
    const point = trigger && 'x' in trigger ? trigger : null;
    if (!element || !trigger) return;
    const position = () => {
      if (matchTriggerWidth && !point)
        element.style.minWidth = `${Math.min((trigger as HTMLButtonElement).getBoundingClientRect().width, window.innerWidth - 16)}px`;
      const rect = element.getBoundingClientRect();
      const p = actionMenuPosition(
        point
          ? { left: point.x, right: point.x, top: point.y, bottom: point.y }
          : (trigger as HTMLButtonElement).getBoundingClientRect(),
        { width: rect.width, height: rect.height },
        { width: window.innerWidth, height: window.innerHeight },
        level > 0,
      );
      element.style.left = `${p.left}px`;
      element.style.top = `${p.top}px`;
      element.dataset.side = p.side;
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(element);
    if (!point) observer.observe(trigger as HTMLButtonElement);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [anchor, level, matchTriggerWidth]);
  useLayoutEffect(() => {
    if (focusRequest?.level !== level) return;
    const buttons = [...(panel.current?.querySelectorAll<HTMLButtonElement>(enabledItems) ?? [])];
    (focusRequest.edge === 'last'
      ? buttons.at(-1)
      : focusRequest.edge === 'selected'
        ? (buttons.find((button) => button.getAttribute('aria-checked') === 'true') ?? buttons[0])
        : buttons[0]
    )?.focus();
  }, [focusRequest, level]);
  const keydown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Drawing shortcuts must never run while the keyboard is navigating a menu.
    event.stopPropagation();
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>(enabledItems)];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const focused = items.find(
      (item) => rowRefs.get(`${level}:${item.id}`) === document.activeElement,
    );
    if (event.key === 'Tab') {
      onTab();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? buttons.length - 1
            : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    } else if (event.key === 'ArrowRight' && focused?.children) {
      event.preventDefault();
      onBranch(focused, true);
    } else if (event.key === 'ArrowLeft' && level > 0) {
      event.preventDefault();
      onBack();
    } else if ((event.key === 'Enter' || event.key === ' ') && focused) {
      event.preventDefault();
      if (focused.children) onBranch(focused, true);
      else onSelect(focused);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const matching = [...buttons.slice(index + 1), ...buttons.slice(0, index + 1)].find(
        (button) =>
          button.textContent?.trim().toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()),
      );
      if (matching) {
        event.preventDefault();
        matching.focus();
      }
    }
  };
  return (
    <div
      ref={panel}
      id={id}
      className={`action-menu-panel${matchTriggerWidth ? ' action-menu-options' : ''}`}
      data-nested={level > 0 || undefined}
      role="menu"
      aria-label={label}
      onKeyDown={keydown}
      onPointerEnter={cancelHover}
      onPointerLeave={onLeave}
    >
      {items.map((item, index) => (
        <div key={item.id} role="none">
          {item.separatorBefore && <div className="action-menu-separator" role="separator" />}
          <button
            ref={(element) => {
              if (element) rowRefs.set(`${level}:${item.id}`, element);
              else rowRefs.delete(`${level}:${item.id}`);
            }}
            type="button"
            role={item.checked === undefined ? 'menuitem' : 'menuitemradio'}
            aria-checked={item.checked}
            aria-label={item.label}
            aria-description={item.shortcut}
            className="action-menu-item"
            tabIndex={index === 0 ? 0 : -1}
            disabled={item.disabled}
            aria-haspopup={item.children ? 'menu' : undefined}
            aria-expanded={item.children ? openItem === item.id : undefined}
            aria-controls={item.children && openItem === item.id ? `${id}-${item.id}` : undefined}
            onFocus={(event) => {
              for (const button of panel.current?.querySelectorAll<HTMLButtonElement>(
                '[role="menuitem"], [role="menuitemradio"]',
              ) ?? [])
                button.tabIndex = button === event.currentTarget ? 0 : -1;
            }}
            onPointerEnter={() => onHover(item)}
            onClick={() => (item.children ? onBranch(item, true) : onSelect(item))}
          >
            <span className="action-menu-icon">{item.icon}</span>
            <span className="action-menu-label">{item.label}</span>
            {item.checked && <Check className="action-menu-check" size={14} aria-hidden="true" />}
            {item.shortcut && <kbd className="action-menu-shortcut">{item.shortcut}</kbd>}
            {item.children && (
              <ChevronRight className="action-menu-chevron" size={14} aria-hidden="true" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

/** A shared menu tree for both the global pencil and selection actions. */
export function ActionMenu({
  label,
  icon,
  items,
  active,
  showLabel = false,
  className = '',
  onOpenChange,
  onEscape,
  context,
  variant = 'actions',
  description,
  triggerId,
}: {
  label: string;
  icon?: ReactNode;
  items: MenuAction[];
  active?: boolean;
  showLabel?: boolean;
  className?: string;
  onOpenChange?: (open: boolean) => void;
  onEscape?: () => void;
  context?: { x: number; y: number; onClose: () => void; returnFocus: () => void };
  variant?: 'actions' | 'choices';
  description?: string;
  triggerId?: string;
}) {
  const id = useId();
  const choices = variant === 'choices';
  const root = useRef<HTMLDivElement>(null);
  const floating = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [rowRefs] = useState(() => new Map<string, HTMLButtonElement>());
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [opened, setOpen] = useState(false);
  const open = !!context || opened;
  const [path, setPath] = useState<string[]>([]);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(
    context ? { level: 0, edge: 'first' } : null,
  );
  const cancelHover = () => {
    if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };
  const close = (restoreFocus = false) => {
    cancelHover();
    setOpen(false);
    setPath([]);
    onOpenChange?.(false);
    context?.onClose();
    if (restoreFocus) {
      if (context) context.returnFocus();
      else trigger.current?.focus();
    }
  };
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (
        !root.current?.contains(event.target as Node) &&
        !floating.current?.contains(event.target as Node)
      )
        close();
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      cancelHover();
      if (path.length) {
        const level = path.length - 1;
        rowRefs.get(`${level}:${path[level]}`)?.focus();
        setPath(path.slice(0, -1));
      } else {
        close(true);
        onEscape?.();
      }
    };
    document.addEventListener('pointerdown', outside, true);
    window.addEventListener('keydown', escape, true);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('keydown', escape, true);
    };
  });
  useEffect(
    () => () => {
      if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!open || !choices || !trigger.current || typeof IntersectionObserver === 'undefined')
      return;
    // A scrolled-out field must not leave a detached choice menu floating over the canvas.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) close();
    });
    observer.observe(trigger.current);
    return () => observer.disconnect();
  });
  const show = (edge?: FocusRequest['edge']) => {
    cancelHover();
    setPath([]);
    setOpen(true);
    setFocusRequest(edge ? { level: 0, edge } : null);
    onOpenChange?.(true);
  };
  const panels: ReactNode[] = [];
  let options = items;
  let panelLabel = label;
  let panelId = id;
  for (let level = 0; open; level++) {
    const panelLevel = level;
    const selected = options.find((item) => item.id === path[level]);
    const anchor =
      level === 0 ? (context ?? trigger) : rowRefs.get(`${level - 1}:${path[level - 1]}`);
    panels.push(
      <MenuPanel
        key={panelId}
        id={panelId}
        label={panelLabel}
        items={options}
        level={level}
        anchor={anchor}
        openItem={selected?.id}
        focusRequest={focusRequest}
        rowRefs={rowRefs}
        matchTriggerWidth={level === 0 && choices}
        cancelHover={cancelHover}
        onBranch={(item, keyboard) => {
          cancelHover();
          setPath([...path.slice(0, panelLevel), item.id]);
          setFocusRequest(keyboard ? { level: panelLevel + 1, edge: 'first' } : null);
        }}
        onSelect={(item) => {
          item.onSelect?.();
          close(true);
        }}
        onBack={() => {
          cancelHover();
          rowRefs.get(`${panelLevel - 1}:${path[panelLevel - 1]}`)?.focus();
          setPath(path.slice(0, panelLevel - 1));
        }}
        onTab={() => close(true)}
        onHover={(item) => {
          cancelHover();
          // A short intent delay lets the pointer cross diagonally into the open submenu.
          hoverTimer.current = setTimeout(
            () => {
              setPath(
                item.children ? [...path.slice(0, panelLevel), item.id] : path.slice(0, panelLevel),
              );
              setFocusRequest(null);
            },
            path[panelLevel] && path[panelLevel] !== item.id ? 280 : 110,
          );
        }}
        onLeave={() => {
          cancelHover();
          hoverTimer.current = setTimeout(() => {
            setPath(path.slice(0, Math.max(0, panelLevel - 1)));
          }, 320);
        }}
      />,
    );
    if (!selected?.children) break;
    options = selected.children;
    panelLabel = selected.label;
    panelId = `${panelId}-${selected.id}`;
  }
  return (
    <div ref={root} className="action-menu-root" data-open={open || undefined}>
      {!context && (
        <button
          ref={trigger}
          id={triggerId}
          type="button"
          className={`icon-button action-menu-trigger${active ? ' active' : ''}${showLabel ? ' action-menu-trigger-label' : ''}${className ? ` ${className}` : ''}`}
          aria-label={label}
          aria-pressed={active}
          aria-description={description}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          title={label}
          data-tooltip={label}
          onClick={(event) =>
            open ? close() : show(choices ? 'selected' : event.detail === 0 ? 'first' : undefined)
          }
          onKeyDown={(event) => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
            event.preventDefault();
            event.stopPropagation();
            show(choices ? 'selected' : event.key === 'ArrowDown' ? 'first' : 'last');
          }}
        >
          {icon}
          {showLabel && <span>{label}</span>}
        </button>
      )}
      {open && createPortal(<div ref={floating}>{panels}</div>, document.body)}
    </div>
  );
}
