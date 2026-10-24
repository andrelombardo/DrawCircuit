import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

export const TOOLBAR_STORAGE_KEY = 'drawcircuit.toolbar.v1';
const MARGIN = 14;
type Position = { x: number; y: number };
type TitleArea = { left: number; right: number; bottom: number };
type WindowControlsOverlay = EventTarget & {
  visible: boolean;
  getTitlebarAreaRect: () => DOMRect;
};
const clamp = (value: number, maximum = 1) => Math.max(0, Math.min(maximum, value));

function loadPosition(): Position {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(TOOLBAR_STORAGE_KEY) ?? 'null');
    if (
      saved &&
      typeof saved === 'object' &&
      'x' in saved &&
      'y' in saved &&
      typeof saved.x === 'number' &&
      typeof saved.y === 'number' &&
      Number.isFinite(saved.x) &&
      Number.isFinite(saved.y)
    )
      return { x: clamp(saved.x), y: clamp(saved.y) };
  } catch {
    /* A UI preference must never prevent drawing. */
  }
  return { x: 0, y: 0 };
}

/** Normalized coordinates refer to the available travel inside the editor, not the circuit. */
export function useFloatingToolbar(sidebarVisible: boolean, inspectorVisible: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const preference = useRef<Position | null>(null);
  if (preference.current === null) preference.current = loadPosition();
  const bounds = useRef({
    width: 0,
    height: 0,
    travelX: 0,
    travelY: 0,
    toolbarWidth: 0,
    toolbarHeight: 0,
    titleArea: null as TitleArea | null,
    inspectorToggle: null as { left: number; right: number; top: number; bottom: number } | null,
  });
  const point = useRef<Position>({ x: 0, y: 0 });
  const drag = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    original: Position;
  } | null>(null);
  const [layout, setLayout] = useState<{
    position: Position;
    menuAbove: boolean;
    maxWidth: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const place = useCallback(
    (requested: Position) => {
      const b = bounds.current;
      const position = {
        x: MARGIN + clamp(requested.x - MARGIN, b.travelX),
        y: MARGIN + clamp(requested.y - MARGIN, b.travelY),
      };
      // Leave the collapsed library button reachable at the top left.
      const reopenBottom = Math.max(MARGIN, (b.titleArea?.bottom ?? 0) + 8) + 44;
      if (!sidebarVisible && position.y < reopenBottom && position.x < 58) {
        if (b.travelX >= 44) position.x = 58;
        else position.y = Math.min(reopenBottom, MARGIN + b.travelY);
      }
      // Keep the inspector's edge tab reachable in both panel states.
      const toggle = b.inspectorToggle;
      if (toggle && position.y < toggle.bottom + 8 && position.y + b.toolbarHeight > toggle.top - 8 &&
        position.x < toggle.right + 8 && position.x + b.toolbarWidth > toggle.left - 8) {
        const left = sidebarVisible ? MARGIN : 58;
        if (b.toolbarWidth <= toggle.left - 8 - left)
          position.x = Math.max(left, toggle.left - 8 - b.toolbarWidth);
        else position.y = Math.min(toggle.bottom + 8, MARGIN + b.travelY);
      }
      // The canvas reaches the top edge in installed apps. Keep a toolbar dragged
      // into that area inside the space between the browser's window buttons.
      const title = b.titleArea;
      if (title && position.y < title.bottom) {
        const left = Math.max(MARGIN, title.left + MARGIN);
        const right = Math.min(MARGIN + b.travelX, title.right - b.toolbarWidth - MARGIN);
        if (left <= right) position.x = Math.max(left, Math.min(right, position.x));
        else position.y = Math.min(title.bottom + 8, MARGIN + b.travelY);
      }
      point.current = position;
      setLayout({
        position,
        menuAbove: position.y + b.toolbarHeight + 140 > b.height - MARGIN,
        maxWidth: Math.max(100, b.width - MARGIN * 2),
      });
      return position;
    },
    [sidebarVisible],
  );
  const save = () => {
    const b = bounds.current;
    preference.current = {
      x: b.travelX ? clamp((point.current.x - MARGIN) / b.travelX) : 0.5,
      y: b.travelY ? clamp((point.current.y - MARGIN) / b.travelY) : 0,
    };
    try {
      localStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify(preference.current));
    } catch {
      /* Keep the toolbar usable when browser storage is unavailable. */
    }
  };

  useLayoutEffect(() => {
    const toolbar = ref.current,
      editor = toolbar?.parentElement;
    if (!toolbar || !editor) return;
    const overlay = (navigator as Navigator & { windowControlsOverlay?: WindowControlsOverlay })
      .windowControlsOverlay;
    const measure = () => {
      const surface = editor.getBoundingClientRect(),
        size = toolbar.getBoundingClientRect();
      const inspector = editor.parentElement?.querySelector<HTMLElement>(
        '.properties-inspector:not([hidden])',
      );
      const edge = inspector?.getBoundingClientRect().left;
      const width =
        edge !== undefined && edge > surface.left && edge < surface.right
          ? edge - surface.left
          : surface.width;
      const title = overlay?.visible ? overlay.getTitlebarAreaRect() : null;
      const toggle = editor.parentElement?.querySelector('.inspector-edge-toggle')?.getBoundingClientRect();
      bounds.current = {
        width,
        height: surface.height,
        travelX: Math.max(0, width - size.width - MARGIN * 2),
        // Reserve the bottom utility controls, even while dragging near the edge.
        travelY: Math.max(0, surface.height - size.height - MARGIN - 64),
        toolbarWidth: size.width,
        toolbarHeight: size.height,
        inspectorToggle: toggle ? {
          left: toggle.left - surface.left,
          right: toggle.right - surface.left,
          top: toggle.top - surface.top,
          bottom: toggle.bottom - surface.top,
        } : null,
        titleArea: title
          ? {
              left: title.x - surface.left,
              right: title.x + title.width - surface.left,
              bottom: title.y + title.height - surface.top,
            }
          : null,
      };
      const saved = preference.current!;
      place({
        x: MARGIN + saved.x * bounds.current.travelX,
        y: MARGIN + saved.y * bounds.current.travelY,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(editor);
    observer.observe(toolbar);
    const inspector = editor.parentElement?.querySelector('.properties-inspector');
    if (inspector) observer.observe(inspector);
    window.addEventListener('resize', measure);
    overlay?.addEventListener('geometrychange', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      overlay?.removeEventListener('geometrychange', measure);
    };
  }, [place, inspectorVisible]);

  const finish = (event: ReactPointerEvent<HTMLButtonElement>, cancelled = false) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (cancelled) place(drag.current.original);
    else save();
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return {
    ref,
    dragging,
    menuAbove: layout?.menuAbove ?? false,
    style: layout
      ? ({
          left: layout.position.x,
          top: layout.position.y,
          transform: 'none',
          maxWidth: layout.maxWidth,
        } as CSSProperties)
      : undefined,
    handle: {
      onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = ref.current!.getBoundingClientRect();
        drag.current = {
          pointerId: event.pointerId,
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top,
          original: { ...point.current },
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      },
      onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
        if (!drag.current || drag.current.pointerId !== event.pointerId) return;
        event.preventDefault();
        event.stopPropagation();
        const editor = ref.current!.parentElement!.getBoundingClientRect();
        place({
          x: event.clientX - editor.left - drag.current.offsetX,
          y: event.clientY - editor.top - drag.current.offsetY,
        });
      },
      onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => finish(event),
      onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => finish(event, true),
      onLostPointerCapture: (event: ReactPointerEvent<HTMLButtonElement>) => finish(event),
      onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        const moves: Record<string, Position> = {
          ArrowLeft: { x: -10, y: 0 },
          ArrowRight: { x: 10, y: 0 },
          ArrowUp: { x: 0, y: -10 },
          ArrowDown: { x: 0, y: 10 },
        };
        const delta = moves[event.key];
        if (!delta) return;
        event.preventDefault();
        place({ x: point.current.x + delta.x, y: point.current.y + delta.y });
        save();
      },
    },
  };
}
