import { t, useLanguage } from './i18n';
import { useCallback, useEffect, useState } from 'react';
import { SelectionActions } from './components/properties/SelectionActions';
import { X } from 'lucide-react';
import { ComponentSidebar } from './components/palette/ComponentSidebar';
import { useSidebarPreferences } from './components/palette/useSidebarPreferences';
import { Canvas } from './components/editor/Canvas';
import { HelpDialog } from './components/toolbar/HelpDialog';
import { useEditorStore } from './store/editorStore';
import { useInspectorPreferences } from './components/properties/useInspectorPreferences';
export default function App() {
  const language = useLanguage((state) => state.language);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const sidebar = useSidebarPreferences();
  const inspector = useInspectorPreferences();
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 600px)').matches);
  const [mobilePanel, setMobilePanel] = useState<'library' | 'inspector' | null>(null);
  const setInspectorPreferences = inspector.setPreferences;
  const toggleDesktopLibrary = sidebar.toggleSidebar;
  const toggleLibrary = useCallback(() => {
    if (compact) setMobilePanel((panel) => (panel === 'library' ? null : 'library'));
    else toggleDesktopLibrary();
  }, [compact, toggleDesktopLibrary]);
  const toggleInspector = useCallback(() => {
    if (compact) setMobilePanel((panel) => (panel === 'inspector' ? null : 'inspector'));
    else setInspectorPreferences((p) => ({ ...p, visible: !p.visible }));
  }, [compact, setInspectorPreferences]);
  const showInspector = useCallback(() => {
    if (compact) setMobilePanel('inspector');
    else setInspectorPreferences((p) => ({ ...p, visible: true }));
  }, [compact, setInspectorPreferences]);
  const libraryVisible = compact ? mobilePanel === 'library' : sidebar.preferences.visible;
  const inspectorVisible = compact ? mobilePanel === 'inspector' : inspector.preferences.visible;
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)');
    const change = () => {
      setCompact(media.matches);
      setMobilePanel(null);
    };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (!compact) return;
    return useEditorStore.subscribe((s, previous) => {
      if (s.tool !== previous.tool || s.pendingPresetId !== previous.pendingPresetId)
        setMobilePanel((panel) => (panel === 'library' ? null : panel));
    });
  }, [compact]);
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
          <ComponentSidebar
            {...sidebar}
            preferences={{ ...sidebar.preferences, visible: libraryVisible }}
            toggleSidebar={toggleLibrary}
          />
          <Canvas
            onHelp={() => setHelpOpen(true)}
            sidebarVisible={libraryVisible}
            onToggleSidebar={toggleLibrary}
            onShowInspector={showInspector}
            inspector={{
              ...inspector,
              preferences: {
                ...inspector.preferences,
                visible: inspectorVisible,
              },
              toggle: toggleInspector,
            }}
          />
        </div>
        {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
        {notice && (
          <div className="toast" role="status">
            {notice}
            <button
              aria-label={t('Dismiss notification')}
              title={t('Dismiss notification')}
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
