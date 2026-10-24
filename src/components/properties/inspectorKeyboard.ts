import type { KeyboardEvent } from 'react';
import { useEditorStore } from '../../store/editorStore';

export const inspectorKeyDown = (event: KeyboardEvent<HTMLElement>) => {
  const target = event.target as HTMLElement;
  const editingText = target.matches(
    'textarea, input:not([type="checkbox"]):not([type="color"]):not([type="range"]), [contenteditable="true"]',
  );
  if ((event.ctrlKey || event.metaKey) && !event.altKey && !editingText) {
    const key = event.key.toLowerCase();
    if (key === 'z' || key === 'y') {
      event.preventDefault();
      event.stopPropagation();
      const state = useEditorStore.getState();
      const selection = state.selection,
        activeLabel = state.activeLabel;
      if (key === 'y' || event.shiftKey) state.redo();
      else state.undo();
      const next = useEditorStore.getState();
      const existing = new Set(next.document.objects.map((object) => object.id));
      const remaining = selection.filter((id) => existing.has(id));
      if (remaining.length) {
        next.select(remaining);
        if (activeLabel && remaining.includes(activeLabel)) next.setActiveLabel(activeLabel);
      }
      return;
    }
  }
  // Native controls own Enter, Space and letter keys. Canvas shortcuts
  // must not rotate or enter label editing while using this inspector.
  if (!event.ctrlKey && !event.metaKey) event.stopPropagation();
};
