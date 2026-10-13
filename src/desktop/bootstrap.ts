import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { message } from '@tauri-apps/plugin-dialog';
import { DesktopStorage } from './storage';

export async function bootstrapDesktop() {
  document.documentElement.dataset.desktop = /Mac/.test(navigator.platform) ? 'macos' : 'other';
  const loaded = await invoke<{ entries: Record<string, string>; recovered: boolean }>(
    'load_workspace',
  );
  const report = (error: unknown) => {
    window.dispatchEvent(new CustomEvent('drawcircuit:storage-error', { detail: String(error) }));
  };
  const storage = new DesktopStorage(
    loaded.entries,
    (entries) => invoke('save_workspace', { entries }),
    report,
    () => window.dispatchEvent(new CustomEvent('drawcircuit:storage-saved')),
  );
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { readText, writeText },
  });
  const { useEditorStore, saveDocumentNow } = await import('../store/editorStore');
  const windowHandle = getCurrentWindow();
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    try {
      (document.activeElement as HTMLElement | null)?.blur();
      useEditorStore.getState().cancelGesture();
      if (!saveDocumentNow()) throw new Error('Il circuito non è stato salvato.');
      await storage.flush();
      await invoke('finish_exit');
    } catch (error) {
      closing = false;
      report(error);
      await message(
        'Il salvataggio non è riuscito. DrawCircuit resta aperto: salva un archivio prima di riprovare.',
        { title: 'DrawCircuit', kind: 'error' },
      );
    }
  };
  await windowHandle.onCloseRequested((event) => {
    event.preventDefault();
    void close();
  });
  await listen('desktop-close', () => {
    void close();
  });
  await listen<string>('desktop-menu', ({ payload }) => {
    if (payload === 'quit') {
      void close();
      return;
    }
    if (['undo', 'redo', 'cut', 'copy', 'paste', 'select_all'].includes(payload)) {
      const editing = document.activeElement?.matches('input, textarea, [contenteditable="true"]');
      if (editing) document.execCommand(payload === 'select_all' ? 'selectAll' : payload);
      else {
        const keys: Record<string, string> = {
          undo: 'z',
          redo: 'z',
          copy: 'c',
          cut: 'x',
          paste: 'v',
          select_all: 'a',
        };
        (document.activeElement ?? window).dispatchEvent(
          new KeyboardEvent('keydown', {
            key: keys[payload],
            bubbles: true,
            cancelable: true,
            metaKey: /Mac/.test(navigator.platform),
            ctrlKey: !/Mac/.test(navigator.platform),
            shiftKey: payload === 'redo',
          }),
        );
      }
      return;
    }
    window.dispatchEvent(new CustomEvent('drawcircuit:desktop-menu', { detail: payload }));
  });
  window.addEventListener('drawcircuit:storage-error', () => {
    useEditorStore.setState({ storageError: true });
    useEditorStore
      .getState()
      .notify('Salvataggio su disco non riuscito. Salva un archivio del circuito.');
  });
  window.addEventListener('drawcircuit:storage-saved', () =>
    useEditorStore.setState({ storageError: false }),
  );
  if (loaded.recovered)
    useEditorStore
      .getState()
      .notify('Ripristinata la copia di sicurezza. Il salvataggio originale è stato conservato.');
  return async () => {
    await invoke('frontend_ready');
    await windowHandle.show();
  };
}
