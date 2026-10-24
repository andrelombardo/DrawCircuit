import { useState } from 'react';
import { ArrowDown, ArrowUp, CircleMinus, Columns2, Rows2, MoveHorizontal, MoveVertical, AlignVerticalJustifyCenter, Plus, X, Minus, Scan, PanelLeft, PanelRight, PanelTop, PanelBottom, Scaling } from 'lucide-react';
import { t } from '../../i18n';
import type { CircuitObject, FrameConstraint, FrameLayout, RectangleAnnotation } from '../../model/types';
import { frameSelection, parentFrame } from '../../model/shapeAppearance';
import { useEditorStore } from '../../store/editorStore';
import { measurementBounds } from '../../utils/measurementGeometry';
import { objectCenter } from '../../utils/selectionGeometry';
import { ActionMenu } from '../toolbar/ActionMenu';
import { InspectorDisclosure, InspectorSection, PropertyField, PropertySelect } from './PropertyControls';
import { objectDisplayName } from './objectName';

export function FramePosition({ object, frame }: { object: CircuitObject; frame: RectangleAnnotation }) {
  const state = () => useEditorStore.getState(), f = frame.frame!;
  const b = measurementBounds(object, state().document);
  const pin = f.constraints[object.id] ?? { horizontal: 'start', vertical: 'start' };
  const [left, top, right, bottom] = [b.x-frame.x, b.y-frame.y, frame.x+frame.width-b.x-b.width, frame.y+frame.height-b.y-b.height];
  const update = (patch: Partial<FrameConstraint>) => state().update(frame.id, (o) => o.kind === 'rectangle' && o.frame
    ? { ...o, frame: { ...o.frame, constraints: { ...o.frame.constraints, [object.id]: { ...pin, ...patch } } } } : o);
  const toggle = (axis: 'horizontal' | 'vertical', edge: 'start' | 'end') => {
    const current = pin[axis], active = current === edge || current === 'both', other = current === 'both' || current === (edge === 'start' ? 'end' : 'start');
    update({ [axis]: active ? (other ? edge === 'start' ? 'end' : 'start' : 'center') : other ? 'both' : edge });
  };
  return <div className="inspector-frame-position">
    {[
      [left, 'x', 'Distance from left', PanelLeft, false], [top, 'y', 'Distance from top', PanelTop, false],
      [right, 'x', 'Distance from right', PanelRight, true], [bottom, 'y', 'Distance from bottom', PanelBottom, true],
    ].map(([value, axis, label, Icon, reverse]) => {
      const FieldIcon = Icon as typeof PanelLeft;
      return <PropertyField key={String(label)} label={t(String(label))} caption={<FieldIcon size={13} />} embedded numeric min={-1e7} max={1e7} disabled={f.direction !== 'free'}
        value={Number(Number(value).toFixed(2))} onCommit={(v) => {
          const coordinate = axis as 'x' | 'y', delta = (Number(v)-Number(value))*(reverse ? -1 : 1);
          const current = 'x' in object ? object[coordinate] : objectCenter(object, state().document)[coordinate];
          state().position(coordinate, current+delta);
        }} />;
    })}
    <div className="inspector-pins" role="group" aria-label={t('Frame constraints')}>
      {[
        ['horizontal', 'start', 'Pin left', 4], ['horizontal', 'end', 'Pin right', 6],
        ['vertical', 'start', 'Pin top', 2], ['vertical', 'end', 'Pin bottom', 8],
      ].map(([axis, edge, label, cell]) => <button key={String(label)} className="inspector-pin" style={{ gridArea: `${Math.ceil(Number(cell)/3)} / ${(Number(cell)-1)%3+1}` }}
        aria-label={t(String(label))} title={t(String(label))} disabled={f.direction !== 'free'}
        aria-pressed={pin[axis as keyof FrameConstraint] === edge || pin[axis as keyof FrameConstraint] === 'both'}
        onClick={() => toggle(axis as keyof FrameConstraint, edge as 'start' | 'end')}><Minus size={17} style={{ transform: axis === 'horizontal' ? 'rotate(90deg)' : undefined }} /></button>)}
      <button className="inspector-pin inspector-pin-scale" aria-label={t('Scale with frame')} title={t('Scale with frame')}
        disabled={f.direction !== 'free'} aria-pressed={pin.horizontal === 'scale' && pin.vertical === 'scale'}
        onClick={() => update(pin.horizontal === 'scale' && pin.vertical === 'scale' ? { horizontal: 'start', vertical: 'start' } : { horizontal: 'scale', vertical: 'scale' })}><Scaling size={15} /></button>
    </div>
  </div>;
}

export function FrameSizing({ object }: { object: RectangleAnnotation }) {
  const f = object.frame!;
  if (f.direction === 'free') return null;
  const update = (patch: Partial<FrameLayout>) => useEditorStore.getState().update(object.id, (o) => o.kind === 'rectangle' && o.frame ? { ...o, frame: { ...o.frame, ...patch } } : o);
  return <div className="inspector-pair inspector-frame-sizing">
    <PropertySelect label={t('Frame width sizing')} caption={<MoveHorizontal size={14} />} embedded value={f.widthSizing} onChange={(v) => update({ widthSizing: v as 'fixed' | 'hug' })}>
      <option value="fixed">{t('Fixed')}</option><option value="hug">{t('Fit content')}</option>
    </PropertySelect>
    <PropertySelect label={t('Frame height sizing')} caption={<MoveVertical size={14} />} embedded value={f.heightSizing} onChange={(v) => update({ heightSizing: v as 'fixed' | 'hug' })}>
      <option value="fixed">{t('Fixed')}</option><option value="hug">{t('Fit content')}</option>
    </PropertySelect>
  </div>;
}

