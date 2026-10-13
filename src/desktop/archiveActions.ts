import { useEditorStore, saveDocumentNow, STORAGE_KEY } from '../store/editorStore';
import {
  usePersonalBlocks,
  PERSONAL_BLOCKS_KEY,
  serializePersonalBlocks,
} from '../personalBlocks/library';
import { serializeDocument } from '../model/serialization';
import { download, fileName } from '../utils/files';
import { parseArchive, serializeArchive, mergeArchiveBlocks } from './archive';
import { readNativeArchive } from './files';

export function saveArchive() {
  (document.activeElement as HTMLElement | null)?.blur();
  const state = useEditorStore.getState();
  return download(
    serializeArchive(state.gestureStart ?? state.document, usePersonalBlocks.getState().blocks),
    `${fileName(state.document.title)}-drawcircuit.json`,
    'application/json',
  );
}
export async function openArchive() {
  const raw = await readNativeArchive();
  if (raw === null) return;
  const incoming = parseArchive(raw);
  const previousBlocks = usePersonalBlocks.getState().blocks;
  const blocks = mergeArchiveBlocks(previousBlocks, incoming.blocks);
  // Validation and merging finish before any editor or persistence mutation.
  (document.activeElement as HTMLElement | null)?.blur();
  const state = useEditorStore.getState();
  state.cancelGesture();
  const previousDocument = useEditorStore.getState().document;
  if (!saveDocumentNow())
    throw new Error('Salva un archivio del circuito corrente prima di aprirne un altro.');
  const storage = localStorage as Storage & { flush?: () => Promise<void> };
  await storage.flush?.();
  try {
    storage.setItem(PERSONAL_BLOCKS_KEY, serializePersonalBlocks(blocks));
    storage.setItem(STORAGE_KEY, serializeDocument(incoming.document));
    await storage.flush?.();
  } catch (error) {
    storage.setItem(PERSONAL_BLOCKS_KEY, serializePersonalBlocks(previousBlocks));
    storage.setItem(STORAGE_KEY, serializeDocument(previousDocument));
    throw error;
  }
  usePersonalBlocks.setState({ blocks, error: '' });
  state.replace(incoming.document);
  state.notify('Archivio aperto. I blocchi personali esistenti sono stati conservati.');
}
