import { shortcut } from '../src/utils/platform';
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ExportDialog } from '../src/components/toolbar/ExportDialog';
import { demoDocument } from '../src/model/demo';
import { useEditorStore } from '../src/store/editorStore';
import { exportObsidian, exportStandalone, exportTikz } from '../src/tikz/exporter';

let writeText: ReturnType<typeof vi.fn>;
beforeEach(() => {
  useEditorStore.setState({ document: demoDocument(), past: [], future: [], selection: [] });
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const preview = () =>
  screen.getByRole('textbox', { name: 'Codice TikZ generato' }) as HTMLTextAreaElement;

describe('Obsidian copy in the existing export dialog', () => {
  it('previews Obsidian without altering the default raw or standalone previews', () => {
    render(<ExportDialog onClose={() => {}} />);
    const doc = useEditorStore.getState().document;
    expect(preview().value).toBe(exportTikz(doc));
    fireEvent.click(screen.getByRole('button', { name: 'Obsidian' }));
    expect(preview().value).toBe(exportObsidian(doc));
    fireEvent.click(screen.getByRole('button', { name: 'File .tex' }));
    expect(preview().value).toBe(exportStandalone(doc));
    fireEvent.click(screen.getByRole('button', { name: 'Codice TikZ' }));
    expect(preview().value).toBe(exportTikz(doc));
  });
  it('copies the entire Obsidian Markdown block and shows consistent success feedback', async () => {
    const before = useEditorStore.getState();
    render(<ExportDialog onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copia per Obsidian' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Copiato per Obsidian' })).toBeTruthy(),
    );
    expect(writeText).toHaveBeenCalledExactlyOnceWith(exportObsidian(before.document));
    expect(preview().value).toBe(exportObsidian(before.document));
    expect(screen.queryByText(/premi ⌘\/Ctrl C/)).toBeNull();
    expect(useEditorStore.getState().document).toBe(before.document);
    expect(useEditorStore.getState().past).toBe(before.past);
    expect(useEditorStore.getState().future).toBe(before.future);
    expect(useEditorStore.getState().selection).toBe(before.selection);
  });
  it('still copies only raw TikZ after previewing or copying Obsidian', async () => {
    render(<ExportDialog onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copia per Obsidian' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Copiato per Obsidian' })).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copia TikZ' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copiato' })).toBeTruthy());
    expect(writeText).toHaveBeenLastCalledWith(exportTikz(useEditorStore.getState().document));
    expect(preview().value).not.toContain('```');
    expect(screen.getByRole('button', { name: 'Copia per Obsidian' })).toBeTruthy();
  });
  it.each(['snippet', 'obsidian'] as const)(
    'selects the correct %s code for manual copy when clipboard permission fails',
    async (format) => {
      writeText.mockRejectedValue(new Error('Clipboard unavailable'));
      render(<ExportDialog onClose={() => {}} />);
      fireEvent.click(screen.getByRole('button', { name: 'File .tex' }));
      fireEvent.click(
        screen.getByRole('button', {
          name: format === 'obsidian' ? 'Copia per Obsidian' : 'Copia TikZ',
        }),
      );
      await waitFor(() =>
        expect(
          screen.getByText(`Codice selezionato: premi ${shortcut('C')} per copiarlo.`),
        ).toBeTruthy(),
      );
      const expected = (format === 'obsidian' ? exportObsidian : exportTikz)(
        useEditorStore.getState().document,
      );
      expect(preview().value).toBe(expected);
      expect(preview().selectionStart).toBe(0);
      expect(preview().selectionEnd).toBe(expected.length);
      expect(screen.queryByRole('button', { name: /^Copiato/ })).toBeNull();
    },
  );
  it('clears stale copy errors when changing preview or retrying successfully', async () => {
    writeText.mockRejectedValueOnce(new Error('Denied'));
    render(<ExportDialog onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copia per Obsidian' }));
    await waitFor(() => expect(screen.getByText(/Codice selezionato/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Codice TikZ' }));
    expect(screen.queryByText(/Codice selezionato/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Copia per Obsidian' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Copiato per Obsidian' })).toBeTruthy(),
    );
    expect(screen.queryByText(/Codice selezionato/)).toBeNull();
  });
  it('preserves the standalone download when the Obsidian preview is selected', () => {
    const createUrl = vi.fn<(blob: Blob) => string>(() => 'blob:test');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<ExportDialog onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Obsidian' }));
    fireEvent.click(screen.getByRole('button', { name: 'Scarica .tex' }));
    expect(createUrl).toHaveBeenCalledOnce();
    expect(createUrl.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(anchorClick).toHaveBeenCalledOnce();
    expect((anchorClick.mock.instances[0] as HTMLAnchorElement).download).toMatch(/\.tex$/);
  });
});
