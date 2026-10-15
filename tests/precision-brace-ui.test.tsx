// @vitest-environment jsdom
import { choosePropertyOption } from './helpers/propertyMenu';
import { chooseSelectionCommand, chooseSelectionColor } from './helpers/selectionMenu';
import { chooseDrawingTool } from './helpers/drawingMenu';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../src/App';
import { useEditorStore, STORAGE_KEY } from '../src/store/editorStore';
import { emptyDocument } from '../src/model/demo';
import { createComponent } from '../src/model/catalog';
import { createWire } from '../src/model/factories';
import { createBrace } from '../src/annotations/brace';
import { deserializeDocument } from '../src/model/serialization';
import { usePersonalBlocks } from '../src/personalBlocks/library';
import { ExportDialog } from '../src/components/toolbar/ExportDialog';
import type { BraceAnnotation } from '../src/model/types';

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
  for (const name of ['setPointerCapture', 'releasePointerCapture', 'hasPointerCapture'])
    Object.defineProperty(SVGElement.prototype, name, {
      configurable: true,
      value: name === 'hasPointerCapture' ? () => false : vi.fn(),
    });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 232,
    y: 0,
    left: 232,
    top: 0,
    right: 1280,
    bottom: 720,
    width: 1048,
    height: 720,
    toJSON: () => ({}),
  });
  useEditorStore.setState({
    document: emptyDocument(),
    selection: [],
    past: [],
    future: [],
    gestureStart: null,
    tool: 'select',
    notice: '',
  });
  usePersonalBlocks.setState({ blocks: [], error: '' });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const canvas = () => screen.getByTestId('circuit-canvas');
const state = () => useEditorStore.getState();
function client(x: number, y: number) {
  const [dx, dy, zoom] = canvas()
    .querySelector(':scope > g')!
    .getAttribute('transform')!
    .match(/-?\d+(?:\.\d+)?/g)!
    .map(Number);
  return { clientX: 232 + dx + x * zoom, clientY: dy + y * zoom, button: 0, pointerId: 1 };
}
function drag(start: [number, number], end: [number, number], target: Element = canvas()) {
  fireEvent.pointerDown(target, client(...start));
  fireEvent.pointerMove(canvas(), client(...end));
  fireEvent.pointerUp(canvas(), client(...end));
}
function create(type: 'brace' | 'bracket', end: [number, number]) {
  chooseDrawingTool('Graffa / Staffa', type === 'brace' ? 'Graffa' : 'Staffa');
  drag([0, 0], end);
  return state().document.objects.at(-1) as BraceAnnotation;
}
const key = (key: string, options = {}) => fireEvent.keyDown(canvas(), { key, ...options });
const nudge = (keyName: string) => {
  key(keyName);
  fireEvent.keyUp(canvas(), { key: keyName });
};

