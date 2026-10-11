// @vitest-environment jsdom
import { chooseDrawingTool } from './helpers/drawingMenu';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';
import { demoDocument, emptyDocument } from '../src/model/demo';
import { categories, catalog, createComponent } from '../src/model/catalog';
import { COLORS } from '../src/model/types';
import type { CircuitDocument, Wire } from '../src/model/types';
import { useEditorStore } from '../src/store/editorStore';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import { resolveEndpoint, wirePoints } from '../src/utils/geometry';
import { exportStandalone } from '../src/tikz/exporter';
let clipboardText = '';
beforeEach(() => {
  clipboardText = '';
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
    x: 200,
    y: 0,
    left: 200,
    top: 0,
    right: 1200,
    bottom: 700,
    width: 1000,
    height: 700,
    toJSON: () => ({}),
  });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        clipboardText = text;
      },
      readText: async () => clipboardText,
    },
  });
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
  useEditorStore.setState({
    document: demoDocument(),
    selection: [],
    tool: 'select',
    past: [],
    future: [],
    gestureStart: null,
    notice: '',
    grid: true,
    placementRotation: 0,
    arrowType: 'straight',
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function canvas() {
  return screen.getByTestId('circuit-canvas');
}
function client(x: number, y: number) {
  const transform = canvas().querySelector(':scope > g')!.getAttribute('transform')!,
    n = transform.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  return { clientX: 200 + n[0] + x * n[2], clientY: n[1] + y * n[2], pointerId: 1, button: 0 };
}
function click(x: number, y: number) {
  const p = client(x, y);
  fireEvent.pointerDown(canvas(), p);
  fireEvent.pointerUp(canvas(), p);
}
function key(key: string, extra: Record<string, boolean> = {}) {
  fireEvent.keyDown(canvas(), { key, ...extra });
}
describe('complete editor workflows', () => {
  it('pans with Space, zooms with the wheel and hides the grid', () => {
    render(<App />);
    const before = canvas().querySelector(':scope > g')!.getAttribute('transform');
    fireEvent.keyDown(canvas(), { key: ' ', code: 'Space' });
    fireEvent.pointerDown(canvas(), { clientX: 700, clientY: 350, button: 0, pointerId: 1 });
    fireEvent.pointerMove(canvas(), { clientX: 740, clientY: 370, button: 0, pointerId: 1 });
    fireEvent.pointerUp(canvas(), { clientX: 740, clientY: 370, button: 0, pointerId: 1 });
    fireEvent.keyUp(canvas(), { key: ' ', code: 'Space' });
    const panned = canvas().querySelector(':scope > g')!.getAttribute('transform');
    expect(panned).not.toBe(before);
    fireEvent.wheel(canvas(), { deltaY: 200, clientX: 700, clientY: 350 });
    expect(canvas().querySelector(':scope > g')!.getAttribute('transform')).not.toBe(panned);
    key('g');
    expect(useEditorStore.getState().grid).toBe(false);
  });
  it('marquee selects multiple objects and rotates the group with valid connections', () => {
    render(<App />);
    fireEvent.pointerDown(canvas(), client(-180, -70));
    fireEvent.pointerMove(canvas(), client(180, 70));
    fireEvent.pointerUp(canvas(), client(180, 70));
    expect(useEditorStore.getState().selection).toContain('r-AB');
    expect(useEditorStore.getState().selection).toContain('r-BC');
    expect(useEditorStore.getState().selection).not.toContain('r-AC');
    key('r');
    expect(useEditorStore.getState().document.objects.find((o) => o.id === 'r-AB')).toMatchObject({
      rotation: 45,
    });
    expect(() =>
      deserializeDocument(serializeDocument(useEditorStore.getState().document)),
    ).not.toThrow();
  });

  it('inserts a component from the palette, rotates, duplicates, deletes and undoes', () => {
    useEditorStore.setState({ document: emptyDocument() });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Inserisci resistenza' }));
    click(0, 0);
    expect(useEditorStore.getState().document.objects).toHaveLength(1);
    key('v');
    key('r');
    expect(useEditorStore.getState().document.objects[0]).toMatchObject({ rotation: 45 });
    key('d', { ctrlKey: true });
    expect(useEditorStore.getState().document.objects).toHaveLength(2);
    key('Delete');
    expect(useEditorStore.getState().document.objects).toHaveLength(1);
    key('z', { ctrlKey: true });
    expect(useEditorStore.getState().document.objects).toHaveLength(2);
  });
  it('creates a reference-based terminal connection and manual waypoints', () => {
    render(<App />);
    chooseDrawingTool('Filo');
    click(-160, 0);
    click(-160, 180);
    click(-240, 160);
    const wire = useEditorStore.getState().document.objects.at(-1)!;
    expect(wire).toMatchObject({
      kind: 'wire',
      startEndpoint: { kind: 'terminal', componentId: 'r-AB', terminalId: 'a' },
      endEndpoint: { kind: 'terminal', componentId: 'r-AD', terminalId: 'b' },
      vertices: expect.arrayContaining([{ x: -160, y: 180 }]),
    });
    if (wire.kind !== 'wire') throw new Error('Wire creation failed');
    const points = wirePoints(wire, useEditorStore.getState().document);
    expect(points[0]).toEqual({ x: -160, y: 0 });
    expect(points[1].x).toBeLessThan(points[0].x);
    expect(points[1].y).toBe(points[0].y);
    expect(points).toContainEqual({ x: -160, y: 180 });
    expect(points.at(-1)).toEqual({ x: -240, y: 160 });
    points.slice(1).forEach((point, i) => {
      expect(point).not.toEqual(points[i]);
      expect(point.x === points[i].x || point.y === points[i].y).toBe(true);
    });
  });
  it('splits a wire when inserting a named junction and preserves connectivity', () => {
    render(<App />);
    chooseDrawingTool('Nodo');
    click(-240, -80);
    const doc = useEditorStore.getState().document,
      junction = doc.objects.at(-1)!;
    expect(junction).toMatchObject({ kind: 'junction', x: -240, y: -80, label: { text: 'E' } });
    const incident = doc.objects.filter(
      (o): o is Wire =>
        o.kind === 'wire' &&
        ((o.startEndpoint.kind === 'junction' && o.startEndpoint.junctionId === junction.id) ||
          (o.endEndpoint.kind === 'junction' && o.endEndpoint.junctionId === junction.id)),
    );
    expect(incident).toHaveLength(2);
    expect(() => deserializeDocument(serializeDocument(doc))).not.toThrow();
  });
  it('moves a component with pointer events and records one undo step', () => {
    render(<App />);
    const object = canvas().querySelector('[data-object="r-AB"] .object-hit')!;
    fireEvent.pointerDown(object, client(-120, 0));
    fireEvent.pointerMove(canvas(), client(-60, 60));
    fireEvent.pointerUp(canvas(), client(-60, 60));
    expect(
      resolveEndpoint(
        { kind: 'terminal', componentId: 'r-AB', terminalId: 'a' },
        useEditorStore.getState().document,
      ),
    ).toEqual({ x: -100, y: 60 });
    expect(useEditorStore.getState().past).toHaveLength(1);
    key('z', { ctrlKey: true });
    expect(
      resolveEndpoint(
        { kind: 'terminal', componentId: 'r-AB', terminalId: 'a' },
        useEditorStore.getState().document,
      ),
    ).toEqual({ x: -160, y: 0 });
  });
  it('drags an attached wire to change its route while retaining references', () => {
    render(<App />);
    const hit = canvas().querySelector('[data-object="w-r-AB-a"] path')!;
    fireEvent.pointerDown(hit, client(-200, 0));
    fireEvent.pointerMove(canvas(), client(-200, 40));
    fireEvent.pointerUp(canvas(), client(-200, 40));
    const wire = useEditorStore.getState().document.objects.find((o) => o.id === 'w-r-AB-a')!;
    expect(wire).toMatchObject({
      startEndpoint: { kind: 'terminal' },
      endEndpoint: { kind: 'junction' },
      vertices: [{ x: -200, y: 40 }],
    });
  });
  it('edits subscripts by double clicking and confirming a label', () => {
    render(<App />);
    fireEvent.doubleClick(canvas().querySelector('[data-object="r-AB"] [data-label]')!);
    fireEvent.change(screen.getByRole('textbox', { name: 'Modifica testo sul foglio' }), {
      target: { value: 'R_{eq}' },
    });
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Modifica testo sul foglio' }), {
      key: 'Enter',
    });
    expect(useEditorStore.getState().document.objects.find((o) => o.id === 'r-AB')).toMatchObject({
      label: { text: 'R_{eq}' },
    });
    expect(
      canvas().querySelector('[data-object="r-AB"] .katex-mathml msub > mrow')?.textContent,
    ).toBe('eq');
  });
  it('inserts selected text directly, drags it, cancels inline edits and preserves LaTeX undo/redo', () => {
    useEditorStore.setState({
      document: emptyDocument(),
      selection: [],
      past: [],
      future: [],
      notice: '',
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Testo' }));
    click(100, -80);
    const text = useEditorStore.getState().document.objects[0];
    const target = () =>
      canvas().querySelector(`[data-layer="annotations"] [data-object="${text.id}"]`)!;
    expect(text).toMatchObject({ kind: 'text', text: 'Testo', x: 100, y: -80 });
    expect(useEditorStore.getState().selection).toEqual([text.id]);
    expect(useEditorStore.getState().tool).toBe('select');
    expect(screen.queryByLabelText('Modifica testo sul foglio')).toBeNull();
    expect(screen.queryByLabelText('Testo annotazione')).toBeNull();
    expect(document.querySelector('.context-toolbar')).toBeNull();
    expect(screen.getByLabelText('Contenuto testo')).toBeDefined();
    expect(document.querySelector('.inline-latex-preview')).toBeNull();
    fireEvent.pointerDown(target(), client(100, -80));
    fireEvent.pointerMove(canvas(), client(120, -60));
    fireEvent.pointerUp(canvas(), client(120, -60));
    expect(useEditorStore.getState().document.objects[0]).toMatchObject({ x: 120, y: -60 });
    const history = useEditorStore.getState().past.length;
    fireEvent.doubleClick(target());
    expect(screen.queryByLabelText('Conferma testo')).toBeNull();
    expect(document.querySelector('.inline-latex-preview')).toBeNull();
    fireEvent.change(screen.getByLabelText('Modifica testo sul foglio'), {
      target: { value: 'Discard me' },
    });
    fireEvent.keyDown(screen.getByLabelText('Modifica testo sul foglio'), { key: 'Escape' });
    expect(useEditorStore.getState().document.objects[0]).toMatchObject({ text: 'Testo' });
    expect(useEditorStore.getState().past).toHaveLength(history);
    fireEvent.doubleClick(target());
    fireEvent.submit(screen.getByLabelText('Modifica testo sul foglio').closest('form')!);
    expect(useEditorStore.getState().past).toHaveLength(history);
    fireEvent.doubleClick(target());
    fireEvent.change(screen.getByLabelText('Modifica testo sul foglio'), {
      target: { value: 'V_{out}' },
    });
    fireEvent.submit(screen.getByLabelText('Modifica testo sul foglio').closest('form')!);
    expect(target().querySelector('.katex-mathml msub > mrow')?.textContent).toBe('out');
    act(() => useEditorStore.getState().undo());
    expect(useEditorStore.getState().document.objects[0]).toMatchObject({ text: 'Testo' });
    act(() => useEditorStore.getState().redo());
    expect(useEditorStore.getState().document.objects[0]).toMatchObject({
      text: 'V_{out}',
      x: 120,
      y: -60,
    });
    act(() => useEditorStore.getState().undo());
    act(() => useEditorStore.getState().undo());
    act(() => useEditorStore.getState().undo());
    expect(useEditorStore.getState().document.objects).toEqual([]);
    act(() => useEditorStore.getState().redo());
    expect(useEditorStore.getState().document.objects[0]).toMatchObject({ text: 'Testo' });
  });
  it('creates text and a circular arrow with editable handles', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Testo' }));
    click(100, -80);
    expect(screen.queryByLabelText('Modifica testo sul foglio')).toBeNull();
    const text = useEditorStore.getState().document.objects.at(-1)!;
    expect(text).toMatchObject({ kind: 'text', text: 'Testo' });
    fireEvent.doubleClick(
      canvas().querySelector(`[data-layer="annotations"] [data-object="${text.id}"]`)!,
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Modifica testo sul foglio' }), {
      target: { value: 'maglia 2' },
    });
    fireEvent.submit(screen.getByLabelText('Modifica testo sul foglio').closest('form')!);
    expect(useEditorStore.getState().document.objects.at(-1)).toMatchObject({
      kind: 'text',
      text: 'maglia 2',
    });
    chooseDrawingTool('Freccia');
    act(() => useEditorStore.getState().setArrowType('arc'));
    fireEvent.pointerDown(canvas(), client(20, 100));
    fireEvent.pointerMove(canvas(), client(180, 100));
    fireEvent.pointerUp(canvas(), client(180, 100));
    expect(useEditorStore.getState().document.objects.at(-1)).toMatchObject({
      kind: 'arrow',
      type: 'arc',
    });
    expect(canvas().querySelector('[data-handle="start"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Inverti freccia' }));
    expect(useEditorStore.getState().document.objects.at(-1)).toMatchObject({ reversed: true });
  });
  it('copies and pastes whole circuits with remapped terminal IDs', async () => {
    render(<App />);
    key('a', { ctrlKey: true });
    key('c', { ctrlKey: true });
    await waitFor(() => expect(clipboardText).not.toBe(''));
    const count = useEditorStore.getState().document.objects.length;
    key('v', { ctrlKey: true });
    await waitFor(() => expect(useEditorStore.getState().document.objects).toHaveLength(count * 2));
    expect(() =>
      deserializeDocument(serializeDocument(useEditorStore.getState().document)),
    ).not.toThrow();
  });
  it('retains internal serialized replacement without exposing document controls', () => {
    render(<App />);
    const doc = { ...emptyDocument(), title: 'Importato' };
    act(() => useEditorStore.getState().replace(deserializeDocument(serializeDocument(doc))));
    expect(useEditorStore.getState().document).toEqual(doc);
    expect(screen.queryByLabelText('Apri file JSON')).toBeNull();
    expect(screen.queryByLabelText('Titolo circuito')).toBeNull();
  });
  it('generates copyable TikZ and a .tex download from the dialog', async () => {
    const createUrl = vi.fn(() => 'blob:test');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Esporta$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Copia TikZ' }));
    await waitFor(() => expect(clipboardText).toContain('\\begin{circuitikz}'));
    fireEvent.click(screen.getByRole('button', { name: 'Scarica .tex' }));
    expect(createUrl).toHaveBeenCalledOnce();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
  });
  it('renders 100 components, 200 wires and 100 annotations and keeps drag connections valid', () => {
    const components = Array.from({ length: 100 }, (_, i) => ({
      ...createComponent('resistor', { x: (i % 10) * 140, y: Math.floor(i / 10) * 140 }),
      id: `c${i}`,
    }));
    const wires: Wire[] = Array.from({ length: 200 }, (_, i) => ({
      kind: 'wire',
      id: `w${i}`,
      startEndpoint: { kind: 'terminal', componentId: `c${i % 100}`, terminalId: 'b' },
      endEndpoint: { kind: 'terminal', componentId: `c${(i + 1) % 100}`, terminalId: 'a' },
      vertices: [],
      color: COLORS.ink,
      width: 2,
    }));
    const doc: CircuitDocument = {
      version: 1,
      title: 'Stress',
      objects: [
        ...components,
        ...wires,
        ...components.map((c, i) => ({
          kind: 'text' as const,
          id: `t${i}`,
          x: c.x,
          y: c.y + 40,
          text: 'i_1',
          color: COLORS.red,
          fontSize: 20,
          align: 'middle' as const,
          rotation: 0 as const,
        })),
      ],
    };
    useEditorStore.setState({ document: doc });
    render(<App />);
    expect(
      new Set(
        Array.from(canvas().querySelectorAll('[data-object]')).map((el) =>
          el.getAttribute('data-object'),
        ),
      ).size,
    ).toBe(400);
    act(() =>
      useEditorStore.getState().update('c0', (o) => (o.kind === 'component' ? { ...o, x: 40 } : o)),
    );
    expect(resolveEndpoint(wires[0].startEndpoint, useEditorStore.getState().document)).toEqual({
      x: 80,
      y: 0,
    });
    expect(canvas().querySelector('[data-object="w0"] path')?.getAttribute('d')).toMatch(/^M 80 0/);
  });
});

