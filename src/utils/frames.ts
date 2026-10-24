import { makeId } from '../model/catalog';
import type { CircuitDocument, CircuitObject, FrameConstraint, FrameLayout, RectangleAnnotation } from '../model/types';
import { frameSelection, parentFrame } from '../model/shapeAppearance';
import { measurementBounds } from './measurementGeometry';
import { unionBounds } from './visualBounds';
import { moveSelection } from './operations';

export const defaultFrame = (children: string[] = []): FrameLayout => ({
  name: 'Frame', children, constraints: {}, direction: 'free', gap: 16,
  padding: [16, 16, 16, 16], align: 'start', widthSizing: 'fixed', heightSizing: 'fixed',
});
export function createFrame(doc: CircuitDocument, ids: string[]): CircuitDocument {
  const selected = new Set(ids), b = unionBounds(doc.objects.filter((o) => selected.has(o.id)).map((o) => measurementBounds(o, doc)));
  if (!selected.size) return doc;
  const roots = [...selected].filter((id) => !ids.some((ancestor) => ancestor !== id && frameSelection(doc, [ancestor]).includes(id)));
  const rootIds = new Set(roots);
  const frame: RectangleAnnotation = { kind: 'rectangle', id: makeId(), x: b.x - 24, y: b.y - 24,
    width: Math.max(1, b.width + 48), height: Math.max(1, b.height + 48), color: '#b6b6bc', strokeWidth: 1,
    fill: 'none', frame: defaultFrame(roots),
  };
  return { ...doc, objects: [frame, ...doc.objects.map((o) => o.kind === 'rectangle' && o.frame
    ? { ...o, frame: { ...o.frame, children: o.frame.children.filter((id) => !rootIds.has(id)),
      constraints: Object.fromEntries(Object.entries(o.frame.constraints).filter(([id]) => !rootIds.has(id))) } } : o)] };
}
export function convertToFrame(doc: CircuitDocument, rectangle: RectangleAnnotation): CircuitDocument {
  const children = doc.objects.filter((o) => {
    if (o.id === rectangle.id || parentFrame(doc, o.id)) return false;
    const b = measurementBounds(o, doc);
    return b.x >= rectangle.x && b.y >= rectangle.y && b.x+b.width <= rectangle.x+rectangle.width && b.y+b.height <= rectangle.y+rectangle.height;
  }).map((o) => o.id);
  return { ...doc, objects: doc.objects.map((o) => o.id === rectangle.id
    ? { ...rectangle, rotation: 0, frame: defaultFrame(children) } : o) };
}

/** Frame membership is explicit. Electrical routes keep the editor's existing
 * topology-aware move semantics, including routes crossing the frame boundary. */
