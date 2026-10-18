import { useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { CircuitDocument, CircuitComponent } from '../../model/types';
import { useEditorStore } from '../../store/editorStore';
import { createPersonalBlock, usePersonalBlocks } from '../../personalBlocks/library';
import { BlockNameDialog } from '../toolbar/BlockNameDialog';
import { ReplaceDialog } from './ReplaceDialog';
import { EditorCommandContext } from './EditorCommandContext';
import { copyPNG } from '../../png/exporter';
import { getExportSelection } from '../../tikz/selection';

/** Dialogs are shared by canvas commands and the personal block library.
 * Capture the command's selection before focus moves into a dialog. */
export function SelectionActions({ children }: { children: ReactNode }) {
  const parent = useContext(EditorCommandContext);
  const [block, setBlock] = useState<{ document: CircuitDocument; selection: string[] } | null>(
    null,
  );
  const [components, setComponents] = useState<CircuitComponent[] | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  if (parent) return children;
  return (
    <EditorCommandContext.Provider
      value={{
        imageBusy,
        copyImage: async () => {
          const { document, selection, notify } = useEditorStore.getState();
          if (!selection.length || imageBusy) return;
          // Include internal connections and annotations belonging to the selected hosts.
          const subset = getExportSelection(document, selection);
          if (!subset.objects.length) return;
          setImageBusy(true);
          try {
            await copyPNG(subset);
            notify('Immagine copiata');
          } catch (error) {
            notify(error instanceof Error ? error.message : 'Impossibile copiare l’immagine.');
          } finally {
            setImageBusy(false);
          }
        },
        replace: () => {
          const s = useEditorStore.getState();
          const selected = new Set(s.selection);
          setComponents(
            s.document.objects.filter(
              (o): o is CircuitComponent => o.kind === 'component' && selected.has(o.id),
            ),
          );
        },
        saveBlock: () => {
          const { document, selection } = useEditorStore.getState();
          if (selection.length) setBlock({ document, selection: [...selection] });
        },
      }}
    >
      {children}
      {block && (
        <BlockNameDialog
          onClose={() => setBlock(null)}
          onSave={(name) =>
            usePersonalBlocks
              .getState()
              .add(createPersonalBlock(block.document, block.selection, name))
          }
        />
      )}
      {!!components?.length && (
        <ReplaceDialog components={components} onClose={() => setComponents(null)} />
      )}
    </EditorCommandContext.Provider>
  );
}
