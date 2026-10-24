import { t } from '../../i18n';
import type { CircuitObject } from '../../model/types';
import { useEditorStore } from '../../store/editorStore';
import { scaleSelection } from '../../utils/scaleSelection';
import { measurementBounds } from '../../utils/measurementGeometry';
import { unionBounds } from '../../utils/visualBounds';
import { PropertyField } from './PropertyControls';

export function SelectionSizeFields({ objects }: { objects: CircuitObject[] }) {
  const doc = useEditorStore((s) => s.document), b = unionBounds(objects.map((o) => o.kind === 'junction'
    ? { x: o.x-(o.radius ?? 4.5), y: o.y-(o.radius ?? 4.5), width: (o.radius ?? 4.5)*2, height: (o.radius ?? 4.5)*2 }
    : measurementBounds(o, doc)));
  return <div className="inspector-dimensions inspector-uniform-dimensions">
    {(['width', 'height'] as const).map((size) => <PropertyField key={size} label={t(size === 'width' ? 'Width' : 'Height')} caption={size === 'width' ? 'W' : 'H'} numeric min={0.01} max={1e7} disabled={b[size] <= 0}
      value={Number(b[size].toFixed(2))} onCommit={(v) => {
        if (b[size] <= 0) return;
        const s = useEditorStore.getState();
        s.commit(scaleSelection(s.document, objects.map((o) => o.id), Number(v)/b[size]), { preserveFrameChildren: true });
      }} />)}
  </div>;
}
