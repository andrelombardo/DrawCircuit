// @vitest-environment jsdom
import { chooseDrawingTool } from './helpers/drawingMenu';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../src/App';
import { emptyDocument } from '../src/model/demo';
import { createComponent } from '../src/model/catalog';
import { createWire } from '../src/model/factories';
import { useEditorStore } from '../src/store/editorStore';
import { createPersonalBlock, usePersonalBlocks } from '../src/personalBlocks/library';
import { createCurrent } from '../src/annotations/electrical';
import { wireCrossings } from '../src/utils/crossings';
import { exportSVG } from '../src/svg/exporter';
import { insertJunction } from '../src/utils/wires';
import type { ElectricalAnnotation } from '../src/model/types';
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
  Object.defineProperty(SVGElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(SVGElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(SVGElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: () => false,
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
  usePersonalBlocks.setState({ blocks: [], error: '' });
  useEditorStore.setState({
    document: emptyDocument(),
    tool: 'select',
    pendingPresetId: null,
    selection: [],
    past: [],
    future: [],
    gestureStart: null,
    placementRotation: 0,
    grid: true,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const canvas = () => screen.getByTestId('circuit-canvas');
function client(x: number, y: number) {
  const n = canvas()
    .querySelector(':scope > g')!
    .getAttribute('transform')!
    .match(/-?\d+(?:\.\d+)?/g)!
    .map(Number);
  return { clientX: 232 + n[0] + x * n[2], clientY: n[1] + y * n[2], button: 0, pointerId: 1 };
}
const move = (x: number, y: number) => fireEvent.pointerMove(canvas(), client(x, y));
function click(x: number, y: number) {
  const point = client(x, y);
  fireEvent.pointerDown(canvas(), point);
  fireEvent.pointerUp(canvas(), point);
}
const key = (key: string, options = {}) => fireEvent.keyDown(canvas(), { key, ...options });
const doc = () => useEditorStore.getState().document;
function chooseElectrical(name: string) {
  chooseDrawingTool(name === 'Corrente su un filo' ? 'Corrente sul filo' : name.replace('−', '-'));
}
const line = (x1: number, y1: number, x2: number, y2: number) =>
  createWire({ kind: 'free', point: { x: x1, y: y1 } }, { kind: 'free', point: { x: x2, y: y2 } });
describe('new feature UI integrates with the existing editor', () => {
  it('saves a multi-selection, inserts a rotated ghost, renames and removes a personal block', () => {
    const c = createComponent('resistor', { x: 0, y: 0 }, 1),
      d = createComponent('capacitor', { x: 180, y: 0 }, 1);
    useEditorStore.setState({
      document: { ...emptyDocument(), objects: [c, d] },
      selection: [c.id, d.id],
    });
    render(<App />);
    fireEvent.click(screen.getByLabelText('Altre proprietà'));
    fireEvent.click(screen.getByRole('button', { name: 'Salva come blocco' }));
    fireEvent.change(screen.getByLabelText('Nome blocco'), { target: { value: 'R-C personale' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salva blocco' }));
    expect(usePersonalBlocks.getState().blocks).toHaveLength(1);
    fireEvent.change(screen.getByRole('textbox', { name: 'Cerca componenti' }), {
      target: { value: 'R-C personale' },
    });
    expect(screen.queryByText('Nessun componente o blocco trovato.')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Inserisci blocco personale: R-C personale' }),
    );
    move(200, 200);
    key('r');
    expect(canvas().querySelector('[data-preset-rotation="90"]')).toBeTruthy();
    click(200, 200);
    expect(doc().objects).toHaveLength(4);
    key('z', { ctrlKey: true });
    expect(doc().objects).toHaveLength(2);
    key('z', { ctrlKey: true, shiftKey: true });
    expect(doc().objects).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: 'Rinomina blocco R-C personale' }));
    fireEvent.change(screen.getByLabelText('Nome blocco'), { target: { value: 'Nuovo nome' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salva blocco' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Cerca componenti' }), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Elimina blocco Nuovo nome' }));
    expect(usePersonalBlocks.getState().blocks).toHaveLength(0);
    expect(doc().objects).toHaveLength(4);
  });
  it('highlights wires on hover, attaches current, edits its label, reverses, colors and drags the label', () => {
    const w = line(-200, 0, 200, 0);
    useEditorStore.setState({ document: { ...emptyDocument(), objects: [w] } });
    render(<App />);
    chooseElectrical('Corrente su un filo');
    move(50, 0);
    expect(canvas().querySelector(`[data-current-hover="${w.id}"]`)).toBeTruthy();
    click(50, 0);
    const annotation = doc().objects.at(-1) as ElectricalAnnotation;
    expect(annotation.wireId).toBe(w.id);
    expect(useEditorStore.getState().tool).toBe('select');
    fireEvent.change(screen.getByLabelText('Etichetta annotazione'), {
      target: { value: 'i_{AB}' },
    });
    fireEvent.blur(screen.getByLabelText('Etichetta annotazione'));
    fireEvent.click(screen.getByRole('button', { name: 'Inverti freccia' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stile' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simbolo: Verde' }));
    expect(doc().objects.at(-1)).toMatchObject({
      reversed: true,
      color: '#269978',
      label: { text: 'i_{AB}' },
    });
    const label = canvas().querySelector(`[data-label="${annotation.id}"]`)!;
    fireEvent.pointerDown(label, client(50, -40));
    move(80, -60);
    fireEvent.pointerUp(canvas(), client(80, -60));
    expect(doc().objects.at(-1)).toMatchObject({
      wireId: w.id,
      label: { offset: { x: 30, y: -20 } },
    });
  });
  it('places vertical current and free voltage arrows without changing wire topology', () => {
    const w = line(0, -200, 0, 200);
    useEditorStore.setState({ document: { ...emptyDocument(), objects: [w] } });
    render(<App />);
    chooseElectrical('Corrente su un filo');
    click(0, 50);
    expect(doc().objects.at(-1)).toMatchObject({
      kind: 'electrical',
      mode: 'current',
      wireId: w.id,
    });
    chooseElectrical('Tensione tra due punti');
    fireEvent.pointerDown(canvas(), client(120, -100));
    move(120, 100);
    fireEvent.pointerUp(canvas(), client(120, 100));
    expect(doc().objects.at(-1)).toMatchObject({
      mode: 'voltage',
      start: { x: 120, y: -100 },
      end: { x: 120, y: 100 },
    });
    expect(doc().objects.filter((o) => o.kind === 'wire')).toEqual([w]);
  });
  it('attaches polarity only to two-terminal components and reverses it', () => {
    const c = createComponent('resistor', { x: 0, y: 0 }, 1),
      multi = createComponent('npn', { x: 200, y: 0 }, 1);
    useEditorStore.setState({ document: { ...emptyDocument(), objects: [c, multi] } });
    render(<App />);
    chooseElectrical('Polarità + / −');
    fireEvent.pointerDown(
      canvas().querySelector(`[data-object="${multi.id}"] .object-hit`)!,
      client(200, 0),
    );
    expect(doc().objects).toHaveLength(2);
    expect(useEditorStore.getState().notice).toContain('due terminali');
    fireEvent.pointerDown(
      canvas().querySelector(`[data-object="${c.id}"] .object-hit`)!,
      client(0, 0),
    );
    expect(doc().objects.at(-1)).toMatchObject({ mode: 'polarity', componentId: c.id });
    fireEvent.click(screen.getByRole('button', { name: 'Inverti freccia' }));
    expect(doc().objects.at(-1)).toMatchObject({ reversed: true });
  });
  it('replaces with a compatible picker and supports atomic undo and redo', () => {
    const c = createComponent('resistor', { x: 0, y: 0 }, 1);
    useEditorStore.setState({ document: { ...emptyDocument(), objects: [c] }, selection: [c.id] });
    render(<App />);
    fireEvent.click(screen.getByLabelText('Altre proprietà'));
    fireEvent.click(screen.getByRole('button', { name: 'Sostituisci…' }));
    expect(screen.queryByRole('button', { name: 'Transistor NPN' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Cerca sostituzione'), {
      target: { value: 'Condensatore' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Condensatore' }));
    expect(doc().objects[0]).toMatchObject({ type: 'capacitor', id: c.id });
    key('z', { ctrlKey: true });
    expect(doc().objects[0]).toMatchObject({ type: 'resistor' });
    key('z', { ctrlKey: true, shiftKey: true });
    expect(doc().objects[0]).toMatchObject({ type: 'capacitor' });
  });
  it('Quick Junction toggles a visual crossing and deletion restores it', () => {
    useEditorStore.setState({
      document: { ...emptyDocument(), objects: [line(-200, 0, 200, 0), line(0, -200, 0, 200)] },
    });
    render(<App />);
    expect(canvas().querySelectorAll('[data-wire-crossing]')).toHaveLength(1);
    chooseDrawingTool('Nodo');
    click(0, 0);
    expect(canvas().querySelectorAll('[data-wire-crossing]')).toHaveLength(0);
    key('Delete');
    expect(wireCrossings(doc())).toHaveLength(1);
    expect(canvas().querySelectorAll('[data-wire-crossing]')).toHaveLength(1);
  });
  it('Quick Junction on an existing node connects a later passing wire in one undo step', () => {
    const connected = insertJunction(
      { ...emptyDocument(), objects: [line(-200, 0, 200, 0)] },
      { x: 0, y: 0 },
    );
    const original = {
      ...connected.doc,
      objects: [...connected.doc.objects, line(0, -200, 0, 200)],
    };
    useEditorStore.setState({ document: original });
    render(<App />);
    expect(canvas().querySelectorAll('[data-wire-crossing]')).toHaveLength(1);
    chooseDrawingTool('Nodo');
    click(0, 0);
    expect(canvas().querySelectorAll('[data-wire-crossing]')).toHaveLength(0);
    expect(doc().objects.filter((o) => o.kind === 'junction')).toHaveLength(1);
    expect(doc().objects.filter((o) => o.kind === 'wire')).toHaveLength(4);
    key('z', { ctrlKey: true });
    expect(doc()).toEqual(original);
    expect(canvas().querySelectorAll('[data-wire-crossing]')).toHaveLength(1);
    key('z', { ctrlKey: true, shiftKey: true });
    expect(canvas().querySelectorAll('[data-wire-crossing]')).toHaveLength(0);
    expect(useEditorStore.getState().past).toHaveLength(1);
  });
  it('exports valid pure XML/SVG with LaTeX and switches to selection without UI debris', async () => {
    const c = createComponent('resistor', { x: 0, y: 0 }, 1),
      d = createComponent('inductor', { x: 180, y: 0 }, 1);
    c.label.text = '\\frac{R_1}{R_2}';
    useEditorStore.setState({
      document: { ...emptyDocument(), objects: [c, d] },
      selection: [c.id],
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Esporta$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'SVG' }));
    const full = (screen.getByLabelText('Codice SVG generato') as HTMLTextAreaElement).value;
    const parsed = new DOMParser().parseFromString(full, 'image/svg+xml');
    expect(parsed.querySelector('parsererror')).toBeNull();
    expect(parsed.documentElement.tagName).toBe('svg');
    expect(full).not.toMatch(/foreignObject|data-layer|NaN|undefined/);
    fireEvent.click(screen.getByRole('button', { name: 'Solo selezione' }));
    const subset = (screen.getByLabelText('Codice SVG generato') as HTMLTextAreaElement).value;
    expect(subset.length).toBeLessThan(full.length);
    const copy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: copy },
      configurable: true,
    });
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Copia codice SVG' })),
    );
    expect(copy).toHaveBeenCalledWith(subset);
    expect(screen.getByRole('button', { name: 'SVG copiato' })).toBeTruthy();
  });
  it('preserves annotations in a saved block and permits their independent deletion after insertion', () => {
    const w = line(-200, 0, 200, 0),
      original = { ...emptyDocument(), objects: [w] },
      a = createCurrent(w, { x: 0, y: 0 }, original);
    const block = createPersonalBlock({ ...original, objects: [w, a] }, [w.id, a.id], 'Corrente');
    usePersonalBlocks.getState().add(block);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Inserisci blocco personale: Corrente' }));
    move(0, 0);
    click(0, 0);
    const inserted = doc().objects.find((o) => o.kind === 'electrical') as ElectricalAnnotation;
    act(() => useEditorStore.getState().select([inserted.id]));
    key('Delete');
    expect(doc().objects.filter((o) => o.kind === 'wire')).toHaveLength(1);
    expect(exportSVG(doc())).not.toContain('NaN');
  });
  it('closes the new electrical menu with Escape without changing existing shortcuts', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Disegno e annotazioni' }));
    key('Escape');
    expect(screen.queryByRole('menuitem', { name: 'Corrente sul filo' })).toBeNull();
    key('a');
    expect(useEditorStore.getState().tool).toBe('arrow');
    key('l');
    expect(useEditorStore.getState().tool).toBe('loop-arrow');
    key('w');
    expect(useEditorStore.getState().tool).toBe('wire');
  });
});

it('flushes an immediate reload and preserves the committed document during a gesture', () => {
  const saved = vi.fn();
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: saved });
  const c = createComponent('resistor', { x: 0, y: 0 }, 1);
  useEditorStore.getState().add([c]);
  window.dispatchEvent(new Event('beforeunload'));
  expect(saved.mock.calls.at(-1)?.[1]).toContain(c.id);
  const committed = doc();
  useEditorStore.getState().beginGesture();
  useEditorStore.getState().preview({ ...committed, objects: [] });
  window.dispatchEvent(new Event('pagehide'));
  expect(saved.mock.calls.at(-1)?.[1]).toContain(c.id);
});

it('exports existing Arrow and Loop Arrow geometry and escapes authored text in SVG', () => {
  const arrows = {
    ...emptyDocument(),
    objects: [
      {
        kind: 'arrow' as const,
        id: 'arrow',
        type: 'curve' as const,
        start: { x: 0, y: 0 },
        end: { x: 120, y: 0 },
        controlPoints: [
          { x: 30, y: -80 },
          { x: 90, y: -80 },
        ] as [{ x: number; y: number }, { x: number; y: number }],
        color: '#df4949',
        width: 3,
        reversed: true,
      },
      {
        kind: 'loop-arrow' as const,
        id: 'loop',
        x: 160,
        y: 0,
        width: 140,
        height: 80,
        direction: 'counterclockwise' as const,
        arrowPosition: 0.4,
        color: '#8855c2',
        strokeWidth: 2,
      },
      {
        kind: 'text' as const,
        id: 'text',
        x: 100,
        y: 150,
        text: '<script>alert("x")</script>',
        fontSize: 24,
        rotation: 0 as const,
        align: 'start' as const,
        color: '#171a20',
      },
    ],
  };
  const svg = exportSVG(arrows),
    parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
  expect(parsed.querySelector('parsererror')).toBeNull();
  expect(parsed.querySelectorAll('path')).toHaveLength(4);
  expect(parsed.querySelector('script')).toBeNull();
  expect(parsed.querySelector('text')?.textContent).toBe('<script>alert("x")</script>');
  expect(svg).toContain('#8855c2');
  expect(svg).not.toContain('NaN');
});

describe('contextual tool feedback and cancellation', () => {
  it('highlights only valid polarity components, clears on leave/Escape, and applies the same target on click', () => {
    const r = createComponent('resistor', { x: 0, y: 0 }),
      op = createComponent('opAmp', { x: 240, y: 0 }),
      w = line(-120, 140, 120, 140);
    useEditorStore.setState({ document: { ...emptyDocument(), objects: [r, op, w] } });
    render(<App />);
    chooseElectrical('Polarità + / −');
    expect(
      screen.getByRole('button', { name: 'Disegno e annotazioni' }).getAttribute('aria-pressed'),
    ).toBe('true');
    const body = canvas().querySelector(
      `[data-layer="components"] [data-object="${r.id}"] .object-hit`,
    )!;
    fireEvent.pointerMove(body, client(0, 0));
    expect(canvas().querySelector(`[data-polarity-hover="${r.id}"]`)).toBeTruthy();
    const invalid = canvas().querySelector(
      `[data-layer="components"] [data-object="${op.id}"] .object-hit`,
    )!;
    fireEvent.pointerMove(invalid, client(240, 0));
    expect(canvas().querySelector('[data-polarity-hover]')).toBeNull();
    move(0, 140);
    expect(canvas().querySelector('[data-polarity-hover]')).toBeNull();
    fireEvent.pointerMove(body, client(0, 0));
    fireEvent.pointerLeave(canvas());
    expect(canvas().querySelector('[data-polarity-hover]')).toBeNull();
    fireEvent.pointerMove(body, client(0, 0));
    key('Escape');
    expect(useEditorStore.getState().tool).toBe('select');
    expect(canvas().querySelector('[data-polarity-hover]')).toBeNull();
    chooseElectrical('Polarità + / −');
    fireEvent.pointerDown(body, client(0, 0));
    fireEvent.pointerUp(canvas(), client(0, 0));
    expect(doc().objects.find((o) => o.kind === 'electrical')).toMatchObject({
      componentId: r.id,
      mode: 'polarity',
    });
    expect(canvas().querySelector('[data-polarity-hover]')).toBeNull();
  });
  it('keeps voltage point A visible between clicks, snaps both points to terminals and cancels cleanly', () => {
    const r = createComponent('resistor', { x: 0, y: 0 });
    useEditorStore.setState({ document: { ...emptyDocument(), objects: [r] } });
    render(<App />);
    chooseElectrical('Tensione tra due punti');
    move(-39, 2);
    expect(canvas().querySelector('.snap-target')).toBeTruthy();
    click(-39, 2);
    expect(canvas().querySelector('[data-voltage-first]')).toBeTruthy();
    expect(document.querySelector('.canvas-hint')?.textContent).toContain('A selezionato');
    move(39, 2);
    expect(canvas().querySelector('[data-voltage-first]')).toBeTruthy();
    click(39, 2);
    expect(doc().objects.find((o) => o.kind === 'electrical')).toMatchObject({
      mode: 'voltage',
      start: { x: -40, y: 0 },
      end: { x: 40, y: 0 },
    });
    expect(canvas().querySelector('[data-voltage-first]')).toBeNull();
    chooseElectrical('Tensione tra due punti');
    click(160, 160);
    key('Escape');
    expect(canvas().querySelector('[data-voltage-first]')).toBeNull();
    expect(canvas().querySelector('.snap-target')).toBeNull();
  });
  it('preserves drag voltage, clears current hover on tool change, and gives visible grid feedback without changing snapping', () => {
    const w = line(0, 0, 200, 0);
    useEditorStore.setState({ document: { ...emptyDocument(), objects: [w] } });
    render(<App />);
    chooseElectrical('Corrente su un filo');
    move(100, 0);
    expect(canvas().querySelector('[data-current-hover]')).toBeTruthy();
    chooseElectrical('Tensione tra due punti');
    expect(canvas().querySelector('[data-current-hover]')).toBeNull();
    fireEvent.pointerDown(canvas(), client(0, 80));
    move(200, 80);
    expect(canvas().querySelector('[data-voltage-first]')).toBeTruthy();
    fireEvent.pointerUp(canvas(), client(200, 80));
    expect(doc().objects.filter((o) => o.kind === 'electrical')).toHaveLength(1);
    const notice = useEditorStore.getState().notice;
    key('g');
    expect(canvas().querySelector(':scope > rect')?.getAttribute('fill')).toBe('transparent');
    expect(screen.getByRole('button', { name: 'Griglia (G)' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(useEditorStore.getState().notice).toBe(notice);
    key('g');
    expect(canvas().querySelector(':scope > rect')?.getAttribute('fill')).toBe('url(#grid)');
    expect(useEditorStore.getState().notice).toBe(notice);
  });
});
