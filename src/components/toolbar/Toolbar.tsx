import {
  ArrowRight,
  CircleDot,
  Download,
  GripVertical,
  Hand,
  MousePointer2,
  Pencil,
  Redo2,
  Spline,
  Type,
  Undo2,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { IconButton } from './IconButton';
import { useFloatingToolbar } from './useFloatingToolbar';
import { ActionMenu } from './ActionMenu';
import type { MenuAction } from './ActionMenu';
import {
  BraceToolIcon,
  BracketToolIcon,
  CurrentInlineIcon,
  LoopPathIcon,
  PolarityIcon,
  VoltageIcon,
} from './DrawingIcons';

export function DrawingToolbar({
  onExport,
  sidebarVisible = true,
}: {
  onExport?: () => void;
  sidebarVisible?: boolean;
}) {
  const {
    ref: toolbarRef,
    style,
    dragging,
    menuAbove,
    handle,
  } = useFloatingToolbar(sidebarVisible);
  const tool = useEditorStore((s) => s.tool),
    setTool = useEditorStore((s) => s.setTool),
    gestureStart = useEditorStore((s) => s.gestureStart),
    past = useEditorStore((s) => s.past),
    future = useEditorStore((s) => s.future),
    undo = useEditorStore((s) => s.undo),
    redo = useEditorStore((s) => s.redo);
  const drawingTools = [
    'wire',
    'junction',
    'arrow',
    'loop-arrow',
    'brace',
    'bracket',
    'polarity',
    'voltage',
    'current',
  ];
  const items: MenuAction[] = [
    { id: 'wire', label: 'Filo', icon: <Spline size={18} />, onSelect: () => setTool('wire') },
    {
      id: 'junction',
      label: 'Nodo',
      icon: <CircleDot size={18} />,
      onSelect: () => setTool('junction'),
    },
    {
      id: 'arrow',
      label: 'Freccia',
      icon: <ArrowRight size={18} />,
      separatorBefore: true,
      onSelect: () => setTool('arrow'),
    },
    { id: 'loop', label: 'Maglia', icon: <LoopPathIcon />, onSelect: () => setTool('loop-arrow') },
    {
      id: 'brace',
      label: 'Graffa / Staffa',
      icon: <BraceToolIcon />,
      children: [
        { id: 'brace', label: 'Graffa', icon: <BraceToolIcon />, onSelect: () => setTool('brace') },
        {
          id: 'bracket',
          label: 'Staffa',
          icon: <BracketToolIcon />,
          onSelect: () => setTool('bracket'),
        },
      ],
    },
    {
      id: 'polarity',
      label: 'Polarità + / -',
      icon: <PolarityIcon />,
      separatorBefore: true,
      onSelect: () => setTool('polarity'),
    },
    {
      id: 'voltage',
      label: 'Tensione tra due punti',
      icon: <VoltageIcon />,
      onSelect: () => setTool('voltage'),
    },
    {
      id: 'current',
      label: 'Corrente sul filo',
      icon: <CurrentInlineIcon />,
      onSelect: () => setTool('current'),
    },
  ];
  return (
    <div
      ref={toolbarRef}
      className="main-tools floating-surface"
      role="toolbar"
      aria-label="Strumenti di disegno"
      style={style}
      data-dragging={dragging || undefined}
      data-menu-above={menuAbove || undefined}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="toolbar-grip"
        aria-label="Sposta toolbar"
        title="Trascina per spostare gli strumenti"
        data-tooltip="Sposta toolbar"
        {...handle}
      >
        <GripVertical size={16} />
      </button>
      <IconButton
        label="Selezione (V)"
        active={tool === 'select'}
        onClick={() => setTool('select')}
      >
        <MousePointer2 size={18} />
      </IconButton>
      <IconButton label="Testo" active={tool === 'text'} onClick={() => setTool('text')}>
        <Type size={19} />
      </IconButton>
      <ActionMenu
        label="Disegno e annotazioni"
        icon={items.find((item) => item.id === tool)?.icon ?? <Pencil size={18} />}
        items={items}
        active={drawingTools.includes(tool)}
        onEscape={() => setTool('select')}
      />
      <div className="toolbar-divider" />
      <IconButton
        label="Annulla (⌘/Ctrl Z)"
        disabled={!past.length && !gestureStart}
        onClick={undo}
      >
        <Undo2 size={18} />
      </IconButton>
      <IconButton label="Ripeti (⌘/Ctrl Shift Z)" disabled={!future.length} onClick={redo}>
        <Redo2 size={18} />
      </IconButton>
      <div className="toolbar-divider" />
      <IconButton
        label="Sposta vista (H o Space)"
        active={tool === 'pan'}
        onClick={() => setTool('pan')}
      >
        <Hand size={18} />
      </IconButton>
      <IconButton label="Esporta" onClick={onExport}>
        <Download size={18} />
      </IconButton>
    </div>
  );
}
