import { t } from '../../i18n';
import type { CircuitObject } from '../../model/types';
import { componentRegistry } from '../../model/catalog';
const names: Record<CircuitObject['kind'], string> = {
  angle: 'Angle', component: 'Component', junction: 'Junction', wire: 'Electrical wire', text: 'Text', arrow: 'Arrow',
  'loop-arrow': 'Loop', electrical: 'Electrical annotation', brace: 'Brace / Bracket', rectangle: 'Rectangle',
  circle: 'Circle', line: 'Decorative line', highlight: 'Highlighter',
};
export const objectTypeName = (o: CircuitObject) => o.kind === 'rectangle' && o.frame ? o.frame.name :
  t(o.kind === 'component' ? componentRegistry[o.type].name : names[o.kind]);
export const objectDisplayName = (o: CircuitObject) => o.kind === 'text' ? o.text || t('Text') :
  'label' in o && o.label.text ? o.label.text : objectTypeName(o);
