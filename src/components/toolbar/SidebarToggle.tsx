import { t } from '../../i18n';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SidebarIcon } from './SidebarIcon';

/** The properties panel uses an edge tab; the component library keeps its floating control. */
export function SidebarToggle({
  side,
  visible,
  onToggle,
  floating = true,
}: {
  side: 'left' | 'right';
  visible: boolean;
  onToggle?: () => void;
  floating?: boolean;
}) {
  const label = t(
    side === 'left'
      ? visible
        ? 'Hide components'
        : 'Show components'
      : visible
        ? 'Hide properties'
        : 'Show properties',
  );
  const title = `${label}${side === 'left' ? ' (T)' : ''}`;
  return (
    <button
      type="button"
      className={`icon-button sidebar-toggle${side === 'right' ? ' inspector-edge-toggle' : visible || !floating ? '' : ' sidebar-reopen floating-surface'}`}
      aria-label={label}
      title={title}
      data-tooltip={title}
      aria-expanded={visible}
      aria-controls={side === 'left' ? 'component-library' : 'properties-inspector'}
      onClick={onToggle}
    >
      {side === 'right'
        ? visible ? <ChevronRight size={18} aria-hidden="true" /> : <ChevronLeft size={18} aria-hidden="true" />
        : <SidebarIcon side={side} />}
    </button>
  );
}
