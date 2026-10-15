import type { CircuitDocument } from './types';
import { deserializeDocument } from './serialization';
import { parsePersonalBlocks } from '../personalBlocks/library';
import type { PersonalBlock } from '../personalBlocks/library';

export function serializeArchive(document: CircuitDocument, blocks: PersonalBlock[]) {
  return JSON.stringify(
    { type: 'drawcircuit-archive', version: 1, document, library: { version: 1, blocks } },
    null,
    2,
  );
}
export function parseArchive(raw: string): { document: CircuitDocument; blocks: PersonalBlock[] } {
  if (raw.length > 25_000_000) throw new Error('L’archivio supera il limite di 25 MB.');
  const root = JSON.parse(raw);
  if (root?.type !== 'drawcircuit-archive')
    return { document: deserializeDocument(raw), blocks: [] };
  if (root.version !== 1) throw new Error('Versione archivio non supportata.');
  return {
    document: deserializeDocument(JSON.stringify(root.document)),
    blocks: parsePersonalBlocks(JSON.stringify(root.library)),
  };
}
