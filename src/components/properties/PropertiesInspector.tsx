import { t } from '../../i18n';
import { useLayoutEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { PropertiesContent } from './PropertiesContent';
import { useEditorStore } from '../../store/editorStore';
import { InspectorHeader } from './InspectorHeader';
import { inspectorKeyDown } from './inspectorKeyboard';
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
  footer,
}: ReturnType<typeof useInspectorPreferences> & { footer?: ReactNode }) {
  const drag = useRef<{ x: number; width: number; pointer: number } | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const selectionKey = useEditorStore((s) => JSON.stringify([s.selection, s.activeLabel]));
  useLayoutEffect(() => {
    if (scroll.current) scroll.current.scrollTop = 0;
  }, [selectionKey]);
  const setWidth = (width: number) =>
    setPreferences((p) => ({ ...p, width: clampInspectorWidth(width) }));
  return (
    <aside
      id="properties-inspector"
      className="properties-inspector"
      role="region"
      aria-label={t('Properties')}
      onKeyDown={inspectorKeyDown}
      hidden={!preferences.visible}
      style={{ '--inspector-width': `${preferences.width}px` } as CSSProperties}
    >
      <InspectorHeader />
      {preferences.visible && (
        <div ref={scroll} className="inspector-scroll">
          <PropertiesContent />
        </div>
      )}
      {preferences.visible && footer && <div className="inspector-footer">{footer}</div>}
      <div
        className="inspector-resizer"
        role="separator"
        aria-label={t('Resize properties')}
        aria-orientation="vertical"
        aria-valuemin={INSPECTOR_MIN_WIDTH}
        aria-valuemax={INSPECTOR_MAX_WIDTH}
        aria-valuenow={preferences.width}
        tabIndex={0}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = {
            x: e.clientX,
            width: preferences.width,
            pointer: e.pointerId,
          };
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
