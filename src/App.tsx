import { useEffect, useState } from 'react';
import { SelectionActions } from './components/properties/SelectionActions';
import { X } from 'lucide-react';
import { ComponentSidebar } from './components/palette/ComponentSidebar';
import { useSidebarPreferences } from './components/palette/useSidebarPreferences';
import { Canvas } from './components/editor/Canvas';
import { ExportDialog } from './components/toolbar/ExportDialog';
import { HelpDialog } from './components/toolbar/HelpDialog';
import { useEditorStore } from './store/editorStore';
export default function App() {
  const sidebar = useSidebarPreferences();
  const [dialog, setDialog] = useState<'export' | 'help' | null>(null),
    notice = useEditorStore((s) => s.notice);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => useEditorStore.getState().notify(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  return (
    <SelectionActions>
      <div className="app-shell">
        <div className="workspace">
          <ComponentSidebar {...sidebar} />
          <Canvas
            onExport={() => setDialog('export')}
            onHelp={() => setDialog('help')}
            sidebarVisible={sidebar.preferences.visible}
            onToggleSidebar={sidebar.toggleSidebar}
          />
        </div>
        {dialog === 'export' && <ExportDialog onClose={() => setDialog(null)} />}{' '}
        {dialog === 'help' && <HelpDialog onClose={() => setDialog(null)} />}
        {notice && (
          <div className="toast" role="status">
            {notice}
            <button
              aria-label="Chiudi notifica"
              title="Chiudi notifica"
              onClick={() => useEditorStore.getState().notify('')}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </SelectionActions>
  );
}
