// @vitest-environment jsdom
import { openSelectionMenu, chooseSelectionCommand } from './helpers/selectionMenu';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Canvas } from '../src/components/editor/Canvas';
import { createComponent } from '../src/model/catalog';
import { createJunction, createWire } from '../src/model/factories';
import { emptyDocument } from '../src/model/demo';
import type { ArrowAnnotation, CircuitObject, LoopArrow } from '../src/model/types';
import { useEditorStore } from '../src/store/editorStore';
import { arrowCenter, rotateArrow, rotationHandle } from '../src/utils/arrows';
import { add, rotatePoint, wirePoints } from '../src/utils/geometry';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
const state = () => useEditorStore.getState();
const canvas = () => screen.getByTestId('circuit-canvas');
function client(x: number, y: number) {
  const [tx, ty, zoom] = canvas()
    .querySelector(':scope > g')!
    .getAttribute('transform')!
    .match(/-?\d+(?:\.\d+)?/g)!
    .map(Number);
  return { clientX: tx + x * zoom, clientY: ty + y * zoom, button: 0, pointerId: 1 };
}
const zoom = () =>
  Number(
    canvas()
      .querySelector(':scope > g')!
      .getAttribute('transform')!
      .match(/scale\(([^)]+)/)![1],
  );
function click(x: number, y: number, target: Element = canvas(), extra = {}) {
  fireEvent.pointerDown(target, { ...client(x, y), ...extra });
  fireEvent.pointerUp(canvas(), client(x, y));
}
function load(objects: CircuitObject[], selection: string[] = []) {
  useEditorStore.setState({ document: { ...emptyDocument(), objects }, selection });
  render(<Canvas />);
}
const curve: ArrowAnnotation = {
  kind: 'arrow',
  id: 'curve',
  type: 'curve',
  start: { x: -80, y: 0 },
  end: { x: 80, y: 0 },
  controlPoints: [
    { x: -30, y: -80 },
    { x: 70, y: 30 },
  ],
  color: '#171a20',
  width: 2,
  reversed: false,
};
const loop: LoopArrow = {
  kind: 'loop-arrow',
  id: 'loop',
  x: -90,
  y: -40,
  width: 180,
  height: 80,
  direction: 'clockwise',
  arrowPosition: 0.19,
  color: '#171a20',
  strokeWidth: 2,
};
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'PointerEvent',
    class extends MouseEvent {
      pointerId = 1;
    },
  );
  for (const name of ['setPointerCapture', 'releasePointerCapture'])
    Object.defineProperty(Element.prototype, name, { configurable: true, value: vi.fn() });
  Object.defineProperty(Element.prototype, 'hasPointerCapture', {
    configurable: true,
    value: () => false,
  });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 1200,
    bottom: 800,
    width: 1200,
    height: 800,
    toJSON: () => ({}),
  });
  useEditorStore.setState({
    document: emptyDocument(),
    selection: [],
    activeLabel: null,
    tool: 'select',
    past: [],
    future: [],
    gestureStart: null,
    wireRouting: 'orthogonal',
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('complete canvas gestures', () => {
  it('inserts five nodes without Shift, keeps its toolbar icon active, deduplicates and exits on Escape', () => {
    load([]);
    fireEvent.keyDown(canvas(), { key: 'n' });
    for (let i = 0; i < 5; i++) click(i * 60, 0);
    expect(state().tool).toBe('junction');
    expect(state().document.objects).toHaveLength(5);
    expect(state().past).toHaveLength(5);
    expect(
      screen.getByRole('button', { name: 'Disegno e annotazioni' }).getAttribute('aria-pressed'),
    ).toBe('true');
    click(240, 0);
    expect(state().past).toHaveLength(5);
    expect(state().document.objects).toHaveLength(5);
    fireEvent.keyDown(canvas(), { key: 'Escape' });
    expect(state().tool).toBe('select');
    act(() => state().undo());
    expect(state().document.objects).toHaveLength(4);
  });
  it('renames with a rendered math preview, confirms once, cancels and undoes', () => {
    const node = { ...createJunction({ x: 0, y: 0 }, 'A'), id: 'node' };
    load([node]);
    const original = state().document;
    fireEvent.doubleClick(canvas().querySelector('[data-label="node"]')!);
    let input = screen.getByLabelText('Modifica testo sul foglio');
    fireEvent.change(input, { target: { value: 'i_1' } });
    expect(document.querySelector('.inline-render .katex')).toBeTruthy();
    expect(state().document).toBe(original);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(state().document.objects[0]).toMatchObject({ label: { text: 'i_1' } });
    expect(state().past).toHaveLength(1);
    fireEvent.keyDown(canvas(), { key: 'Enter' });
    input = screen.getByLabelText('Modifica testo sul foglio');
    fireEvent.change(input, { target: { value: 'discard' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(state().past).toHaveLength(1);
    expect(state().document.objects[0]).toMatchObject({ label: { text: 'i_1' } });
    act(() => state().undo());
    expect(state().document).toEqual(original);
  });
  it('replaces a mixed multi-selection in one action and preserves noncomponents', () => {
    const components = Array.from({ length: 5 }, (_, i) => ({
      ...createComponent('resistor', { x: i * 100, y: 0 }),
      id: `r${i}`,
    }));
    const node = createJunction({ x: 0, y: 80 }, 'A');
    load([...components, node]);
    components.forEach((c, i) =>
      click(
        c.x,
        c.y,
        canvas().querySelector(`[data-layer="components"] [data-object="${c.id}"] .object-hit`)!,
        i ? { shiftKey: true } : {},
      ),
    );
    click(
      node.x,
      node.y,
      canvas().querySelector(`[data-layer="junctions"] [data-object="${node.id}"]`)!,
      { shiftKey: true },
    );
    expect(state().selection).toHaveLength(6);

    chooseSelectionCommand('Sostituisci componenti…');
    fireEvent.change(screen.getByLabelText('Cerca sostituzione'), {
      target: { value: 'condensatore' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Condensatore' }));
    expect(
      state()
        .document.objects.filter((o) => o.kind === 'component')
        .every((o) => o.type === 'capacitor'),
    ).toBe(true);
    expect(state().document.objects.at(-1)).toBe(node);
    expect(state().past).toHaveLength(1);
    act(() => state().undo());
    expect(state().document.objects).toEqual([...components, node]);
  });
  it('omits batch replacement when a marquee selects incompatible components', () => {
    const a = { ...createComponent('resistor', { x: -60, y: 0 }), id: 'a' },
      b = { ...createComponent('npn', { x: 60, y: 0 }), id: 'b' };
    load([a, b]);
    fireEvent.pointerDown(canvas(), client(-150, -100));
    fireEvent.pointerMove(canvas(), client(150, 100));
    fireEvent.pointerUp(canvas(), client(150, 100));
    expect(state().selection).toHaveLength(2);

    openSelectionMenu();
    expect(screen.queryByRole('menuitem', { name: 'Sostituisci…' })).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Salva come blocco' })).toBeDefined();
    expect(state().past).toHaveLength(0);
  });
  it('edits opacity percentages locally and commits one undo; label alpha stays independent', () => {
    const c = { ...createComponent('resistor', { x: 0, y: 0 }), id: 'a' },
      j = { ...createJunction({ x: 100, y: 0 }, 'B'), id: 'b' };
    load([c, j], ['a', 'b']);
    const original = state().document;

    const opacity = screen.getByLabelText('Opacità simbolo');
    opacity.focus();
    for (const value of ['80', '50', '0']) fireEvent.change(opacity, { target: { value } });
    expect(state().past).toHaveLength(0);
    expect(state().document).toEqual(original);
    expect(
      state().document.objects.every((o) => 'label' in o && o.label.opacity === undefined),
    ).toBe(true);
    fireEvent.blur(opacity);
    expect(state().document.objects.every((o) => o.opacity === 0)).toBe(true);
    expect(state().past).toHaveLength(1);
    act(() => state().undo());
    expect(state().document).toEqual(original);
  });
  it('cycles overlapping labels with Option-click, drags and nudges only the label', () => {
    const a = { ...createJunction({ x: 0, y: 0 }, 'A'), id: 'a' },
      b = { ...createJunction({ x: 40, y: 0 }, 'B'), id: 'b' };
    a.label.offset = { x: 20, y: 0 };
    b.label.offset = { x: -20, y: 0 };
    const wire = createWire(
      { kind: 'junction', junctionId: 'a' },
      { kind: 'junction', junctionId: 'b' },
    );
    load([a, b, wire]);
    const first = canvas().querySelector('[data-label="b"]')!,
      second = canvas().querySelector('[data-label="a"]')!;
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [first, second],
    });
    click(20, 0, first, { altKey: true });
    expect(state().activeLabel).toBe('b');
    click(20, 0, first, { altKey: true });
    expect(state().activeLabel).toBe('a');
    fireEvent.pointerDown(second, client(20, 0));
    fireEvent.pointerMove(canvas(), client(33, 7));
    fireEvent.pointerUp(canvas(), client(33, 7));
    fireEvent.keyDown(canvas(), { key: 'ArrowRight' });
    fireEvent.keyUp(canvas(), { key: 'ArrowRight' });
    expect(state().document.objects[0]).toMatchObject({
      x: 0,
      y: 0,
      label: { offset: { x: 34, y: 7 } },
    });
    expect(state().document.objects[1]).toBe(b);
    expect(state().document.objects[2]).toBe(wire);
  });
  it.each([false, true])(
    'routes and drags a real diagonal; Shift+W changes preview routing: %s',
    (free) => {
      const a = createJunction({ x: 0, y: 0 }, 'A'),
        b = createJunction({ x: 200, y: 200 }, 'B');
      load([a, b]);
      fireEvent.keyDown(canvas(), { key: 'w' });
      fireEvent.click(screen.getByRole('button', { name: free ? 'Libero' : '45°' }));
      click(0, 0);
      fireEvent.pointerMove(canvas(), client(200, 200));
      click(200, 200);
      const wire = state().document.objects.find((o) => o.kind === 'wire')!;
      expect(wire.routing).toBe(free ? 'free' : '45');
      expect(wirePoints(wire, state().document)).toHaveLength(2);
      fireEvent.keyDown(canvas(), { key: 'v' });
      fireEvent.pointerDown(
        canvas().querySelector(`[data-layer="wires"] [data-object="${wire.id}"]`)!,
        client(100, 100),
      );
      fireEvent.pointerMove(canvas(), client(80, 120));
      fireEvent.pointerUp(canvas(), client(80, 120));
      const changed = state().document.objects.find((o) => o.id === wire.id)!;
      expect(changed).toMatchObject({
        routing: wire.routing,
        startEndpoint: wire.startEndpoint,
        endEndpoint: wire.endEndpoint,
      });
      expect(state().past).toHaveLength(2);
      act(() => state().undo());
      expect(state().document.objects.find((o) => o.id === wire.id)).toEqual(wire);
    },
  );
  it.each([curve, loop])(
    'rotates $kind with the mouse under zoom/pan, snaps with Shift, cancels and undoes',
    (arrow) => {
      const other = arrow.kind === 'arrow' ? loop : curve;
      load([arrow, other], [arrow.id]);
      fireEvent.click(screen.getByRole('button', { name: 'Aumenta zoom' }));
      fireEvent.pointerDown(canvas(), { ...client(200, 200), button: 1 });
      fireEvent.pointerMove(canvas(), { ...client(230, 220), button: 1 });
      fireEvent.pointerUp(canvas(), client(230, 220));
      const original = state().document;
      const c = arrowCenter(arrow),
        handle = rotationHandle(arrow, zoom());
      fireEvent.pointerMove(canvas(), client(c.x, c.y));
      let knob = canvas().querySelector('[data-handle="rotate"]')!;
      expect(knob).toBeTruthy();
      const rotatedPoint = add(c, rotatePoint({ x: handle.x - c.x, y: handle.y - c.y }, 37.2));
      fireEvent.pointerDown(knob, client(handle.x, handle.y));
      fireEvent.pointerMove(canvas(), client(rotatedPoint.x, rotatedPoint.y));
      expect(state().past).toHaveLength(0);
      fireEvent.keyDown(canvas(), { key: 'Escape' });
      expect(state().document).toBe(original);
      act(() => state().select([arrow.id]));
      fireEvent.pointerMove(canvas(), client(c.x, c.y));
      knob = canvas().querySelector('[data-handle="rotate"]')!;
      fireEvent.pointerDown(knob, { ...client(handle.x, handle.y), shiftKey: true });
      fireEvent.pointerMove(canvas(), {
        ...client(rotatedPoint.x, rotatedPoint.y),
        shiftKey: true,
      });
      fireEvent.pointerUp(canvas(), client(rotatedPoint.x, rotatedPoint.y));
      expect(state().document.objects[1]).toBe(other);
      const actual = state().document.objects[0];
      const expected = rotateArrow(arrow, 30);
      if (actual.kind === 'arrow' && expected.kind === 'arrow') {
        expect(actual.start.x).toBeCloseTo(expected.start.x);
        expect(actual.controlPoints[1].y).toBeCloseTo(expected.controlPoints[1].y);
      } else expect(actual).toMatchObject({ rotation: 30 });
      expect(state().past).toHaveLength(1);
      expect(deserializeDocument(serializeDocument(state().document))).toEqual(state().document);
      act(() => state().undo());
      expect(state().document).toEqual(original);
    },
  );
});
