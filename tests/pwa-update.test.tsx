// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PwaStatus } from '../src/pwa/PwaStatus';
import { useEditorStore } from '../src/store/editorStore';
import { emptyDocument } from '../src/model/demo';
import { createComponent } from '../src/model/catalog';
import { deserializeDocument } from '../src/model/serialization';
const mocks = vi.hoisted(() => ({
  update: vi.fn().mockResolvedValue(undefined),
  register: vi.fn(),
}));
vi.mock('virtual:pwa-register', () => ({ registerSW: mocks.register }));
let needRefresh: () => void;
beforeEach(() => {
  vi.stubEnv('PROD', true);
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {} });
  useEditorStore.setState({
    document: { ...emptyDocument(), objects: [createComponent('resistor', { x: 0, y: 0 }, 1)] },
    gestureStart: null,
    notice: '',
    past: [],
    future: [],
  });
  mocks.update.mockClear();
  mocks.register.mockImplementation((options: { onNeedRefresh: () => void }) => {
    needRefresh = options.onNeedRefresh;
    return mocks.update;
  });
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
async function offer() {
  render(<PwaStatus />);
  await waitFor(() => expect(mocks.register).toHaveBeenCalled());
  act(() => needRefresh());
}
it('registers the production worker and waits for explicit approval instead of reloading', async () => {
  await offer();
  expect(screen.getByText('Aggiornamento disponibile')).toBeTruthy();
  expect(screen.getByRole('dialog').parentElement).toBe(document.body);
  expect(mocks.update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Più tardi' }));
  expect(screen.queryByRole('button', { name: 'Aggiorna' })).toBeNull();
  expect(mocks.update).not.toHaveBeenCalled();
});
it('saves the exact document before activating the waiting worker', async () => {
  const saved = vi.fn();
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: saved });
  await offer();
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Aggiorna' })));
  expect(deserializeDocument(saved.mock.calls[0][1])).toEqual(useEditorStore.getState().document);
  expect(mocks.update).toHaveBeenCalledWith(true);
  expect(saved.mock.invocationCallOrder[0]).toBeLessThan(mocks.update.mock.invocationCallOrder[0]);
});
it('refuses updates during gestures or inline editing', async () => {
  await offer();
  act(() => useEditorStore.getState().beginGesture());
  fireEvent.click(screen.getByRole('button', { name: 'Aggiorna' }));
  expect(mocks.update).not.toHaveBeenCalled();
  act(() => useEditorStore.getState().cancelGesture());
  const editor = document.createElement('form');
  editor.className = 'inline-editor';
  document.body.append(editor);
  fireEvent.click(screen.getByRole('button', { name: 'Aggiorna' }));
  expect(mocks.update).not.toHaveBeenCalled();
  editor.remove();
});
it('keeps the app open and reports the persistence error when local saving fails', async () => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => {
      throw Error('quota');
    },
  });
  await offer();
  fireEvent.click(screen.getByRole('button', { name: 'Aggiorna' }));
  expect(mocks.update).not.toHaveBeenCalled();
  expect(useEditorStore.getState().notice).toContain('Esporta');
});
it('reports a rejected worker activation and keeps the saved circuit and retry button', async () => {
  const savedDocument = useEditorStore.getState().document;
  mocks.update.mockRejectedValueOnce(new Error('Worker unavailable'));
  await offer();
  fireEvent.click(screen.getByRole('button', { name: 'Aggiorna' }));
  await waitFor(() =>
    expect(useEditorStore.getState().notice).toContain('Aggiornamento non riuscito'),
  );
  expect(useEditorStore.getState().document).toEqual(savedDocument);
  expect(screen.getByRole('button', { name: 'Aggiorna' })).toBeTruthy();
  expect(screen.getByRole('dialog').textContent).toContain('Aggiornamento non riuscito');
  expect(localStorage.setItem).toHaveBeenCalled();
});
it('allows Escape to postpone an available update without reloading', async () => {
  await offer();
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(mocks.update).not.toHaveBeenCalled();
});
it('prevents closing or reapplying while the waiting worker is activating', async () => {
  let finish!: () => void;
  mocks.update.mockImplementationOnce(() => new Promise<void>((resolve) => (finish = resolve)));
  await offer();
  fireEvent.click(screen.getByRole('button', { name: 'Aggiorna' }));
  const dialog = screen.getByRole('dialog');
  expect(dialog.getAttribute('aria-busy')).toBe('true');
  expect(screen.queryByRole('button', { name: 'Più tardi' })).toBeNull();
  fireEvent(dialog, new Event('cancel', { cancelable: true }));
  expect(screen.getByRole('dialog')).toBe(dialog);
  fireEvent.click(screen.getByRole('button', { name: 'Aggiorna' }));
  expect(mocks.update).toHaveBeenCalledOnce();
  await act(async () => finish());
});
it('leaves installation to the browser without an unsolicited workspace notice', async () => {
  render(<PwaStatus />);
  await waitFor(() => expect(mocks.register).toHaveBeenCalled());
  const event = new Event('beforeinstallprompt', { cancelable: true });
  act(() => window.dispatchEvent(event));
  expect(event.defaultPrevented).toBe(false);
  expect(screen.queryByRole('status')).toBeNull();
});
it('does not announce successful offline setup', async () => {
  render(<PwaStatus />);
  await waitFor(() => expect(mocks.register).toHaveBeenCalled());
  expect(mocks.register.mock.calls[0][0].onOfflineReady).toBeUndefined();
  expect(useEditorStore.getState().notice).toBe('');
});
