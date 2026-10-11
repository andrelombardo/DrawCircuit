import { PanelRightClose } from 'lucide-react';
import { useRef } from 'react';
import type { CSSProperties } from 'react';
import { PropertiesContent } from './PropertiesContent';
import { IconButton } from '../toolbar/IconButton';
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
      hidden={!preferences.visible}
      style={{ '--inspector-width': `${preferences.width}px` } as CSSProperties}
    >
      <div className="inspector-header">
        <h2>Proprietà</h2>
        <IconButton label="Nascondi proprietà" onClick={toggle}>
          <PanelRightClose size={17} />
        </IconButton>
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
