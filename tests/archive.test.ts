import { describe, expect, it } from 'vitest';
import { parseArchive, serializeArchive } from '../src/model/archive';
import { parallelSources } from './helpers/parallelSources';
import { serializeDocument } from '../src/model/serialization';
import type { PersonalBlock } from '../src/personalBlocks/library';

describe('portable circuit archive', () => {
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
});
