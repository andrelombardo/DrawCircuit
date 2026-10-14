import { SidebarToggle } from '../components/toolbar/SidebarToggle';
import './DesktopFrame.css';

export function DesktopFrame({
  sidebarVisible,
  inspectorVisible,
  toggleSidebar,
  toggleInspector,
}: {
  sidebarVisible: boolean;
  inspectorVisible: boolean;
  toggleSidebar?: () => void;
  toggleInspector: () => void;
}) {
  return (
    <div className="desktop-frame">
      <div className="desktop-drag-region" data-tauri-drag-region />
      <div className="desktop-sidebar-control">
        <SidebarToggle
          side="left"
          visible={sidebarVisible}
          onToggle={toggleSidebar}
          floating={false}
        />
      </div>
      <div className="desktop-inspector-control">
        <SidebarToggle
          side="right"
          visible={inspectorVisible}
          onToggle={toggleInspector}
          floating={false}
        />
      </div>
    </div>
  );
}
