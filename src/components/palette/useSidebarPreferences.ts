import { useCallback, useEffect, useState } from 'react';

export const SIDEBAR_STORAGE_KEY = 'drawcircuit.sidebar.v1';
export const SIDEBAR_DEFAULT_WIDTH = 268;
export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 480;
export const clampWidth = (width: number) =>
  Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));
function initialPreferences(): { visible: boolean; width: number } {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(SIDEBAR_STORAGE_KEY) ?? 'null');
    if (
      saved &&
      typeof saved === 'object' &&
      'visible' in saved &&
      'width' in saved &&
      typeof saved.visible === 'boolean' &&
      typeof saved.width === 'number' &&
      Number.isFinite(saved.width)
    ) {
      return { visible: saved.visible, width: clampWidth(saved.width) };
    }
  } catch {
    /* Unavailable or malformed storage uses the same functional defaults. */
  }
  return { visible: true, width: SIDEBAR_DEFAULT_WIDTH };
}
export function useSidebarPreferences() {
  const [preferences, setPreferences] = useState(initialPreferences);
  const toggleSidebar = useCallback(
    () => setPreferences((p) => ({ ...p, visible: !p.visible })),
    [],
  );
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      /* UI preferences remain usable for this session. */
    }
  }, [preferences]);
  return { preferences, setPreferences, toggleSidebar };
}
