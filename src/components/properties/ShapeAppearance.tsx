import { useState } from 'react';
import { Circle, Scan, Radius, ChevronDown } from 'lucide-react';
import { ActionMenu } from '../toolbar/ActionMenu';
import { t } from '../../i18n';
import type { CircuitObject, ShapeAnnotation } from '../../model/types';
import { commonValue } from './commonValue';
import { InspectorSection, PropertyField } from './PropertyControls';

type Apply = (fn: (o: CircuitObject) => CircuitObject) => void;
export function ShapeCorners({ objects, apply }: { objects: ShapeAnnotation[]; apply: Apply }) {
  const [individual, setIndividual] = useState(objects.some((o) => new Set(o.cornerRadii ?? [0, 0, 0, 0]).size > 1));
  const radii = objects.map((o) => o.cornerRadii ?? [0, 0, 0, 0]);
  const setRadius = (value: number, index?: number) => apply((o) => o.kind === 'rectangle' ? { ...o,
    cornerRadii: (o.cornerRadii ?? [0, 0, 0, 0]).map((radius, i) => index === undefined || index === i ? value : radius) as [number, number, number, number],
  } : o);
  return <InspectorSection title={t('Corners')} className="inspector-corners" actions={<>
    <button className="inspector-heading-action" aria-label={t('Maximum corner radius')} title={t('Maximum corner radius')}
      onClick={() => apply((o) => o.kind === 'rectangle' ? { ...o, cornerRadii: Array(4).fill(Math.min(o.width, o.height)/2) as [number, number, number, number] } : o)}><Circle size={15} /></button>
    <button className="inspector-heading-action" aria-label={t('Individual corners')} title={t('Individual corners')} aria-pressed={individual} onClick={() => setIndividual(!individual)}><Scan size={15} /></button>
  </>}>
    {!individual ? <div className="inspector-corner-uniform">
      <ActionMenu label={t('Corner style')} className="inspector-corner-type" icon={<><Radius size={14} /><span>{t('Rounded')}</span><ChevronDown size={12} /></>}
        items={[{ id: 'rounded', label: t('Rounded'), checked: true }, { id: 'reset', label: t('Reset corners'), separatorBefore: true, onSelect: () => setRadius(0) }]} />
      <PropertyField label={t('Corner radius')} caption="" numeric min={0} max={1e7} value={commonValue(radii.flat())} onCommit={(v) => setRadius(Number(v))} />
    </div> : <div className="inspector-pair inspector-corner-fields">
      {['Top left', 'Top right', 'Bottom right', 'Bottom left'].map((corner, i) => <PropertyField key={corner} label={t('{corner} radius', { corner: t(corner) })}
        caption={<Radius size={14} style={{ transform: `rotate(${i*90}deg)` }} />} numeric min={0} max={1e7} value={commonValue(radii.map((r) => r[i]))} onCommit={(v) => setRadius(Number(v), i)} />)}
    </div>}
  </InspectorSection>;
}
