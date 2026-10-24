import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { t } from '../../i18n';
import { inspectorKeyDown } from './inspectorKeyboard';
import { actionMenuPosition } from '../toolbar/actionMenuPosition';

export function InspectorPopover({ title, anchor, onClose, children }: {
  title: string; anchor: RefObject<HTMLButtonElement | null>; onClose: () => void; children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null), heading = useId();
  useLayoutEffect(() => {
    const element = panel.current, trigger = anchor.current;
    if (!element || !trigger) return;
    const position = () => {
      const a = trigger.getBoundingClientRect(), b = element.getBoundingClientRect();
      const p = actionMenuPosition(a, b, { width: innerWidth, height: innerHeight });
      element.style.left = `${Math.max(8, Math.min(innerWidth-b.width-8, a.right-b.width))}px`;
      element.style.top = `${p.top}px`;
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(element);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => { observer.disconnect(); window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true); };
  }, [anchor]);
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (!panel.current?.contains(target) && !anchor.current?.contains(target) && !target.closest('.action-menu-panel')) onClose();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('.action-menu-panel')) {
        event.preventDefault(); event.stopPropagation(); onClose(); anchor.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('pointerdown', outside, true);
    window.addEventListener('keydown', escape, true);
    return () => { document.removeEventListener('pointerdown', outside, true); window.removeEventListener('keydown', escape, true); };
  }, [anchor, onClose]);
  return createPortal(<div ref={panel} className="properties-inspector inspector-popover" role="dialog" aria-labelledby={heading} tabIndex={-1}
    onKeyDown={inspectorKeyDown}>
    <div className="inspector-popover-heading"><h3 id={heading}>{title}</h3><button className="inspector-heading-action" aria-label={t('Close')} title={t('Close')}
      onClick={() => { onClose(); anchor.current?.focus({ preventScroll: true }); }}><X size={14} /></button></div>
    <div className="inspector-popover-content">{children}</div>
  </div>, document.body);
}