export function FrameSettings({ object }: { object: RectangleAnnotation }) {
  const f = object.frame!;
  const [individualPadding, setIndividualPadding] = useState(false);
  if (f.direction === 'free') return null;
  const update = (patch: Partial<FrameLayout>) => useEditorStore.getState().update(object.id, (o) => o.kind === 'rectangle' && o.frame ? { ...o, frame: { ...o.frame, ...patch } } : o);
  const paddingIcons = individualPadding ? [PanelTop, PanelRight, PanelBottom, PanelLeft] : [MoveHorizontal, MoveVertical];
  return <InspectorSection title={t('Stack')} className="inspector-stack" actions={<button className="inspector-heading-action" aria-label={t('Remove auto layout')} title={t('Remove auto layout')} onClick={() => update({ direction: 'free' })}><CircleMinus size={15} /></button>}>
    <div className="inspector-layout-direction" role="group" aria-label={t('Auto layout')}>
      {([['horizontal', Columns2, 'Horizontal stack'], ['vertical', Rows2, 'Vertical stack']] as const).map(([direction, Icon, label]) =>
        <button key={direction} aria-label={t(label)} title={t(label)} aria-pressed={f.direction === direction} onClick={() => update({ direction })}><Icon size={15} /></button>)}
    </div>
    <div className="inspector-frame-spacing">
      <PropertySelect label={t('Stack alignment')} caption={<AlignVerticalJustifyCenter size={14} />} embedded value={f.align} onChange={(v) => update({ align: v as FrameLayout['align'] })}>
        <option value="start">{t('Start')}</option><option value="center">{t('Center')}</option><option value="end">{t('End')}</option><option value="stretch">{t('Stretch')}</option>
      </PropertySelect>
      <PropertyField label={t('Item spacing')} caption={f.direction === 'horizontal' ? <MoveHorizontal size={14} /> : <MoveVertical size={14} />} embedded numeric min={0} max={1e7} value={f.gap} onCommit={(v) => update({ gap: Number(v) })} />
    </div>
    <div className="inspector-padding-heading"><span>{t('Padding')}</span><button className="inspector-heading-action" aria-label={t('Individual padding')} title={t('Individual padding')} aria-pressed={individualPadding} onClick={() => setIndividualPadding(!individualPadding)}><Scan size={14} /></button></div>
    <div className="inspector-pair inspector-padding-fields">
      {(individualPadding ? ['Top', 'Right', 'Bottom', 'Left'] : ['Horizontal', 'Vertical']).map((side, i) => {
        const Icon = paddingIcons[i];
        return <PropertyField key={side} label={t('{side} padding', { side: t(side) })} caption={<Icon size={14} />} embedded numeric min={0} max={1e7}
          value={individualPadding ? f.padding[i] : f.padding[i === 0 ? 1 : 0]}
          onCommit={(v) => update({ padding: f.padding.map((p, index) => (individualPadding ? index === i : index%2 === (i === 0 ? 1 : 0)) ? Number(v) : p) as FrameLayout['padding'] })} />;
      })}
    </div>
    <FrameContents object={object} />
  </InspectorSection>;
}

export function FrameContents({ object }: { object: RectangleAnnotation }) {
  const doc = useEditorStore((s) => s.document), f = object.frame!;
  const update = (patch: Partial<FrameLayout>) => useEditorStore.getState().update(object.id, (o) => o.kind === 'rectangle' && o.frame ? { ...o, frame: { ...o.frame, ...patch } } : o);
  const excluded = new Set(frameSelection(doc, [object.id]));
  let ancestor = parentFrame(doc, object.id);
  while (ancestor) { excluded.add(ancestor.id); ancestor = parentFrame(doc, ancestor.id); }
  const available = doc.objects.filter((o) => !excluded.has(o.id) && !parentFrame(doc, o.id));
  return <InspectorDisclosure title={t('Contents ({count})', { count: f.children.length })}>
      <PropertyField label={t('Frame name')} value={f.name} onCommit={(name) => { if (name.trim()) update({ name: name.trim().slice(0, 80) }); }} />
      <div className="inspector-frame-children">
        {f.children.map((id, index) => {
          const child = doc.objects.find((o) => o.id === id);
          if (!child) return null;
          const reorder = (delta: number) => { const children = [...f.children]; [children[index], children[index+delta]] = [children[index+delta], children[index]]; update({ children }); };
          return <div className="inspector-frame-child" key={id}>
            <button onClick={() => useEditorStore.getState().select([id])}>{objectDisplayName(child)}</button>
            <button aria-label={t('Move up')} title={t('Move up')} disabled={!index} onClick={() => reorder(-1)}><ArrowUp size={12} /></button>
            <button aria-label={t('Move down')} title={t('Move down')} disabled={index === f.children.length-1} onClick={() => reorder(1)}><ArrowDown size={12} /></button>
            <button aria-label={t('Remove from frame')} title={t('Remove from frame')} onClick={() => update({ children: f.children.filter((c) => c !== id), constraints: Object.fromEntries(Object.entries(f.constraints).filter(([key]) => key !== id)) })}><X size={12} /></button>
          </div>;
        })}
        <ActionMenu label={t('Add to frame')} className="inspector-add-child" icon={<><Plus size={13} /><span>{t('Add to frame')}</span></>}
          items={available.length ? available.map((o) => ({ id: o.id, label: objectDisplayName(o), onSelect: () => update({ children: [...f.children, o.id] }) })) : [{ id: 'none', label: t('No available elements'), disabled: true }]} />
      </div>
    </InspectorDisclosure>;
}