export function reconcileFrames(previous: CircuitDocument, next: CircuitDocument, preserveChildren = false): CircuitDocument {
  let doc = next;
  const existing = new Set(doc.objects.map((o) => o.id));
  doc = { ...doc, objects: doc.objects.map((o) => {
    if (o.kind !== 'rectangle' || !o.frame) return o;
    const children = o.frame.children.filter((id) => existing.has(id));
    return children.length === o.frame.children.length ? o : { ...o, frame: { ...o.frame, children,
      constraints: Object.fromEntries(Object.entries(o.frame.constraints).filter(([id]) => existing.has(id))) } };
  }) };
  const oldIds = new Set(previous.objects.map((o) => o.id));
  for (const o of doc.objects) {
    if (oldIds.has(o.id) || parentFrame(doc, o.id)) continue;
    const bounds = measurementBounds(o, doc), descendants = new Set(frameSelection(doc, [o.id]));
    const frame = doc.objects.filter((candidate): candidate is RectangleAnnotation => candidate.kind === 'rectangle' && !!candidate.frame &&
      oldIds.has(candidate.id) && !descendants.has(candidate.id) && bounds.x >= candidate.x && bounds.y >= candidate.y &&
      bounds.x+bounds.width <= candidate.x+candidate.width && bounds.y+bounds.height <= candidate.y+candidate.height)
      .sort((a, b) => a.width*a.height-b.width*b.height)[0];
    if (frame?.frame) doc = { ...doc, objects: doc.objects.map((item) => item.id === frame.id
      ? { ...frame, frame: { ...frame.frame!, children: [...frame.frame!.children, o.id] } } : item) };
  }
  const lookup = (id: string) => doc.objects.find((o) => o.id === id);
  const replace = (o: CircuitObject) => { doc = { ...doc, objects: doc.objects.map((item) => item.id === o.id ? o : item) }; };
  const move = (id: string, x: number, y: number) => {
    if (Math.abs(x) + Math.abs(y) > 1e-8) doc = moveSelection(doc, [id], { x, y });
  };
  const size = (id: string, width: number, height: number) => {
    const o = lookup(id);
    if (o && (o.kind === 'rectangle' || o.kind === 'circle')) {
      const w = Math.max(1, width), h = o.kind === 'circle' ? w : Math.max(1, height);
      if (w !== o.width || h !== o.height) replace({ ...o, width: w, height: h });
    }
  };
  const roots = () => doc.objects.filter((o) => o.kind === 'rectangle' && o.frame && !parentFrame(doc, o.id));
  const constrain = (id: string, baseline: CircuitDocument, depth = 0) => {
    if (depth > 32) return;
    const f = lookup(id), before = baseline.objects.find((o) => o.id === id);
    if (f?.kind !== 'rectangle' || !f.frame) return;
    if (before?.kind === 'rectangle' && before.frame && f.frame.direction === 'free' &&
      (f.x !== before.x || f.y !== before.y || f.width !== before.width || f.height !== before.height)) {
      for (const childId of f.frame.children) {
        const child = lookup(childId), old = baseline.objects.find((o) => o.id === childId);
        if (!child || !old || (child !== old && f.width === before.width && f.height === before.height)) continue;
        const b = measurementBounds(old, baseline), current = measurementBounds(child, doc), c = f.frame.constraints[childId] ?? { horizontal: 'start', vertical: 'start' };
        const axis = (at: number, length: number, oldAt: number, oldLength: number, nowAt: number, nowLength: number, pin: FrameConstraint['horizontal']) => {
          const relative = at - oldAt, delta = nowLength - oldLength;
          return pin === 'scale' ? [nowAt + relative * nowLength / oldLength, length * nowLength / oldLength] :
            [nowAt + relative + (pin === 'end' ? delta : pin === 'center' ? delta / 2 : 0), length + (pin === 'both' ? delta : 0)];
        };
        const [x, w] = axis(b.x, b.width, before.x, before.width, f.x, f.width, c.horizontal);
        const [y, h] = axis(b.y, b.height, before.y, before.height, f.y, f.height, c.vertical);
        size(childId, w, h);
        move(childId, x-current.x, y-current.y);
      }
    }
    f.frame.children.forEach((child) => constrain(child, baseline, depth+1));
  };
  if (!preserveChildren) roots().forEach((f) => constrain(f.id, previous));
  const layout = (id: string, depth = 0) => {
    if (depth > 32) return;
    let f = lookup(id);
    if (f?.kind !== 'rectangle' || !f.frame) return;
    f.frame.children.forEach((child) => layout(child, depth+1));
    f = lookup(id) as RectangleAnnotation;
    const config = f.frame!;
    if (config.direction === 'free' || !config.children.length) return;
    const children = config.children.flatMap((childId) => {
      const o = lookup(childId);
      return o ? [{ id: childId, b: measurementBounds(o, doc) }] : [];
    });
    const horizontal = config.direction === 'horizontal', [top, right, bottom, left] = config.padding;
    const main = children.reduce((sum, child) => sum + (horizontal ? child.b.width : child.b.height), 0) + config.gap * Math.max(0, children.length-1);
    const cross = Math.max(0, ...children.map((child) => horizontal ? child.b.height : child.b.width));
    size(id, config.widthSizing === 'hug' ? (horizontal ? main : cross) + left+right : f.width,
      config.heightSizing === 'hug' ? (horizontal ? cross : main) + top+bottom : f.height);
    f = lookup(id) as RectangleAnnotation;
    let cursor = horizontal ? f.x+left : f.y+top;
    const start = horizontal ? f.y+top : f.x+left, available = Math.max(1, horizontal ? f.height-top-bottom : f.width-left-right);
    for (const child of children) {
      const length = horizontal ? child.b.height : child.b.width;
      const crossPosition = start + (config.align === 'center' ? (available-length)/2 : config.align === 'end' ? available-length : 0);
      if (config.align === 'stretch') size(child.id, horizontal ? child.b.width : available, horizontal ? available : child.b.height);
      move(child.id, (horizontal ? cursor : crossPosition)-child.b.x, (horizontal ? crossPosition : cursor)-child.b.y);
      cursor += (horizontal ? child.b.width : child.b.height)+config.gap;
    }
  };
  const beforeLayout = doc;
  roots().forEach((f) => layout(f.id));
  roots().forEach((f) => constrain(f.id, beforeLayout));
  roots().forEach((f) => layout(f.id));
  return doc;
}
