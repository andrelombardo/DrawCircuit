import { t } from '../../i18n';
import { createPortal } from 'react-dom';
import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useDialogFocus } from './useDialogFocus';
export function BlockNameDialog({
  initial = '',
  onSave,
  onClose,
}: {
  initial?: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial),
    [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, onClose);
  return createPortal(
    <div className="modal-backdrop">
      <div
        ref={ref}
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={initial ? t('Rename block') : t('Save as block')}
      >
        <button
          className="modal-close"
          aria-label={t('Close block dialog')}
          title={t('Close block dialog')}
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2>{initial ? t('Rename block') : t('Save as block')}</h2>
        <p>{t('The block stays in your personal library in this browser.')}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              onSave(name);
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : t('Unable to save the block.'));
            }
          }}
        >
          <label className="block-name">
            {t('Name')}{' '}
            <input
              autoFocus
              aria-label={t('Block name')}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              {t('Cancel')}{' '}
            </button>
            <button className="primary-button" type="submit">
              {t('Save block')}{' '}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
