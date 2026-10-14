// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DesktopUpdater } from '../src/desktop/DesktopUpdater';
import { emptyDocument } from '../src/model/demo';
import { useEditorStore } from '../src/store/editorStore';

const native = vi.hoisted(() => ({ check: vi.fn(), invoke: vi.fn(), confirm: vi.fn() }));
vi.mock('@tauri-apps/plugin-updater', () => ({ check: native.check }));
vi.mock('@tauri-apps/api/core', () => ({ invoke: native.invoke }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ confirm: native.confirm }));
afterEach(() => cleanup());

it('offers a central update dialog, saves before downloading and confirms with one explicit click', async () => {
  useEditorStore.setState({ document: emptyDocument(), gestureStart: null });
  const flush = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), flush });
  native.invoke.mockResolvedValue(undefined);
  let offer!: (update: unknown) => void;
  let finishDownload!: () => void;
  const update = {
    version: '1.0.2',
    download: vi.fn((progress) => {
      progress({ event: 'Started', data: { contentLength: 100 } });
      progress({ event: 'Progress', data: { chunkLength: 50 } });
      return new Promise<void>((resolve) => (finishDownload = resolve));
    }),
    install: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
  native.check.mockImplementationOnce(() => new Promise((resolve) => (offer = resolve)));
  render(<DesktopUpdater />);
  expect(screen.queryByRole('dialog')).toBeNull();
  await act(async () => offer(update));
  expect(screen.getByRole('dialog').textContent).toContain('Versione 1.0.2');
  expect(document.querySelector('.pwa-notice')).toBeNull();
  expect(update.download).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Più tardi' }));
  expect(screen.queryByRole('dialog')).toBeNull();

  native.check.mockResolvedValueOnce(update);
  act(() => window.dispatchEvent(new Event('drawcircuit:check-updates')));
  await screen.findByRole('button', { name: 'Aggiorna' });
  fireEvent.click(screen.getByRole('button', { name: 'Aggiorna' }));
  await waitFor(() => expect(update.download).toHaveBeenCalledOnce());
  expect(native.confirm).not.toHaveBeenCalled();
  expect(flush).toHaveBeenCalledOnce();
  expect(flush.mock.invocationCallOrder[0]).toBeLessThan(
    update.download.mock.invocationCallOrder[0],
  );
  expect(screen.getByRole('progressbar').getAttribute('value')).toBe('50');
  expect(screen.queryByRole('button', { name: 'Più tardi' })).toBeNull();
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  expect(screen.getByRole('dialog')).toBeTruthy();

  await act(async () => finishDownload());
  expect(update.install).toHaveBeenCalledOnce();
  expect(native.invoke).toHaveBeenCalledWith('restart_after_update');
  expect(screen.getByRole('button', { name: 'Riavvia' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Riavvia' }));
  await waitFor(() => expect(native.invoke).toHaveBeenCalledTimes(2));
  expect(update.install).toHaveBeenCalledOnce();
});
