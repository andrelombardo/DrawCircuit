import { HelpCircle } from 'lucide-react';
import { t } from '../../i18n';
import { IconButton } from './IconButton';

export function WorkspaceUtilities({ onHelp }: { onHelp?: () => void }) {
  return (
    <div className="workspace-utilities">
      <IconButton label={t('Help')} className="help-control floating-surface" onClick={onHelp}>
        <HelpCircle size={18} />
      </IconButton>
    </div>
  );
}
