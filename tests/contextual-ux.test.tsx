// @vitest-environment jsdom
import { chooseSelectionCommand } from './helpers/selectionMenu';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Canvas } from '../src/components/editor/Canvas';
import { nearbyTerminalComponents } from '../src/components/editor/useTerminalProximity';
import { componentRegistry, createComponent } from '../src/model/catalog';
import { createJunction, createWire } from '../src/model/factories';
import type { CircuitDocument, ComponentType } from '../src/model/types';
import { useEditorStore } from '../src/store/editorStore';
import { getExportSelection } from '../src/tikz/selection';
import { copyPNG } from '../src/png/exporter';
import { exportSVG } from '../src/svg/exporter';
import { createCurrent, electricalGeometry } from '../src/annotations/electrical';
vi.mock('../src/png/exporter', () => ({ copyPNG: vi.fn().mockResolvedValue(undefined) }));
const types: ComponentType[] = [
  'resistor',
  'capacitor',
  'voltageSource',
  'xnorGate',
  'opAmp',
  'npn',
];
const circuit = (): CircuitDocument => ({
  version: 1,
  title: 'Contextual UX',
  objects: types.map((type, i) => ({
    ...createComponent(type, { x: i * 200, y: 0 }),
    id: type,
  })),
});
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
    right: 1600,
    bottom: 800,
    width: 1600,
    height: 800,
    toJSON: () => ({}),
  });
  useEditorStore.setState({
    document: circuit(),
    selection: [],
    activeLabel: null,
    tool: 'select',
    past: [],
    future: [],
    gestureStart: null,
    notice: '',
  });
  vi.mocked(copyPNG).mockClear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
