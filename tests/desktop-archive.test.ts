import { describe, expect, it } from 'vitest';
import { parseArchive, serializeArchive, mergeArchiveBlocks } from '../src/desktop/archive';
import { parallelSources } from './helpers/parallelSources';
import { serializeDocument } from '../src/model/serialization';
import type { PersonalBlock } from '../src/personalBlocks/library';

describe('portable desktop archive', () => {
  it('round trips the full circuit, connected branches and personal block library', () => {
    const document = parallelSources();
    const blocks: PersonalBlock[] = [{ id: 'personal', name: 'Rete personale', document }];
    expect(parseArchive(serializeArchive(document, blocks))).toEqual({ document, blocks });
    expect(parseArchive(serializeDocument(document))).toEqual({ document, blocks: [] });
  });
  it('rejects an invalid library or future archive before any data is imported', () => {
    const archive = JSON.parse(serializeArchive(parallelSources(), []));
    expect(() => parseArchive(JSON.stringify({ ...archive, version: 2 }))).toThrow();
    expect(() =>
      parseArchive(
        JSON.stringify({ ...archive, library: { version: 1, blocks: [{ id: 'bad' }] } }),
      ),
    ).toThrow();
    expect(() => parseArchive('not JSON')).toThrow();
  });
  it('deduplicates repeated imports and preserves existing blocks when ids collide', () => {
    const existing: PersonalBlock = { id: 'same', name: 'Originale', document: parallelSources() };
    const changed = { ...existing, name: 'Importato' };
    const current = [existing];
    const merged = mergeArchiveBlocks(current, [existing, changed]);
    expect(current).toEqual([existing]);
    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual(existing);
    expect(merged[1].name).toBe('Importato');
    expect(merged[1].id).not.toBe(existing.id);
  });
});
