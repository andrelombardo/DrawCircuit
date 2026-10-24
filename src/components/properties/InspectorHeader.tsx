import { useShallow } from 'zustand/react/shallow';
import { DraftingCompass, ArrowRight, Braces, Cable, Circle, CircleDot, Eraser, Frame, Highlighter, Layers2, Minus, Zap, RectangleHorizontal, RotateCw, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { t } from '../../i18n';
import { componentRegistry } from '../../model/catalog';
import type { CircuitObject } from '../../model/types';
import { objectTypeName } from './objectName';
import { useEditorStore } from '../../store/editorStore';
import { ComponentPreview } from '../palette/ComponentPreview';

const objectIcons: Record<CircuitObject['kind'], LucideIcon> = {
  angle: DraftingCompass, component: RectangleHorizontal, junction: CircleDot, wire: Cable, text: Type,
  arrow: ArrowRight, 'loop-arrow': RotateCw, electrical: Zap, brace: Braces,
  rectangle: RectangleHorizontal, circle: Circle, line: Minus, highlight: Highlighter,
};

export function InspectorHeader() {
  const objects = useEditorStore(
    useShallow((s) => {
      const ids = new Set(s.selection);
      return s.document.objects.filter((object) => ids.has(object.id));
    }),
  );
  const tool = useEditorStore((s) => s.tool);
  const activeLabel = useEditorStore((s) => s.activeLabel);
  const object = objects.length === 1 ? objects[0] : null;
  const contextual = objects.length > 0 || tool === 'highlight' || tool === 'highlight-eraser';
  let title = t('Properties');
  if (tool === 'highlight-eraser') title = t('Highlight eraser');
  else if (tool === 'highlight') title = t('Highlighter');
  else if (activeLabel) title = t('Selected label');
  else if (object)
    title = objectTypeName(object);
  else if (objects.length)
    title = t(objects.every((object) => object.kind === 'highlight')
      ? '{count} highlights' : '{count} selected elements', { count: objects.length });
  const Icon = tool === 'highlight-eraser' ? Eraser : tool === 'highlight' ? Highlighter : activeLabel ? Type :
    object?.kind === 'rectangle' && object.frame ? Frame : object ? objectIcons[object.kind] : Layers2;
  const component = object?.kind === 'component' && !activeLabel && tool !== 'highlight' && tool !== 'highlight-eraser' ? object : null;
  const definition = component ? componentRegistry[component.type] : null;
  const componentCategory = definition?.name.match(/^(AC|DC)\b/)?.[1] ?? (definition ? t(definition.group) : '');
  return (
    <div className="inspector-header" data-contextual={contextual || undefined} data-component={component ? true : undefined}>
      <div className="inspector-header-title">
        {contextual && <span className="inspector-object-icon" data-component={component ? true : undefined} aria-hidden="true">
          {definition ? <ComponentPreview component={definition} /> : <Icon size={22} />}
        </span>}
        {component ? <div className="inspector-component-details">
          <h2>{title}</h2>
          <p>{t('Component')} · {componentCategory}</p>
        </div> : <h2>{title}</h2>}
      </div>
    </div>
  );
}
