import { useEffect, useRef, useState } from 'react';
import { saveDocumentNow, useEditorStore } from '../store/editorStore';
import { isDesktop } from '../desktop/environment';
export function PwaStatus() {
  const [refresh, setRefresh] = useState(false);
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
    if (useEditorStore.getState().gestureStart || document.querySelector('.inline-editor')) {
      useEditorStore.getState().notify('Concludi la modifica sul foglio prima di aggiornare.');
      return;
    }
    if (!saveDocumentNow()) {
      useEditorStore
        .getState()
        .notify('Salvataggio locale non disponibile. Esporta il circuito prima di aggiornare.');
      return;
    }
    try {
      await update.current?.(true);
    } catch {
      useEditorStore
        .getState()
        .notify('Aggiornamento non riuscito. Il circuito è salvato; riprova quando sei online.');
    }
  };
  if (!refresh) return null;
  return (
    <aside className="pwa-notice" role="status">
      <span>È disponibile una nuova versione.</span>
      <button onClick={() => void applyUpdate()}>Aggiorna</button>
      <button onClick={() => setRefresh(false)}>Più tardi</button>
    </aside>
  );
}
