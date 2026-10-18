import { t } from '../i18n';
import { useEditorCommands } from '../components/properties/EditorCommandContext';
import { useRef, useState } from 'react';
import { ChevronDown, Pencil, Trash2, Undo2 } from 'lucide-react';
import { usePersonalBlocks } from './library';
import { useEditorStore } from '../store/editorStore';
import { BlockNameDialog } from '../components/toolbar/BlockNameDialog';
export function PersonalBlockPalette({ search }: { search: string }) {
  const commands = useEditorCommands();
  const selected = useEditorStore((s) => s.selection.length);
  const blocks = usePersonalBlocks((s) => s.blocks),
    error = usePersonalBlocks((s) => s.error);
  const lastRemoved = usePersonalBlocks((s) => s.lastRemoved);
  const [renaming, setRenaming] = useState<string | null>(null),
    [open, setOpen] = useState(true);
  const file = useRef<HTMLInputElement>(null);
  const pending = useEditorStore((s) => s.pendingPresetId);
  return (
    <section className="personal-blocks" aria-label={t('Personal blocks')}>
      <button
        className="group-heading"
        aria-expanded={open || !!search}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          {t('Personal blocks')} <span className="count">{blocks.length}</span>
        </span>
        <ChevronDown size={14} className={!open && !search ? 'collapsed' : ''} />
      </button>
      {lastRemoved && (
        <div className="personal-block-recovery" role="status">
          <span>{t('“{name}” deleted.', { name: lastRemoved.block.name })}</span>
          <button
            onClick={() => {
              try {
                usePersonalBlocks.getState().restoreRemoved();
              } catch (error) {
                useEditorStore
                  .getState()
                  .notify(
                    error instanceof Error ? error.message : t('Unable to restore the block.'),
                  );
              }
            }}
          >
            <Undo2 size={14} /> {t('Undo deletion')}{' '}
          </button>
        </div>
      )}
      {(open || !!search) && (
        <>
          {blocks
            .filter((b) => b.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
            .map((b) => (
              <div className="personal-block-row" key={b.id}>
                <button
                  className={pending === b.id ? 'chosen' : ''}
                  aria-label={t('Insert personal block: {name}', {
                    name: b.name,
                  })}
                  title={t('{name} \u00b7 click to place \u00b7 R rotates', {
                    name: b.name,
                  })}
                  onClick={() => useEditorStore.getState().selectPreset(b.id)}
                >
                  {b.name}
                </button>
                <button
                  aria-label={t('Rename block {name}', { name: b.name })}
                  title={t('Rename')}
                  onClick={() => setRenaming(b.id)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="destructive-button"
                  aria-label={t('Delete block {name}', { name: b.name })}
                  title={t('Delete from library')}
                  onClick={() => {
                    usePersonalBlocks.getState().remove(b.id);
                    if (pending === b.id) useEditorStore.getState().setTool('select');
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          {!blocks.length && (
            <p className="personal-empty">
              {t('Select elements on the sheet and choose “Save as block”.')}{' '}
            </p>
          )}
          <button
            className="personal-save-selection"
            disabled={!selected}
            onClick={commands.saveBlock}
          >
            {t('Save selection as block')}{' '}
          </button>
          <div className="personal-library-actions">
            <button onClick={() => file.current?.click()}>{t('Import blocks')}</button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="copy-error">
          {error}
        </p>
      )}
      <input
        hidden
        ref={file}
        type="file"
        accept=".json,application/json"
        aria-label={t('Import personal blocks')}
        onChange={async (e) => {
          const f = e.currentTarget.files?.[0];
          e.currentTarget.value = '';
          if (!f) return;
          try {
            if (f.size > 10_000_000) throw new Error(t('The file exceeds 10 MB.'));
            usePersonalBlocks.getState().import(await f.text());
          } catch (err) {
            useEditorStore
              .getState()
              .notify(err instanceof Error ? err.message : t('Invalid library.'));
          }
        }}
      />
      {renaming && (
        <BlockNameDialog
          initial={blocks.find((b) => b.id === renaming)?.name}
          onSave={(name) => usePersonalBlocks.getState().rename(renaming, name)}
          onClose={() => setRenaming(null)}
        />
      )}
    </section>
  );
}
