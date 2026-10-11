import { braceGeometry } from '../annotations/brace';
import { electricalDrawingGeometry } from '../annotations/electrical';
import type { CircuitDocument, CircuitObject, Label, Point, Rotation } from '../model/types';
import { add } from './geometry';

export type LabelObject = Extract<CircuitObject, { label: Label }>;
export function hasAssociatedLabel(object: CircuitObject): object is LabelObject {
  return 'label' in object;
}

export interface InlineTextTarget {
  id: string;
  text: string;
  point: Point;
  color: string;
  opacity?: number;
  fontSize: number;
  rotation: Rotation;
  align: 'start' | 'middle' | 'end';
}

/** One editor target for text and every associated label, using their rendered anchor. */
export function inlineTextTarget(
  object: CircuitObject | null | undefined,
  doc: CircuitDocument,
): InlineTextTarget | null {
  if (!object) return null;
  if (object.kind === 'text') {
    return {
      id: object.id,
      text: object.text,
      point: { x: object.x, y: object.y },
      color: object.color,
      opacity: object.opacity,
      fontSize: object.fontSize,
      rotation: object.rotation,
      align: object.align,
    };
  }
  if (!hasAssociatedLabel(object)) return null;
  const electrical = object.kind === 'electrical' ? electricalDrawingGeometry(object, doc) : null;
  const point =
    object.kind === 'electrical'
      ? electrical!.labelPoint
      : object.kind === 'brace'
        ? braceGeometry(object).labelPoint
        : add(object, object.label.offset);
  return {
    id: object.id,
    text: object.label.text,
    point,
    color: object.label.color,
    opacity: object.label.opacity,
    fontSize: electrical?.labelFontSize ?? object.label.fontSize,
    rotation: object.label.rotation,
    align: 'middle',
  };
}

/** Preserve identity on an unchanged edit so blur and canvas clicks cannot add empty undo steps. */
export function replaceInlineText(object: CircuitObject, text: string): CircuitObject {
  if (object.kind === 'text') return object.text === text ? object : { ...object, text };
  if (!hasAssociatedLabel(object) || object.label.text === text) return object;
  return { ...object, label: { ...object.label, text } };
}

/** A label selection only changes its offset; its owner and connected geometry stay untouched. */
export function moveLabel(doc: CircuitDocument, id: string, delta: Point): CircuitDocument {
  if (!delta.x && !delta.y) return doc;
  return {
    ...doc,
    objects: doc.objects.map((object) =>
      object.id === id && hasAssociatedLabel(object)
        ? {
            ...object,
            label: { ...object.label, offset: add(object.label.offset, delta) },
          }
        : object,
    ),
  };
}
