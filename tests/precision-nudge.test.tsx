// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import {
  useKeyboardNudge,
  NUDGE_STEP,
  NUDGE_LARGE_STEP,
} from '../src/components/editor/useKeyboardNudge';
import { DistanceGuideLayer } from '../src/components/editor/DistanceGuideLayer';
import { useEditorStore } from '../src/store/editorStore';
import { createComponent } from '../src/model/catalog';
import { createJunction, createTextAnnotation, createWire } from '../src/model/factories';
import { createElectrical } from '../src/annotations/electrical';
import { createBrace } from '../src/annotations/brace';
import { demoDocument } from '../src/model/demo';
import { moveSelection } from '../src/utils/operations';
import { resolveEndpoint } from '../src/utils/geometry';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import type { CircuitDocument, CircuitObject } from '../src/model/types';

function Harness({ zoom = 1 }: { zoom?: number }) {
  const distances = useKeyboardNudge(zoom);
  return (
    <>
      <svg tabIndex={0} data-testid="canvas">
        <g transform={`scale(${zoom})`}>
          <DistanceGuideLayer guides={distances} zoom={zoom} />
        </g>
      </svg>
      <input aria-label="Input" />
      <textarea />
      <select>
        <option>Scelta</option>
      </select>
      <div contentEditable />
      <button>Menu</button>
    </>
  );
}
const doc = (objects: CircuitObject[]): CircuitDocument => ({
  version: 1,
  title: 'Precision',
  objects,
});
const state = () => useEditorStore.getState();
function setup(objects: CircuitObject[], zoom = 1) {
  useEditorStore.setState({ document: doc(objects), selection: objects.map((o) => o.id) });
  const view = render(<Harness zoom={zoom} />);
  view.getByTestId('canvas').focus();
  return view;
}
const down = (key = 'ArrowRight', options = {}) =>
  fireEvent.keyDown(document.activeElement!, { key, ...options });
