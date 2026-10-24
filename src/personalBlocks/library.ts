import { normalizeAngle } from '../annotations/angle';
import { mapHighlight } from '../annotations/highlight';
import { t } from '../i18n';
import { create } from 'zustand';
import { makeId, componentRegistry } from '../model/catalog';
import { deserializeDocument } from '../model/serialization';
import type { CircuitDocument, Endpoint, Point, Rotation } from '../model/types';
import { cloneObjects } from '../utils/operations';
import { selectionDocument } from '../tikz/selection';
import { rotatePoint, snapPoint } from '../utils/geometry';
import { rotateArrow } from '../utils/arrows';
import { localPersistence } from '../utils/localPersistence';
export const PERSONAL_BLOCKS_KEY = 'drawcircuit.personal-blocks.v1';
export interface PersonalBlock {
  id: string;
  name: string;
  document: CircuitDocument;
}
const validName = (s: string) => {
  const name = s.trim();
  if (!name || name.length > 80) throw new Error(t('Enter a name between 1 and 80 characters.'));
  return name;
};
export function createPersonalBlock(
  doc: CircuitDocument,
  selection: string[],
  name: string,
): PersonalBlock {
  const subset = selectionDocument(doc, selection);
  if (!subset.objects.length) throw new Error(t('Select at least one circuit element.'));
  return {
    id: makeId(),
    name: validName(name),
    document: deserializeDocument(JSON.stringify(subset)),
  };
}
export function parsePersonalBlocks(raw: string): PersonalBlock[] {
  if (raw.length > 10_000_000) throw new Error(t('The file exceeds the 10 MB limit.'));
  let root;
  try {
    root = JSON.parse(raw);
  } catch {
    throw new Error(t('Invalid block library: the JSON file cannot be read.'));
  }
  if (!root || root.version !== 1 || !Array.isArray(root.blocks) || root.blocks.length > 100)
    throw new Error(t('Invalid block library.'));
  const ids = new Set<string>();
  return root.blocks.map((b: PersonalBlock) => {
    if (!b || typeof b.id !== 'string' || !b.id || ids.has(b.id) || typeof b.name !== 'string')
      throw new Error(t('Invalid block.'));
    ids.add(b.id);
    const document = deserializeDocument(JSON.stringify(b.document));
    if (!document.objects.length) throw new Error(t('A block cannot be empty.'));
    return { id: b.id, name: validName(b.name), document };
  });
}
export const serializePersonalBlocks = (blocks: PersonalBlock[]) =>
  JSON.stringify({ version: 1, blocks }, null, 2);
