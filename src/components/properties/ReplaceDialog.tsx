import { t } from '../../i18n';
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
        aria-label={t('Replace component')}
      >
        <button
          className="modal-close"
          aria-label={t('Close replacement dialog')}
          title={t('Close replacement dialog')}
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2>
          {components.length > 1
            ? t('Replace {count} components', { count: components.length })
            : t('Replace with')}
        </h2>
        <div className="replace-search-field">
          <Search size={15} />
          <input
            className="replace-search"
            autoFocus
            aria-label={t('Search replacements')}
            placeholder={t('Search component…')}
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
              <section key={group} aria-label={t(group)}>
                {items.length > 6 && <h3>{t(group)}</h3>}
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
                    <span>{t(c.name)}</span>
                  </button>
                ))}
              </section>
            );
          })}
        </div>
        {!items.length && (
          <p>
            {search
              ? t('No results for this search.')
              : t(
                  'No shared replacement: the selected components have incompatible terminal geometry or functions.',
                )}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
