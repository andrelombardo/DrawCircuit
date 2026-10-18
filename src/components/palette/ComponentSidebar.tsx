import { t } from '../../i18n';
import { useRef } from 'react';
import type { CSSProperties } from 'react';
import { Palette } from './Palette';
import {
  clampWidth,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
  useSidebarPreferences,
} from './useSidebarPreferences';

export function ComponentSidebar({
  preferences,
  setPreferences,
  toggleSidebar,
}: ReturnType<typeof useSidebarPreferences>) {
  const shell = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; width: number; pointerId: number } | null>(null);
  const setWidth = (width: number) => setPreferences((p) => ({ ...p, width: clampWidth(width) }));
  return (
    <div
      id="component-library"
      ref={shell}
      className="component-sidebar"
      hidden={!preferences.visible}
      style={
        {
          width: preferences.width,
          '--sidebar-width': `${preferences.width}px`,
        } as CSSProperties
      }
    >
      <Palette onHide={toggleSidebar} />
      <div
        className="sidebar-resizer"
        role="separator"
        aria-label={t('Resize component sidebar')}
        aria-orientation="vertical"
        tabIndex={0}
        aria-valuemin={SIDEBAR_MIN_WIDTH}
        aria-valuemax={SIDEBAR_MAX_WIDTH}
        aria-valuenow={preferences.width}
        title={t('Drag to resize · double-click to reset')}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          if (shell.current) shell.current.dataset.resizing = 'true';
          drag.current = {
            x: e.clientX,
            width: shell.current!.getBoundingClientRect().width,
            pointerId: e.pointerId,
          };
        }}
        onPointerMove={(e) => {
          if (!drag.current || drag.current.pointerId !== e.pointerId) return;
          const maximum = Math.max(
            SIDEBAR_MIN_WIDTH,
            Math.min(SIDEBAR_MAX_WIDTH, window.innerWidth * 0.45),
          );
          setWidth(Math.min(maximum, drag.current.width + e.clientX - drag.current.x));
        }}
        onPointerUp={(e) => {
          if (drag.current?.pointerId === e.pointerId) {
            if (shell.current) delete shell.current.dataset.resizing;
            drag.current = null;
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        }}
        onPointerCancel={() => {
          if (shell.current) delete shell.current.dataset.resizing;
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          if (shell.current) delete shell.current.dataset.resizing;
          drag.current = null;
        }}
        onDoubleClick={() => setWidth(SIDEBAR_DEFAULT_WIDTH)}
        onKeyDown={(e) => {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            setWidth(
              e.key === 'Home'
                ? SIDEBAR_MIN_WIDTH
                : e.key === 'End'
                  ? SIDEBAR_MAX_WIDTH
                  : preferences.width + (e.key === 'ArrowLeft' ? -10 : 10),
            );
          }
        }}
      />
    </div>
  );
}
