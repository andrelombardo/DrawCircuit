import { useEffect, useRef, useState } from 'react';
import { saveDocumentNow, useEditorStore } from '../store/editorStore';
import { isDesktop } from '../desktop/environment';
import { UpdateDialog } from '../components/UpdateDialog';
export function PwaStatus() {
  const [refresh, setRefresh] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('Il circuito sarà salvato prima di ricaricare.');
  const update = useRef<((reload?: boolean) => Promise<void>) | null>(null);
  useEffect(() => {
    if (
      import.meta.env.MODE === 'desktop' ||
      isDesktop() ||
      !import.meta.env.PROD ||
      !('serviceWorker' in navigator)
    )
      return;
    let disposed = false,
      registration: ServiceWorkerRegistration | undefined;
    const check = () => {
      if (navigator.onLine) void registration?.update().catch(() => {});
    };
    window.addEventListener('focus', check);
    const timer = window.setInterval(check, 60 * 60 * 1000);
    void import('virtual:pwa-register')
      .then(({ registerSW }) => {
        if (disposed) return;
        update.current = registerSW({
          onNeedRefresh: () => {
            if (!disposed) setRefresh(true);
          },
          onRegisteredSW: (_url, reg) => {
            registration = reg;
          },
          onRegisterError: () => {
            if (!disposed)
              useEditorStore
                .getState()
                .notify('Modalità offline non disponibile in questo browser.');
          },
        });
      })
      .catch(() => {
        if (!disposed)
          useEditorStore.getState().notify('Modalità offline non disponibile in questo browser.');
      });
    return () => {
      disposed = true;
      window.removeEventListener('focus', check);
      window.clearInterval(timer);
    };
  }, []);
  const applyUpdate = async () => {
    if (applying) return;
    const report = (message: string) => {
      setMessage(message);
      useEditorStore.getState().notify(message);
    };
    if (useEditorStore.getState().gestureStart || document.querySelector('.inline-editor')) {
      report('Concludi la modifica sul foglio prima di aggiornare.');
      return;
    }
    if (!saveDocumentNow()) {
      report('Salvataggio locale non disponibile. Esporta il circuito prima di aggiornare.');
      return;
    }
    try {
      setApplying(true);
      await update.current?.(true);
    } catch {
      report('Aggiornamento non riuscito. Il circuito è salvato; riprova quando sei online.');
    } finally {
      setApplying(false);
    }
  };
  if (!refresh) return null;
  return (
    <UpdateDialog
      title={applying ? 'Aggiornamento in corso…' : 'Aggiornamento disponibile'}
      message={message}
      actionLabel="Aggiorna"
      onAction={() => void applyUpdate()}
      onClose={() => setRefresh(false)}
      busy={applying}
    />
  );
}
