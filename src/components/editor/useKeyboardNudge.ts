import { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { moveSelection } from '../../utils/operations';
import { normalizeDocumentWires } from '../../utils/wires';
import type { CircuitDocument, Point } from '../../model/types';
import { computeMoveGuides, createMoveContext } from '../../utils/smartGuides';
import type { DistanceGuide, MoveContext } from '../../utils/smartGuides';
import { moveLabel } from '../../utils/labels';

export const NUDGE_STEP = 1;
export const NUDGE_LARGE_STEP = 10;
const directions: Record<string, Point> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};
function focusConsumesArrows(target: EventTarget | null) {
  return (
    target instanceof Element &&
    !!target.closest(
      'input, textarea, select, button, summary, [contenteditable]:not([contenteditable="false"]), [role="menu"], [role="listbox"], [role="combobox"], [role="slider"], [role="separator"], [role="dialog"], [role="textbox"]',
    )
  );
}

/** One held-key gesture, including diagonals; also closes on focus loss or another action. */
export function useKeyboardNudge(zoom = 1): DistanceGuide[] {
  const [distances, setDistances] = useState<DistanceGuide[]>([]);
  useEffect(() => {
    let gesture: {
      doc: CircuitDocument;
      ids: string[];
      delta: Point;
      keys: Set<string>;
      labelId: string | null;
      context: MoveContext;
    } | null = null;
    const finish = () => {
      if (!gesture) return;
      const s = useEditorStore.getState();
      const base = gesture.doc,
        labelId = gesture.labelId,
        ids = new Set(gesture.ids);
      gesture = null;
      setDistances([]);
      if (s.gestureStart !== base) return;
      if (
        !labelId &&
        base.objects.some(
          (o) => ids.has(o.id) && ['component', 'junction', 'wire'].includes(o.kind),
        )
      )
        s.preview(normalizeDocumentWires(s.document));
      s.endGesture();
    };
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') return;
      const direction = directions[e.key];
      if (!direction || e.ctrlKey || e.metaKey || e.altKey) {
        finish();
        return;
      }
      if (
        e.defaultPrevented ||
        e.isComposing ||
        focusConsumesArrows(e.target) ||
        focusConsumesArrows(document.activeElement) ||
        document.querySelector('[role="dialog"], [role="menu"]')
      ) {
        finish();
        return;
      }
      const s = useEditorStore.getState();
      if (
        gesture &&
        (s.gestureStart !== gesture.doc ||
          s.selection !== gesture.ids ||
          s.activeLabel !== gesture.labelId ||
          s.tool !== 'select')
      )
        finish();
      if (s.tool !== 'select' || !s.selection.length || (s.gestureStart && !gesture)) return;
      e.preventDefault();
      if (!gesture) {
        gesture = {
          doc: s.document,
          ids: s.selection,
          delta: { x: 0, y: 0 },
          keys: new Set(),
          labelId: s.activeLabel,
          context: createMoveContext(s.document, s.selection),
        };
        s.beginGesture();
      }
      gesture.keys.add(e.key);
      const step = e.shiftKey ? NUDGE_LARGE_STEP : NUDGE_STEP;
      gesture.delta = {
        x: gesture.delta.x + direction.x * step,
        y: gesture.delta.y + direction.y * step,
      };
      s.preview(
        gesture.labelId
          ? moveLabel(gesture.doc, gesture.labelId, gesture.delta)
          : moveSelection(gesture.doc, gesture.ids, gesture.delta),
      );
      // Keyboard precision stays 1/10 document units. The same geometry engine
      // supplies transient distance feedback without magnetically overriding it.
      setDistances(
        gesture.labelId
          ? []
          : computeMoveGuides(gesture.context, gesture.delta, zoom, false, true).distances,
      );
    };
    const up = (e: KeyboardEvent) => {
      gesture?.keys.delete(e.key);
      if (gesture && !gesture.keys.size) finish();
    };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    window.addEventListener('blur', finish);
    window.addEventListener('focusin', finish);
    window.addEventListener('pointerdown', finish, true);
    return () => {
      finish();
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
      window.removeEventListener('blur', finish);
      window.removeEventListener('focusin', finish);
      window.removeEventListener('pointerdown', finish, true);
    };
  }, [zoom]);
  return distances;
}
