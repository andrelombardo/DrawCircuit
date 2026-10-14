import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './updateDialog.css';

export function UpdateDialog({
  title,
  icon = `${import.meta.env.BASE_URL}icons/drawcircuit-blue-192.png`,
  message,
  version,
  actionLabel,
  onAction,
  onClose,
  busy = false,
  dismissible = true,
  closeLabel = 'Più tardi',
  progress,
}: {
  title: string;
  icon?: string;
  message: string;
  version?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  busy?: boolean;
  dismissible?: boolean;
  closeLabel?: string;
  progress?: number;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    element?.querySelector<HTMLButtonElement>('.update-dialog-primary:not(:disabled)')?.focus();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={dialog}
      className="update-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-message`}
      aria-modal="true"
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy && dismissible) onClose();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {!busy && dismissible && (
        <button className="update-dialog-close" aria-label="Chiudi aggiornamento" onClick={onClose}>
          <X size={14} />
        </button>
      )}
      <div className="update-dialog-heading">
        <img className="update-dialog-icon" src={icon} alt="" />
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          {version && <p className="update-dialog-version">Versione {version}</p>}
        </div>
      </div>
      <p id={`${id}-message`} className="update-dialog-message" role="status" aria-live="polite">
        {message}
      </p>
      {busy && (
        <progress
          className="update-dialog-progress"
          aria-label={title}
          max={100}
          value={progress}
        />
      )}
      <div className="update-dialog-actions">
        {!busy && dismissible && <button onClick={onClose}>{closeLabel}</button>}
        {onAction && (
          <button className="update-dialog-primary" disabled={busy} onClick={onAction} autoFocus>
            {actionLabel}
          </button>
        )}
      </div>
    </dialog>,
    document.body,
  );
}
