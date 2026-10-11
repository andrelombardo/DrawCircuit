import { componentRegistry } from '../../model/catalog';
import type { CircuitObject } from '../../model/types';
/** Shared audit/mapping keeps properties specific to the selected object. */
export function toolbarActions(o: CircuitObject | null) {
  if (!o)
    return {
      primary: ['style', 'rotate', 'duplicate'],
      secondary: ['saveBlock', 'copyPNG', 'delete'],
    };
  const common = ['duplicate'];
  const secondary = ['saveBlock', 'copyPNG', 'delete'];
  switch (o.kind) {
    case 'component':
      return {
        primary: ['label', 'style', 'rotate', ...common],
        secondary: [
          ...secondary,
          ...(componentRegistry[o.type].internalText !== undefined ? ['bodyText'] : []),
        ],
      };
    case 'brace':
      return { primary: ['label', 'style', 'rotate', 'flip', ...common], secondary };
    case 'electrical':
      return {
        primary: ['label', 'style', 'reverse', ...common],
        secondary: [...secondary, 'annotationOffset'],
      };
    case 'junction':
      return {
        primary: ['label', 'style', ...common],
        secondary,
      };
    case 'text':
      return { primary: ['style', ...common], secondary: [...secondary, 'alignment'] };
    case 'rectangle':
    case 'line':
    case 'wire':
      return { primary: ['style', ...common], secondary };
    case 'arrow':
      return { primary: ['style', 'reverse', ...common], secondary: [...secondary, 'arrowType'] };
    case 'loop-arrow':
      return { primary: ['style', 'reverse', ...common], secondary };
  }
}