describe('precision/annotation/export UI workflows', () => {
  it.each(['brace', 'bracket'] as const)(
    'creates %s horizontally/vertically as one Undo operation',
    (type) => {
      render(<App />);
      const h = create(type, [240, 20]);
      const v = create(type, [10, 200]);
      expect(h).toMatchObject({ start: { x: 0, y: 0 }, end: { x: 240, y: 0 } });
      expect(v).toMatchObject({ start: { x: 0, y: 0 }, end: { x: 0, y: 200 } });
      expect(state().past).toHaveLength(2);
      act(() => state().undo());
      expect(state().document.objects).toEqual([h]);
      act(() => state().redo());
      expect(state().document.objects).toEqual([h, v]);
      expect(canvas().querySelectorAll('[data-handle]')).toHaveLength(0);
    },
  );
  it('edits, cancels, flips, resizes, moves, nudges and styles a brace through existing controls', () => {
    render(<App />);
    const o = create('brace', [240, 0]);
    const hit = () =>
      canvas().querySelector(`[data-layer="annotations"] [data-object="${o.id}"] path`)!;
    fireEvent.doubleClick(hit());
    fireEvent.change(screen.getByLabelText('Modifica testo sul foglio'), {
      target: { value: 'R_{eq}' },
    });
    fireEvent.submit(screen.getByLabelText('Modifica testo sul foglio').closest('form')!);
    const brace = () => state().document.objects.find((obj) => obj.id === o.id) as BraceAnnotation;
    expect(brace().label.text).toBe('R_{eq}');
    key('Enter');
    fireEvent.change(screen.getByLabelText('Modifica testo sul foglio'), {
      target: { value: 'Annullato' },
    });
    fireEvent.keyDown(screen.getByLabelText('Modifica testo sul foglio'), { key: 'Escape' });
    expect(brace().label.text).toBe('R_{eq}');
    expect(canvas().querySelectorAll('[data-handle]')).toHaveLength(0);
    fireEvent.pointerDown(hit(), client(100, 0));
    fireEvent.pointerUp(canvas(), client(100, 0));
    chooseSelectionCommand('Inverti lato');
    expect(brace().side).toBe(-1);
    drag([240, 0], [320, 0], canvas().querySelector('[data-handle="end"]')!);
    expect(brace().end.x).toBe(320);
    drag([100, 0], [140, 20], hit());
    expect(brace().start).toEqual({ x: 40, y: 20 });
    expect(brace().label.offset).toEqual({ x: 0, y: 0 });
    nudge('ArrowRight');
    expect(brace().start.x).toBe(41);
    const final = brace();
    act(() => state().undo());
    expect(brace().start.x).toBe(40);
    act(() => state().redo());
    expect(brace()).toEqual(final);
    act(() => state().select([o.id]));

    chooseSelectionColor('Simbolo', 'Viola');
    choosePropertyOption(screen.getByLabelText('Spessore linea'), '4 px');
    choosePropertyOption(screen.getByLabelText('Dimensione testo'), '32 px');
    expect(brace()).toMatchObject({ color: '#8855c2', width: 4, label: { fontSize: 32 } });
    expect(canvas().querySelectorAll('[data-handle]')).toHaveLength(2);
  });
  it('keeps connected wires and circuit positions still while editing a label or a dialog', () => {
    const c = createComponent('resistor', { x: 0, y: 0 });
    const b = createComponent('resistor', { x: 160, y: 0 });
    const wire = createWire(
      { kind: 'terminal', componentId: c.id, terminalId: 'b' },
      { kind: 'terminal', componentId: b.id, terminalId: 'a' },
    );
    useEditorStore.setState({
      document: { ...emptyDocument(), objects: [c, b, wire] },
      selection: [c.id],
    });
    render(<App />);
    key('Enter');
    const original = state().document;
    fireEvent.keyDown(screen.getByLabelText('Modifica testo sul foglio'), { key: 'ArrowLeft' });
    expect(state().document).toBe(original);
    fireEvent.keyDown(screen.getByLabelText('Modifica testo sul foglio'), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Esporta' }));
    key('ArrowRight');
    expect(state().document).toBe(original);
  });
  it('copies/pastes and duplicates braces with fresh IDs and persists the committed result', async () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: () => null, setItem });
    const o = createBrace('brace', { x: 0, y: 60 }, { x: 240, y: 60 });
    useEditorStore.setState({ document: { ...emptyDocument(), objects: [o] }, selection: [o.id] });
    render(<App />);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error()),
        readText: vi.fn().mockRejectedValue(new Error()),
      },
    });
    await act(async () => {
      key('c', { ctrlKey: true });
    });
    await act(async () => {
      key('v', { ctrlKey: true });
    });
    key('d', { ctrlKey: true });
    expect(state().document.objects).toHaveLength(3);
    expect(new Set(state().document.objects.map((o) => o.id)).size).toBe(3);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450));
    });
    const saved = [...setItem.mock.calls].reverse().find(([name]) => name === STORAGE_KEY)!;
    expect(deserializeDocument(saved[1])).toEqual(state().document);
  });
  it('adds PNG only inside Export and explains clipboard fallback while keeping download available', async () => {
    useEditorStore.setState({
      document: {
        ...emptyDocument(),
        objects: [createBrace('bracket', { x: 0, y: 0 }, { x: 200, y: 0 })],
      },
    });
    vi.stubGlobal('ClipboardItem', undefined);
    render(<ExportDialog onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'PNG' })).toBeNull();
    expect(screen.getByRole('textbox')).toBeTruthy();
    expect(screen.queryByText('PNG · 2×')).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copia PNG' }));
    });
    expect(screen.getByRole('alert').textContent).toContain('Scarica PNG');
    expect(screen.getByRole('button', { name: 'Scarica PNG' }).hasAttribute('disabled')).toBe(
      false,
    );
  });
});
