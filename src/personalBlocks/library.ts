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
  if (!name || name.length > 80) throw new Error('Inserisci un nome da 1 a 80 caratteri.');
  return name;
};
export function createPersonalBlock(
  doc: CircuitDocument,
  selection: string[],
  name: string,
): PersonalBlock {
  const subset = selectionDocument(doc, selection);
  if (!subset.objects.length) throw new Error('Seleziona almeno un elemento del circuito.');
  return {
    id: makeId(),
    name: validName(name),
    document: deserializeDocument(JSON.stringify(subset)),
  };
}
export function parsePersonalBlocks(raw: string): PersonalBlock[] {
  if (raw.length > 10_000_000) throw new Error('Il file supera il limite di 10 MB.');
  let root;
  try {
    root = JSON.parse(raw);
  } catch {
    throw new Error('Libreria blocchi non valida: il file JSON non è leggibile.');
  }
  if (!root || root.version !== 1 || !Array.isArray(root.blocks) || root.blocks.length > 100)
    throw new Error('Libreria blocchi non valida.');
  const ids = new Set<string>();
  return root.blocks.map((b: PersonalBlock) => {
    if (!b || typeof b.id !== 'string' || !b.id || ids.has(b.id) || typeof b.name !== 'string')
      throw new Error('Blocco non valido.');
    ids.add(b.id);
    const document = deserializeDocument(JSON.stringify(b.document));
    if (!document.objects.length) throw new Error('Un blocco non può essere vuoto.');
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
  const rp = (p: Point) => rotatePoint(p, rotation);
  const next = (r: Rotation) => ((r + rotation) % 360) as Rotation;
  const ep = (e: Endpoint): Endpoint =>
    e.kind === 'free' ? { kind: 'free', point: rp(e.point) } : e;
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
        return { ...o, ...rp(o), label: { ...o.label, offset: rp(o.label.offset) } };
      if (o.kind === 'text') return { ...o, ...rp(o), rotation: next(o.rotation) };
      if (o.kind === 'rectangle') {
        const center = rp({ x: o.x + o.width / 2, y: o.y + o.height / 2 });
        const width = rotation % 180 === 90 ? o.height : o.width,
          height = rotation % 180 === 90 ? o.width : o.height;
        return { ...o, x: center.x - width / 2, y: center.y - height / 2, width, height };
      }
      if (o.kind === 'line') return { ...o, start: rp(o.start), end: rp(o.end) };
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
  add: (block: PersonalBlock) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  import: (raw: string) => void;
}
function persist(blocks: PersonalBlock[]) {
  if (blocks.length > 100) throw new Error('La libreria può contenere al massimo 100 blocchi.');
  const raw = serializePersonalBlocks(blocks);
  if (raw.length > 10_000_000) throw new Error('Libreria troppo grande.');
  try {
    blockPersistence.save(blocks);
    return '';
  } catch {
    return 'Salvataggio dei blocchi non disponibile: esporta la libreria JSON.';
  }
}
export const usePersonalBlocks = create<LibraryState>((set, get) => ({
  blocks: initialLibrary.value,
  error: initialLibrary.error,
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
    const blocks = get().blocks.filter((b) => b.id !== id);
    const error = persist(blocks);
    set({ blocks, error });
  },
  import: (raw) => {
    const incoming = parsePersonalBlocks(raw).map((b) => ({ ...b, id: makeId() }));
    const blocks = [...get().blocks, ...incoming];
    const error = persist(blocks);
    set({ blocks, error });
  },
}));
