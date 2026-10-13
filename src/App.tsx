import { useEffect, useState } from 'react';
import { SelectionActions } from './components/properties/SelectionActions';
import { X } from 'lucide-react';
import { PwaStatus } from './pwa/PwaStatus';
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
  useEffect(() => {
    const report = (event: Event) =>
      useEditorStore.getState().notify((event as CustomEvent<string>).detail);
    const menu = (event: Event) => {
      const action = (event as CustomEvent<string>).detail;
      if (action === 'export') setDialog('export');
      if (action === 'open' || action === 'save') {
        void import('./desktop/archiveActions')
          .then((commands) => (action === 'open' ? commands.openArchive() : commands.saveArchive()))
          .catch((error) => useEditorStore.getState().notify(String(error)));
      }
    };
    window.addEventListener('drawcircuit:desktop-error', report);
    window.addEventListener('drawcircuit:desktop-menu', menu);
    return () => {
      window.removeEventListener('drawcircuit:desktop-error', report);
      window.removeEventListener('drawcircuit:desktop-menu', menu);
    };
  }, []);
  return (
    <SelectionActions>
      <div className="app-shell">
        <PwaStatus />
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
