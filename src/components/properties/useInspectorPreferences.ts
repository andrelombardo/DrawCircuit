import { useCallback, useEffect, useState } from 'react';
export const INSPECTOR_STORAGE_KEY = 'drawcircuit.inspector.v1';
export const INSPECTOR_DEFAULT_WIDTH = 264,
  INSPECTOR_MIN_WIDTH = 252,
  INSPECTOR_MAX_WIDTH = 440;
export const clampInspectorWidth = (width: number) =>
  Math.max(INSPECTOR_MIN_WIDTH, Math.min(INSPECTOR_MAX_WIDTH, width));
function read() {
  try {
    const p = JSON.parse(localStorage.getItem(INSPECTOR_STORAGE_KEY) ?? 'null');
    if (
      p &&
      typeof p.visible === 'boolean' &&
      typeof p.width === 'number' &&
      Number.isFinite(p.width)
    )
      return { visible: p.visible, width: clampInspectorWidth(p.width) };
  } catch {
    /* Unavailable preferences do not affect the document. */
  }
  return { visible: true, width: INSPECTOR_DEFAULT_WIDTH };
}
export function useInspectorPreferences() {
  const [preferences, setPreferences] = useState(read);
  const toggle = useCallback(() => setPreferences((p) => ({ ...p, visible: !p.visible })), []);
  useEffect(() => {
    try {
      localStorage.setItem(INSPECTOR_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      /* Session preferences still work. */
    }
  }, [preferences]);
  return { preferences, setPreferences, toggle };
}
