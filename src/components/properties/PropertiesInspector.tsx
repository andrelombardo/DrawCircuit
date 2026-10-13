import { useRef } from 'react';
import type { CSSProperties } from 'react';
import { PropertiesContent } from './PropertiesContent';
import { useEditorStore } from '../../store/editorStore';
import { SidebarToggle } from '../toolbar/SidebarToggle';
import {
  clampInspectorWidth,
  INSPECTOR_DEFAULT_WIDTH,
  INSPECTOR_MAX_WIDTH,
  INSPECTOR_MIN_WIDTH,
  useInspectorPreferences,
} from './useInspectorPreferences';
export function PropertiesInspector({
  preferences,
  setPreferences,
  toggle,
}: ReturnType<typeof useInspectorPreferences>) {
  const drag = useRef<{ x: number; width: number; pointer: number } | null>(null);
  const setWidth = (width: number) =>
    setPreferences((p) => ({ ...p, width: clampInspectorWidth(width) }));
  return (
    <aside
      id="properties-inspector"
      className="properties-inspector"
      role="region"
      aria-label="Proprietà"
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        const editingText = target.matches(
          'textarea, input:not([type="checkbox"]):not([type="color"]), [contenteditable="true"]',
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
            const remaining = selection.filter((id) =>
              next.document.objects.some((object) => object.id === id),
            );
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
      }}
      hidden={!preferences.visible}
      style={{ '--inspector-width': `${preferences.width}px` } as CSSProperties}
    >
      <div className="inspector-header">
        <h2>Proprietà</h2>
        <SidebarToggle side="right" visible onToggle={toggle} />
      </div>
      <div className="inspector-scroll">
        <PropertiesContent />
      </div>
      <div
        className="inspector-resizer"
        role="separator"
        aria-label="Ridimensiona proprietà"
        aria-orientation="vertical"
        aria-valuemin={INSPECTOR_MIN_WIDTH}
        aria-valuemax={INSPECTOR_MAX_WIDTH}
        aria-valuenow={preferences.width}
        tabIndex={0}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, width: preferences.width, pointer: e.pointerId };
        }}
        onPointerMove={(e) => {
          if (drag.current?.pointer === e.pointerId)
            setWidth(drag.current.width + drag.current.x - e.clientX);
        }}
        onPointerUp={(e) => {
          if (drag.current?.pointer === e.pointerId) {
            drag.current = null;
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        }}
        onPointerCancel={() => {
          if (drag.current) setWidth(drag.current.width);
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
        onDoubleClick={() => setWidth(INSPECTOR_DEFAULT_WIDTH)}
        onKeyDown={(e) => {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            setWidth(
              e.key === 'Home'
                ? INSPECTOR_MIN_WIDTH
                : e.key === 'End'
                  ? INSPECTOR_MAX_WIDTH
                  : preferences.width + (e.key === 'ArrowLeft' ? 10 : -10),
            );
          }
        }}
      />
    </aside>
  );
}
