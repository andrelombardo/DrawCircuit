import { usePersonalBlocks, instantiatePersonalBlock } from '../personalBlocks/library';
import {
  replaceComponent as replaceComponentInDocument,
  replaceComponents as replaceComponentsInDocument,
} from '../model/replacement';
import type { ComponentType } from '../model/types';
import { create } from 'zustand';
import { reconcileCurrentSegments } from '../annotations/electrical';
import { demoDocument } from '../model/demo';
import { deserializeDocument, serializeDocument } from '../model/serialization';
import { cloneObjects, extractSelection, removeObjects, rotateObjects } from '../utils/operations';
import { alignSelection, distributeSelection, positionSelection } from '../utils/selectionGeometry';
import type { Axis, Alignment, DistributionMode } from '../utils/selectionGeometry';
import { copySelection, pasteSelection } from '../utils/clipboard';
import { mirrorArrows } from '../utils/arrows';
import {
  hasAssociatedLabel,
  inlineTextTarget,
  moveLabel,
  replaceInlineText,
} from '../utils/labels';
import { instantiatePreset } from '../presets/instantiate';
import { presetRegistry } from '../presets/registry';
import { localPersistence } from '../utils/localPersistence';
import type {
  ArrowAnnotation,
  CircuitDocument,
  CircuitObject,
  Point,
  Rotation,
  Tool,
  WireRouting,
} from '../model/types';
export const STORAGE_KEY = 'drawcircuit.document.v1';
const documentStorage = localPersistence(
  STORAGE_KEY,
  deserializeDocument,
  serializeDocument,
  demoDocument,
);
const initialDocument = documentStorage.load();
interface EditorState {
  document: CircuitDocument;
  selection: string[];
  activeLabel: string | null;
  tool: Tool;
  pendingPresetId: string | null;
  replaceComponent: (id: string, type: ComponentType) => void;
  replaceComponents: (ids: string[], type: ComponentType) => void;
  selectPreset: (id: string) => void;
  insertPreset: (point: Point) => void;
  placementRotation: Rotation;
  rotatePlacement: () => void;
  arrowType: ArrowAnnotation['type'];
  wireRouting: WireRouting;
  setWireRouting: (routing: WireRouting) => void;
  grid: boolean;
  snapEnabled: boolean;
  toggleSnap: () => void;
  splittingWireId: string | null;
  setSplitWire: (id: string | null) => void;
  past: CircuitDocument[];
  future: CircuitDocument[];
  gestureStart: CircuitDocument | null;
  notice: string;
  storageError: boolean;
  setTool: (tool: Tool) => void;
  select: (ids: string[]) => void;
  setActiveLabel: (id: string | null) => void;
  setArrowType: (type: ArrowAnnotation['type']) => void;
  toggleGrid: () => void;
  commit: (doc: CircuitDocument) => void;
  add: (objects: CircuitObject[]) => void;
  updateSelection: (fn: (o: CircuitObject) => CircuitObject) => void;
  updateObjects: (ids: readonly string[], fn: (o: CircuitObject) => CircuitObject) => void;
  align: (axis: Axis, alignment: Alignment) => void;
  distribute: (axis: Axis, mode?: DistributionMode, spacing?: number) => void;
  position: (axis: Axis, value: number) => void;
  copy: (clipboardData?: DataTransfer | null) => Promise<boolean>;
  cut: (clipboardData?: DataTransfer | null) => Promise<boolean>;
  paste: (nativeText?: string) => Promise<void>;
  update: (id: string, fn: (o: CircuitObject) => CircuitObject) => void;
  beginGesture: () => void;
  preview: (doc: CircuitDocument) => void;
  endGesture: () => void;
  cancelGesture: () => void;
  undo: () => void;
  redo: () => void;
  remove: (includeLabelOwner?: boolean) => void;
  duplicate: () => void;
  mirror: (axis: 'horizontal' | 'vertical') => void;
  rotate: () => void;
  replace: (doc: CircuitDocument) => void;
  notify: (message: string) => void;
}
export const useEditorStore = create<EditorState>((set, get) => ({
  document: initialDocument.value,
  selection: [],
  activeLabel: null,
  tool: 'select',
  pendingPresetId: null,
  selectPreset: (id) => {
    if (
      !Object.hasOwn(presetRegistry, id) &&
      !usePersonalBlocks.getState().blocks.some((b) => b.id === id)
    )
      return;
    get().setTool('preset');
    set({ pendingPresetId: id });
  },
  insertPreset: (point) => {
    const s = get(),
      preset = s.pendingPresetId ? presetRegistry[s.pendingPresetId] : undefined;
    const personal = usePersonalBlocks.getState().blocks.find((b) => b.id === s.pendingPresetId);
    if (!preset && !personal) return;
    const objects = personal
      ? instantiatePersonalBlock(personal, point, s.placementRotation, s.document)
      : instantiatePreset(preset!, point, s.placementRotation, s.document);
    s.setTool('select');
    s.add(objects);
  },
  replaceComponent: (id, type) =>
    get().commit(replaceComponentInDocument(get().document, id, type)),
  replaceComponents: (ids, type) =>
    get().commit(replaceComponentsInDocument(get().document, ids, type)),
  placementRotation: 0,
  rotatePlacement: () =>
    set((s) => ({
      placementRotation: ((s.placementRotation + (s.tool === 'preset' ? 90 : 45)) %
        360) as Rotation,
    })),
  arrowType: 'straight',
  wireRouting: 'orthogonal',
  setWireRouting: (wireRouting) => set({ wireRouting }),
  grid: true,
  snapEnabled: true,
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  splittingWireId: null,
  setSplitWire: (splittingWireId) => set({ splittingWireId, tool: 'select' }),
  past: [],
  future: [],
  gestureStart: null,
  notice: initialDocument.error,
  storageError: Boolean(initialDocument.error),
  setTool: (tool) =>
    set((s) => ({
      tool,
      splittingWireId: null,
      pendingPresetId: null,
      placementRotation: 0,
      selection: tool === 'select' ? s.selection : [],
      activeLabel: null,
    })),
  select: (selection) => set({ selection, activeLabel: null }),
  setActiveLabel: (activeLabel) => set({ activeLabel }),
  setArrowType: (arrowType) => set({ arrowType }),
  toggleGrid: () => set((s) => ({ grid: !s.grid })),
  commit: (document) =>
    set((s) => ({
      document: reconcileCurrentSegments(s.gestureStart ?? s.document, document),
      past: [...s.past, s.document].slice(-100),
      future: [],
      gestureStart: null,
    })),
  add: (objects) => {
    const s = get();
    s.commit({ ...s.document, objects: [...s.document.objects, ...objects] });
    s.select(objects.map((o) => o.id));
  },
  updateSelection: (fn) => get().updateObjects(get().selection, fn),
  updateObjects: (objectIds, fn) => {
    const s = get(),
      ids = new Set(objectIds);
    const objects = s.document.objects.map((o) => (ids.has(o.id) ? fn(o) : o));
    if (objects.some((o, i) => o !== s.document.objects[i])) {
      const next = { ...s.document, objects };
      if (s.gestureStart) s.preview(next);
      else s.commit(next);
    }
  },
  align: (axis, alignment) => {
    const s = get();
    const next = alignSelection(s.document, s.selection, axis, alignment);
    if (next !== s.document) s.commit(next);
  },
  distribute: (axis, mode = 'centers', spacing) => {
    const s = get();
    const next = distributeSelection(s.document, s.selection, axis, mode, spacing);
    if (next !== s.document) s.commit(next);
  },
  position: (axis, value) => {
    const s = get();
    const target =
      s.activeLabel && s.selection.length === 1
        ? inlineTextTarget(
            s.document.objects.find((o) => o.id === s.activeLabel),
            s.document,
          )
        : null;
    const next =
      target && Number.isFinite(value)
        ? moveLabel(s.document, s.activeLabel!, {
            x: axis === 'x' ? value - target.point.x : 0,
            y: axis === 'y' ? value - target.point.y : 0,
          })
        : positionSelection(s.document, s.selection, axis, value);
    if (next !== s.document) s.commit(next);
  },
  copy: async (clipboardData) => {
    const s = get();
    const result = copySelection(s.document, s.selection, clipboardData);
    if (!result) return false;
    await result;
    s.notify('Selezione copiata');
    return true;
  },
  cut: async (clipboardData) => {
    const s = get();
    // The fallback is populated synchronously before deletion. Clipboard permission
    // can resolve after a selection change, so never delete from an async continuation.
    const result = copySelection(s.document, s.selection, clipboardData);
    if (!result) {
      s.notify('Impossibile copiare la selezione.');
      return false;
    }
    s.remove(true);
    s.notify('Selezione tagliata');
    await result;
    return true;
  },
  paste: async (nativeText) => {
    const copied = await pasteSelection(nativeText);
    if (!copied) return;
    const s = get();
    s.add(cloneObjects(copied, { x: 40, y: 40 }, s.document));
    s.notify('Selezione incollata');
  },
  update: (id, fn) => {
    const s = get();
    s.commit({ ...s.document, objects: s.document.objects.map((o) => (o.id === id ? fn(o) : o)) });
  },
  beginGesture: () => set((s) => ({ gestureStart: s.gestureStart ?? s.document })),
  preview: (document) =>
    set((s) => ({
      document: reconcileCurrentSegments(s.gestureStart ?? s.document, document),
    })),
  endGesture: () => {
    const s = get();
    if (s.gestureStart && s.gestureStart !== s.document)
      set({ past: [...s.past, s.gestureStart].slice(-100), future: [], gestureStart: null });
    else set({ gestureStart: null });
  },
  cancelGesture: () => {
    const s = get();
    if (s.gestureStart) set({ document: s.gestureStart, gestureStart: null });
  },
  undo: () => {
    const s = get();
    if (s.gestureStart) {
      s.cancelGesture();
      set({ selection: [], activeLabel: null, tool: 'select', pendingPresetId: null });
      return;
    }
    if (!s.past.length) return;
    set({
      document: s.past[s.past.length - 1],
      past: s.past.slice(0, -1),
      future: [s.document, ...s.future].slice(0, 100),
      selection: [],
      activeLabel: null,
      gestureStart: null,
      tool: 'select',
      splittingWireId: null,
      pendingPresetId: null,
    });
  },
  redo: () => {
    const s = get();
    if (s.gestureStart) {
      s.cancelGesture();
      set({ selection: [], activeLabel: null, tool: 'select', pendingPresetId: null });
      return;
    }
    if (!s.future.length) return;
    set({
      document: s.future[0],
      future: s.future.slice(1),
      past: [...s.past, s.document].slice(-100),
      selection: [],
      activeLabel: null,
      gestureStart: null,
      tool: 'select',
      splittingWireId: null,
      pendingPresetId: null,
    });
  },
  remove: (includeLabelOwner = false) => {
    const s = get();
    if (!s.selection.length) return;
    const labelOwner =
      !includeLabelOwner && s.selection.length === 1 && s.selection[0] === s.activeLabel
        ? s.document.objects.find((o) => o.id === s.activeLabel)
        : undefined;
    if (labelOwner && hasAssociatedLabel(labelOwner)) {
      // Labels share their owner's id; explicit label focus is the selection subtarget.
      // Clearing the embedded text preserves its placement, owner and wire topology.
      if (labelOwner.label.text) s.update(labelOwner.id, (o) => replaceInlineText(o, ''));
    } else s.commit(removeObjects(s.document, s.selection));
    s.select([]);
  },
  duplicate: () => {
    const s = get();
    if (s.selection.length)
      s.add(cloneObjects(extractSelection(s.document, s.selection), { x: 40, y: 40 }, s.document));
  },
  mirror: (axis) => {
    const s = get();
    s.commit(mirrorArrows(s.document, s.selection, axis));
  },
  rotate: () => {
    const s = get();
    if (s.selection.length) s.commit(rotateObjects(s.document, s.selection));
  },
  replace: (document) => {
    get().cancelGesture();
    get().commit(document);
    set({ selection: [], activeLabel: null, tool: 'select', pendingPresetId: null });
  },
  notify: (notice) => set({ notice }),
}));
let saveTimer: ReturnType<typeof setTimeout> | undefined;
useEditorStore.subscribe((state, previous) => {
  // A preview may stay open indefinitely; keep saving the last committed document.
  if (
    (state.gestureStart ?? state.document) === (previous.gestureStart ?? previous.document) &&
    !(previous.gestureStart && !state.gestureStart)
  )
    return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      documentStorage.save(
        useEditorStore.getState().gestureStart ?? useEditorStore.getState().document,
      );
      if (useEditorStore.getState().storageError) useEditorStore.setState({ storageError: false });
    } catch {
      useEditorStore.setState({ storageError: true });
    }
  }, 400);
});

/** Flush the committed document synchronously without saving an active gesture. */
export function saveDocumentNow(): boolean {
  const state = useEditorStore.getState();
  if (state.gestureStart) return false;
  try {
    documentStorage.save(state.document);
    clearTimeout(saveTimer);
    if (state.storageError) useEditorStore.setState({ storageError: false });
    return true;
  } catch {
    useEditorStore.setState({ storageError: true });
    return false;
  }
}

/** Closing/reloading must not outrun the autosave debounce. Save the committed state,
 * including when a pointer gesture was still previewing changes. */
function saveOnExit(event: Event) {
  const state = useEditorStore.getState();
  try {
    documentStorage.save(state.gestureStart ?? state.document);
    clearTimeout(saveTimer);
  } catch {
    useEditorStore.setState({ storageError: true });
    if (event.type === 'beforeunload') {
      // The debounce may not have reported the failed final edit yet. Let the
      // browser warn before closing a circuit that could not be saved.
      event.preventDefault();
      (event as BeforeUnloadEvent).returnValue = '';
    }
  }
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', saveOnExit);
  window.addEventListener('beforeunload', saveOnExit);
}
