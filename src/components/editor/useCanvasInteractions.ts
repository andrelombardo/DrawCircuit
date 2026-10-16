import { rectangleFromDrag, resizeRectangle } from '../../utils/rectangles';
import type { RectangleAnnotation, LineAnnotation } from '../../model/types';
import { createBrace, resizeBrace } from '../../annotations/brace';
import { createCurrent, createElectrical, createPolarity } from '../../annotations/electrical';
import { supportsPolarity } from '../../model/capabilities';
import type { BraceAnnotation, ElectricalAnnotation } from '../../model/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent, PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { catalog, createComponent, makeId } from '../../model/catalog';
import { createTextAnnotation, createWire, createLine } from '../../model/factories';
import { COLORS, componentTypes } from '../../model/types';
import type {
  ArrowAnnotation,
  CircuitDocument,
  Endpoint,
  LoopArrow,
  Point,
  Viewport,
} from '../../model/types';
import {
  add,
  distance,
  documentBounds,
  nearestWire,
  objectBounds,
  snap,
  snapPoint,
  rotatePoint,
  resolveEndpoint,
  safeWirePoints,
  wirePoints,
} from '../../utils/geometry';
import { moveSelection } from '../../utils/operations';
import { inlineTextTarget, moveLabel, replaceInlineText } from '../../utils/labels';
import {
  splitWireAtPoint,
  beginWire,
  commitWire,
  insertJunction,
  normalizeDocumentWires,
  TERMINAL_DRAG_THRESHOLD,
  wireCandidate,
  drawingWireCandidate,
  wireEndpointCandidate,
} from '../../utils/wires';
import type { WireCandidate, WireDraft } from '../../utils/wires';
import {
  arrowCenter,
  arrowOrientation,
  rotateArrow,
  rotationGesture,
  rotationHandle,
} from '../../utils/arrows';
import { loopPositionAt, resizeLoop } from '../../utils/loops';
import { createMoveContext, computeMoveGuides } from '../../utils/smartGuides';
import type { MoveContext, DistanceGuide } from '../../utils/smartGuides';
import { useSmartPlacement } from '../../smartPlacement/useSmartPlacement';
import { isMac } from '../../utils/platform';
import { clampZoom, readZoomPreference, saveZoomPreference } from './zoomPreferences';
type Drag =
  | { type: 'pan'; screen: Point; view: Viewport }
  | {
      type: 'move' | 'label' | 'handle';
      origin: Point;
      doc: CircuitDocument;
      ids: string[];
      handle?: string;
      moveContext?: MoveContext;
    }
  | { type: 'marquee'; origin: Point; additive: boolean }
  | {
      type: 'terminal-wire';
      screen: Point;
      start: WireCandidate;
      started: boolean;
    }
  | {
      type: 'arrow' | 'loop-arrow' | 'voltage' | 'brace' | 'bracket' | 'rectangle' | 'line';
      origin: Point;
    };
