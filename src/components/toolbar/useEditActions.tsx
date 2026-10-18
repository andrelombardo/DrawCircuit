import { t } from '../../i18n';
import {
  BookmarkPlus,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Replace,
  Scissors,
  Trash2,
  ClipboardCopy,
  Scan,
} from 'lucide-react';
import { commonReplacements } from '../../model/replacement';
import { useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useEditorCommands } from '../properties/EditorCommandContext';
import { annotationsForHost, withHostAnnotation } from '../properties/annotationActions';
import { CurrentInlineIcon } from './DrawingIcons';
import type { MenuAction } from './ActionMenu';
import { isMac, shortcut } from '../../utils/platform';

/** Menus and keyboard shortcuts dispatch the same store operations. */
export function useEditActions(canvasOnly = false) {
  const document = useEditorStore((s) => s.document),
    selection = useEditorStore((s) => s.selection),
    activeLabel = useEditorStore((s) => s.activeLabel);
  const commands = useEditorCommands();
  const state = () => useEditorStore.getState();
  const objects = useMemo(() => {
    if (canvasOnly) return [];
    const ids = new Set(selection);
    return document.objects.filter((object) => ids.has(object.id));
  }, [canvasOnly, document, selection]);
  const selected = !!objects.length;
  const replaceable = useMemo(
    () => commonReplacements(objects.filter((o) => o.kind === 'component')).length > 0,
    [objects],
  );
  const selectionItems: MenuAction[] = [
    {
      id: 'cut',
      label: t('Cut'),
      shortcut: shortcut('X'),
      icon: <Scissors size={15} />,
      disabled: !selected,
      onSelect: () => void state().cut(),
    },
    {
      id: 'copy',
      label: t('Copy'),
      shortcut: shortcut('C'),
      icon: <Copy size={15} />,
      disabled: !selected,
      onSelect: () => void state().copy(),
    },
    {
      id: 'duplicate',
      label: t('Duplicate'),
      shortcut: shortcut('D'),
      icon: <CopyPlus size={15} />,
      disabled: !selected,
      onSelect: () => state().duplicate(),
    },
    // Native clipboard permission is requested only when invoking Paste. A read
    // cannot reliably predict availability, so keep Paste reachable on every canvas.
    {
      id: 'paste',
      label: t('Paste'),
      shortcut: shortcut('V'),
      icon: <ClipboardPaste size={15} />,
      onSelect: () => void state().paste(),
    },
  ];
  const remove: MenuAction = {
    id: 'delete',
    label: activeLabel && selected ? t('Delete label') : t('Delete'),
    shortcut: isMac() ? '⌫' : 'Delete',
    icon: <Trash2 size={15} />,
    disabled: !selected,
    separatorBefore: true,
    onSelect: () => state().remove(),
  };
  const selectAll: MenuAction = {
    id: 'all',
    label: t('Select all'),
    shortcut: shortcut('A'),
    icon: <Scan size={15} />,
    disabled: !document.objects.length,
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
          ? t('Replace…')
          : t('Replace components…'),
        icon: <Replace size={15} />,
        separatorBefore: true,
        onSelect: commands.replace,
      });
    const wire = objects.length === 1 && objects[0].kind === 'wire' ? objects[0] : null;
    if (wire) {
      const hasCurrent = annotationsForHost(wire, document).length > 0;
      if (!hasCurrent)
        contextItems.push({
          id: 'current',
          label: t('Current on wire'),
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
        label: t('Split wire…'),
        separatorBefore: hasCurrent,
        onSelect: () => {
          state().setSplitWire(wire.id);
          state().notify(t('Click the wire where you want to split it · Esc cancels.'));
        },
      });
    }
    contextItems.push(
      {
        id: 'image',
        label: t('Copy as image'),
        icon: <ClipboardCopy size={15} />,
        separatorBefore: true,
        disabled: commands.imageBusy,
        onSelect: commands.copyImage,
      },
      {
        id: 'block',
        label: t('Save as block'),
        icon: <BookmarkPlus size={15} />,
        onSelect: commands.saveBlock,
      },
      remove,
    );
  }
  return { contextItems };
}
