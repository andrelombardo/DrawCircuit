import { SidebarIcon } from './SidebarIcon';

/** Both workspace panels share the same control, including their floating reopen buttons. */
export function SidebarToggle({
  side,
  visible,
  onToggle,
}: {
  side: 'left' | 'right';
  visible: boolean;
  onToggle?: () => void;
}) {
  const label = `${visible ? 'Nascondi' : 'Mostra'} ${side === 'left' ? 'componenti' : 'proprietà'}`;
  const title = `${label}${side === 'left' ? ' (T)' : ''}`;
  return (
    <button
      type="button"
      className={`icon-button sidebar-toggle${visible ? '' : ` sidebar-reopen floating-surface${side === 'right' ? ' inspector-reopen' : ''}`}`}
      aria-label={label}
      title={title}
      data-tooltip={title}
      aria-expanded={visible}
      aria-controls={side === 'left' ? 'component-library' : 'properties-inspector'}
      onClick={onToggle}
    >
      <SidebarIcon side={side} />
    </button>
  );
}