export interface Overlay {
  mouse: Point | null;
  target: Point | null;
  box: { x: number; y: number; width: number; height: number } | null;
  guides: { x?: number; y?: number };
  arrow:
    | ArrowAnnotation
    | LoopArrow
    | ElectricalAnnotation
    | BraceAnnotation
    | RectangleAnnotation
    | LineAnnotation
    | null;
  distances: DistanceGuide[];
  componentTarget: string | null;
  wireTarget: string | null;
}
const blank: Overlay = {
  mouse: null,
  target: null,
  box: null,
  guides: {},
  arrow: null,
  distances: [],
  componentTarget: null,
  wireTarget: null,
};
export function useCanvasInteractions(
  svgRef: RefObject<SVGSVGElement | null>,
  onToggleSidebar?: () => void,
) {
  const [initialZoom] = useState(readZoomPreference);
  const [viewport, setViewport] = useState<Viewport>({ x: 600, y: 340, zoom: initialZoom ?? 1 });
  useEffect(() => saveZoomPreference(viewport.zoom), [viewport.zoom]);
  const [surfaceSize, setSurfaceSize] = useState({ width: 1200, height: 700 });
  const previousSurface = useRef<{ width: number; height: number } | null>(null);
  const smart = useSmartPlacement(viewport);
  const {
    modifierKey,
    blur: smartBlur,
    rotatePlacement,
    reset: resetSmart,
    leave: leaveSmart,
  } = smart;
  const [paletteDragType, setPaletteDragType] = useState<(typeof componentTypes)[number] | null>(
    null,
  );
  const [hoveredArrow, setHoveredArrow] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(blank);
  const doc = useEditorStore((s) => s.document);
  const objectMap = useMemo(() => new Map(doc.objects.map((o) => [o.id, o])), [doc]);
  const [voltageStart, setVoltageStart] = useState<Point | null>(null);
  const voltageStartRef = useRef<Point | null>(null);
  const setFirstPoint = (point: Point | null) => {
    voltageStartRef.current = point;
    setVoltageStart(point);
  };
  const polarityTarget = (target: EventTarget) => {
    const id = (target as Element).closest('[data-object]')?.getAttribute('data-object');
    const c = id ? objectMap.get(id) : null;
    return c && supportsPolarity(c) ? c : null;
  };
  const [draft, setDraft] = useState<WireDraft | null>(null);
  const [space, setSpace] = useState(false);
  const [dragging, setDragging] = useState<'move' | 'pan' | 'handle' | 'wire' | null>(null);
  const activeLabel = useEditorStore((s) => s.activeLabel);
  const setActiveLabel = useEditorStore((s) => s.setActiveLabel);
  const [editing, setEditing] = useState<{
    id: string;
    text: string;
    point: Point;
  } | null>(null);
  useEffect(() => {
    const start = (e: Event) => {
      const type = (e as CustomEvent).detail;
      if (componentTypes.includes(type)) {
        resetSmart();
        setPaletteDragType(type);
      }
    };
    const end = () => {
      leaveSmart();
      setPaletteDragType(null);
    };
    window.addEventListener('drawcircuit:component-drag-start', start);
    window.addEventListener('drawcircuit:component-drag-end', end);
    return () => {
      window.removeEventListener('drawcircuit:component-drag-start', start);
      window.removeEventListener('drawcircuit:component-drag-end', end);
    };
  }, [resetSmart, leaveSmart]);
  const drag = useRef<Drag | null>(null),
    spaceDown = useRef(false),
    draftRef = useRef<WireDraft | null>(null),
    mouseRef = useRef<Point>({ x: 0, y: 0 }),
    screenPointerRef = useRef<Point | null>(null);
  const setWireDraft = (d: WireDraft | null) => {
    draftRef.current = d;
    setDraft(d);
  };
  const world = useCallback(
    (x: number, y: number): Point => {
      const b = svgRef.current!.getBoundingClientRect();
      return {
        x: (x - b.left - viewport.x) / viewport.zoom,
        y: (y - b.top - viewport.y) / viewport.zoom,
      };
    },
    [svgRef, viewport],
  );
  useEffect(() => {
    if (!draftRef.current || !screenPointerRef.current || !svgRef.current) return;
    const pointer = screenPointerRef.current,
      p = world(pointer.x, pointer.y),
      candidate = drawingWireCandidate(
        p,
        useEditorStore.getState().document,
        viewport.zoom,
        draftRef.current,
      );
    mouseRef.current = p;
    setOverlay({
      ...blank,
      mouse: p,
      target: candidate.kind === 'grid' ? null : candidate.point,
    });
  }, [viewport, world, svgRef]);
  const fit = useCallback(
    (restoredZoom?: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const b = svg.getBoundingClientRect(),
        bounds = documentBounds(useEditorStore.getState().document);
      setSurfaceSize((previous) =>
        previous.width === b.width && previous.height === b.height
          ? previous
          : { width: b.width, height: b.height },
      );
      previousSurface.current = { width: b.width, height: b.height };
      const z =
        restoredZoom ??
        Math.max(
          0.2,
          Math.min(
            1.45,
            Math.min((b.width - 130) / bounds.width, (b.height - 180) / bounds.height),
          ),
        );
      setViewport({
        zoom: z,
        x: b.width / 2 - (bounds.x + bounds.width / 2) * z,
        y: b.height / 2 - (bounds.y + bounds.height / 2) * z + 15,
      });
    },
    [svgRef],
  );
  const zoomAt = useCallback(
    (factor: number, point?: Point) => {
      const b = svgRef.current?.getBoundingClientRect();
      if (!b) return;
      const p = point ?? { x: b.width / 2, y: b.height / 2 };
      setViewport((v) => {
        const z = clampZoom(v.zoom * factor);
        return {
          zoom: z,
          x: p.x - ((p.x - v.x) * z) / v.zoom,
          y: p.y - ((p.y - v.y) * z) / v.zoom,
        };
      });
    },
    [svgRef],
  );
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const b = svg.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.008 : 0.002)), {
        x: e.clientX - b.left,
        y: e.clientY - b.top,
      });
    };
    svg.addEventListener('wheel', wheel, { passive: false });
    return () => svg.removeEventListener('wheel', wheel);
  }, [svgRef, zoomAt]);
  useEffect(() => {
    fit(initialZoom ?? undefined);
    const fitHandler = () => fit(),
      zoomIn = () => zoomAt(1.2),
      zoomOut = () => zoomAt(1 / 1.2);
    let frame = 0;
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const b = svgRef.current?.getBoundingClientRect();
        if (!b || !b.width || !b.height) return;
        const previous = previousSurface.current;
        previousSurface.current = { width: b.width, height: b.height };
        setSurfaceSize({ width: b.width, height: b.height });
        if (previous && (previous.width !== b.width || previous.height !== b.height)) {
          // Keep the world point at the canvas centre and the user's zoom level.
          setViewport((v) => ({
            ...v,
            x: v.x + (b.width - previous.width) / 2,
            y: v.y + (b.height - previous.height) / 2,
          }));
        }
      });
    });
    if (svgRef.current) resize.observe(svgRef.current);
    window.addEventListener('drawcircuit:fit', fitHandler);
    window.addEventListener('drawcircuit:zoom-in', zoomIn);
    window.addEventListener('drawcircuit:zoom-out', zoomOut);
    return () => {
      resize.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('drawcircuit:fit', fitHandler);
      window.removeEventListener('drawcircuit:zoom-in', zoomIn);
      window.removeEventListener('drawcircuit:zoom-out', zoomOut);
    };
  }, [fit, zoomAt, svgRef, initialZoom]);
  const finishWire = useCallback((candidate: WireCandidate) => {
    const d = draftRef.current;
    if (!d) return;
    const s = useEditorStore.getState(),
      result = commitWire(s.document, d, candidate);
    setWireDraft(null);
    if (!result) {
      s.cancelGesture();
      setOverlay(blank);
      return;
    }
    s.preview(result.doc);
    s.endGesture();
    s.select([result.wireId]);
  }, []);
  useEffect(() => {
    const isEditing = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return !!(
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        el?.isContentEditable ||
        el?.closest?.('[contenteditable]:not([contenteditable="false"])') ||
        document.querySelector('[role="dialog"], [role="menu"]')
      );
    };
    // WebKit and application Edit menus can dispatch clipboard events without keydown.
    const clipboard = (e: ClipboardEvent) => {
      if (e.defaultPrevented || isEditing(e.target)) return;
      const s = useEditorStore.getState();
      if (e.type !== 'paste' && !s.selection.length) return;
      e.preventDefault();
      if (e.type === 'paste') void s.paste(e.clipboardData?.getData('text/plain'));
      else if (e.type === 'copy') void s.copy(e.clipboardData);
      else {
        s.endGesture();
        drag.current = null;
        setDragging(null);
        setOverlay(blank);
        void s.cut(e.clipboardData);
      }
    };
    const keydown = async (e: KeyboardEvent) => {
      if (e.isComposing || isEditing(e.target)) return;
      if (e.key === 'Escape' && document.querySelector('.context-more[open]')) return;
      modifierKey(e);
      const s = useEditorStore.getState(),
        mod = e.ctrlKey || e.metaKey;
      if (e.code === 'Space') {
        e.preventDefault();
        spaceDown.current = true;
        setSpace(true);
      }
      if (
        (!mod || (isMac() ? e.metaKey : e.ctrlKey)) &&
        !e.altKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === 't'
      ) {
        if (onToggleSidebar && !document.querySelector('[role="menu"], .context-more[open]')) {
          e.preventDefault();
          if (!e.repeat) onToggleSidebar();
        }
      } else if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        drag.current = null;
        setDragging(null);
        setActiveLabel(null);
        setOverlay(blank);
        setWireDraft(null);
        if (e.shiftKey) s.redo();
        else s.undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        drag.current = null;
        setDragging(null);
        setActiveLabel(null);
        setOverlay(blank);
        setWireDraft(null);
        s.redo();
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        s.duplicate();
      } else if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        s.select(s.document.objects.map((o) => o.id));
      } else if (mod && ['c', 'x'].includes(e.key.toLowerCase()) && s.selection.length) {
        e.preventDefault();
        if (e.key.toLowerCase() === 'x') {
          s.endGesture();
          drag.current = null;
          setDragging(null);
          setOverlay(blank);
          await s.cut();
        } else await s.copy();
      } else if (mod && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        await s.paste();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const draft = draftRef.current;
        if (draft) {
          if (draft.vertices.length)
            setWireDraft({ ...draft, vertices: draft.vertices.slice(0, -1) });
          else {
            setWireDraft(null);
            s.cancelGesture();
            setOverlay(blank);
          }
        } else s.remove(e.shiftKey);
      } else if (e.key === 'Escape') {
        s.setSplitWire(null);
        setFirstPoint(null);
        s.cancelGesture();
        drag.current = null;
        setDragging(null);
        setActiveLabel(null);
        setOverlay(blank);
        setWireDraft(null);
        s.setTool('select');
        s.select([]);
        setEditing(null);
      } else if (e.key === 'Enter' && draftRef.current) {
        e.preventDefault();
        finishWire(
          drawingWireCandidate(mouseRef.current, s.document, viewport.zoom, draftRef.current),
        );
      } else if (e.key === 'Enter' && s.selection.length === 1) {
        const o = s.document.objects.find((o) => o.id === s.selection[0]);
        const target = inlineTextTarget(o, s.document);
        if (target) {
          e.preventDefault();
          setActiveLabel(o?.kind === 'text' ? null : target.id);
          setEditing(target);
        }
      } else if (!mod && e.key.toLowerCase() === 'r') {
        if (s.tool === 'preset') s.rotatePlacement();
        else if (componentTypes.includes(s.tool as (typeof componentTypes)[number]))
          rotatePlacement();
        else s.rotate();
      } else if (!mod && e.key.toLowerCase() === 'v') s.setTool('select');
      else if (!mod && e.key.toLowerCase() === 'w') {
        if (e.shiftKey)
          s.setWireRouting(
            s.wireRouting === 'orthogonal' ? '45' : s.wireRouting === '45' ? 'free' : 'orthogonal',
          );
        else s.setTool('wire');
      } else if (!mod && e.key.toLowerCase() === 'n') s.setTool('junction');
      else if (!mod && e.key.toLowerCase() === 'a') s.setTool('arrow');
      else if (!mod && e.key.toLowerCase() === 'l') s.setTool('loop-arrow');
      else if (!mod && e.key.toLowerCase() === 'h') s.setTool('pan');
      else if (!mod && e.key.toLowerCase() === 'g') s.toggleGrid();
      else if (e.key === '+' || e.key === '=') zoomAt(1.2);
      else if (e.key === '-') zoomAt(1 / 1.2);
      else if (e.key === '1') fit();
    };
    const keyup = (e: KeyboardEvent) => {
      modifierKey(e);
      if (e.code === 'Space') {
        spaceDown.current = false;
        setSpace(false);
      }
    };
    const blur = () => {
      if (draftRef.current || drag.current) useEditorStore.getState().cancelGesture();
      drag.current = null;
      setWireDraft(null);
      setDragging(null);
      setOverlay(blank);
      setFirstPoint(null);
      smartBlur();
      spaceDown.current = false;
      setSpace(false);
    };
    for (const type of ['copy', 'cut', 'paste'] as const) window.addEventListener(type, clipboard);
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    return () => {
      for (const type of ['copy', 'cut', 'paste'] as const)
        window.removeEventListener(type, clipboard);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
    };
  }, [
    finishWire,
    fit,
    zoomAt,
    modifierKey,
    smartBlur,
    rotatePlacement,
    onToggleSidebar,
    viewport.zoom,
    setActiveLabel,
  ]);
  // Cancel an unfinished wire when a different tool is chosen.
  useEffect(
    () =>
      useEditorStore.subscribe((s, prev) => {
        if (s.wireRouting !== prev.wireRouting && draftRef.current)
          setWireDraft({ ...draftRef.current, routing: s.wireRouting });
        if (
          s.tool !== prev.tool ||
          s.pendingPresetId !== prev.pendingPresetId ||
          (prev.gestureStart && !s.gestureStart && draftRef.current) ||
          (s.document !== prev.document &&
            drag.current?.type === 'terminal-wire' &&
            !drag.current.started)
        ) {
          const unfinished = draftRef.current;
          setWireDraft(null);
          if (unfinished || drag.current) s.cancelGesture();
          drag.current = null;
          setDragging(null);
          setActiveLabel(null);
          setOverlay(blank);
          setFirstPoint(null);
        }
      }),
    [setActiveLabel],
  );
  const placeComponent = (type: (typeof componentTypes)[number], p: Point) => {
    const s = useEditorStore.getState(),
      def = catalog.find((c) => c.type === type)!;
    const used = new Set(
      s.document.objects.filter((o) => o.kind === 'component').map((o) => o.label.text),
    );
    let index = 1;
    while (used.has(`${def.prefix}_${index}`)) index++;
    const o = createComponent(type, snapPoint(p), index);
    o.rotation = s.placementRotation;
    o.label.offset = rotatePoint(o.label.offset, o.rotation);
    s.add([o]);
  };
  const addJunction = (p: Point) => {
    const s = useEditorStore.getState(),
      candidate = wireCandidate(p, s.document, viewport.zoom);
    const result = insertJunction(s.document, candidate.point);
    if (candidate.kind === 'terminal') {
      const ep: Endpoint = { kind: 'junction', junctionId: result.junction.id };
      const same = (a: Endpoint, b: Endpoint) => JSON.stringify(a) === JSON.stringify(b);
      const linked = result.doc.objects.some(
        (o) =>
          o.kind === 'wire' &&
          ((same(o.startEndpoint, candidate.endpoint) && same(o.endEndpoint, ep)) ||
            (same(o.endEndpoint, candidate.endpoint) && same(o.startEndpoint, ep))),
      );
      if (!linked)
        result.doc = {
          ...result.doc,
          objects: [...result.doc.objects, createWire(candidate.endpoint, ep)],
        };
    }
    if (result.doc !== s.document) s.commit(result.doc);
    s.select([result.junction.id]);
  };
  // Alt/Option-click cycles overlapping labels in paint order, before body targeting.
  const pointerTarget = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!e.altKey || !document.elementsFromPoint) return e.target as Element;
    const labels = document
      .elementsFromPoint(e.clientX, e.clientY)
      .map((element) => element.closest('[data-label]'))
      .filter((element): element is Element => !!element && !!svgRef.current?.contains(element));
    const unique = [
      ...new Map(labels.map((element) => [element.getAttribute('data-label'), element])).values(),
    ];
    if (!unique.length) return e.target as Element;
    const current = unique.findIndex(
      (element) => element.getAttribute('data-label') === useEditorStore.getState().activeLabel,
    );
    return unique[(current + 1) % unique.length];
  };
  const pointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    if (editing) saveEdit();
    const focused = document.activeElement;
    if (focused instanceof HTMLElement) focused.blur();
    const svg = svgRef.current!;
    svg.focus({ preventScroll: true });
    const p = world(e.clientX, e.clientY),
      s = useEditorStore.getState();
    mouseRef.current = p;
    screenPointerRef.current = { x: e.clientX, y: e.clientY };
    if (e.button === 1 || spaceDown.current || s.tool === 'pan') {
      svg.setPointerCapture(e.pointerId);
      setDragging('pan');
      drag.current = { type: 'pan', screen: { x: e.clientX, y: e.clientY }, view: viewport };
      return;
    }
    if (s.splittingWireId) {
      const excluded = new Set(
        s.document.objects.filter((o) => o.id !== s.splittingWireId).map((o) => o.id),
      );
      const near = nearestWire(p, s.document, 14 / viewport.zoom, excluded);
      if (near) {
        const result = splitWireAtPoint(s.document, near.wire.id, near.point);
        if (result) {
          s.commit(result.doc);
          s.select([result.secondId]);
          s.setSplitWire(null);
        } else s.notify('Scegli un punto interno al filo, lontano da incroci e terminali.');
      }
      return;
    }
    if (s.tool === 'preset') {
      s.insertPreset(p);
      return;
    }
    if (s.tool === 'wire') {
      const d = draftRef.current;
      if (!d && e.detail >= 2) return;
      const target = drawingWireCandidate(p, s.document, viewport.zoom, d);
      if (!d) {
        s.beginGesture();
        const result = beginWire(s.document, target, s.wireRouting);
        if (result.doc !== s.document) s.preview(result.doc);
        setWireDraft(result.draft);
      } else if (target.kind !== 'grid' || e.detail >= 2) finishWire(target);
      else if (
        distance(d.vertices.at(-1) ?? resolveEndpoint(d.start, s.document), target.point) > 0.001
      )
        setWireDraft({ ...d, vertices: [...d.vertices, target.point] });
      const candidate = drawingWireCandidate(
        p,
        useEditorStore.getState().document,
        viewport.zoom,
        draftRef.current,
      );
      setOverlay({
        ...blank,
        mouse: p,
        target: candidate.kind === 'grid' ? null : candidate.point,
      });
      return;
    }
    if (s.tool === 'current') {
      const near = nearestWire(p, s.document, 16 / viewport.zoom);
      if (near) {
        s.add([createCurrent(near.wire, near.point, s.document)]);
        s.setTool('select');
      } else s.notify('Clicca un filo per associare la freccia di corrente.');
      return;
    }
    if (s.tool === 'polarity') {
      const c = polarityTarget(e.target);
      const annotation = c?.kind === 'component' ? createPolarity(c) : null;
      if (annotation) {
        s.add([annotation]);
        s.setTool('select');
      } else s.notify('Scegli un componente a due terminali, oppure usa Freccia tensione.');
      return;
    }
    if (s.tool === 'junction') {
      addJunction(p);
      return;
    }
    if (s.tool === 'text') {
      s.add([createTextAnnotation(snapPoint(p))]);
      s.setTool('select');
      return;
    }
    if (s.tool === 'voltage') {
      const point = wireCandidate(p, s.document, viewport.zoom).point;
      if (voltageStartRef.current) {
        if (distance(voltageStartRef.current, point) > 20) {
          s.add([createElectrical('voltage', voltageStartRef.current, point, 'V_{AB}')]);
          setFirstPoint(null);
          s.setTool('select');
        }
      } else {
        svg.setPointerCapture(e.pointerId);
        drag.current = { type: 'voltage', origin: point };
        setFirstPoint(point);
        setOverlay({ ...blank, target: point });
      }
      return;
    }
    if (
      s.tool === 'rectangle' ||
      s.tool === 'line' ||
      s.tool === 'arrow' ||
      s.tool === 'loop-arrow' ||
      s.tool === 'brace' ||
      s.tool === 'bracket'
    ) {
      svg.setPointerCapture(e.pointerId);
      drag.current = { type: s.tool, origin: snapPoint(p) };
      return;
    }
    if (componentTypes.includes(s.tool as (typeof componentTypes)[number])) {
      const type = s.tool as (typeof componentTypes)[number];
      if (!smart.confirm(type, p, e.altKey)) placeComponent(type, p);
      return;
    }
    const target = pointerTarget(e),
      el = target.closest('[data-object]'),
      id = el?.getAttribute('data-object'),
      handle = target.closest('[data-handle]')?.getAttribute('data-handle'),
      labelId = target.closest('[data-label]')?.getAttribute('data-label');
    const terminalId = target.closest('[data-terminal]')?.getAttribute('data-terminal'),
      component = id ? objectMap.get(id) : null;
    if (s.tool === 'select' && terminalId && component?.kind === 'component' && !e.shiftKey) {
      const terminal = component.terminals.find((t) => t.id === terminalId);
      if (terminal) {
        s.select([component.id]);
        svg.setPointerCapture(e.pointerId);
        drag.current = {
          type: 'terminal-wire',
          screen: { x: e.clientX, y: e.clientY },
          start: {
            kind: 'terminal',
            point: add(
              component,
              rotatePoint({ x: terminal.localX, y: terminal.localY }, component.rotation),
            ),
            endpoint: { kind: 'terminal', componentId: component.id, terminalId },
          },
          started: false,
        };
        return;
      }
    }
    if (id) {
      if (e.altKey && handle?.startsWith('vertex:')) {
        s.update(id, (o) =>
          o.kind === 'wire'
            ? { ...o, vertices: o.vertices.filter((_, i) => i !== Number(handle.split(':')[1])) }
            : o,
        );
        return;
      }
      if (e.shiftKey && !handle) {
        s.select(
          s.selection.includes(id) ? s.selection.filter((i) => i !== id) : [...s.selection, id],
        );
        return;
      }
      const ids = labelId ? [id] : s.selection.includes(id) ? s.selection : [id];
      window.dispatchEvent(new Event('drawcircuit:show-properties'));
      s.select(ids);
      setActiveLabel(labelId ?? null);
      s.beginGesture();
      const wire = objectMap.get(id);
      const segment =
        !handle && !labelId && ids.length === 1 && wire?.kind === 'wire'
          ? nearestWire(
              p,
              s.document,
              Infinity,
              new Set(s.document.objects.filter((o) => o.id !== id).map((o) => o.id)),
            )?.segment
          : undefined;
      const moveContext =
        !handle && !labelId && segment === undefined
          ? createMoveContext(s.document, ids)
          : undefined;
      drag.current = {
        type: handle || segment !== undefined ? 'handle' : labelId ? 'label' : 'move',
        origin: p,
        doc: s.document,
        ids: handle || labelId ? [id] : ids,
        handle: segment !== undefined ? `segment:${segment}` : (handle ?? undefined),
        moveContext,
      };
      if (moveContext)
        setOverlay({
          ...blank,
          distances: computeMoveGuides(
            moveContext,
            { x: 0, y: 0 },
            viewport.zoom,
            e.altKey || !s.snapEnabled,
            true,
          ).distances,
        });
    } else {
      svg.setPointerCapture(e.pointerId);
      setActiveLabel(null);
      if (!e.shiftKey) s.select([]);
      drag.current = { type: 'marquee', origin: p, additive: e.shiftKey };
    }
  };
  const pointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const p = world(e.clientX, e.clientY),
      s = useEditorStore.getState();
    mouseRef.current = p;
    screenPointerRef.current = { x: e.clientX, y: e.clientY };
    const d = drag.current;
    if (!d) {
      const hovered =
        s.tool === 'select'
          ? s.document.objects.find((o) => {
              if (!s.selection.includes(o.id) || (o.kind !== 'arrow' && o.kind !== 'loop-arrow'))
                return false;
              const b = objectBounds(o, s.document),
                margin = 28 / viewport.zoom;
              return (
                distance(p, rotationHandle(o, viewport.zoom)) < margin ||
                (p.x >= b.x - margin &&
                  p.x <= b.x + b.width + margin &&
                  p.y >= b.y - margin &&
                  p.y <= b.y + b.height + margin)
              );
            })
          : null;
      setHoveredArrow(hovered?.id ?? null);
    }
    if (d?.type === 'pan') {
      setViewport({
        ...d.view,
        x: d.view.x + e.clientX - d.screen.x,
        y: d.view.y + e.clientY - d.screen.y,
      });
      return;
    }
    if (d?.type === 'terminal-wire') {
      if (!d.started) {
        if (distance({ x: e.clientX, y: e.clientY }, d.screen) < TERMINAL_DRAG_THRESHOLD) return;
        s.beginGesture();
        const result = beginWire(s.document, d.start, s.wireRouting);
        if (result.doc !== s.document) s.preview(result.doc);
        setWireDraft(result.draft);
        d.started = true;
        setDragging('wire');
      }
      const candidate = drawingWireCandidate(
        p,
        useEditorStore.getState().document,
        viewport.zoom,
        draftRef.current,
      );
      setOverlay({
        ...blank,
        mouse: p,
        target: candidate.kind === 'grid' ? null : candidate.point,
      });
      return;
    }
    if (d?.type === 'marquee') {
      const box = {
        x: Math.min(p.x, d.origin.x),
        y: Math.min(p.y, d.origin.y),
        width: Math.abs(p.x - d.origin.x),
        height: Math.abs(p.y - d.origin.y),
      };
      setOverlay({ ...blank, box });
      return;
    }
    if (d?.type === 'voltage') {
      const point = wireCandidate(p, s.document, viewport.zoom).point;
      setOverlay({
        ...blank,
        target: point,
        arrow: { ...createElectrical('voltage', d.origin, point, 'V_{AB}'), id: 'preview' },
      });
      return;
    }
    if (d?.type === 'rectangle' || d?.type === 'line') {
      let end = snapPoint(p);
      if (d.type === 'line' && e.shiftKey) {
        const dx = end.x - d.origin.x,
          dy = end.y - d.origin.y,
          length = Math.hypot(dx, dy);
        const angle = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI) / 4;
        end = {
          x: d.origin.x + Math.cos(angle) * length,
          y: d.origin.y + Math.sin(angle) * length,
        };
      }
      setOverlay({
        ...blank,
        arrow: {
          ...(d.type === 'rectangle'
            ? rectangleFromDrag(d.origin, end, e.shiftKey, e.altKey)
            : createLine(d.origin, end)),
          id: 'preview',
        },
      });
      return;
    }
    if (d?.type === 'brace' || d?.type === 'bracket') {
      setOverlay({
        ...blank,
        arrow: { ...createBrace(d.type, d.origin, snapPoint(p)), id: 'preview' },
      });
      return;
    }
    if (d?.type === 'loop-arrow') {
      const end = snapPoint(p);
      setOverlay({
        ...blank,
        arrow: {
          kind: 'loop-arrow',
          id: 'preview',
          x: Math.min(d.origin.x, end.x),
          y: Math.min(d.origin.y, end.y),
          width: Math.max(20, Math.abs(end.x - d.origin.x)),
          height: Math.max(20, Math.abs(end.y - d.origin.y)),
          direction: 'clockwise',
          arrowPosition: 0.125,
          color: COLORS.red,
          strokeWidth: 2,
        },
      });
      return;
    }
    if (d?.type === 'arrow') {
      const start = d.origin,
        end = snapPoint(p),
        dx = end.x - start.x,
        dy = end.y - start.y;
      setOverlay({
        ...blank,
        arrow: {
          kind: 'arrow',
          id: 'preview',
          type: s.arrowType,
          start,
          end,
          controlPoints: [
            { x: start.x + dx / 3 - dy * 0.45, y: start.y + dy / 3 + dx * 0.45 },
            { x: start.x + (dx * 2) / 3 - dy * 0.45, y: start.y + (dy * 2) / 3 + dx * 0.45 },
          ],
          color: COLORS.red,
          width: 2,
          reversed: false,
        },
      });
      return;
    }
    if (d?.type === 'move' || d?.type === 'label' || d?.type === 'handle') {
      if (distance(p, d.origin) < 2 / viewport.zoom && s.document === d.doc) return;
      if (!svgRef.current!.hasPointerCapture(e.pointerId))
        svgRef.current!.setPointerCapture(e.pointerId);
      setDragging(d.type === 'handle' ? 'handle' : 'move');
      const selected = new Set(d.ids);
      const raw = { x: p.x - d.origin.x, y: p.y - d.origin.y };
      const feedback =
        d.type === 'move' && d.moveContext
          ? computeMoveGuides(
              d.moveContext,
              raw,
              viewport.zoom,
              e.altKey || !s.snapEnabled,
              false,
              e.shiftKey,
            )
          : {
              delta: { x: snap(raw.x), y: snap(raw.y) },
              alignment: {},
              distances: [],
              target: null,
            };
      const { delta, alignment: guides, distances, target } = feedback;
      const objects =
        d.type === 'move'
          ? moveSelection(d.doc, d.ids, delta).objects
          : d.type === 'label'
            ? moveLabel(d.doc, d.ids[0], {
                x: Math.round(raw.x),
                y: Math.round(raw.y),
              }).objects
            : d.doc.objects.map((o) => {
                if (!selected.has(o.id)) return o;
                if (d.type === 'handle') {
                  if (d.handle === 'rotate' && (o.kind === 'arrow' || o.kind === 'loop-arrow'))
                    return rotateArrow(
                      o,
                      rotationGesture(arrowCenter(o), d.origin, p, e.shiftKey, arrowOrientation(o)),
                    );
                  if (o.kind === 'loop-arrow') {
                    if (d.handle === 'loopHead')
                      return { ...o, arrowPosition: loopPositionAt(o, p) };
                    if (d.handle === 'loopNW' || d.handle === 'loopSE')
                      return resizeLoop(o, d.handle, snapPoint(p));
                  }
                  if (o.kind === 'brace' && (d.handle === 'start' || d.handle === 'end')) {
                    return resizeBrace(o, d.handle, snapPoint(p));
                  }
                  if (o.kind === 'rectangle' && d.handle?.startsWith('rect'))
                    return resizeRectangle(o, d.handle, snapPoint(p), e.shiftKey);
                  if (o.kind === 'line' && (d.handle === 'start' || d.handle === 'end'))
                    return { ...o, [d.handle]: snapPoint(p) };
                  if (o.kind === 'arrow') {
                    const q = snapPoint(p),
                      handle = d.handle;
                    if (handle === 'start' || handle === 'end') return { ...o, [handle]: q };
                    if (handle?.startsWith('control:')) {
                      const cps: [Point, Point] = [...o.controlPoints];
                      cps[Number(handle.split(':')[1])] = q;
                      return { ...o, controlPoints: cps };
                    }
                  }
                  if (o.kind === 'wire') {
                    if (d.handle?.startsWith('segment:')) {
                      const points = wirePoints(o, d.doc),
                        index = Number(d.handle.split(':')[1]);
                      const a = points[index],
                        b = points[index + 1];
                      const length = distance(a, b) || 1,
                        normal = {
                          x: -(b.y - a.y) / length,
                          y: (b.x - a.x) / length,
                        };
                      const projected = raw.x * normal.x + raw.y * normal.y;
                      const amount =
                        !o.routing || o.routing === 'orthogonal' ? snap(projected) : projected;
                      const shift = {
                        x: normal.x * amount,
                        y: normal.y * amount,
                      };
                      const route = points.map((point, i) =>
                        i === index || i === index + 1 ? add(point, shift) : point,
                      );
                      if (index === 0) route.unshift(points[0]);
                      if (index === points.length - 2) route.push(points.at(-1)!);
                      const moved = { ...o, vertices: route.slice(1, -1) };
                      return !o.routing || o.routing === 'orthogonal'
                        ? {
                            ...moved,
                            vertices: safeWirePoints(moved, d.doc).slice(1, -1),
                          }
                        : moved;
                    }
                    if (d.handle?.startsWith('vertex:'))
                      return {
                        ...o,
                        vertices: o.vertices.map((v, i) =>
                          i === Number(d.handle!.split(':')[1]) ? snapPoint(p) : v,
                        ),
                      };
                    const target = wireEndpointCandidate(
                        p,
                        o,
                        d.handle === 'wireStart' ? 'start' : 'end',
                        d.doc,
                        viewport.zoom,
                      ),
                      endpoint: Endpoint =
                        target.kind === 'wire'
                          ? { kind: 'free', point: target.point }
                          : target.endpoint;
                    if (d.handle === 'wireStart') return { ...o, startEndpoint: endpoint };
                    if (d.handle === 'wireEnd') return { ...o, endEndpoint: endpoint };
                  }
                  return o;
                }
                return o;
              });
      s.preview({ ...d.doc, objects });
      setOverlay({ ...blank, guides, distances, target });
      return;
    }
    if (s.tool === 'polarity') {
      const componentTarget = polarityTarget(e.target)?.id ?? null;
      setOverlay((previous) =>
        previous.componentTarget === componentTarget ? previous : { ...blank, componentTarget },
      );
      return;
    }
    if (s.tool === 'current') {
      const near = nearestWire(p, s.document, 16 / viewport.zoom);
      const wireTarget = near?.wire.id ?? null,
        target = near?.point ?? null;
      setOverlay((previous) =>
        previous.wireTarget === wireTarget &&
        previous.target?.x === target?.x &&
        previous.target?.y === target?.y
          ? previous
          : { ...blank, target, wireTarget },
      );
      return;
    }
    if (s.tool === 'voltage') {
      const point = wireCandidate(p, s.document, viewport.zoom).point;
      setOverlay((previous) =>
        previous.target?.x === point.x && previous.target?.y === point.y
          ? previous
          : {
              ...blank,
              target: point,
              arrow:
                voltageStartRef.current && distance(voltageStartRef.current, point) > 20
                  ? {
                      ...createElectrical('voltage', voltageStartRef.current, point, 'V_{AB}'),
                      id: 'preview',
                    }
                  : null,
            },
      );
      return;
    }
    if (s.splittingWireId) {
      const excluded = new Set(
        s.document.objects.filter((o) => o.id !== s.splittingWireId).map((o) => o.id),
      );
      const near = nearestWire(p, s.document, 14 / viewport.zoom, excluded);
      if (near) {
        const result = splitWireAtPoint(s.document, near.wire.id, near.point);
        if (result) {
          s.commit(result.doc);
          s.select([result.secondId]);
          s.setSplitWire(null);
        } else s.notify('Scegli un punto interno al filo, lontano da incroci e terminali.');
      }
      return;
    }
    if (s.tool === 'preset') {
      setOverlay({ ...blank, mouse: snapPoint(p) });
      return;
    }
    if (
      s.tool !== 'wire' &&
      s.tool !== 'junction' &&
      !componentTypes.includes(s.tool as (typeof componentTypes)[number])
    )
      return;
    if (componentTypes.includes(s.tool as (typeof componentTypes)[number])) {
      smart.move(s.tool as (typeof componentTypes)[number], p, e.altKey);
      return;
    }
    const target =
      s.tool === 'wire' || s.tool === 'junction'
        ? drawingWireCandidate(
            p,
            s.document,
            viewport.zoom,
            s.tool === 'wire' ? draftRef.current : null,
          )
        : null;
    setOverlay({
      ...blank,
      mouse: p,
      target: target && target.kind !== 'grid' ? target.point : null,
    });
  };
  const pointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current,
      s = useEditorStore.getState();
    drag.current = null;
    setDragging(null);
    if (svgRef.current?.hasPointerCapture(e.pointerId))
      svgRef.current.releasePointerCapture(e.pointerId);
    if (d?.type === 'terminal-wire' && d.started)
      finishWire(
        drawingWireCandidate(
          world(e.clientX, e.clientY),
          s.document,
          viewport.zoom,
          draftRef.current,
        ),
      );
    if (d?.type === 'move' || d?.type === 'label' || d?.type === 'handle') {
      if (
        s.document !== d.doc &&
        d.type === 'handle' &&
        (d.handle === 'wireStart' || d.handle === 'wireEnd')
      ) {
        const doc = useEditorStore.getState().document;
        const wire = doc.objects.find((o) => o.id === d.ids[0]);
        if (wire?.kind === 'wire') {
          const p = world(e.clientX, e.clientY),
            original = d.doc.objects.find((o) => o.id === wire.id);
          const candidate = wireEndpointCandidate(
            p,
            original?.kind === 'wire' ? original : wire,
            d.handle === 'wireStart' ? 'start' : 'end',
            d.doc,
            viewport.zoom,
          );
          if (candidate.kind === 'wire') {
            const result = insertJunction(doc, candidate.point);
            result.doc.objects = result.doc.objects.map((o) =>
              o.id === wire.id && o.kind === 'wire'
                ? {
                    ...o,
                    [d.handle === 'wireStart' ? 'startEndpoint' : 'endEndpoint']: {
                      kind: 'junction',
                      junctionId: result.junction.id,
                    },
                  }
                : o,
            );
            s.preview(result.doc);
          }
        }
      }
      const doc = useEditorStore.getState().document;
      const changesWireGeometry =
        d.type === 'handle' ||
        (d.type === 'move' &&
          d.doc.objects.some(
            (o) => d.ids.includes(o.id) && ['wire', 'component', 'junction'].includes(o.kind),
          ));
      if (doc !== d.doc && changesWireGeometry) s.preview(normalizeDocumentWires(doc));
      s.endGesture();
    }
    if (d?.type === 'marquee') {
      const p = world(e.clientX, e.clientY),
        x = Math.min(p.x, d.origin.x),
        y = Math.min(p.y, d.origin.y),
        w = Math.abs(p.x - d.origin.x),
        h = Math.abs(p.y - d.origin.y);
      if (w > 4 || h > 4) {
        const ids = s.document.objects
          .filter((o) => {
            const b = objectBounds(o, s.document);
            return b.x >= x && b.y >= y && b.x + b.width <= x + w && b.y + b.height <= y + h;
          })
          .map((o) => o.id);
        s.select(d.additive ? [...new Set([...s.selection, ...ids])] : ids);
      }
    }
    if (d?.type === 'voltage') {
      const point = wireCandidate(world(e.clientX, e.clientY), s.document, viewport.zoom).point;
      if (distance(d.origin, point) > 20) {
        s.add([createElectrical('voltage', d.origin, point, 'V_{AB}')]);
        setFirstPoint(null);
        s.setTool('select');
      }
    }
    if (
      (d?.type === 'rectangle' ||
        d?.type === 'line' ||
        d?.type === 'arrow' ||
        d?.type === 'loop-arrow' ||
        d?.type === 'brace' ||
        d?.type === 'bracket') &&
      overlay.arrow &&
      (overlay.arrow.kind === 'rectangle'
        ? overlay.arrow.width >= 2 &&
          overlay.arrow.height >= 2 &&
          distance(d.origin, world(e.clientX, e.clientY)) > 3 / viewport.zoom
        : overlay.arrow.kind === 'loop-arrow'
          ? distance(d.origin, world(e.clientX, e.clientY)) > 20
          : distance(overlay.arrow.start, overlay.arrow.end) > 20)
    ) {
      s.add([{ ...overlay.arrow, id: makeId() }]);
      s.setTool('select');
    }
    if (s.tool === 'wire') {
      const p = world(e.clientX, e.clientY),
        candidate = drawingWireCandidate(
          p,
          useEditorStore.getState().document,
          viewport.zoom,
          draftRef.current,
        );
      setOverlay({
        ...blank,
        mouse: p,
        target: candidate.kind === 'grid' ? null : candidate.point,
      });
    } else setOverlay(blank);
  };
  const doubleClick = (e: ReactPointerEvent<SVGSVGElement>) => {
    const s = useEditorStore.getState();
    if (s.tool === 'wire') {
      if (draftRef.current)
        finishWire(
          drawingWireCandidate(
            world(e.clientX, e.clientY),
            s.document,
            viewport.zoom,
            draftRef.current,
          ),
        );
      return;
    }
    if (s.tool !== 'select') return;
    const id = pointerTarget(e).closest('[data-object]')?.getAttribute('data-object'),
      o = s.document.objects.find((o) => o.id === id);
    if (!o) return;
    const target = inlineTextTarget(o, s.document);
    if (target) {
      s.select([target.id]);
      setActiveLabel(o.kind === 'text' ? null : target.id);
      setEditing(target);
    } else if (o.kind === 'wire') {
      const p = world(e.clientX, e.clientY),
        near = nearestWire(p, s.document, 14 / viewport.zoom);
      if (!near || near.wire.id !== o.id) return;
      const vertices = [
        ...near.points.slice(1, near.segment + 1),
        near.point,
        ...near.points.slice(near.segment + 1, -1),
      ];
      s.update(o.id, (obj) => (obj.kind === 'wire' ? { ...obj, vertices } : obj));
    }
  };
  const drop = (e: DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/drawcircuit-component');
    if (componentTypes.includes(type as (typeof componentTypes)[number])) {
      const componentType = type as (typeof componentTypes)[number],
        p = world(e.clientX, e.clientY);
      if (!smart.confirm(componentType, p, e.altKey, true)) placeComponent(componentType, p);
    }
    setPaletteDragType(null);
  };
  const saveEdit = () => {
    if (!editing) return;
    const original = useEditorStore.getState().document.objects.find((o) => o.id === editing.id);
    if (!original || replaceInlineText(original, editing.text) === original) {
      setEditing(null);
      svgRef.current?.focus();
      return;
    }
    useEditorStore.getState().update(editing.id, (o) => replaceInlineText(o, editing.text));
    setEditing(null);
    svgRef.current?.focus();
  };
  return {
    viewport,
    hoveredArrow,
    voltageStart,
    surfaceSize,
    smart,
    paletteDragType,
    dragOver: (e: DragEvent<SVGSVGElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (paletteDragType) smart.move(paletteDragType, world(e.clientX, e.clientY), e.altKey);
    },
    overlay,
    draft,
    space,
    dragging,
    activeLabel,
    editing,
    setEditing,
    saveEdit,
    fit,
    zoomAt,
    pointerDown,
    pointerMove,
    pointerUp,
    leave: () => {
      smart.leave();
      if (!drag.current) {
        setOverlay(blank);
        setHoveredArrow(null);
      }
    },
    doubleClick,
    drop,
    cancel: () => {
      useEditorStore.getState().cancelGesture();
      drag.current = null;
      setDragging(null);
      setActiveLabel(null);
      setWireDraft(null);
      setOverlay(blank);
      setFirstPoint(null);
      smart.reset();
    },
  };
}
