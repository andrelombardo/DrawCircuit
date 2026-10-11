import { afterEach, describe, expect, it, vi } from 'vitest';
import { createComponent } from '../src/model/catalog';
import { emptyDocument } from '../src/model/demo';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
const key = 'drawcircuit.personal-blocks.v1';
const corrupt = '{"version":1,"blocks":[{"id":"valuable-unreadable-original"}]}';

async function loadLibrary(raw: string | null, blockRecovery = false) {
  const values = new Map<string, string>(raw === null ? [] : [[key, raw]]);
  const setItem = vi.fn((name: string, value: string) => {
    if (blockRecovery && name.startsWith(`${key}.recovery.`)) throw new Error('Quota exceeded');
    values.set(name, value);
  });
  vi.stubGlobal('localStorage', { getItem: (name: string) => values.get(name) ?? null, setItem });
  vi.resetModules();
  const library = await import('../src/personalBlocks/library');
  const doc = { ...emptyDocument(), objects: [createComponent('resistor', { x: 0, y: 0 })] };
  const block = library.createPersonalBlock(doc, [doc.objects[0].id], 'Nuovo blocco audit');
  return { library, values, setItem, block };
}

describe('release candidate: personal blocks never silently overwrite unreadable user data', () => {
  it('shows a load error and leaves the unreadable original untouched before editing', async () => {
    const { library, values, setItem } = await loadLibrary(corrupt);
    expect(library.usePersonalBlocks.getState().blocks).toEqual([]);
    expect(library.usePersonalBlocks.getState().error).toContain('non leggibile');
    expect(values.get(key)).toBe(corrupt);
    expect(setItem).not.toHaveBeenCalled();
  });
  it('backs up the exact original before successfully saving a new block', async () => {
    const { library, values, setItem, block } = await loadLibrary(corrupt);
    library.usePersonalBlocks.getState().add(block);
    const backups = Array.from(values).filter(([name]) => name.startsWith(`${key}.recovery.`));
    expect(backups).toHaveLength(1);
    expect(backups[0][1]).toBe(corrupt);
    expect(setItem.mock.calls[0][0]).toBe(backups[0][0]);
    expect(library.parsePersonalBlocks(values.get(key)!)).toEqual([block]);
    expect(library.usePersonalBlocks.getState().error).toBe('');
  });
  it('retains original raw data if the recovery backup cannot be saved', async () => {
    const { library, values, setItem, block } = await loadLibrary(corrupt, true);
    library.usePersonalBlocks.getState().add(block);
    expect(values.get(key)).toBe(corrupt);
    expect(setItem).not.toHaveBeenCalledWith(key, expect.any(String));
    expect(library.usePersonalBlocks.getState().blocks).toEqual([block]);
    expect(library.usePersonalBlocks.getState().error).toContain('esporta la libreria JSON');
  });
  it('rejects malformed imports atomically without altering an existing library', async () => {
    const { library, values, block } = await loadLibrary(null);
    library.usePersonalBlocks.getState().add(block);
    const saved = values.get(key);
    expect(() =>
      library.usePersonalBlocks.getState().import('{"version":1,"blocks":[{}]}'),
    ).toThrow();
    expect(library.usePersonalBlocks.getState().blocks).toEqual([block]);
    expect(values.get(key)).toBe(saved);
    expect(() => library.usePersonalBlocks.getState().import('{not valid JSON')).toThrow(
      'Libreria blocchi non valida: il file JSON non è leggibile.',
    );
    expect(library.usePersonalBlocks.getState().blocks).toEqual([block]);
    expect(values.get(key)).toBe(saved);
  });
  it('loads a valid existing library without warning or rewrite', async () => {
    const original = await loadLibrary(null);
    const serialized = original.library.serializePersonalBlocks([original.block]);
    const { library, setItem } = await loadLibrary(serialized);
    expect(library.usePersonalBlocks.getState().blocks).toEqual([original.block]);
    expect(library.usePersonalBlocks.getState().error).toBe('');
    expect(setItem).not.toHaveBeenCalled();
  });
});
