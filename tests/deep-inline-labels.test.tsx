// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Canvas } from '../src/components/editor/Canvas';
import { createComponent } from '../src/model/catalog';
import { createJunction, createTextAnnotation, createWire } from '../src/model/factories';
import { createElectrical } from '../src/annotations/electrical';
import { createBrace } from '../src/annotations/brace';
import type { CircuitDocument, CircuitObject } from '../src/model/types';
import { useEditorStore } from '../src/store/editorStore';
import {
  hasAssociatedLabel,
  inlineTextTarget,
  moveLabel,
  replaceInlineText,
} from '../src/utils/labels';
import { moveSelection } from '../src/utils/operations';
import { wirePoints } from '../src/utils/geometry';

const documentWith = (objects: CircuitObject[]): CircuitDocument => ({
  version: 1,
  title: 'Inline editing and label independence',
  objects,
});
const state = () => useEditorStore.getState();
const canvas = () => screen.getByTestId('circuit-canvas');
function client(x: number, y: number) {
  const values = canvas()
    .querySelector(':scope > g')!
    .getAttribute('transform')!
    .match(/-?\d+(?:\.\d+)?/g)!
    .map(Number);
  return {
    clientX: values[0] + x * values[2],
    clientY: values[1] + y * values[2],
    pointerId: 1,
    button: 0,
  };
}
function fixture() {
  const resistor = { ...createComponent('resistor', { x: 0, y: 0 }), id: 'resistor' };
  resistor.label.text = 'R_1';
  const junction = { ...createJunction({ x: -160, y: 0 }, 'A'), id: 'junction' };
  // Redundant imported vertex deliberately retained: editing Text/labels may not clean up wires.
  const wire = {
    ...createWire(
      { kind: 'junction', junctionId: junction.id },
      { kind: 'terminal', componentId: resistor.id, terminalId: resistor.terminals[0].id },
      [{ x: -120, y: 0 }],
    ),
    id: 'wire',
  };
  const current = {
    ...createElectrical('current', { x: -120, y: -50 }, { x: -60, y: -50 }, 'i_1'),
    id: 'current',
    wireId: wire.id,
  };
  const voltage = {
    ...createElectrical('voltage', { x: 100, y: 50 }, { x: 200, y: 50 }, 'V_1'),
    id: 'voltage',
  };
  const polarity = {
    ...createElectrical('polarity', { x: 0, y: 0 }, { x: 80, y: 0 }, 'V_R'),
    id: 'polarity',
    componentId: resistor.id,
  };
  const brace = { ...createBrace('brace', { x: 0, y: 120 }, { x: 120, y: 120 }), id: 'brace' };
  brace.label.text = 'R_{eq}';
  const bracket = {
    ...createBrace('bracket', { x: 200, y: 120 }, { x: 320, y: 120 }),
    id: 'bracket',
  };
  bracket.label.text = 'G';
  const text = { ...createTextAnnotation({ x: 80, y: 200 }, 'maglia 1'), id: 'text' };
  return documentWith([resistor, junction, wire, current, voltage, polarity, brace, bracket, text]);
}
const renameableIds = [
  'resistor',
  'junction',
  'current',
  'voltage',
  'polarity',
  'brace',
  'bracket',
  'text',
];
const labelIds = renameableIds.filter((id) => id !== 'text');
function label(id: string) {
  return canvas().querySelector(`[data-label="${id}"]`)!;
}
function clickLabel(id: string) {
  const target = inlineTextTarget(
    state().document.objects.find((o) => o.id === id),
    state().document,
  )!;
  fireEvent.pointerDown(label(id), client(target.point.x, target.point.y));
  fireEvent.pointerUp(canvas(), client(target.point.x, target.point.y));
}
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
    Object.defineProperty(SVGElement.prototype, name, { configurable: true, value: vi.fn() });
  Object.defineProperty(SVGElement.prototype, 'hasPointerCapture', {
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
    document: fixture(),
    selection: [],
    activeLabel: null,
    tool: 'select',
    past: [],
    future: [],
    gestureStart: null,
    notice: '',
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('one lightweight editor for every renameable object', () => {
  it.each(renameableIds)('%s uses the Text primitive and saves once with Enter', (id) => {
    render(<Canvas />);
    const original = state().document;
    const target = original.objects.find((o) => o.id === id)!;
    fireEvent.doubleClick(
      id === 'text' ? canvas().querySelector(`[data-object="${id}"]`)! : label(id),
    );
    const input = screen.getByLabelText('Modifica testo sul foglio');
    expect(input.closest('form')?.className).toBe('inline-editor inline-text-editor');
    expect(input.closest('form')?.querySelectorAll('input')).toHaveLength(1);
    expect(screen.queryByLabelText('Conferma testo')).toBeNull();
    expect(document.querySelector('.inline-latex-preview')).toBeNull();
    expect(
      id === 'text'
        ? canvas().querySelector('[data-layer="annotations"] [data-object="text"]')
        : label(id),
    ).toBeNull();
    fireEvent.change(input, { target: { value: 'x_{new}' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.queryByLabelText('Modifica testo sul foglio')).toBeNull();
    expect(state().document.objects.find((o) => o.id === id)).toEqual(
      replaceInlineText(target, 'x_{new}'),
    );
    expect(state().past).toHaveLength(1);
    expect(state().document.objects.filter((o) => o.id !== id)).toEqual(
      original.objects.filter((o) => o.id !== id),
    );
    act(() => state().undo());
    expect(state().document).toEqual(original);
  });
  it.each(['resistor', 'text'])('%s cancels on Escape and commits on focus loss', (id) => {
    render(<Canvas />);
    const open = () =>
      fireEvent.doubleClick(
        id === 'text' ? canvas().querySelector('[data-object="text"]')! : label(id),
      );
    const original = state().document;
    open();
    fireEvent.change(screen.getByLabelText('Modifica testo sul foglio'), {
      target: { value: 'discard' },
    });
    fireEvent.keyDown(screen.getByLabelText('Modifica testo sul foglio'), { key: 'Escape' });
    expect(state().document).toBe(original);
    expect(state().past).toHaveLength(0);
    open();
    fireEvent.change(screen.getByLabelText('Modifica testo sul foglio'), {
      target: { value: 'saved' },
    });
    act(() => canvas().focus());
    expect(state().document.objects.find((o) => o.id === id)).toEqual(
      replaceInlineText(
        original.objects.find((o) => o.id === id)!,
        'saved',
      ),
    );
    expect(state().past).toHaveLength(1);
  });
  it('keeps Etichetta in the component toolbar alongside inline editing', () => {
    render(<Canvas />);
    const body = canvas().querySelector(
      '[data-layer="components"] [data-object="resistor"] .object-hit',
    )!;
    fireEvent.pointerDown(body, client(0, 0));
    fireEvent.pointerUp(canvas(), client(0, 0));
    expect(screen.getByLabelText('Etichetta componente')).toBeDefined();
    fireEvent.doubleClick(label('resistor'));
    expect(screen.getByLabelText('Modifica testo sul foglio')).toBeDefined();
    fireEvent.keyDown(screen.getByLabelText('Modifica testo sul foglio'), { key: 'Escape' });
    expect(screen.getByLabelText('Etichetta componente')).toBeDefined();
  });
  it('retains text alignment, rotation, size, color and anchor in the editor', () => {
    const original = fixture();
    const text = original.objects.find((o) => o.kind === 'text')!;
    if (text.kind !== 'text') throw new Error('text fixture');
    text.align = 'end';
    text.rotation = 90;
    text.fontSize = 31;
    text.color = '#8855c2';
    useEditorStore.setState({ document: original });
    render(<Canvas />);
    fireEvent.doubleClick(canvas().querySelector('[data-object="text"]')!);
    const input = screen.getByLabelText('Modifica testo sul foglio');
    const zoom = Number(
      canvas()
        .querySelector(':scope > g')!
        .getAttribute('transform')!
        .match(/scale\(([^)]+)\)/)![1],
    );
    expect(parseFloat(input.style.fontSize)).toBeCloseTo(31);
    expect(input.closest('form')!.querySelector('[fill="#8855c2"]')).toBeTruthy();
    expect(input.closest('form')?.style.transform).toContain(`scale(${zoom}) rotate(90deg)`);
  });
});

describe('label and standalone Text movement is independent from circuit geometry', () => {
  it.each(labelIds)('%s label drag and keyboard nudge only change its offset', (id) => {
    render(<Canvas />);
    const original = state().document;
    const target = inlineTextTarget(
      original.objects.find((o) => o.id === id),
      original,
    )!;
    fireEvent.pointerDown(label(id), client(target.point.x, target.point.y));
    fireEvent.pointerMove(canvas(), client(target.point.x + 11, target.point.y + 7));
    fireEvent.pointerUp(canvas(), client(target.point.x + 11, target.point.y + 7));
    expect(state().activeLabel).toBe(id);
    expect(state().document).toEqual(moveLabel(original, id, { x: 11, y: 7 }));
    expect(canvas().querySelector(`[data-label="${id}"][data-active-label]`)).not.toBeNull();
    expect(canvas().querySelector(`[data-layer="selection"] [data-object="${id}"]`)).toBeNull();
    fireEvent.keyDown(canvas(), { key: 'ArrowRight' });
    fireEvent.keyUp(window, { key: 'ArrowRight' });
    fireEvent.keyDown(canvas(), { key: 'ArrowDown', shiftKey: true });
    fireEvent.keyUp(window, { key: 'ArrowDown' });
    expect(state().document).toEqual(moveLabel(original, id, { x: 12, y: 17 }));
    expect(state().document.objects.find((o) => o.id === 'wire')).toBe(
      original.objects.find((o) => o.id === 'wire'),
    );
    expect(canvas().querySelectorAll('[data-distance]')).toHaveLength(0);
  });
  it('clicking a label focuses its nudge target; selecting its body then moves body and associated label', () => {
    render(<Canvas />);
    clickLabel('resistor');
    expect(state().activeLabel).toBe('resistor');
    fireEvent.keyDown(canvas(), { key: 'ArrowRight' });
    fireEvent.keyUp(window, { key: 'ArrowRight' });
    const afterLabel = state().document;
    const resistor = afterLabel.objects.find((o) => o.id === 'resistor')!;
    expect(resistor).toMatchObject({ x: 0, y: 0, label: { offset: { x: 1, y: -30 } } });
    fireEvent.pointerDown(
      canvas().querySelector('[data-layer="components"] [data-object="resistor"] .object-hit')!,
      client(0, 0),
    );
    fireEvent.pointerUp(canvas(), client(0, 0));
    expect(state().activeLabel).toBeNull();
    fireEvent.keyDown(canvas(), { key: 'ArrowRight' });
    fireEvent.keyUp(window, { key: 'ArrowRight' });
    expect(state().document.objects.find((o) => o.id === 'resistor')).toMatchObject({
      x: 1,
      y: 0,
      label: { offset: { x: 1, y: -30 } },
    });
  });
  it('standalone Text mouse movement and nudge leave every other object and wire unchanged', () => {
    render(<Canvas />);
    const original = state().document;
    fireEvent.pointerDown(canvas().querySelector('[data-object="text"]')!, client(80, 200));
    fireEvent.pointerMove(canvas(), client(100, 220));
    fireEvent.pointerUp(canvas(), client(100, 220));
    expect(state().document).toEqual(moveSelection(original, ['text'], { x: 20, y: 20 }));
    fireEvent.keyDown(canvas(), { key: 'ArrowLeft' });
    fireEvent.keyUp(window, { key: 'ArrowLeft' });
    expect(state().document).toEqual(moveSelection(original, ['text'], { x: 19, y: 20 }));
    for (const object of original.objects.filter((o) => o.id !== 'text'))
      expect(state().document.objects.find((o) => o.id === object.id)).toBe(object);
  });
  it('explicit multiselect clears label focus and moves the selected group', () => {
    render(<Canvas />);
    clickLabel('junction');
    act(() => state().select(['junction', 'resistor', 'wire']));
    expect(state().activeLabel).toBeNull();
    const original = state().document;
    fireEvent.keyDown(canvas(), { key: 'ArrowDown', shiftKey: true });
    fireEvent.keyUp(window, { key: 'ArrowDown' });
    expect(state().document.objects.find((o) => o.id === 'junction')).toMatchObject({ y: 10 });
    expect(state().document.objects.find((o) => o.id === 'resistor')).toMatchObject({ y: 10 });
    expect(state().document.objects.find((o) => o.id === 'wire')).toMatchObject({
      startEndpoint: { kind: 'junction' },
      endEndpoint: { kind: 'terminal' },
    });
    expect(
      original.objects
        .filter(hasAssociatedLabel)
        .every((o) => state().document.objects.find((next) => next.id === o.id)?.kind === o.kind),
    ).toBe(true);
  });
});

describe('deletion respects the selected label subtarget', () => {
  const labelShortcuts = labelIds.flatMap((id) =>
    ['Delete', 'Backspace'].map((key) => ({ id, key })),
  );

  it.each(labelShortcuts)(
    '$id label + $key clears only its text and supports Undo/Redo',
    ({ id, key }) => {
      render(<Canvas />);
      const original = state().document;
      const owner = original.objects.find((o) => o.id === id)!;
      clickLabel(id);
      fireEvent.keyDown(canvas(), { key });
      const cleared = state().document;
      expect(cleared.objects.find((o) => o.id === id)).toEqual(replaceInlineText(owner, ''));
      expect(cleared.objects.filter((o) => o.id !== id)).toEqual(
        original.objects.filter((o) => o.id !== id),
      );
      expect(cleared.objects).toHaveLength(original.objects.length);
      expect(state().activeLabel).toBeNull();
      expect(state().selection).toEqual([]);
      expect(state().past).toHaveLength(1);
      // Holding Delete cannot turn label deletion into deletion of the remaining body.
      fireEvent.keyDown(canvas(), { key, repeat: true });
      expect(state().document).toBe(cleared);
      act(() => state().undo());
      expect(state().document).toEqual(original);
      act(() => state().redo());
      expect(state().document).toEqual(cleared);
    },
  );

  it.each(labelShortcuts)(
    '$id label + Shift $key removes its owner and embedded label',
    ({ id, key }) => {
      render(<Canvas />);
      const original = state().document;
      const wire = original.objects.find((o) => o.kind === 'wire')!;
      const route = wirePoints(wire, original);
      clickLabel(id);
      fireEvent.keyDown(canvas(), { key, shiftKey: true });
      const deleted = state().document;
      expect(deleted.objects.some((o) => o.id === id)).toBe(false);
      expect(deleted.objects).toHaveLength(original.objects.length - 1);
      expect(deleted.objects.filter((o) => o.kind === 'text')).toEqual(
        original.objects.filter((o) => o.kind === 'text'),
      );
      const afterWire = deleted.objects.find((o) => o.kind === 'wire')!;
      expect(wirePoints(afterWire, deleted)).toEqual(route);
      if (id === 'resistor') expect(afterWire.endEndpoint.kind).toBe('free');
      if (id === 'junction') expect(afterWire.startEndpoint.kind).toBe('free');
      expect(state().past).toHaveLength(1);
      act(() => state().undo());
      expect(state().document).toEqual(original);
      act(() => state().redo());
      expect(state().document).toEqual(deleted);
    },
  );

  it.each(['resistor', 'junction'])('%s body + Delete removes the body and its label', (id) => {
    render(<Canvas />);
    clickLabel(id);
    const layer = id === 'resistor' ? 'components' : 'junctions';
    const body = canvas().querySelector(`[data-layer="${layer}"] [data-object="${id}"]`)!;
    fireEvent.pointerDown(body, client(0, 0));
    fireEvent.pointerUp(canvas(), client(0, 0));
    expect(state().activeLabel).toBeNull();
    fireEvent.keyDown(canvas(), { key: 'Delete' });
    expect(state().document.objects.some((o) => o.id === id)).toBe(false);
    expect(state().document.objects.filter((o) => o.kind === 'text')).toHaveLength(1);
  });

  it('explicit multiselect after label focus deletes the selected owners', () => {
    render(<Canvas />);
    clickLabel('resistor');
    act(() => state().select(['resistor', 'junction', 'brace']));
    fireEvent.keyDown(canvas(), { key: 'Backspace' });
    expect(
      state().document.objects.some((o) => ['resistor', 'junction', 'brace'].includes(o.id)),
    ).toBe(false);
    expect(state().document.objects.find((o) => o.id === 'wire')).toMatchObject({
      startEndpoint: { kind: 'free' },
      endEndpoint: { kind: 'free' },
    });
  });
});
