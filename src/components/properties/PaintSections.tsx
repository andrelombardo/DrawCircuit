import { useRef, useState } from 'react';
import { AlignJustify, ArrowDown, ArrowUp, Blend, ChevronDown, CirclePlus, Layers2, Settings2, Trash2 } from 'lucide-react';
import { t } from '../../i18n';
import { makeId } from '../../model/catalog';
import { COLORS } from '../../model/types';
import type { CircuitObject, ShapeBorder, ShapeFill } from '../../model/types';
import { objectBorders, objectFills, withPaints } from '../../model/shapeAppearance';
import { MAX_LINE_WIDTH } from '../../model/limits';
import { ActionMenu } from '../toolbar/ActionMenu';
import { commonValue } from './commonValue';
import { ColorControl } from './SelectionStyle';
import { InspectorSection, PropertyField, PropertySelect } from './PropertyControls';
import { InspectorPopover } from './InspectorPopover';

export function ObjectPaintSection({ objects, apply, border = false }: {
  objects: CircuitObject[]; apply: (fn: (o: CircuitObject) => CircuitObject) => void; border?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeBorder, setActiveBorder] = useState(0);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const get = border ? objectBorders : objectFills;
  const lists = objects.map(get), count = Math.max(...lists.map((list) => list.length));
  const settingsIndex = Math.min(activeBorder, Math.max(0, count-1));
  const label = t(border ? 'Border' : 'Fill'), shapes = objects.every((o) => o.kind === 'rectangle' || o.kind === 'circle');
  const update = (index: number, patch: Partial<ShapeBorder>) => apply((o) => withPaints(o, border, get(o).map((p, i) => i === index ? { ...p, ...patch } : p)));
  const reorder = (index: number, delta: number) => apply((o) => {
    const list = [...get(o)];
    if (index+delta < 0 || index+delta >= list.length) return o;
    [list[index], list[index+delta]] = [list[index+delta], list[index]];
    return withPaints(o, border, list);
  });
  const add = () => apply((o) => withPaints(o, border, [{ id: makeId(), color: border ? COLORS.ink : COLORS.blue, enabled: true, opacity: 1,
    ...(border ? { width: 2, position: 'center' as const, lineStyle: 'solid' as const } : {}),
  }, ...get(o)]));
  return <InspectorSection title={t(border ? 'Borders' : 'Fills')} className="inspector-paints" actions={<>
    {border && !!count && <button ref={settingsButton} className="inspector-heading-action" aria-label={t('Border settings')} title={t('Border settings')} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><Settings2 size={15} /></button>}
    <button className="inspector-heading-action" aria-label={t(border ? 'Add border' : 'Add fill')} title={t(border ? 'Add border' : 'Add fill')} disabled={count >= 32} onClick={add}><CirclePlus size={15} /></button>
  </>}>
    {Array.from({ length: count }, (_, index) => {
      const paints = lists.map((list) => list[index]), borders = paints as (ShapeBorder | undefined)[];
      const value = <K extends keyof ShapeFill>(key: K) => commonValue(paints.map((paint) => paint?.[key]));
      const enabled = value('enabled'), opacity = value('opacity'), itemLabel = `${label} ${index+1}`;
      const position = commonValue(borders.map((b) => b?.position));
      const opacityField = <PropertyField label={t('{paint} opacity', { paint: itemLabel })} caption="" icon={<Blend size={12} />} numeric min={0} max={100} unit="%" value={opacity === undefined ? undefined : Math.round(opacity*100)} onCommit={(v) => update(index, { opacity: Number(v)/100 })} />;
      return <div className="inspector-paint-item" key={lists[0][index]?.id ?? index} data-enabled={enabled !== false}>
        <ColorControl paint outlineSwatch={border} label={itemLabel} value={value('color')} onChange={(color) => update(index, { color })}
          valueControl={border ? shapes ? <ActionMenu label={t('{paint} position', { paint: itemLabel })} className="inspector-border-position" variant="choices" icon={<><span>{position ? t(position === 'center' ? 'Center' : position === 'inside' ? 'Inside' : 'Outside') : t('Mixed')}</span><ChevronDown size={12} /></>}
            items={(['inside', 'center', 'outside'] as const).map((p) => ({ id: p, label: t(p === 'center' ? 'Center' : p === 'inside' ? 'Inside' : 'Outside'), checked: position === p, onSelect: () => update(index, { position: p }) }))} />
            : <button className="inspector-border-position" aria-label={t('{paint} position', { paint: itemLabel })} disabled><span>{t('Center')}</span><ChevronDown size={12} /></button> : undefined}
          leading={<input type="checkbox" role="switch" className="inspector-paint-enabled" aria-label={t('Show {paint}', { paint: itemLabel.toLocaleLowerCase() })} checked={enabled !== false} onChange={(e) => update(index, { enabled: e.target.checked })} />}
          actions={[
            { id: 'up', label: t('Move paint up'), icon: <ArrowUp size={14} />, separatorBefore: true, disabled: index === 0, onSelect: () => reorder(index, -1) },
            { id: 'down', label: t('Move paint down'), icon: <ArrowDown size={14} />, disabled: index === count-1, onSelect: () => reorder(index, 1) },
            { id: 'delete', label: t(border ? 'Remove border' : 'Remove fill'), icon: <Trash2 size={14} />, separatorBefore: true, onSelect: () => apply((o) => withPaints(o, border, get(o).filter((_, i) => i !== index))) },
          ]}>
          {border ? <PropertyField label={t('{paint} thickness', { paint: itemLabel })} caption="" icon={<AlignJustify size={12} />} numeric min={0.1} max={objects.every((o) => o.kind === 'highlight') ? 1000 : MAX_LINE_WIDTH}
            value={commonValue(borders.map((b) => b?.width))} onCommit={(v) => update(index, { width: Number(v) })} /> : opacityField}
        </ColorControl>
        {border && expanded && index === settingsIndex && <InspectorPopover title={t('Border settings')} anchor={settingsButton} onClose={() => setExpanded(false)}>
          {count > 1 && <PropertySelect label={t('Border')} caption={<Layers2 size={14} />} embedded value={settingsIndex} onChange={(v) => setActiveBorder(Number(v))}>
            {Array.from({ length: count }, (_, i) => <option key={i} value={i}>{`${label} ${i+1}`}</option>)}
          </PropertySelect>}
          <div className="inspector-border-options">
          <ColorControl paint label={itemLabel} caption={t('Color')} value={value('color')} onChange={(color) => update(index, { color })}>{opacityField}</ColorControl>
          <PropertySelect label={t('{paint} line style', { paint: itemLabel })} caption={t('Line style')} value={commonValue(borders.map((b) => b?.lineStyle ?? 'solid'))} onChange={(v) => update(index, { lineStyle: v as ShapeBorder['lineStyle'] })}>
            <option value="solid">{t('Solid')}</option><option value="dashed">{t('Dashed')}</option><option value="dotted">{t('Dotted')}</option>
          </PropertySelect>
          {borders.every((b) => b?.lineStyle === 'dashed') && <div className="inspector-pair">
            <PropertyField label={t('{paint} dash length', { paint: itemLabel })} caption={t('Dash')} numeric min={0.1} max={1000} value={commonValue(borders.map((b) => b?.dashLength ?? (b?.width ?? 2)*4))} onCommit={(v) => update(index, { dashLength: Number(v) })} />
            <PropertyField label={t('{paint} dash gap', { paint: itemLabel })} caption={t('Gap')} numeric min={0.1} max={1000} value={commonValue(borders.map((b) => b?.dashGap ?? (b?.width ?? 2)*2))} onCommit={(v) => update(index, { dashGap: Number(v) })} />
          </div>}
          </div>
        </InspectorPopover>}
      </div>;
    })}
  </InspectorSection>;
}
