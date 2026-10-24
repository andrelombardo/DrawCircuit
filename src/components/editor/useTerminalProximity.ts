import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent, RefObject } from 'react';
import { componentRegistry } from '../../model/catalog';
import type { CircuitDocument, Point, Viewport } from '../../model/types';
import { placementIndex } from '../../smartPlacement/spatialIndex';

export const TERMINAL_PROXIMITY_PX = 24;
export const TERMINAL_RELEASE_PX = 32;
export const TERMINAL_RELEASE_MS = 100;

/** Screen-space distance to the rotated component hit area, including its leads. */
export function nearbyTerminalComponents(
  doc: CircuitDocument,
  point: Point,
  zoom: number,
  previous: readonly string[] = [],
): string[] {
  const retained = new Set(previous);
  return placementIndex(doc)
    .nearbyComponents(point, TERMINAL_RELEASE_PX / zoom)
    .filter((component) => {
      const angle = (-component.rotation * Math.PI) / 180;
      const dx = point.x - component.x,
        dy = point.y - component.y;
      const local = {
        x: (dx * Math.cos(angle) - dy * Math.sin(angle))/(component.scale ?? 1),
        y: (dx * Math.sin(angle) + dy * Math.cos(angle))/(component.scale ?? 1),
      };
      const b = componentRegistry[component.type].bounds;
      const distance = Math.hypot(
        Math.max(b.x - local.x, 0, local.x - b.x - b.width),
        Math.max(b.y - local.y, 0, local.y - b.y - b.height),
      );
      return (
        distance * zoom * (component.scale ?? 1) <=
        (retained.has(component.id) ? TERMINAL_RELEASE_PX : TERMINAL_PROXIMITY_PX)
      );
    })
    .map((component) => component.id)
    .sort();
}

export function useTerminalProximity(
  svgRef: RefObject<SVGSVGElement | null>,
  doc: CircuitDocument,
  viewport: Viewport,
  enabled = true,
) {
  const [ids, setIds] = useState<string[]>([]);
  const current = useRef<string[]>([]);
  const screenPointer = useRef<Point | null>(null);
  const release = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearRelease = useCallback(() => {
    if (release.current !== null) clearTimeout(release.current);
    release.current = null;
  }, []);
  const update = useCallback((next: string[]) => {
    if (next.join(',') === current.current.join(',')) return;
    current.current = next;
    setIds(next);
  }, []);
  const scheduleRelease = useCallback(() => {
    if (!current.current.length || release.current !== null) return;
    release.current = setTimeout(() => {
      release.current = null;
      update([]);
    }, TERMINAL_RELEASE_MS);
  }, [update]);
  const leave = useCallback(() => {
    screenPointer.current = null;
    scheduleRelease();
  }, [scheduleRelease]);
  const recompute = useCallback(() => {
    if (!enabled) {
      clearRelease();
      update([]);
      return;
    }
    const screen = screenPointer.current;
    if (!screen) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = {
      x: (screen.x - rect.left - viewport.x) / viewport.zoom,
      y: (screen.y - rect.top - viewport.y) / viewport.zoom,
    };
    const next = nearbyTerminalComponents(doc, point, viewport.zoom, current.current);
    if (!next.length) scheduleRelease();
    else {
      clearRelease();
      update(next);
    }
  }, [
    doc,
    enabled,
    svgRef,
    viewport.x,
    viewport.y,
    viewport.zoom,
    clearRelease,
    update,
    scheduleRelease,
  ]);
  // Wheel/keyboard zoom, undo and replacement can move a body under a stationary
  // pointer. During gestures/tools the existing selection/tool handles suffice.
  useEffect(() => recompute(), [recompute]);
  useEffect(() => {
    window.addEventListener('blur', leave);
    return () => {
      window.removeEventListener('blur', leave);
      clearRelease();
    };
  }, [leave, clearRelease]);
  return {
    ids,
    move: (event: PointerEvent<SVGSVGElement>) => {
      screenPointer.current = { x: event.clientX, y: event.clientY };
      recompute();
    },
    leave,
  };
}
