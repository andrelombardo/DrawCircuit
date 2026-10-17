import { useEffect, useState } from 'react';
import { SelectionActions } from './components/properties/SelectionActions';
import { X } from 'lucide-react';
import { ComponentSidebar } from './components/palette/ComponentSidebar';
import { useSidebarPreferences } from './components/palette/useSidebarPreferences';
import { Canvas } from './components/editor/Canvas';
import { HelpDialog } from './components/toolbar/HelpDialog';
import { useEditorStore } from './store/editorStore';
export default function App() {
  const sidebar = useSidebarPreferences();
  const [helpOpen, setHelpOpen] = useState(false),
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
            onHelp={() => setHelpOpen(true)}
            sidebarVisible={sidebar.preferences.visible}
            onToggleSidebar={sidebar.toggleSidebar}
          />
        </div>
        {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
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