describe('fast drawing interactions', () => {
  it('creates a terminal junction once and keeps the original history document immutable', () => {
    render(<App />);
    const initial = useEditorStore.getState().document;
    key('n');
    click(-160, 0);
    const once = useEditorStore.getState().document;
    expect(once.objects.filter((o) => o.kind === 'junction')).toHaveLength(5);
    key('n');
    click(-160, 0);
    expect(useEditorStore.getState().document).toBe(once);
    key('z', { metaKey: true });
    expect(useEditorStore.getState().document).toEqual(initial);
  });
  it('finishes free wires on double click without starting a phantom draft on a connected target', () => {
    render(<App />);
    key('w');
    click(-160, 0);
    fireEvent.pointerDown(canvas(), { ...client(-180, 180), detail: 1 });
    fireEvent.pointerUp(canvas(), client(-180, 180));
    fireEvent.pointerDown(canvas(), { ...client(-180, 180), detail: 2 });
    fireEvent.pointerUp(canvas(), client(-180, 180));
    fireEvent.doubleClick(canvas(), client(-180, 180));
    expect(useEditorStore.getState().document.objects.at(-1)).toMatchObject({
      kind: 'wire',
      endEndpoint: { kind: 'free', point: { x: -180, y: 180 } },
    });
    click(-160, 0);
    click(-240, 160);
    fireEvent.pointerDown(canvas(), { ...client(-240, 160), detail: 2 });
    fireEvent.pointerUp(canvas(), client(-240, 160));
    fireEvent.doubleClick(canvas(), client(-240, 160));
    expect(useEditorStore.getState().gestureStart).toBeNull();
  });
  it('reattaches a selected endpoint directly to a wire as one undoable topology edit', () => {
    render(<App />);
    act(() => useEditorStore.getState().select(['w-r-AB-a']));
    const before = useEditorStore.getState().document;
    fireEvent.pointerDown(
      canvas().querySelector('[data-handle="wireStart"] circle')!,
      client(-160, 0),
    );
    fireEvent.pointerMove(canvas(), client(240, -80));
    fireEvent.pointerUp(canvas(), client(240, -80));
    const doc = useEditorStore.getState().document;
    expect(doc.objects.find((o) => o.id === 'w-r-AB-a')).toMatchObject({
      startEndpoint: { kind: 'junction' },
    });
    expect(doc.objects.filter((o) => o.kind === 'junction')).toHaveLength(5);
    expect(() => deserializeDocument(serializeDocument(doc))).not.toThrow();
    key('z', { metaKey: true });
    expect(useEditorStore.getState().document).toEqual(before);
  });
  it('builds the complete six-resistor network from blank through UI interactions and exports both loops', async () => {
    useEditorStore.setState({ document: emptyDocument() });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Inserisci resistenza' }));
    click(-120, 0);
    click(120, 0);
    click(0, -160);
    key('r');
    key('r');
    click(-240, 120);
    click(0, 120);
    click(240, 120);
    key('Escape');
    const components = useEditorStore
      .getState()
      .document.objects.filter((o) => o.kind === 'component');
    const names = ['r_{AB}', 'r_{BC}', 'r_{AC}', 'r_{AD}', 'r_{BD}', 'r_{CD}'];
    components.forEach((o, i) => {
      fireEvent.doubleClick(
        canvas().querySelector(`[data-layer="labels"] [data-object="${o.id}"] [data-label]`)!,
      );
      fireEvent.change(screen.getByLabelText('Modifica testo sul foglio'), {
        target: { value: names[i] },
      });
      fireEvent.submit(screen.getByLabelText('Modifica testo sul foglio').closest('form')!);
    });
    for (const [i, p] of [
      [-240, 0],
      [0, 0],
      [240, 0],
      [0, 220],
    ].entries()) {
      key('n');
      click(p[0], p[1]);
      key('Enter');
      fireEvent.change(screen.getByLabelText('Modifica testo sul foglio'), {
        target: { value: 'ABCD'[i] },
      });
      fireEvent.submit(screen.getByLabelText('Modifica testo sul foglio').closest('form')!);
    }
    const connect = (points: number[][]) => {
      key('w');
      points.forEach((p) => click(p[0], p[1]));
    };
    connect([
      [-160, 0],
      [-240, 0],
    ]);
    connect([
      [-80, 0],
      [0, 0],
    ]);
    connect([
      [80, 0],
      [0, 0],
    ]);
    connect([
      [160, 0],
      [240, 0],
    ]);
    connect([
      [-40, -160],
      [-240, -160],
      [-240, 0],
    ]);
    connect([
      [40, -160],
      [240, -160],
      [240, 0],
    ]);
    connect([
      [-240, 80],
      [-240, 0],
    ]);
    connect([
      [0, 80],
      [0, 0],
    ]);
    connect([
      [240, 80],
      [240, 0],
    ]);
    connect([
      [-240, 160],
      [-240, 220],
      [0, 220],
    ]);
    connect([
      [0, 160],
      [0, 220],
    ]);
    connect([
      [240, 160],
      [240, 220],
      [0, 220],
    ]);
    expect(
      useEditorStore.getState().document.objects.filter((o) => o.kind === 'wire'),
    ).toHaveLength(12);
    for (const [x1, x2] of [
      [-200, -40],
      [40, 200],
    ]) {
      key('l');
      fireEvent.pointerDown(canvas(), client(x1, 40));
      fireEvent.pointerMove(canvas(), client(x2, 180));
      fireEvent.pointerUp(canvas(), client(x2, 180));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Inverti freccia' }));
    const ad = components[3],
      origin = client(-240, 120);
    fireEvent.pointerDown(
      canvas().querySelector(`[data-layer="components"] [data-object="${ad.id}"] .object-hit`)!,
      origin,
    );
    fireEvent.pointerMove(canvas(), client(-220, 120));
    fireEvent.pointerUp(canvas(), client(-220, 120));
    let doc = useEditorStore.getState().document;
    const wires = doc.objects.filter((o): o is Wire => o.kind === 'wire');
    const attached = wires.filter(
      (o) => o.startEndpoint.kind === 'terminal' && o.startEndpoint.componentId === ad.id,
    );
    expect(attached).toHaveLength(2);
    attached.forEach((o) => expect(resolveEndpoint(o.startEndpoint, doc).x).toBe(-220));
    const b = doc.objects.find((o) => o.kind === 'junction' && o.label.text === 'B')!;
    fireEvent.pointerDown(
      canvas().querySelector(`[data-layer="junctions"] [data-object="${b.id}"] circle`)!,
      client(0, 0),
    );
    fireEvent.pointerMove(canvas(), client(20, 20));
    fireEvent.pointerUp(canvas(), client(20, 20));
    doc = useEditorStore.getState().document;
    wires
      .filter((o) => o.endEndpoint.kind === 'junction' && o.endEndpoint.junctionId === b.id)
      .forEach((o) => expect(resolveEndpoint(o.endEndpoint, doc)).toEqual({ x: 20, y: 20 }));
    connect([
      [-240, -80],
      [-300, -80],
    ]);
    key('Enter');
    key('v');
    const complete = useEditorStore.getState().document;
    expect(complete.objects.filter((o) => o.kind === 'junction')).toHaveLength(5);
    expect(deserializeDocument(serializeDocument(complete))).toEqual(complete);
    fireEvent.click(screen.getByRole('button', { name: /^Esporta$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'File .tex' }));
    const code = (screen.getByLabelText('Codice TikZ generato') as HTMLTextAreaElement).value;
    expect(code).toBe(exportStandalone(complete));
    expect(code.match(/x radius=/g)).toHaveLength(2);
    names.forEach((name) => expect(code).toContain(name));
    // Compilation fixture is generated from the actual UI workflow, not a model-only example.
    const { writeFileSync } = await vi.importActual<{
      writeFileSync: (path: string, data: string) => void;
    }>('node:fs');
    writeFileSync('/private/tmp/drawcircuit-pass2.tex', code);
    writeFileSync('/private/tmp/drawcircuit-pass2.json', serializeDocument(complete));
  });
  it('places repeatedly, rotates the preview, then rotates selection after Esc', () => {
    useEditorStore.setState({ document: emptyDocument() });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Inserisci resistenza' }));
    key('r');
    click(0, 0);
    click(140, 0);
    expect(useEditorStore.getState().tool).toBe('resistor');
    expect(
      useEditorStore
        .getState()
        .document.objects.map(
          (o) => o.kind === 'component' && [o.rotation, o.label.text, o.label.rotation],
        ),
    ).toEqual([
      [45, 'R_1', 0],
      [45, 'R_2', 0],
    ]);
    key('Escape');
    fireEvent.pointerDown(canvas().querySelector('[data-object] .object-hit')!, client(0, 0));
    fireEvent.pointerUp(canvas(), client(0, 0));
    key('r');
    expect(useEditorStore.getState().document.objects[0]).toMatchObject({
      rotation: 90,
      label: { rotation: 0 },
    });
    key('d', { metaKey: true });
    key('d', { metaKey: true });
    expect(
      useEditorStore
        .getState()
        .document.objects.slice(-2)
        .map((o) => o.kind === 'component' && o.label.text),
    ).toEqual(['R_3', 'R_4']);
  });
  it('starts a branch on a wire and undoes/redoes the split and branch together', () => {
    render(<App />);
    key('w');
    click(-240, -80);
    expect(useEditorStore.getState().past).toHaveLength(0);
    expect(
      useEditorStore.getState().document.objects.filter((o) => o.kind === 'junction'),
    ).toHaveLength(5);
    click(-160, 0);
    expect(useEditorStore.getState().past).toHaveLength(1);
    expect(useEditorStore.getState().document.objects.at(-1)).toMatchObject({
      kind: 'wire',
      startEndpoint: { kind: 'junction' },
      endEndpoint: { kind: 'terminal', componentId: 'r-AB' },
    });
    key('z', { metaKey: true });
    expect(useEditorStore.getState().document).toEqual(demoDocument());
    key('z', { metaKey: true, shiftKey: true });
    expect(
      useEditorStore.getState().document.objects.filter((o) => o.kind === 'junction'),
    ).toHaveLength(5);
    expect(() =>
      deserializeDocument(serializeDocument(useEditorStore.getState().document)),
    ).not.toThrow();
  });
  it('finishes at a wire, preserves draft through pan, cancels provisional nodes on Esc/tool change', () => {
    render(<App />);
    key('w');
    click(-160, 0);
    fireEvent.keyDown(canvas(), { key: ' ', code: 'Space' });
    fireEvent.pointerDown(canvas(), client(400, 0));
    fireEvent.pointerMove(canvas(), client(420, 0));
    fireEvent.pointerUp(canvas(), client(420, 0));
    fireEvent.keyUp(canvas(), { key: ' ', code: 'Space' });
    expect(useEditorStore.getState().tool).toBe('wire');
    click(-240, -80);
    expect(useEditorStore.getState().document.objects.at(-1)).toMatchObject({
      kind: 'wire',
      endEndpoint: { kind: 'junction' },
    });
    const complete = useEditorStore.getState().document;
    key('w');
    click(240, -80);
    key('Escape');
    expect(useEditorStore.getState().document).toBe(complete);
    key('w');
    click(240, -80);
    key('a');
    expect(useEditorStore.getState().document).toBe(complete);
  });
  it('Enter edits node names, Escape cancels and the context input also cancels', () => {
    render(<App />);
    act(() => useEditorStore.getState().select(['node-A']));
    key('Enter');
    fireEvent.change(screen.getByLabelText('Modifica testo sul foglio'), {
      target: { value: 'Q' },
    });
    fireEvent.keyDown(screen.getByLabelText('Modifica testo sul foglio'), { key: 'Escape' });
    expect(useEditorStore.getState().document.objects.find((o) => o.id === 'node-A')).toMatchObject(
      { label: { text: 'A' } },
    );
    const name = screen.getByLabelText('Nome nodo');
    fireEvent.change(name, { target: { value: 'Q' } });
    fireEvent.keyDown(name, { key: 'Escape' });
    fireEvent.blur(name);
    expect(useEditorStore.getState().document.objects.find((o) => o.id === 'node-A')).toMatchObject(
      { label: { text: 'A' } },
    );
    key('Enter');
    fireEvent.change(screen.getByLabelText('Modifica testo sul foglio'), {
      target: { value: 'P' },
    });
    fireEvent.submit(screen.getByLabelText('Modifica testo sul foglio').closest('form')!);
    expect(useEditorStore.getState().document.objects.find((o) => o.id === 'node-A')).toMatchObject(
      { label: { text: 'P' } },
    );
  });
  it('creates an ellipse, resizes it, moves its head, reverses and records creation undo', () => {
    render(<App />);
    key('l');
    fireEvent.pointerDown(canvas(), client(-200, 40));
    fireEvent.pointerMove(canvas(), client(-40, 180));
    fireEvent.pointerUp(canvas(), client(-40, 180));
    expect(useEditorStore.getState().document.objects.at(-1)).toMatchObject({
      kind: 'loop-arrow',
      width: 160,
      height: 140,
      direction: 'clockwise',
      strokeWidth: 2,
    });
    key('z', { metaKey: true });
    expect(useEditorStore.getState().document).toEqual(demoDocument());
    key('z', { metaKey: true, shiftKey: true });
    const id = useEditorStore.getState().document.objects.at(-1)!.id;
    act(() => useEditorStore.getState().select([id]));
    fireEvent.pointerDown(
      canvas().querySelector('[data-handle="loopSE"] circle')!,
      client(-40, 180),
    );
    fireEvent.pointerMove(canvas(), client(-20, 220));
    fireEvent.pointerUp(canvas(), client(-20, 220));
    expect(useEditorStore.getState().document.objects.at(-1)).toMatchObject({
      width: 180,
      height: 180,
    });
    fireEvent.pointerDown(
      canvas().querySelector('[data-handle="loopHead"] circle')!,
      client(-46, 66),
    );
    fireEvent.pointerMove(canvas(), client(-110, 220));
    fireEvent.pointerUp(canvas(), client(-110, 220));
    const ellipse = useEditorStore.getState().document.objects.at(-1)!;
    expect(ellipse.kind === 'loop-arrow' && ellipse.arrowPosition).toBeCloseTo(0.5);
    fireEvent.click(screen.getByRole('button', { name: 'Inverti freccia' }));
    expect(useEditorStore.getState().document.objects.at(-1)).toMatchObject({
      direction: 'counterclockwise',
    });
    const layers = Array.from(canvas().querySelectorAll('[data-layer]')).map((el) =>
      el.getAttribute('data-layer'),
    );
    expect(layers.indexOf('selection')).toBeGreaterThan(layers.indexOf('annotations'));
  });
  it('adds, drags and removes a wire waypoint with Alt click', () => {
    render(<App />);
    const path = canvas().querySelector('[data-object="w-r-AB-a"] path')!;
    fireEvent.doubleClick(path, client(-200, 0));
    act(() => useEditorStore.getState().select(['w-r-AB-a']));
    const handle = canvas().querySelector('[data-handle="vertex:0"] circle')!;
    fireEvent.pointerDown(handle, client(-200, 0));
    fireEvent.pointerMove(canvas(), client(-200, 40));
    fireEvent.pointerUp(canvas(), client(-200, 40));
    expect(
      useEditorStore.getState().document.objects.find((o) => o.id === 'w-r-AB-a'),
    ).toMatchObject({ vertices: [{ x: -200, y: 40 }] });
    fireEvent.pointerDown(canvas().querySelector('[data-handle="vertex:0"] circle')!, {
      ...client(-200, 40),
      altKey: true,
    });
    expect(
      useEditorStore.getState().document.objects.find((o) => o.id === 'w-r-AB-a'),
    ).toMatchObject({ vertices: [] });
  });
});

describe('expanded library and annotation fonts in the rendered interface', () => {
  it('filters aliases, expands search results from collapsed categories and edits block text', () => {
    useEditorStore.setState({ document: emptyDocument() });
    render(<App />);
    for (const category of categories)
      expect(screen.getByRole('button', { name: category })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Transistor' }));
    const search = screen.getByRole('textbox', { name: 'Cerca componenti' });
    fireEvent.change(search, { target: { value: 'mos' } });
    expect(screen.getByRole('button', { name: 'Inserisci mosfet nmos' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Inserisci mosfet pmos' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Inserisci resistenza' })).toBeNull();
    fireEvent.change(search, { target: { value: 'ground' } });
    expect(screen.getAllByRole('button', { name: /Inserisci massa/ })).toHaveLength(3);
    fireEvent.change(search, { target: { value: 'black box' } });
    fireEvent.click(screen.getByRole('button', { name: 'Inserisci blocco rettangolare' }));
    click(0, 0);
    key('v');

    const internal = screen.getByRole('textbox', { name: 'Testo interno' });
    fireEvent.change(internal, { target: { value: 'H(s)' } });
    fireEvent.blur(internal);
    expect(useEditorStore.getState().document.objects[0]).toMatchObject({
      type: 'blackBox',
      bodyText: 'H(s)',
    });
    expect(canvas().querySelector('[data-layer="components"] text')?.textContent).toBe('H(s)');
    key('z', { ctrlKey: true });
    expect(useEditorStore.getState().document.objects[0]).toMatchObject({ bodyText: 'BLACK BOX' });
  });
  it('creates components, junctions and text without font or value controls', () => {
    render(<App />);
    expect(screen.queryByRole('combobox', { name: /Font/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Inserisci resistenza' }));
    click(400, 0);
    key('v');

    expect(screen.queryByRole('textbox', { name: 'Valore' })).toBeNull();
    key('n');
    click(400, 100);
    fireEvent.click(screen.getByRole('button', { name: 'Testo' }));
    click(400, 200);
    expect(screen.queryByLabelText('Modifica testo sul foglio')).toBeNull();
    const text = useEditorStore.getState().document.objects.at(-1)!;
    fireEvent.doubleClick(
      canvas().querySelector(`[data-layer="annotations"] [data-object="${text.id}"]`)!,
    );
    expect(screen.getByLabelText('Modifica testo sul foglio').style.fontFamily).toContain(
      'Comic Sans',
    );
    fireEvent.submit(screen.getByLabelText('Modifica testo sul foglio').closest('form')!);
    expect(serializeDocument(useEditorStore.getState().document)).not.toContain('fontFamily');
    expect(useEditorStore.getState().document.objects.at(-1)).toMatchObject({ kind: 'text' });
  });
  it('renders A and B in Comic Sans and r_AB with KaTeX, saves and imports source and exports', async () => {
    useEditorStore.setState({ document: emptyDocument() });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Inserisci resistenza' }));
    click(0, 0);
    key('v');
    const label = screen.getByLabelText('Etichetta componente');
    fireEvent.change(label, { target: { value: 'r_{AB}' } });
    fireEvent.blur(label);
    key('n');
    click(-100, 0);
    key('n');
    click(100, 0);
    const objects = useEditorStore.getState().document.objects;
    expect(objects).toHaveLength(3);
    key('w');
    click(-100, 0);
    click(-40, 0);
    click(40, 0);
    click(100, 0);
    key('Escape');
    for (const object of objects) {
      const hit =
        canvas().querySelector(
          `[data-object="${object.id}"] ${object.kind === 'component' ? '.object-hit' : '.junction-hit'}`,
        ) ?? canvas().querySelector(`[data-object="${object.id}"] circle`)!;
      fireEvent.pointerDown(
        hit,
        client(object.kind === 'component' || object.kind === 'junction' ? object.x : 0, 0),
      );
      fireEvent.pointerUp(
        canvas(),
        client(object.kind === 'component' || object.kind === 'junction' ? object.x : 0, 0),
      );
      expect(screen.queryByRole('combobox', { name: 'Font' })).toBeNull();
      expect(canvas().querySelector(`[data-object="${object.id}"] [data-source]`)).not.toBeNull();
    }
    const saved = serializeDocument(useEditorStore.getState().document);
    act(() => useEditorStore.getState().replace(deserializeDocument(saved)));
    expect(serializeDocument(useEditorStore.getState().document)).toBe(saved);
    const fs = await vi.importActual<{ writeFileSync: (path: string, data: string) => void }>(
      'node:fs',
    );
    fs.writeFileSync('/private/tmp/drawcircuit-font-labels.json', saved);
    fs.writeFileSync(
      '/private/tmp/drawcircuit-font-labels.tex',
      exportStandalone(useEditorStore.getState().document),
    );
    fireEvent.click(screen.getByRole('button', { name: /^Esporta$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'File .tex' }));
    expect((screen.getByLabelText('Codice TikZ generato') as HTMLTextAreaElement).value).toContain(
      '\\ifPDFTeX',
    );
    expect(screen.queryByRole('combobox', { name: /Font/ })).toBeNull();
  });
  it('draws the requested 17-component schematic through palette and canvas, wires every pin, rotates, moves, saves/reloads and exports', async () => {
    const createUrl = vi.fn(() => 'blob:mixed');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const consoleError = vi.spyOn(console, 'error');
    useEditorStore.setState({ document: emptyDocument() });
    render(<App />);
    const types = [
      'resistor',
      'capacitor',
      'inductor',
      'voltageSource',
      'currentSource',
      'diode',
      'led',
      'zener',
      'npn',
      'pmos',
      'openSwitch',
      'ground',
      'transformer',
      'opAmp',
      'andGate',
      'notGate',
      'voltmeter',
    ] as const;
    const components = types.map((type, i) => {
      const definition = catalog.find((d) => d.type === type)!;
      fireEvent.click(
        screen.getByRole('button', { name: `Inserisci ${definition.name.toLowerCase()}` }),
      );
      click((i % 5) * 200 - 400, Math.floor(i / 5) * 200 - 300);
      key('Escape');
      const c = useEditorStore.getState().document.objects.at(-1)!;
      if (c.kind !== 'component') throw new Error('Component insertion failed');
      return c;
    });
    for (const c of components)
      for (const pin of c.terminals) {
        const x = c.x + pin.localX,
          y = c.y + pin.localY;
        key('w');
        click(x, y);
        click(
          x + (pin.direction === 'x' ? (pin.localX >= 0 ? 60 : -60) : 0),
          y + (pin.direction === 'y' ? (pin.localY >= 0 ? 60 : -60) : 0),
        );
        key('Enter');
        key('Escape');
      }
    expect(
      useEditorStore.getState().document.objects.filter((o) => o.kind === 'wire'),
    ).toHaveLength(components.reduce((count, c) => count + c.terminals.length, 0));
    const connections = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [8, 9],
      [12, 13],
      [13, 14],
    ];
    for (const [from, to] of connections) {
      const a = components[from],
        b = components[to],
        pinA = a.terminals.at(-1)!,
        pinB = b.terminals[0];
      key('w');
      click(a.x + pinA.localX, a.y + pinA.localY);
      click(b.x + pinB.localX, b.y + pinB.localY);
      key('Escape');
      const wire = useEditorStore.getState().document.objects.at(-1)!;
      expect(wire).toMatchObject({
        kind: 'wire',
        startEndpoint: { kind: 'terminal', componentId: a.id, terminalId: pinA.id },
        endEndpoint: { kind: 'terminal', componentId: b.id, terminalId: pinB.id },
      });
    }
    for (const original of components.filter((c) =>
      ['npn', 'pmos', 'transformer', 'opAmp', 'andGate'].includes(c.type),
    )) {
      const hit = canvas().querySelector(`[data-object="${original.id}"] .object-hit`)!;
      fireEvent.pointerDown(hit, client(original.x, original.y));
      fireEvent.pointerUp(canvas(), client(original.x, original.y));
      key('r');
      const afterRotation = useEditorStore
        .getState()
        .document.objects.find((o) => o.id === original.id)!;
      expect(afterRotation).toMatchObject({ x: original.x, y: original.y, rotation: 45 });
      fireEvent.pointerDown(hit, client(original.x, original.y));
      fireEvent.pointerMove(canvas(), {
        ...client(original.x + 40, original.y + 40),
        altKey: true,
      });
      fireEvent.pointerUp(canvas(), client(original.x + 40, original.y + 40));
      const doc = useEditorStore.getState().document;
      expect(doc.objects.find((o) => o.id === original.id)).toMatchObject({
        x: original.x + 40,
        y: original.y + 40,
        rotation: 45,
      });
      for (const pin of original.terminals) {
        const endpoint = {
          kind: 'terminal' as const,
          componentId: original.id,
          terminalId: pin.id,
        };
        expect(() => resolveEndpoint(endpoint, doc)).not.toThrow();
        const wire = doc.objects.find(
          (o): o is Wire =>
            o.kind === 'wire' &&
            o.startEndpoint.kind === 'terminal' &&
            o.startEndpoint.componentId === original.id &&
            o.startEndpoint.terminalId === pin.id,
        )!;
        const point = resolveEndpoint(endpoint, doc);
        expect(
          canvas().querySelector(`[data-object="${wire.id}"] path`)?.getAttribute('d'),
        ).toMatch(new RegExp(`^M ${point.x} ${point.y}`));
      }
    }
    const saved = serializeDocument(useEditorStore.getState().document);
    act(() => useEditorStore.getState().replace(deserializeDocument(saved)));
    expect(serializeDocument(useEditorStore.getState().document)).toBe(saved);
    fireEvent.click(screen.getByRole('button', { name: /^Esporta$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'File .tex' }));
    const code = (screen.getByLabelText('Codice TikZ generato') as HTMLTextAreaElement).value;
    expect(code).not.toMatch(/undefined|NaN/);
    for (const type of types) expect(code).toContain(`% Component: ${type}`);
    fireEvent.click(screen.getByRole('button', { name: 'Scarica .tex' }));
    expect(createUrl).toHaveBeenCalledOnce();
    const fs = await vi.importActual<{ writeFileSync: (path: string, data: string) => void }>(
      'node:fs',
    );
    fs.writeFileSync('/private/tmp/drawcircuit-mixed-library.json', saved);
    fs.writeFileSync('/private/tmp/drawcircuit-mixed-library.tex', code);
    expect(consoleError).not.toHaveBeenCalled();
    // This full schematic workflow can exceed the unit-test timeout under load.
  }, 10000);
});
