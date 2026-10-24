import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Blend, Check, ChevronDown, CirclePlus as Plus, Paintbrush, Unlink, X } from 'lucide-react';
import { t } from '../../i18n';
import type { CircuitObject } from '../../model/types';
import { applyObjectStyle, objectStyle, styleKind, styleSignature, useStyleLibrary } from '../../styles/library';
import { useEditorStore } from '../../store/editorStore';
import { ActionMenu } from '../toolbar/ActionMenu';
import { InspectorSection, PropertyField } from './PropertyControls';
import { commonValue } from './commonValue';
import { objectTypeName } from './objectName';

export function ObjectStyleSection({ objects, apply, children }: {
  objects: CircuitObject[]; apply: (fn: (o: CircuitObject) => CircuitObject) => void; children?: ReactNode;
}) {
  const styles = useStyleLibrary((s) => s.styles), error = useStyleLibrary((s) => s.error);
  const [creating, setCreating] = useState(false), [name, setName] = useState(''), [failure, setFailure] = useState('');
  const createButton = useRef<HTMLButtonElement>(null);
  const first = objects[0], kind = styleKind(first), sameKind = objects.every((o) => styleKind(o) === kind);
  const canCreate = sameKind && objects.every((o) => styleSignature(objectStyle(o)) === styleSignature(objectStyle(first)));
  const styleId = commonValue(objects.map((o) => o.styleId)), selected = styles.find((s) => s.id === styleId);
  const availableStyles = styles.filter((s) => sameKind && s.kind === kind);
  const modified = !!selected && objects.some((o) => styleSignature(objectStyle(o)) !== styleSignature(selected.value));
  const opacity = commonValue(objects.map((o) => o.styleOpacity ?? 1));
  const create = () => { setName(t('{name} Style', { name: objectTypeName(first) }).slice(0, 80)); setFailure(''); setCreating(true); };
  const closeCreate = () => { setCreating(false); requestAnimationFrame(() => createButton.current?.focus({ preventScroll: true })); };
  return <InspectorSection title={t('Style')} className="inspector-object-style" actions={
    <button ref={createButton} className="inspector-heading-action" title={t('Create style')} aria-label={t('Create style')} aria-expanded={creating} disabled={!canCreate || creating} onClick={create}><Plus size={16} /></button>
  }>
    {!creating && (availableStyles.length || selected ? <ActionMenu label={t('Layer style')} className="inspector-saved-style" variant="choices" icon={<><Paintbrush size={15} /><span>{selected ? `${selected.name}${modified ? ' *' : ''}` : t('No Layer Style')}</span><ChevronDown size={12} /></>}
      items={[
        ...availableStyles.map((s) => ({ id: s.id, label: s.name, checked: styleId === s.id,
          onSelect: () => apply((o) => applyObjectStyle(o, s.value, s.id)) })),
        ...(selected ? [
          { id: 'update', label: t('Update saved style'), disabled: !modified, separatorBefore: true, onSelect: () => {
            useStyleLibrary.getState().save(selected.name, first, selected.id);
            const state = useEditorStore.getState();
            state.commit({ ...state.document, objects: state.document.objects.map((o) => o.styleId === selected.id
              ? applyObjectStyle(o, objectStyle(first), selected.id) : o) });
          } },
          { id: 'detach', label: t('Detach style'), icon: <Unlink size={14} />, onSelect: () => apply((o) => ({ ...o, styleId: undefined })) },
          { id: 'remove', label: t('Delete saved style'), onSelect: () => {
            useStyleLibrary.getState().remove(selected.id);
            const state = useEditorStore.getState();
            state.commit({ ...state.document, objects: state.document.objects.map((o) => o.styleId === selected.id ? { ...o, styleId: undefined } : o) });
          } },
        ] : []),
      ]} /> : <div className="inspector-saved-style"><Paintbrush size={15} aria-hidden="true" /><span>{t('No Layer Style')}</span></div>)}
    {creating && <form className="inspector-style-create" aria-label={t('Create style')} onKeyDown={(e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeCreate(); }
    }} onSubmit={(e) => {
      e.preventDefault();
      try { const id = useStyleLibrary.getState().save(name, first); apply((o) => ({ ...o, styleId: id })); closeCreate(); }
      catch (error) { setFailure(error instanceof Error ? error.message : t('Unable to save style.')); }
    }}>
      <input autoFocus required maxLength={80} aria-label={t('Style name')} placeholder={t('Style name')} value={name} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setName(e.target.value)} />
      <button className="inspector-heading-action" type="submit" aria-label={t('Save')} title={t('Save')}><Check size={16} /></button>
      <button type="button" className="inspector-heading-action" aria-label={t('Cancel')} title={t('Cancel')} onClick={closeCreate}><X size={15} /></button>
      {failure && <span role="alert">{failure}</span>}
    </form>}
    <div className="inspector-layer-opacity">
      <PropertyField label={t('Layer opacity')} caption={t('Opacity')} embedded icon={<Blend size={12} />} numeric min={0} max={100} unit="%" value={opacity === undefined ? undefined : Math.round(opacity*100)} onCommit={(v) => apply((o) => ({ ...o, styleOpacity: Number(v)/100 }))} />
    </div>
    {children}
    {error && <p role="status" className="inspector-note">{error}</p>}
  </InspectorSection>;
}
