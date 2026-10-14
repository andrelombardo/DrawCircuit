import { useEffect, useSyncExternalStore } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';
import { saveDocumentNow, useEditorStore } from '../store/editorStore';
import { DesktopUpdateController } from './updateController';
import { UpdateDialog } from '../components/UpdateDialog';
import appIcon from '../../src-tauri/icons/icon.png';

const stopEditing = (event: KeyboardEvent) => {
  event.preventDefault();
  event.stopImmediatePropagation();
};

const controller = new DesktopUpdateController({
  check: () => check({ timeout: 15000 }),
  // The update dialog's explicit action is the installation confirmation.
  confirm: async () => true,
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
    downloading: 'Download dell’aggiornamento…',
    installing: 'Installazione aggiornamento…',
    restarting: 'Riavvio di DrawCircuit…',
    checking: 'Controllo aggiornamenti…',
    confirming: 'In attesa di conferma…',
  };
  const canApply = ['available', 'error', 'installed'].includes(state.phase);
  return (
    <UpdateDialog
      icon={appIcon}
      title={
        state.phase in labels
          ? labels[state.phase as keyof typeof labels]
          : state.phase === 'installed'
            ? 'Aggiornamento installato'
            : state.phase === 'error'
              ? 'Aggiornamento non riuscito'
              : state.version
                ? 'Aggiornamento disponibile'
                : 'Controllo aggiornamenti'
      }
      message={
        state.message ??
        (state.phase === 'checking'
          ? 'Cerco una nuova versione di DrawCircuit.'
          : 'Il lavoro sarà salvato e l’app si riavvierà.')
      }
      version={state.version}
      busy={busy || state.phase === 'confirming' || state.phase === 'checking'}
      dismissible={state.phase !== 'installed'}
      closeLabel={state.phase === 'idle' ? 'Chiudi' : 'Più tardi'}
      progress={state.phase === 'downloading' ? state.progress : undefined}
      actionLabel={
        state.phase === 'installed' ? 'Riavvia' : state.phase === 'error' ? 'Riprova' : 'Aggiorna'
      }
      onAction={canApply ? () => void controller.apply() : undefined}
      onClose={() => controller.dismiss()}
    />
  );
}