const blockPersistence = localPersistence(
  PERSONAL_BLOCKS_KEY,
  parsePersonalBlocks,
  serializePersonalBlocks,
  () => [] as PersonalBlock[],
);
const initialLibrary = blockPersistence.load();
export function instantiatePersonalBlock(
  block: PersonalBlock,
  point: Point,
  rotation: Rotation,
  existing: CircuitDocument,
) {
  // Frames use canvas-aligned constraints. Preserve their hierarchy and layout
  // when inserting a block rather than rotating its children out of the frame.
  if (block.document.objects.some((o) => o.kind === 'rectangle' && o.frame)) rotation = 0;
  const rp = (p: Point) => rotatePoint(p, rotation);
  const next = (r: Rotation) => ((r + rotation) % 360) as Rotation;
  const ep = (e: Endpoint): Endpoint => (e.kind === 'free' ? { ...e, point: rp(e.point) } : e);
  const doc = {
    ...block.document,
    objects: block.document.objects.map((o) => {
      if (o.kind === 'component')
        return {
          ...o,
          ...rp(o),
          rotation: next(o.rotation),
          label: { ...o.label, offset: rp(o.label.offset) },
        };
      if (o.kind === 'junction')
        return {
          ...o,
          ...rp(o),
          label: { ...o.label, offset: rp(o.label.offset) },
        };
      if (o.kind === 'angle') return { ...o, ...rp(o), startAngle: normalizeAngle(o.startAngle-rotation),
        label: { ...o.label, offset: rp(o.label.offset) } };
      if (o.kind === 'text') return { ...o, ...rp(o), rotation: next(o.rotation) };
      if (o.kind === 'rectangle' || o.kind === 'circle') {
        const center = rp({ x: o.x + o.width / 2, y: o.y + o.height / 2 });
        const width = o.width, height = o.height;
        return {
          ...o,
          x: center.x - width / 2,
          y: center.y - height / 2,
          width,
          height,
          ...(o.kind === 'rectangle' && !o.frame ? { rotation: ((o.rotation ?? 0) + rotation) % 360 } : {}),
        };
      }
      if (o.kind === 'highlight') return mapHighlight(o, rp);
      if (o.kind === 'line') return { ...o, start: rp(o.start), end: rp(o.end),
        ...(o.controlPoints ? { controlPoints: [rp(o.controlPoints[0]), rp(o.controlPoints[1])] as [Point, Point] } : {}),
        vertices: o.vertices?.map(rp), startEndpoint: o.startEndpoint && ep(o.startEndpoint),
        endEndpoint: o.endEndpoint && ep(o.endEndpoint) };
      if (o.kind === 'wire')
        return {
          ...o,
          startEndpoint: ep(o.startEndpoint),
          endEndpoint: ep(o.endEndpoint),
          vertices: o.vertices.map(rp),
        };
      if (o.kind === 'brace')
        return {
          ...o,
          start: rp(o.start),
          end: rp(o.end),
          label: { ...o.label, offset: rp(o.label.offset) },
        };
      if (o.kind === 'arrow') return rotateArrow(o, rotation, { x: 0, y: 0 });
      if (o.kind === 'electrical')
        return {
          ...o,
          start: rp(o.start),
          end: rp(o.end),
          offset: rp(o.offset),
          label: { ...o.label, offset: rp(o.label.offset) },
        };
      return rotateArrow(o, rotation, { x: 0, y: 0 });
    }),
  };
  const objects = cloneObjects(doc, snapPoint(point), existing);
  // Only standard component labels are allocated. Semantic labels stay exactly as authored.
  const used = new Set(
    existing.objects.flatMap((o) => (o.kind === 'component' ? [o.label.text] : [])),
  );
  // Reserve retained labels across the whole block before allocating any automatic label.
  for (const o of doc.objects)
    if (
      o.kind === 'component' &&
      !new RegExp(`^${componentRegistry[o.type].prefix}_\\d+$`).test(o.label.text)
    )
      used.add(o.label.text);
  objects.forEach((o, i) => {
    const old = doc.objects[i];
    if (o.kind === 'component' && old.kind === 'component') {
      const prefix = componentRegistry[o.type].prefix;
      if (!new RegExp(`^${prefix}_\\d+$`).test(old.label.text)) o.label.text = old.label.text;
      else {
        let n = 1;
        while (used.has(`${prefix}_${n}`)) n++;
        o.label.text = `${prefix}_${n}`;
        used.add(o.label.text);
      }
    }
  });
  return objects;
}
interface LibraryState {
  blocks: PersonalBlock[];
  error: string;
  lastRemoved: { block: PersonalBlock; index: number } | null;
  add: (block: PersonalBlock) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  restoreRemoved: () => void;
  import: (raw: string) => void;
}
function persist(blocks: PersonalBlock[]) {
  if (blocks.length > 100) throw new Error(t('The library can contain at most 100 blocks.'));
  const raw = serializePersonalBlocks(blocks);
  if (raw.length > 10_000_000) throw new Error(t('Library too large.'));
  try {
    blockPersistence.save(blocks);
    return '';
  } catch {
    return t('Block saving is unavailable. Keep this page open.');
  }
}
export const usePersonalBlocks = create<LibraryState>((set, get) => ({
  blocks: initialLibrary.value,
  error: initialLibrary.error,
  lastRemoved: null,
  add: (block) => {
    const blocks = [...get().blocks, block];
    const error = persist(blocks);
    set({ blocks, error });
  },
  rename: (id, name) => {
    const blocks = get().blocks.map((b) => (b.id === id ? { ...b, name: validName(name) } : b));
    const error = persist(blocks);
    set({ blocks, error });
  },
  remove: (id) => {
    const previous = get().blocks;
    const index = previous.findIndex((b) => b.id === id);
    if (index < 0) return;
    const blocks = previous.filter((b) => b.id !== id);
    const error = persist(blocks);
    set({ blocks, error, lastRemoved: { block: previous[index], index } });
  },
  restoreRemoved: () => {
    const { blocks: previous, lastRemoved } = get();
    if (!lastRemoved) return;
    const blocks = [...previous];
    blocks.splice(lastRemoved.index, 0, lastRemoved.block);
    const error = persist(blocks);
    set({ blocks, error, lastRemoved: null });
  },
  import: (raw) => {
    const incoming = parsePersonalBlocks(raw).map((b) => ({
      ...b,
      id: makeId(),
    }));
    const blocks = [...get().blocks, ...incoming];
    const error = persist(blocks);
    set({ blocks, error });
  },
}));