const canvas = () => screen.getByTestId('circuit-canvas');
const handles = (id: string) => canvas().querySelector(`[data-object="${id}"] .terminal-handles`)!;
function client(x: number, y: number) {
  const values = canvas()
    .querySelector(':scope > g')!
    .getAttribute('transform')!
    .match(/-?\d+(?:\.\d+)?/g)!
    .map(Number);
  return { clientX: values[0] + x * values[2], clientY: values[1] + y * values[2], pointerId: 1 };
}
describe('contextual terminal handles', () => {
  it.each(types)(
    '%s uses a 24px threshold at 50, 100 and 200 percent with 32px release hysteresis',
    (type) => {
      const component = { ...createComponent(type, { x: 0, y: 0 }), id: type };
      const doc: CircuitDocument = { version: 1, title: type, objects: [component] };
      const b = componentRegistry[type].bounds;
      for (const zoom of [0.5, 1, 2]) {
        const point = (gap: number) => ({ x: b.x + b.width + gap / zoom, y: b.y + b.height / 2 });
        expect(nearbyTerminalComponents(doc, point(23), zoom)).toEqual([type]);
        expect(nearbyTerminalComponents(doc, point(25), zoom)).toEqual([]);
        expect(nearbyTerminalComponents(doc, point(31), zoom, [type])).toEqual([type]);
        expect(nearbyTerminalComponents(doc, point(33), zoom, [type])).toEqual([]);
      }
    },
  );
  it('hides idle handles, reveals proximity/selection/tools, and holds through a brief departure', () => {
    render(<Canvas />);
    for (const type of types) expect(handles(type).getAttribute('data-visible')).toBe('false');
    fireEvent.pointerMove(canvas(), client(0, 0));
    expect(handles('resistor').getAttribute('data-visible')).toBe('true');
    vi.useFakeTimers();
    fireEvent.pointerMove(canvas(), client(0, 300));
    act(() => vi.advanceTimersByTime(60));
    expect(handles('resistor').getAttribute('data-visible')).toBe('true');
    fireEvent.pointerMove(canvas(), client(60, 0));
    act(() => vi.advanceTimersByTime(100));
    expect(handles('resistor').getAttribute('data-visible')).toBe('true');
    fireEvent.pointerLeave(canvas());
    act(() => vi.advanceTimersByTime(100));
    expect(handles('resistor').getAttribute('data-visible')).toBe('false');
    act(() => useEditorStore.getState().select(['capacitor']));
    expect(handles('capacitor').getAttribute('data-visible')).toBe('true');
    act(() => useEditorStore.getState().setTool('wire'));
    for (const type of types) expect(handles(type).getAttribute('data-visible')).toBe('true');
    expect(exportSVG(useEditorStore.getState().document)).not.toMatch(
      /terminal-handles|data-terminal|object-hit/,
    );
  });
});
describe('selection PNG shortcut', () => {
  it.each([false, true])(
    'reuses the normal export subset and copy pipeline (multiselect=%s)',
    async (multi) => {
      const r1 = { ...createComponent('resistor', { x: 0, y: 0 }), id: 'r1' };
      const r2 = { ...createComponent('resistor', { x: 200, y: 0 }), id: 'r2' };
      const j = { ...createJunction({ x: 100, y: 0 }, 'A'), id: 'j' };
      const w = createWire(
        { kind: 'terminal', componentId: r1.id, terminalId: 'b' },
        { kind: 'junction', junctionId: j.id },
      );
      const doc: CircuitDocument = { version: 1, title: 'PNG subset', objects: [r1, r2, j, w] };
      const selection = multi ? [r1.id, r2.id, j.id, w.id] : [r1.id];
      useEditorStore.setState({ document: doc, selection });
      render(<Canvas />);

      chooseSelectionCommand('Copia come immagine');
      await waitFor(() => expect(useEditorStore.getState().notice).toBe('PNG copiato'));
      expect(copyPNG).toHaveBeenCalledExactlyOnceWith(getExportSelection(doc, selection));
      expect(screen.queryByRole('dialog')).toBeNull();
    },
  );
});
describe('current mode controls', () => {
  it('inserts integrated current directly and undoes/redoes insertion', () => {
    const wire = createWire(
      { kind: 'free', point: { x: 0, y: 0 } },
      { kind: 'free', point: { x: 240, y: 0 } },
    );
    const doc: CircuitDocument = { version: 1, title: 'Modes', objects: [wire] };
    useEditorStore.setState({ document: doc });
    render(<Canvas />);
    fireEvent.click(screen.getByRole('button', { name: 'Disegno e annotazioni' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Corrente sul filo' }));
    fireEvent.pointerDown(canvas(), client(120, 0));
    const created = useEditorStore
      .getState()
      .document.objects.find((o) => o.kind === 'electrical')!;
    expect(created).toMatchObject({ currentPlacement: 'inline', wireId: wire.id });
    expect(screen.queryByLabelText('Posizione corrente')).toBeNull();
    act(() => useEditorStore.getState().undo());
    expect(useEditorStore.getState().document).toEqual(doc);
    act(() => useEditorStore.getState().redo());
    expect(useEditorStore.getState().document.objects.at(-1)).toEqual(created);
    // Geometry shares exactly the same object and wire association for both modes.
    const inline = createCurrent(wire, { x: 120, y: 0 }, doc);
    expect(electricalGeometry(inline, doc).arrowEnd.y).toBe(0);
  });
});

describe('direct contextual annotations and canvas focus', () => {
  it.each(['inline'] as const)(
    'adds %s current to the selected wire without another canvas click',
    (placement) => {
      const wire = createWire(
        { kind: 'free', point: { x: 0, y: 0 } },
        { kind: 'free', point: { x: 400, y: 100 } },
        [{ x: 400, y: 0 }],
      );
      const doc: CircuitDocument = { version: 1, title: 'Direct current', objects: [wire] };
      useEditorStore.setState({ document: doc, selection: [wire.id] });
      render(<Canvas />);
      chooseSelectionCommand('Corrente sul filo');

      const state = useEditorStore.getState();
      expect(state.tool).toBe('select');
      expect(state.document.objects).toHaveLength(2);
      expect(state.document.objects[0]).toBe(wire);
      const current = state.document.objects[1];
      expect(current).toMatchObject({
        kind: 'electrical',
        wireId: wire.id,
        currentPlacement: placement,
        wireSegment: { index: 0, ratio: 0.5 },
      });
      expect(state.selection).toEqual([current.id]);
      act(() => state.undo());
      expect(useEditorStore.getState().document).toEqual(doc);
      act(() => state.redo());
      expect(useEditorStore.getState().document.objects[1]).toEqual(current);
    },
  );
  it.each(['resistor', 'capacitor', 'voltageSource', 'diode', 'motor'] as const)(
    'directly associates polarity with compatible %s',
    (type) => {
      const component = createComponent(type, { x: 0, y: 0 });
      const doc: CircuitDocument = { version: 1, title: 'Direct polarity', objects: [component] };
      useEditorStore.setState({ document: doc, selection: [component.id] });
      render(<Canvas />);
      chooseSelectionCommand('Polarità + / -');
      const state = useEditorStore.getState();
      expect(state.tool).toBe('select');
      expect(state.document.objects[1]).toMatchObject({
        kind: 'electrical',
        mode: 'polarity',
        componentId: component.id,
      });
      expect(state.past).toHaveLength(1);
    },
  );
  it.each(['notGate', 'connector2', 'npn', 'ground', 'transformer'] as const)(
    'excludes semantically incompatible %s even when it has two pins',
    (type) => {
      const component = createComponent(type, { x: 0, y: 0 });
      useEditorStore.setState({
        document: { version: 1, title: 'Unsupported', objects: [component] },
        selection: [component.id],
      });
      render(<Canvas />);
      expect(screen.queryByRole('button', { name: 'Polarità + / -' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Corrente sul filo' })).toBeNull();
    },
  );
  it('preserves focus for shortcuts and distinguishes keyboard navigation from pointer gestures', () => {
    render(<Canvas />);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(canvas().getAttribute('data-focus-modality')).toBe('keyboard');
    canvas().focus();
    expect(document.activeElement).toBe(canvas());
    fireEvent.pointerDown(canvas(), client(0, 0));
    expect(canvas().getAttribute('data-focus-modality')).toBe('pointer');
    expect(document.activeElement).toBe(canvas());
    fireEvent.pointerUp(canvas(), client(0, 0));
    fireEvent.keyDown(canvas(), { key: 'w' });
    expect(useEditorStore.getState().tool).toBe('wire');
    fireEvent.keyDown(canvas(), { key: 'Escape' });
    expect(useEditorStore.getState().tool).toBe('select');
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(canvas().getAttribute('data-focus-modality')).toBe('keyboard');
  });
});
