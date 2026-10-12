import { useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { CircuitDocument, CircuitComponent } from '../../model/types';
import { useEditorStore } from '../../store/editorStore';
import { createPersonalBlock, usePersonalBlocks } from '../../personalBlocks/library';
import { BlockNameDialog } from '../toolbar/BlockNameDialog';
import { ReplaceDialog } from './ReplaceDialog';
import { EditorCommandContext } from './EditorCommandContext';

/** Dialogs are shared by canvas commands and the personal block library.
 * Capture the command's selection before focus moves into a dialog. */
export function SelectionActions({ children }: { children: ReactNode }) {
  const parent = useContext(EditorCommandContext);
  const [block, setBlock] = useState<{ document: CircuitDocument; selection: string[] } | null>(
    null,
  );
  const [components, setComponents] = useState<CircuitComponent[] | null>(null);
  if (parent) return children;
  return (
    <EditorCommandContext.Provider
      value={{
        replace: () => {
          const s = useEditorStore.getState();
          setComponents(
            s.document.objects.filter(
              (o): o is CircuitComponent => o.kind === 'component' && s.selection.includes(o.id),
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
