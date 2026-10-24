import { create } from 'zustand';
import { t } from '../i18n';
import { makeId } from '../model/catalog';
import { BLEND_MODES } from '../model/types';
import type { BlendMode, CircuitObject, ShapeStyle, ShapeFill, ShapeBorder } from '../model/types';
import { objectFills, objectBorders, shapeStyle, validObjectAppearance, validShapeAppearance } from '../model/shapeAppearance';
import { MAX_FONT_SIZE, MAX_LINE_WIDTH } from '../model/limits';
import { localPersistence } from '../utils/localPersistence';

export interface ObjectStyle {
  color: string;
  opacity: number;
  weight?: number;
  fontSize?: number;
  align?: 'start' | 'middle' | 'end';
  label?: { color: string; opacity: number; fontSize: number };
  shape?: ShapeStyle;
  fills?: ShapeFill[];
  borders?: ShapeBorder[];
  blendMode: BlendMode;
  styleOpacity: number;
}
export interface SavedStyle { id: string; name: string; kind: string; value: ObjectStyle }
export const styleSignature = (style: ObjectStyle) => JSON.stringify(style, (key, value) => key === 'id' ? undefined : value);
export const styleKind = (o: CircuitObject) => o.kind === 'rectangle' || o.kind === 'circle' ? 'shape' : o.kind;
export const objectStyle = (o: CircuitObject): ObjectStyle => ({
  color: o.color, opacity: o.opacity ?? 1,
  ...('strokeWidth' in o ? { weight: o.strokeWidth } : 'width' in o ? { weight: o.width } : {}),
  ...(o.kind === 'text' ? { fontSize: o.fontSize, align: o.align } : {}),
  ...('label' in o ? { label: { color: o.label.color, opacity: o.label.opacity ?? 1, fontSize: o.label.fontSize } } : {}),
  ...(o.kind === 'rectangle' || o.kind === 'circle' ? { shape: shapeStyle(o) } : {}),
  ...(o.kind === 'rectangle' || o.kind === 'circle' ? {} : o.kind === 'text' || o.kind === 'junction' ? { fills: objectFills(o) } : { borders: objectBorders(o) }),
  blendMode: o.blendMode ?? 'normal', styleOpacity: o.styleOpacity ?? 1,
});
export function applyObjectStyle(o: CircuitObject, style: ObjectStyle, id?: string): CircuitObject {
  return { ...o, color: style.color, opacity: style.opacity, blendMode: style.blendMode, styleOpacity: style.styleOpacity,
    styleId: id, ...('strokeWidth' in o ? { strokeWidth: style.weight ?? o.strokeWidth } : 'width' in o ? { width: style.weight ?? o.width } : {}),
    ...(o.kind === 'text' ? { fontSize: style.fontSize ?? o.fontSize, align: style.align ?? o.align } : {}),
    ...('label' in o && style.label ? { label: { ...o.label, ...style.label } } : {}),
    ...((o.kind === 'rectangle' || o.kind === 'circle') && style.shape ? structuredClone(style.shape) : {}),
    ...(o.kind === 'rectangle' || o.kind === 'circle' ? {} : { fills: style.fills && structuredClone(style.fills), borders: style.borders && structuredClone(style.borders) }),
  };
}
const hex = (v: unknown) => typeof v === 'string' && /^#[\da-f]{6}$/i.test(v);
const alpha = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
const positive = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= max;
const kinds = ['shape', 'component', 'junction', 'text', 'wire', 'line', 'arrow', 'loop-arrow', 'electrical', 'brace', 'angle', 'highlight'];
export function parseStyles(raw: string): SavedStyle[] {
  if (raw.length > 1_000_000) throw new Error(t('Style library is too large.'));
  const values = JSON.parse(raw) as SavedStyle[];
  if (!Array.isArray(values) || values.length > 100) throw new Error(t('Invalid style library.'));
  const ids = new Set<string>();
  for (const entry of values) {
    const s = entry?.value;
    if (!entry || typeof entry.id !== 'string' || !entry.id || ids.has(entry.id) || typeof entry.name !== 'string' ||
      !entry.name.trim() || entry.name.length > 80 || !kinds.includes(entry.kind) || !s || !hex(s.color) || !alpha(s.opacity) ||
      !alpha(s.styleOpacity) || !BLEND_MODES.includes(s.blendMode) ||
      !validObjectAppearance({ ...s, kind: entry.kind }) ||
      (s.weight !== undefined && !positive(s.weight, entry.kind === 'highlight' ? 1000 : MAX_LINE_WIDTH)) ||
      (s.fontSize !== undefined && !positive(s.fontSize, MAX_FONT_SIZE)) ||
      (s.align !== undefined && !['start', 'middle', 'end'].includes(s.align)) ||
      (s.label !== undefined && (!hex(s.label.color) || !alpha(s.label.opacity) || !positive(s.label.fontSize, MAX_FONT_SIZE))) ||
      (s.shape !== undefined && (!s.shape.fills || !s.shape.borders || !s.shape.cornerRadii || !validShapeAppearance(s.shape as unknown as Record<string, unknown>))))
      throw new Error(t('Invalid style library.'));
    ids.add(entry.id);
  }
  return values;
}
const storage = localPersistence('drawcircuit.styles.v1', parseStyles, (styles: SavedStyle[]) => JSON.stringify(styles), () => [] as SavedStyle[]);
const initial = storage.load();
export const useStyleLibrary = create<{
  styles: SavedStyle[]; error: string;
  save: (name: string, object: CircuitObject, id?: string) => string;
  remove: (id: string) => void;
}>((set, get) => {
  const persist = (styles: SavedStyle[]) => {
    parseStyles(JSON.stringify(styles));
    let error = '';
    try { storage.save(styles); } catch { error = t('Style saving is unavailable. Keep this page open.'); }
    set({ styles, error });
  };
  return { styles: initial.value, error: initial.error,
    save(name, object, id = makeId()) {
      name = name.trim();
      if (!name || name.length > 80) throw new Error(t('Enter a name between 1 and 80 characters.'));
      const entry = { id, name, kind: styleKind(object), value: objectStyle(object) };
      const existing = get().styles.some((s) => s.id === id);
      persist(existing ? get().styles.map((s) => s.id === id ? entry : s) : [...get().styles, entry]);
      return id;
    },
    remove(id) { persist(get().styles.filter((s) => s.id !== id)); },
  };
});
