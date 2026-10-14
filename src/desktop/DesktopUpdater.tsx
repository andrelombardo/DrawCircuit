import { useEffect, useSyncExternalStore } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { confirm } from '@tauri-apps/plugin-dialog';
import { check } from '@tauri-apps/plugin-updater';
import { saveDocumentNow, useEditorStore } from '../store/editorStore';
import { DesktopUpdateController } from './updateController';
import './updater.css';

const stopEditing = (event: KeyboardEvent) => {
  event.preventDefault();
  event.stopImmediatePropagation();
};

const controller = new DesktopUpdateController({
  check: () => check({ timeout: 15000 }),
  confirm: (version) =>
    confirm(
      `Installare DrawCircuit ${version}? Il circuito, i blocchi personali e le preferenze saranno salvati. L’app si riavvierà al termine.`,
      {
        title: 'Aggiornamento DrawCircuit',
        kind: 'info',
        okLabel: 'Salva e aggiorna',
        cancelLabel: 'Più tardi',
      },
    ),
  assertReady: () => {
    if (useEditorStore.getState().gestureStart || document.querySelector('.inline-editor'))
      throw new Error('Concludi la modifica sul foglio prima di aggiornare');
  },
  save: async () => {
    (document.activeElement as HTMLElement | null)?.blur();
    if (!saveDocumentNow()) throw new Error('Il circuito non è stato salvato');
    const storage = localStorage as Storage & { flush?: () => Promise<void> };
    if (!storage.flush) throw new Error('Salvataggio su disco non disponibile');
    await storage.flush();
  },
  restart: () => invoke('restart_after_update'),
  lock: (locked) => {
    const root = document.getElementById('root');
    if (root) root.inert = locked;
    if (locked) window.addEventListener('keydown', stopEditing, true);
    else window.removeEventListener('keydown', stopEditing, true);
  },
});

export function DesktopUpdater() {
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot);
  useEffect(() => {
    const manual = () => {
      void controller.check(true);
    };
    const automatic = () => {
      if (navigator.onLine) void controller.check();
    };
    void controller.check();
    const timer = window.setInterval(automatic, 60 * 60 * 1000);
    window.addEventListener('drawcircuit:check-updates', manual);
    window.addEventListener('online', automatic);
    return () => {
      clearInterval(timer);
      window.removeEventListener('drawcircuit:check-updates', manual);
      window.removeEventListener('online', automatic);
    };
  }, []);
  const busy = ['saving', 'downloading', 'installing', 'restarting'].includes(state.phase);
  const visible = state.phase !== 'idle' || state.message;
  if (!visible) return null;
  const labels = {
    saving: 'Salvataggio del lavoro…',
    downloading: `Download aggiornamento${state.progress === undefined ? '' : `: ${state.progress}%`}…`,
    installing: 'Installazione aggiornamento…',
    restarting: 'Riavvio di DrawCircuit…',
    checking: 'Controllo aggiornamenti…',
    confirming: 'In attesa di conferma…',
  };
  return (
    <div className={busy ? 'desktop-update-overlay' : undefined}>
      <aside className="pwa-notice desktop-update-notice" role="status" aria-live="polite">
        <span>
          {state.message ??
            (state.phase in labels
              ? labels[state.phase as keyof typeof labels]
              : `È disponibile DrawCircuit ${state.version}.`)}
        </span>
        {['available', 'error', 'installed'].includes(state.phase) && (
          <button onClick={() => void controller.apply()}>
            {state.phase === 'installed'
              ? 'Riavvia'
              : state.phase === 'error'
                ? 'Riprova'
                : 'Aggiorna'}
          </button>
        )}
        {!busy &&
          state.phase !== 'confirming' &&
          state.phase !== 'checking' &&
          state.phase !== 'installed' && (
            <button onClick={() => controller.dismiss()}>Più tardi</button>
          )}
      </aside>
    </div>
  );
}