const up = (key = 'ArrowRight') => fireEvent.keyUp(window, { key });
beforeEach(() =>
  useEditorStore.setState({
    document: doc([]),
    selection: [],
    past: [],
    future: [],
    gestureStart: null,
    tool: 'select',
    activeLabel: null,
  }),
);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('exact keyboard movement through the shared drag operation', () => {
  it('shows the same bilateral body measurements only during a held nudge gesture', () => {
    const component = createComponent('resistor', { x: 180, y: 0 });
    const left = createWire(
      { kind: 'free', point: { x: 0, y: 0 } },
      { kind: 'terminal', componentId: component.id, terminalId: 'a' },
    );
    const right = createWire(
      { kind: 'terminal', componentId: component.id, terminalId: 'b' },
      { kind: 'free', point: { x: 400, y: 0 } },
    );
    const view = setup([component, left, right]);
    act(() => state().select([component.id]));
    down();
    expect(
      [...view.container.querySelectorAll('[data-distance]')].map((g) =>
        g.getAttribute('data-distance'),
      ),
    ).toEqual(['161', '199']);
    for (let i = 0; i < 19; i++) down('ArrowRight', { repeat: true });
    expect(view.container.querySelectorAll('[data-equal="true"]')).toHaveLength(2);
    expect(serializeDocument(state().document)).not.toContain('distance');
    up();
    expect(view.container.querySelectorAll('[data-distance]')).toHaveLength(0);
    expect(state().past).toHaveLength(1);
  });

  it.each([0.5, 1, 2])('moves one component by canvas units at zoom %s', (zoom) => {
    const c = createComponent('resistor', { x: 23, y: 17 });
    setup([c], zoom);
    down();
    up();
    expect(state().document.objects[0]).toMatchObject({ x: 23 + NUDGE_STEP, y: 17 });
    down('ArrowUp', { shiftKey: true });
    up('ArrowUp');
    expect(state().document.objects[0]).toMatchObject({ x: 24, y: 17 - NUDGE_LARGE_STEP });
  });
  it('moves mixed selections exactly like drag, preserving relative geometry and attached wires', () => {
    const d = demoDocument();
    d.objects.push(createBrace('brace', { x: 0, y: 200 }, { x: 300, y: 200 }));
    const ids = d.objects.map((o) => o.id);
    setup(d.objects);
    down('ArrowDown');
    up('ArrowDown');
    expect(state().document.objects).toEqual(moveSelection(d, ids, { x: 0, y: 1 }).objects);
    expect(() => deserializeDocument(serializeDocument(state().document))).not.toThrow();
  });
  it.each([
    createJunction({ x: 12, y: 13 }, 'A'),
    createTextAnnotation({ x: 12, y: 13 }, 'Testo'),
    createElectrical('current', { x: 12, y: 13 }, { x: 80, y: 13 }, 'i'),
    createElectrical('voltage', { x: 12, y: 13 }, { x: 80, y: 13 }, 'V'),
    createBrace('brace', { x: 12, y: 13 }, { x: 80, y: 13 }),
    createBrace('bracket', { x: 12, y: 13 }, { x: 12, y: 80 }),
  ])('nudges $kind objects', (o) => {
    setup([o]);
    down('ArrowLeft');
    up('ArrowLeft');
    expect(state().document.objects).toEqual(
      moveSelection(doc([o]), [o.id], { x: -1, y: 0 }).objects,
    );
  });
  it.each(['resistor', 'opAmp'] as const)('keeps every %s terminal reference attached', (type) => {
    const c = createComponent(type, { x: 0, y: 0 });
    const j = createJunction({ x: -160, y: 0 }, 'A');
    const wires = c.terminals.map((t) =>
      createWire(
        { kind: 'junction', junctionId: j.id },
        { kind: 'terminal', componentId: c.id, terminalId: t.id },
      ),
    );
    setup([c, j, ...wires]);
    act(() => state().select([c.id]));
    down();
    up();
    for (const wire of wires) {
      const next = state().document.objects.find((o) => o.id === wire.id)!;
      expect(next).toMatchObject({
        startEndpoint: wire.startEndpoint,
        endEndpoint: wire.endEndpoint,
      });
      expect(resolveEndpoint(wire.endEndpoint, state().document).x).toBe(
        resolveEndpoint(wire.endEndpoint, doc([c, j, ...wires])).x + 1,
      );
    }
    act(() => state().select([j.id]));
    down('ArrowDown');
    up('ArrowDown');
    expect(resolveEndpoint(wires[0].startEndpoint, state().document)).toEqual({ x: -160, y: 1 });
  });
  it('commits all repeats once and restores exact initial/final documents with Undo/Redo', () => {
    const c = createComponent('resistor', { x: 23, y: 17 });
    setup([c]);
    const original = state().document;
    down();
    for (let i = 0; i < 49; i++) down('ArrowRight', { repeat: true });
    expect(state().past).toHaveLength(0);
    expect(state().gestureStart).toBe(original);
    up();
    const final = state().document;
    expect(state().past).toHaveLength(1);
    expect(final.objects[0]).toMatchObject({ x: 73 });
    act(() => state().undo());
    expect(state().document).toEqual(original);
    act(() => state().redo());
    expect(state().document).toEqual(final);
  });
  it('supports overlapping arrow keys and commits after the last release', () => {
    setup([createTextAnnotation({ x: 0, y: 0 })]);
    down();
    down('ArrowDown');
    up();
    expect(state().past).toHaveLength(0);
    up('ArrowDown');
    expect(state().past).toHaveLength(1);
    expect(state().document.objects[0]).toMatchObject({ x: 1, y: 1 });
  });
  it('keeps one transaction when Shift changes during a held arrow', () => {
    setup([createTextAnnotation({ x: 0, y: 0 })]);
    down();
    down('Shift');
    down('ArrowRight', { repeat: true, shiftKey: true });
    up('Shift');
    down('ArrowRight', { repeat: true });
    up();
    expect(state().past).toHaveLength(1);
    expect(state().document.objects[0]).toMatchObject({ x: 12, y: 0 });
  });
  it.each(['input', 'textarea', 'select', '[contenteditable]', 'button'])(
    'respects focus in %s',
    (selector) => {
      const view = setup([createTextAnnotation({ x: 0, y: 0 })]);
      const original = state().document;
      (view.container.querySelector(selector) as HTMLElement).focus();
      down();
      up();
      expect(state().document).toBe(original);
      expect(state().gestureStart).toBeNull();
    },
  );
  it.each(['dialog', 'menu', 'listbox', 'combobox', 'slider', 'separator'])(
    'does not nudge when navigating a %s',
    (role) => {
      setup([createTextAnnotation({ x: 0, y: 0 })]);
      const popup = document.createElement('div');
      popup.role = role;
      popup.tabIndex = 0;
      document.body.append(popup);
      popup.focus();
      const original = state().document;
      down();
      up();
      expect(state().document).toBe(original);
      popup.remove();
    },
  );
  it('finishes on blur, focus transfer and a competing shortcut without losing history', () => {
    const view = setup([createTextAnnotation({ x: 0, y: 0 })]);
    down();
    fireEvent.blur(window);
    expect(state().past).toHaveLength(1);
    down();
    view.getByLabelText('Input').focus();
    expect(state().past).toHaveLength(2);
    view.getByTestId('canvas').focus();
    down();
    down('z', { ctrlKey: true });
    expect(state().past).toHaveLength(3);
    expect(state().gestureStart).toBeNull();
  });
  it('does not take over an active pointer gesture or non-selection tool', () => {
    setup([createTextAnnotation({ x: 0, y: 0 })]);
    act(() => state().beginGesture());
    const original = state().document;
    down();
    up();
    expect(state().document).toBe(original);
    act(() => {
      state().cancelGesture();
      state().setTool('wire');
    });
    down();
    up();
    expect(state().document).toBe(original);
  });
});
