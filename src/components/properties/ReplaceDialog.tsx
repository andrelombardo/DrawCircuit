import { createPortal } from 'react-dom';
import { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { CircuitComponent } from '../../model/types';
import { commonReplacements } from '../../model/replacement';
import { categories, componentRegistry, matchesComponent } from '../../model/catalog';
import { ComponentPreview } from '../palette/ComponentPreview';
import { useEditorStore } from '../../store/editorStore';
import { useDialogFocus } from '../toolbar/useDialogFocus';
export function ReplaceDialog({
  components,
  onClose,
}: {
  components: CircuitComponent[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, onClose);
  const items = commonReplacements(components).filter((type) =>
    matchesComponent(componentRegistry[type], search),
  );
  return createPortal(
    <div
      className="modal-backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="confirm-dialog replace-dialog"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Sostituisci componente"
      >
        <button
          className="modal-close"
          aria-label="Chiudi sostituzione"
          title="Chiudi sostituzione"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2>Sostituisci {components.length > 1 ? `${components.length} componenti` : 'con'}</h2>
        <div className="replace-search-field">
          <Search size={15} />
          <input
            className="replace-search"
            autoFocus
            aria-label="Cerca sostituzione"
            placeholder="Cerca componente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="replace-list">
          {categories.map((group) => {
            const entries = items
              .map((type) => componentRegistry[type])
              .filter((c) => c.group === group);
            if (!entries.length) return null;
            return (
              <section key={group} aria-label={group}>
                {items.length > 6 && <h3>{group}</h3>}
                {entries.map((c) => (
                  <button
                    key={c.type}
                    className="replace-option"
                    onClick={() => {
                      useEditorStore.getState().replaceComponents(
                        components.map((c) => c.id),
                        c.type,
                      );
                      onClose();
                    }}
                  >
                    <ComponentPreview component={c} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </section>
            );
          })}
        </div>
        {!items.length && (
          <p>
            {search
              ? 'Nessun risultato per questa ricerca.'
              : 'Nessuna destinazione comune: i terminali dei componenti selezionati hanno geometrie o funzioni incompatibili.'}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
