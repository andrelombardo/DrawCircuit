import {
  BookmarkPlus,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Replace,
  Scissors,
  Trash2,
  ImageDown,
  Scan,
} from 'lucide-react';
import { commonReplacements } from '../../model/replacement';
import { useEditorStore } from '../../store/editorStore';
import { useEditorCommands } from '../properties/EditorCommandContext';
import { annotationsForHost, withHostAnnotation } from '../properties/annotationActions';
import { CurrentInlineIcon } from './DrawingIcons';
import type { MenuAction } from './ActionMenu';
import { isMac, shortcut } from '../../utils/platform';

/** Menus and keyboard shortcuts dispatch the same store operations. */
export function useEditActions(canvasOnly = false) {
  const s = useEditorStore();
  const commands = useEditorCommands();
  const state = () => useEditorStore.getState();
  const objects = canvasOnly ? [] : s.document.objects.filter((o) => s.selection.includes(o.id));
  const selected = !!objects.length;
  const replaceable = commonReplacements(objects.filter((o) => o.kind === 'component')).length > 0;
  const selectionItems: MenuAction[] = [
    {
      id: 'cut',
      label: 'Taglia',
      shortcut: shortcut('X'),
      icon: <Scissors size={15} />,
      disabled: !selected,
      onSelect: () => void state().cut(),
    },
    {
      id: 'copy',
      label: 'Copia',
      shortcut: shortcut('C'),
      icon: <Copy size={15} />,
      disabled: !selected,
      onSelect: () => void state().copy(),
    },
    {
      id: 'duplicate',
      label: 'Duplica',
      shortcut: shortcut('D'),
      icon: <CopyPlus size={15} />,
      disabled: !selected,
      onSelect: () => state().duplicate(),
    },
    // Native clipboard permission is requested only when invoking Paste. A read
    // cannot reliably predict availability, so keep Paste reachable on every canvas.
    {
      id: 'paste',
      label: 'Incolla',
      shortcut: shortcut('V'),
      icon: <ClipboardPaste size={15} />,
      onSelect: () => void state().paste(),
    },
  ];
  const remove: MenuAction = {
    id: 'delete',
    label: s.activeLabel && selected ? 'Elimina etichetta' : 'Elimina',
    shortcut: isMac() ? '⌫' : 'Delete',
    icon: <Trash2 size={15} />,
    disabled: !selected,
    separatorBefore: true,
    onSelect: () => state().remove(),
  };
  const selectAll: MenuAction = {
    id: 'all',
    label: 'Seleziona tutto',
    shortcut: shortcut('A'),
    icon: <Scan size={15} />,
    disabled: !s.document.objects.length,
    onSelect: () => state().select(state().document.objects.map((o) => o.id)),
  };
  const contextItems: MenuAction[] = selected
    ? [...selectionItems]
    : [selectionItems[3], { ...selectAll, separatorBefore: true }];
  if (selected) {
    if (replaceable)
      contextItems.push({
        id: 'replace',
        label: objects.every((o) => o.kind === 'component')
          ? 'Sostituisci…'
          : 'Sostituisci componenti…',
        icon: <Replace size={15} />,
        separatorBefore: true,
        onSelect: commands.replace,
      });
    const wire = objects.length === 1 && objects[0].kind === 'wire' ? objects[0] : null;
    if (wire) {
      const hasCurrent = annotationsForHost(wire, s.document).length > 0;
      if (!hasCurrent)
        contextItems.push({
          id: 'current',
          label: 'Corrente sul filo',
          icon: <CurrentInlineIcon size={15} />,
          separatorBefore: true,
          onSelect: () => {
            const s = state();
            const next = withHostAnnotation(wire, s.document);
            if (next !== s.document) s.commit(next);
          },
        });
      contextItems.push({
        id: 'split',
        label: 'Dividi filo…',
        separatorBefore: hasCurrent,
        onSelect: () => {
          state().setSplitWire(wire.id);
          state().notify('Clicca il filo nel punto da dividere · Esc annulla.');
        },
      });
    }
    contextItems.push(
      {
        id: 'image',
        label: 'Salva come immagine',
        icon: <ImageDown size={15} />,
        separatorBefore: true,
        disabled: commands.imageBusy,
        onSelect: commands.saveImage,
      },
      {
        id: 'block',
        label: 'Salva come blocco',
        icon: <BookmarkPlus size={15} />,
        onSelect: commands.saveBlock,
      },
      remove,
    );
  }
  return { contextItems };
}
