import { useState } from 'react';
import {
  ArrowLeftRight,
  BookmarkPlus,
  ClipboardPaste,
  Copy,
  Ellipsis,
  FlipHorizontal,
  FlipVertical,
  Image,
  Replace,
  RotateCw,
  Scissors,
  Trash2,
} from 'lucide-react';
import type { CircuitObject } from '../../model/types';
import { useEditorStore } from '../../store/editorStore';
import { supportsPolarity } from '../../model/capabilities';
import { createPolarity } from '../../annotations/electrical';
import { reverseLoop } from '../../utils/loops';
import { currentOnSelectedWire } from './annotationActions';
import { createPersonalBlock, usePersonalBlocks } from '../../personalBlocks/library';
import { copyPNG } from '../../png/exporter';
import { getExportSelection } from '../../tikz/selection';
import { BlockNameDialog } from '../toolbar/BlockNameDialog';
import { ReplaceDialog } from './ReplaceDialog';
import { ActionMenu } from '../toolbar/ActionMenu';
import type { MenuAction } from '../toolbar/ActionMenu';
import { CurrentInlineIcon, PolarityIcon } from '../toolbar/DrawingIcons';

/** Commands stay in a contextual menu; the inspector's reading flow contains properties only. */
export function SelectionActions({ objects }: { objects: CircuitObject[] }) {
  const [blockDialog, setBlockDialog] = useState(false);
  const [replaceDialog, setReplaceDialog] = useState(false);
  const [pngBusy, setPngBusy] = useState(false);
  const activeLabel = useEditorStore((s) => s.activeLabel);
  const state = () => useEditorStore.getState();
  const o = objects.length === 1 ? objects[0] : null;
  const components = objects.filter((o) => o.kind === 'component');
  const png = async () => {
    if (pngBusy) return;
    setPngBusy(true);
    try {
      await copyPNG(getExportSelection(state().document, state().selection));
      state().notify('PNG copiato');
    } catch (error) {
      state().notify(error instanceof Error ? error.message : 'Impossibile copiare il PNG.');
    } finally {
      setPngBusy(false);
    }
  };
  const items: MenuAction[] = [
    {
      id: 'duplicate',
      label: 'Duplica (⌘/Ctrl D)',
      icon: <Copy size={16} />,
      onSelect: () => state().duplicate(),
    },
    {
      id: 'copy',
      label: 'Copia (⌘/Ctrl C)',
      icon: <Copy size={16} />,
      onSelect: () => void state().copy(),
    },
    {
      id: 'cut',
      label: 'Taglia (⌘/Ctrl X)',
      icon: <Scissors size={16} />,
      onSelect: () => void state().cut(),
    },
    {
      id: 'paste',
      label: 'Incolla (⌘/Ctrl V)',
      icon: <ClipboardPaste size={16} />,
      onSelect: () => void state().paste(),
    },
  ];
  if (components.length)
    items.push({
      id: 'replace',
      label: 'Sostituisci…',
      icon: <Replace size={16} />,
      separatorBefore: true,
      onSelect: () => setReplaceDialog(true),
    });
  if (!o || (o.kind !== 'wire' && o.kind !== 'junction'))
    items.push({
      id: 'rotate',
      label: `Ruota ${components.length ? 45 : 90}° (R)`,
      icon: <RotateCw size={16} />,
      separatorBefore: !components.length,
      onSelect: () => state().rotate(),
    });
  if (o?.kind === 'wire') {
    items.push(
      {
        id: 'current',
        label: 'Corrente sul filo',
        icon: <CurrentInlineIcon size={17} />,
        separatorBefore: true,
        onSelect: () => state().add([currentOnSelectedWire(o, state().document)]),
      },
      {
        id: 'split',
        label: 'Dividi filo…',
        onSelect: () => {
          state().setSplitWire(o.id);
          state().notify('Clicca il filo nel punto da dividere · Esc annulla.');
        },
      },
    );
  }
  if (o && supportsPolarity(o))
    items.push({
      id: 'polarity',
      label: 'Polarità + / -',
      icon: <PolarityIcon size={17} />,
      onSelect: () => {
        const annotation = createPolarity(o);
        if (annotation) state().add([annotation]);
      },
    });
  if (objects.some((o) => o.kind === 'brace'))
    items.push({
      id: 'side',
      label: 'Inverti lato',
      icon: <FlipHorizontal size={16} />,
      onSelect: () =>
        state().updateSelection((o) =>
          o.kind === 'brace' ? { ...o, side: o.side === 1 ? -1 : 1 } : o,
        ),
    });
  if (objects.some((o) => o.kind === 'arrow' || o.kind === 'electrical' || o.kind === 'loop-arrow'))
    items.push({
      id: 'reverse',
      label: 'Inverti freccia',
      icon: <ArrowLeftRight size={16} />,
      onSelect: () =>
        state().updateSelection((o) =>
          o.kind === 'arrow' || o.kind === 'electrical'
            ? { ...o, reversed: !o.reversed }
            : o.kind === 'loop-arrow'
              ? reverseLoop(o)
              : o,
        ),
    });
  if (objects.some((o) => o.kind === 'arrow' || o.kind === 'loop-arrow'))
    items.push(
      {
        id: 'mirror-x',
        label: 'Specchia orizzontalmente',
        icon: <FlipHorizontal size={16} />,
        onSelect: () => state().mirror('horizontal'),
      },
      {
        id: 'mirror-y',
        label: 'Specchia verticalmente',
        icon: <FlipVertical size={16} />,
        onSelect: () => state().mirror('vertical'),
      },
    );
  items.push(
    {
      id: 'block',
      label: 'Salva come blocco',
      icon: <BookmarkPlus size={16} />,
      separatorBefore: true,
      onSelect: () => setBlockDialog(true),
    },
    {
      id: 'png',
      label: pngBusy ? 'Copia immagine…' : 'Copia come immagine',
      icon: <Image size={16} />,
      disabled: pngBusy,
      onSelect: () => void png(),
    },
    {
      id: 'delete',
      label: activeLabel ? 'Elimina etichetta (Delete)' : 'Elimina (Delete)',
      icon: <Trash2 size={16} />,
      separatorBefore: true,
      onSelect: () => state().remove(),
    },
  );
  return (
    <>
      <ActionMenu
        label="Comandi selezione"
        icon={<Ellipsis size={18} />}
        items={items}
        className="inspector-overflow"
      />
      {blockDialog && (
        <BlockNameDialog
          onClose={() => setBlockDialog(false)}
          onSave={(name) =>
            usePersonalBlocks
              .getState()
              .add(createPersonalBlock(state().document, state().selection, name))
          }
        />
      )}
      {replaceDialog && components.length > 0 && (
        <ReplaceDialog components={components} onClose={() => setReplaceDialog(false)} />
      )}
    </>
  );
}
