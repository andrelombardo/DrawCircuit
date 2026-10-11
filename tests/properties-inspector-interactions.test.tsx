// @vitest-environment jsdom
import { chooseSelectionCommand, chooseSelectionColor } from './helpers/selectionMenu';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { useEditorStore, saveDocumentNow, STORAGE_KEY } from '../src/store/editorStore';
import {
  createLine,
  createRectangle,
  createTextAnnotation,
  createWire,
} from '../src/model/factories';
import { createComponent } from '../src/model/catalog';
import { createBrace } from '../src/annotations/brace';
import { parallelSources } from './helpers/parallelSources';
import { chooseDrawingTool } from './helpers/drawingMenu';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import { INSPECTOR_STORAGE_KEY } from '../src/components/properties/useInspectorPreferences';
import type { CircuitObject, Point } from '../src/model/types';
import { exportSVG } from '../src/svg/exporter';
const stored = new Map<string, string>();
const canvas = () => screen.getByTestId('circuit-canvas');
const state = () => useEditorStore.getState();
const current = () => state().document;
function client(p: Point, extra = {}) {
  const [x, y, zoom] = canvas()
    .querySelector(':scope > g')!
    .getAttribute('transform')!
    .match(/-?\d+(?:\.\d+)?/g)!
    .map(Number);
  return { clientX: x + p.x * zoom, clientY: y + p.y * zoom, button: 0, pointerId: 1, ...extra };
}
function renderSelection(objects: CircuitObject[]) {
  useEditorStore.setState({
    document: { version: 1, title: 'Test', objects },
    selection: objects.map((o) => o.id),
  });
  render(<App />);
}
function edit(label: string, value: string) {
  const input = screen.getByLabelText(label);
  input.focus();
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
}
beforeEach(() => {
  stored.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => stored.get(k) ?? null,
    setItem: (k: string, v: string) => stored.set(k, v),
  });
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
  for (const method of ['setPointerCapture', 'releasePointerCapture'])
    Object.defineProperty(Element.prototype, method, { configurable: true, value: vi.fn() });
  Object.defineProperty(Element.prototype, 'hasPointerCapture', {
    configurable: true,
    value: () => false,
  });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width: 1200,
    height: 800,
    right: 1200,
    bottom: 800,
    toJSON: () => ({}),
  });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: vi.fn().mockRejectedValue(Error('denied')),
      readText: vi.fn().mockRejectedValue(Error('denied')),
    },
  });
  useEditorStore.setState({
    document: parallelSources(),
    selection: [],
    activeLabel: null,
    past: [],
    future: [],
    gestureStart: null,
    tool: 'select',
    grid: true,
    snapEnabled: true,
    splittingWireId: null,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe('persistent inspector and property transactions', () => {
  it('opens, closes, persists width and visibility without changing document, view or history', () => {
    render(<App />);
    const original = serializeDocument(current()),
      transform = canvas().querySelector(':scope > g')!.getAttribute('transform');
    const separator = screen.getByRole('separator', { name: 'Ridimensiona proprietà' });
    fireEvent.keyDown(separator, { key: 'ArrowLeft' });
    expect(separator.getAttribute('aria-valuenow')).toBe('302');
    fireEvent.pointerDown(separator, { clientX: 900, button: 0 });
    fireEvent.pointerMove(separator, { clientX: 850 });
    fireEvent.pointerUp(separator);
    expect(separator.getAttribute('aria-valuenow')).toBe('352');
    fireEvent.click(screen.getByRole('button', { name: 'Nascondi proprietà' }));
    expect(screen.queryByRole('region', { name: 'Proprietà' })).toBeNull();
    expect(JSON.parse(stored.get(INSPECTOR_STORAGE_KEY)!)).toEqual({ visible: false, width: 352 });
    expect(serializeDocument(current())).toBe(original);
    expect(state().past).toEqual([]);
    expect(canvas().querySelector(':scope > g')!.getAttribute('transform')).toBe(transform);
    cleanup();
    render(<App />);
    expect(screen.queryByRole('region', { name: 'Proprietà' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Mostra proprietà' }));
    expect(
      screen
        .getByRole('separator', { name: 'Ridimensiona proprietà' })
        .getAttribute('aria-valuenow'),
    ).toBe('352');
    expect(JSON.parse(serializeDocument(current()))).not.toHaveProperty('inspector');
  });
  it('clamps size, restores defaults and tolerates malformed preferences', () => {
    stored.set(INSPECTOR_STORAGE_KEY, '{bad');
    render(<App />);
    const separator = screen.getByRole('separator', { name: 'Ridimensiona proprietà' });
    expect(separator.getAttribute('aria-valuenow')).toBe('292');
    fireEvent.keyDown(separator, { key: 'End' });
    expect(separator.getAttribute('aria-valuenow')).toBe('440');
    fireEvent.doubleClick(separator);
    expect(separator.getAttribute('aria-valuenow')).toBe('292');
  });
  it('shows mixed colors, opacity, thickness and text size without selecting a first value', () => {
    const a = createComponent('currentSource', { x: 0, y: 0 }),
      b = {
        ...createComponent('currentSource', { x: 150, y: 0 }),
        color: '#df4949',
        opacity: 0.5,
        width: 3,
        label: { ...a.label, fontSize: 28 },
      };
    renderSelection([a, b]);
    expect(screen.getByLabelText('Spessore linea').getAttribute('value')).toBeNull();
    expect((screen.getByLabelText('Spessore linea') as HTMLSelectElement).value).toBe('');
    expect((screen.getByLabelText('Dimensione testo') as HTMLSelectElement).value).toBe('');
    expect(screen.getByLabelText('Opacità simbolo').getAttribute('aria-valuetext')).toBe(
      'Valori misti',
    );
    expect(screen.getAllByText('Misto')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Colore simbolo' }).textContent).toContain('Misto');
    expect(screen.queryByRole('menu')).toBeNull();
    chooseSelectionColor('Simbolo', 'Verde');
    expect(current().objects.every((o) => o.color === '#269978')).toBe(true);
    expect(state().past).toHaveLength(1);
    act(() => state().undo());
    expect(current().objects[1].color).toBe('#df4949');
  });
  it('edits a percentage locally, cancels with Escape and commits the selection once', () => {
    renderSelection(parallelSources().objects.filter((o) => o.kind === 'component'));
    const input = screen.getByLabelText('Opacità simbolo');
    input.focus();
    fireEvent.change(input, { target: { value: '60' } });
    fireEvent.change(input, { target: { value: '30' } });
    expect(current().objects.every((o) => o.opacity === undefined)).toBe(true);
    expect(state().past).toHaveLength(0);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(current().objects.every((o) => o.opacity === undefined)).toBe(true);
    edit('Opacità simbolo', '75');
    expect(current().objects.every((o) => o.opacity === 0.75)).toBe(true);
    expect(state().past).toHaveLength(1);
    act(() => state().undo());
    expect(current().objects.every((o) => o.opacity === undefined)).toBe(true);
  });
  it('keeps input edits local until confirmation and Escape leaves no history', () => {
    const source = createComponent('currentSource', { x: 0, y: 0 });
    renderSelection([source]);
    const input = screen.getByLabelText('Posizione X');
    input.focus();
    fireEvent.change(input, { target: { value: '123' } });
    expect(current().objects[0]).toEqual(source);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(state().past).toHaveLength(0);
    edit('Posizione X', '120');
    expect(current().objects[0]).toMatchObject({ x: 120 });
    expect(state().past).toHaveLength(1);
  });
  it('groups a native color picker preview into one undo and rejects invalid numeric drafts', () => {
    const c = createComponent('currentSource', { x: 0, y: 0 });
    renderSelection([c]);
    const picker = screen.getByLabelText('Colore simbolo personalizzato');
    fireEvent.pointerDown(picker);
    fireEvent.input(picker, { target: { value: '#111111' } });
    fireEvent.input(picker, { target: { value: '#222222' } });
    expect(state().past).toHaveLength(0);
    fireEvent.change(picker, { target: { value: '#222222' } });
    expect(state().past).toHaveLength(1);
    act(() => state().undo());
    expect(current().objects[0].color).toBe(c.color);
    act(() => state().select([c.id]));
    edit('Posizione X', '10000001');
    expect(current().objects[0]).toMatchObject({ x: 0 });
    expect((screen.getByLabelText('Posizione X') as HTMLInputElement).value).toBe('0');
  });
  it('edits selected label position and rotation without moving or rotating its owner', () => {
    const c = createComponent('currentSource', { x: 0, y: 0 });
    renderSelection([c]);
    act(() => state().setActiveLabel(c.id));
    edit('Posizione X', '80');
    fireEvent.change(screen.getByLabelText('Rotazione'), { target: { value: '90' } });
    expect(current().objects[0]).toMatchObject({
      x: 0,
      y: 0,
      rotation: 0,
      label: { offset: { x: 80 }, rotation: 90 },
    });
    expect(state().past).toHaveLength(2);
  });
  it('exposes appropriate properties for text, line, node and component', () => {
    const types = [
      createTextAnnotation({ x: 0, y: 0 }),
      createLine({ x: 0, y: 0 }, { x: 100, y: 0 }),
      parallelSources().objects.find((o) => o.kind === 'junction')!,
      createComponent('currentSource', { x: 0, y: 0 }),
    ];
    for (const o of types) {
      cleanup();
      renderSelection([o]);
      if (o.kind === 'text') {
        expect(screen.getByLabelText('Contenuto testo')).toBeDefined();
        expect(screen.getByLabelText('Allineamento testo')).toBeDefined();
        expect(screen.queryByLabelText('Stile linea')).toBeNull();
      }
      if (o.kind === 'line') {
        expect(screen.getByLabelText('Stile linea')).toBeDefined();
        expect(screen.queryByLabelText('Dimensione testo')).toBeNull();
        expect(screen.queryByText('Corrente sul filo')).toBeNull();
      }
      if (o.kind === 'junction') {
        expect(screen.getByLabelText('Nome nodo')).toBeDefined();
        expect(screen.queryByLabelText('Spessore linea')).toBeNull();
      }
      if (o.kind === 'component') {
        expect(screen.getByLabelText('Etichetta componente')).toBeDefined();
        expect(screen.getByLabelText('Rotazione')).toBeDefined();
      }
    }
    expect(document.querySelector('.context-toolbar')).toBeNull();
  });
  it('distributes the screenshot sources and sets numeric center spacing through the sidebar', () => {
    useEditorStore.setState({ selection: ['source-1', 'source-2', 'source-3'] });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Distribuisci orizzontalmente' }));
    expect(
      current()
        .objects.filter((o) => o.kind === 'component')
        .map((o) => o.x),
    ).toEqual([0, 150, 300]);
    fireEvent.change(screen.getByLabelText('Distanza esatta'), { target: { value: '120' } });
    fireEvent.click(screen.getByRole('button', { name: 'Applica' }));
    expect(
      current()
        .objects.filter((o) => o.kind === 'component')
        .map((o) => o.x),
    ).toEqual([0, 120, 240]);
    expect(state().past).toHaveLength(2);
  });
  it('applies mixed wire styles to all compatible objects without changing geometry', () => {
    const wires = [
      createWire(
        { kind: 'free', point: { x: 0, y: 0 } },
        { kind: 'free', point: { x: 100, y: 0 } },
      ),
      createWire(
        { kind: 'free', point: { x: 0, y: 80 } },
        { kind: 'free', point: { x: 100, y: 80 } },
      ),
    ];
    wires[1].lineStyle = 'dashed';
    renderSelection(wires);
    expect((screen.getByLabelText('Stile linea') as HTMLSelectElement).value).toBe('');
    fireEvent.change(screen.getByLabelText('Stile linea'), { target: { value: 'dotted' } });
    expect(current().objects.every((o) => o.kind === 'wire' && o.lineStyle === 'dotted')).toBe(
      true,
    );
    expect(state().past).toHaveLength(1);
    expect(canvas().querySelectorAll('[stroke-dasharray="0 6"]')).toHaveLength(2);
  });
});
describe('contextual properties and selection commands', () => {
  it('orders properties by purpose and keeps generic commands behind the overflow', () => {
    renderSelection([createComponent('currentSource', { x: 0, y: 0 })]);
    const inspector = screen.getByRole('region', { name: 'Proprietà' });
    expect(
      within(inspector)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['Generale', 'Posizione', 'Aspetto', 'Testo']);
    expect(within(inspector).queryByRole('slider')).toBeNull();
    expect(within(inspector).queryByText('Azioni')).toBeNull();
    expect(
      within(inspector).queryByRole('button', { name: /Duplica|Elimina|Sostituisci/ }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Comandi selezione' }));
    expect(screen.getByRole('menuitem', { name: 'Sostituisci…' })).toBeDefined();
    expect(screen.getByRole('menuitem', { name: 'Taglia (⌘/Ctrl X)' })).toBeDefined();
  });
  it('shows only common properties for a component and a wire while preserving contextual commands', () => {
    const c = createComponent('currentSource', { x: 0, y: 0 });
    const w = createWire(
      { kind: 'free', point: { x: 0, y: 80 } },
      { kind: 'free', point: { x: 100, y: 80 } },
    );
    renderSelection([c, w]);
    expect(screen.getByText('2 elementi selezionati')).toBeDefined();
    expect(screen.getByText('Proprietà comuni')).toBeDefined();
    expect(screen.getByLabelText('Opacità simbolo')).toBeDefined();
    expect(screen.getByLabelText('Spessore linea')).toBeDefined();
    for (const label of [
      'Opacità etichetta',
      'Etichetta comune',
      'Dimensione testo',
      'Routing filo',
      'Rotazione',
      'Stile linea',
    ])
      expect(screen.queryByLabelText(label)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Comandi selezione' }));
    expect(screen.getByRole('menuitem', { name: 'Sostituisci…' })).toBeDefined();
    expect(screen.queryByRole('menuitem', { name: 'Dividi filo…' })).toBeNull();
  });
  it('changes label opacity independently, rejects invalid percentages and records one confirmation', () => {
    const c = createComponent('currentSource', { x: 0, y: 0 });
    renderSelection([c]);
    const input = screen.getByLabelText('Opacità etichetta');
    input.focus();
    fireEvent.change(input, { target: { value: '42' } });
    expect(current().objects[0]).toEqual(c);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(current().objects[0]).toMatchObject({ label: { opacity: 0.42 } });
    expect(current().objects[0].opacity).toBeUndefined();
    expect(state().past).toHaveLength(1);
    edit('Opacità etichetta', '101');
    edit('Opacità etichetta', '-1');
    expect(state().past).toHaveLength(1);
    expect((screen.getByLabelText('Opacità etichetta') as HTMLInputElement).value).toBe('42');
    act(() => state().undo());
    expect(current().objects[0]).toEqual(c);
  });
  it('limits a selected label to its properties and leaves the symbol untouched', () => {
    const c = createComponent('currentSource', { x: 0, y: 0 });
    renderSelection([c]);
    act(() => state().setActiveLabel(c.id));
    expect(screen.getByText('Etichetta selezionata')).toBeDefined();
    expect(screen.queryByLabelText('Opacità simbolo')).toBeNull();
    expect(screen.queryByLabelText('Spessore linea')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Geometria' })).toBeNull();
    edit('Opacità etichetta', '25');
    expect(current().objects[0]).toMatchObject({ color: c.color, label: { opacity: 0.25 } });
    chooseSelectionCommand('Elimina etichetta (Delete)');
    expect(current().objects).toHaveLength(1);
    expect(current().objects[0]).toMatchObject({ label: { text: '' } });
    act(() => state().undo());
    expect(current().objects[0]).toMatchObject({ label: { text: c.label.text, opacity: 0.25 } });
  });
  it('closes the overflow with Escape, restores focus and executes duplicate by keyboard once', () => {
    const c = createComponent('currentSource', { x: 0, y: 0 });
    renderSelection([c]);
    const trigger = screen.getByRole('button', { name: 'Comandi selezione' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(
      screen.getByRole('menuitem', { name: 'Duplica (⌘/Ctrl D)' }),
    );
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(state().selection).toEqual([c.id]);
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(current().objects).toHaveLength(2);
    expect(state().past).toHaveLength(1);
    act(() => state().undo());
    expect(current().objects).toEqual([c]);
  });
  it('keeps rectangle outline and fill opacity independent with one input for each', () => {
    const r = { ...createRectangle({ x: 0, y: 0 }, { x: 100, y: 80 }), fill: '#2463cb' };
    renderSelection([r]);
    expect(screen.getAllByLabelText('Opacità simbolo')).toHaveLength(1);
    expect(screen.getAllByLabelText('Opacità riempimento')).toHaveLength(1);
    edit('Opacità riempimento', '35');
    expect(current().objects[0]).toMatchObject({ fillOpacity: 0.35 });
    expect(current().objects[0].opacity).toBeUndefined();
    fireEvent.change(screen.getByLabelText('Riempimento'), { target: { value: 'none' } });
    expect(screen.queryByLabelText('Opacità riempimento')).toBeNull();
    expect(screen.getByLabelText('Opacità simbolo')).toBeDefined();
    act(() => state().undo());
    act(() => state().select([r.id]));
    expect(screen.getByLabelText('Opacità riempimento')).toBeDefined();
  });
  it('edits shared content and typography across multiple text annotations', () => {
    const a = createTextAnnotation({ x: 0, y: 0 });
    const b = { ...createTextAnnotation({ x: 100, y: 0 }), text: 'Secondo', align: 'end' as const };
    renderSelection([a, b]);
    expect((screen.getByLabelText('Contenuto comune') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Allineamento testo') as HTMLSelectElement).value).toBe('');
    edit('Contenuto comune', 'V_{ab}');
    fireEvent.change(screen.getByLabelText('Allineamento testo'), { target: { value: 'middle' } });
    expect(
      current().objects.every(
        (o) => o.kind === 'text' && o.text === 'V_{ab}' && o.align === 'middle',
      ),
    ).toBe(true);
    expect(state().past).toHaveLength(2);
  });
});
describe('graphic drawing and gestures', () => {
  it('creates a rectangle in reverse direction, previews it, resizes atomically and persists all styles', () => {
    useEditorStore.setState({ document: { version: 1, title: 'Test', objects: [] } });
    render(<App />);
    chooseDrawingTool('Rettangolo');
    fireEvent.pointerDown(canvas(), client({ x: 100, y: 80 }));
    fireEvent.pointerMove(canvas(), client({ x: 0, y: 0 }));
    expect(current().objects).toHaveLength(0);
    expect(canvas().querySelector('[data-object="preview"] rect')).toBeTruthy();
    fireEvent.pointerUp(canvas(), client({ x: 0, y: 0 }));
    const rectangle = current().objects[0];
    expect(rectangle).toMatchObject({
      kind: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 80,
      fill: 'none',
    });
    expect(state().past).toHaveLength(1);
    const handle = canvas().querySelector('[data-handle="rectSE"]')!;
    fireEvent.pointerDown(handle, client({ x: 100, y: 80 }));
    fireEvent.pointerMove(canvas(), client({ x: 160, y: 120 }));
    expect(state().past).toHaveLength(1);
    fireEvent.pointerUp(canvas(), client({ x: 160, y: 120 }));
    expect(current().objects[0]).toMatchObject({ width: 160, height: 120 });
    expect(state().past).toHaveLength(2);
    edit('Larghezza', '200');
    fireEvent.change(screen.getByLabelText('Stile linea'), { target: { value: 'dashed' } });
    fireEvent.change(screen.getByLabelText('Riempimento'), { target: { value: 'color' } });
    chooseSelectionColor('Riempimento', 'Verde');
    expect(current().objects[0]).toMatchObject({
      width: 200,
      fill: '#269978',
      lineStyle: 'dashed',
    });
    expect(saveDocumentNow()).toBe(true);
    expect(deserializeDocument(stored.get(STORAGE_KEY)!)).toEqual(current());
    const output = exportSVG(current());
    expect(output).toContain('stroke-dasharray');
    expect(output).not.toMatch(/rectSE|control-handle|preview|distance-guide/);
  });
  it('cancels rectangle creation and resizing with Escape', () => {
    const r = createRectangle({ x: 0, y: 0 }, { x: 100, y: 80 });
    renderSelection([r]);
    const handle = canvas().querySelector('[data-handle="rectNW"]')!;
    fireEvent.pointerDown(handle, client({ x: 0, y: 0 }));
    fireEvent.pointerMove(canvas(), client({ x: -40, y: -40 }));
    fireEvent.keyDown(canvas(), { key: 'Escape' });
    expect(current().objects[0]).toEqual(r);
    expect(state().past).toHaveLength(0);
    chooseDrawingTool('Rettangolo');
    fireEvent.pointerDown(canvas(), client({ x: 0, y: 0 }));
    fireEvent.pointerMove(canvas(), client({ x: 100, y: 100 }));
    fireEvent.keyDown(canvas(), { key: 'Escape' });
    fireEvent.pointerUp(canvas(), client({ x: 100, y: 100 }));
    expect(current().objects).toHaveLength(1);
  });
  it('keeps hollow rectangles behind components and uses only the border as hit area', () => {
    const r = createRectangle({ x: -100, y: -100 }, { x: 100, y: 100 }),
      c = createComponent('currentSource', { x: 0, y: 0 });
    renderSelection([r, c]);
    const graphics = canvas().querySelector('[data-layer="graphics"]')!,
      components = canvas().querySelector('[data-layer="components"]')!;
    expect(
      graphics.compareDocumentPosition(components) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const hit = graphics.querySelector('rect[stroke="transparent"]')!;
    expect(hit.getAttribute('pointer-events')).toBe('stroke');
    expect(hit.getAttribute('fill')).toBe('none');
    expect(current().objects.some((o) => o.kind === 'junction')).toBe(false);
  });
  it('draws a decorative line without electrical junctions and selects it through gaps', () => {
    useEditorStore.setState({ document: { version: 1, title: 'Test', objects: [] } });
    render(<App />);
    chooseDrawingTool('Linea decorativa');
    fireEvent.pointerDown(canvas(), client({ x: 0, y: 0 }));
    fireEvent.pointerMove(canvas(), client({ x: 200, y: 0 }));
    fireEvent.pointerUp(canvas(), client({ x: 200, y: 0 }));
    expect(current().objects).toHaveLength(1);
    expect(current().objects[0].kind).toBe('line');
    fireEvent.change(screen.getByLabelText('Stile linea'), { target: { value: 'dashed' } });
    const hit = canvas().querySelector('[data-layer="graphics"] path[stroke="transparent"]')!;
    expect(hit.getAttribute('stroke-dasharray')).toBeNull();
    fireEvent.pointerDown(hit, client({ x: 40, y: 0 }));
    fireEvent.pointerUp(canvas(), client({ x: 40, y: 0 }));
    expect(state().selection).toHaveLength(1);
  });
  it('splits a wire at a chosen point and styles only its continuation with one undo per action', () => {
    const w = createWire(
      { kind: 'free', point: { x: 0, y: 0 } },
      { kind: 'free', point: { x: 300, y: 0 } },
    );
    renderSelection([w]);
    chooseSelectionCommand('Dividi filo…');
    fireEvent.pointerDown(canvas(), client({ x: 180, y: 0 }));
    fireEvent.pointerUp(canvas(), client({ x: 180, y: 0 }));
    expect(current().objects.filter((o) => o.kind === 'wire')).toHaveLength(2);
    expect(state().past).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Stile linea'), { target: { value: 'dashed' } });
    const wires = current().objects.filter((o) => o.kind === 'wire');
    expect(wires[0].lineStyle).toBeUndefined();
    expect(wires[1].lineStyle).toBe('dashed');
    act(() => state().undo());
    act(() => state().undo());
    expect(current().objects).toEqual([w]);
  });
});
describe('cut shortcuts and editing focus', () => {
  it('supports native clipboard commands without keydown and preserves internal connections', async () => {
    const objects = parallelSources().objects;
    renderSelection(objects);
    let text = '';
    const clipboardData = {
      setData: (_: string, raw: string) => {
        text = raw;
      },
      getData: () => text,
    };
    await act(async () => {
      fireEvent.copy(canvas(), { clipboardData });
    });
    expect(deserializeDocument(text).objects).toHaveLength(objects.length);
    expect(state().past).toHaveLength(0);
    await act(async () => {
      fireEvent.cut(canvas(), { clipboardData });
    });
    expect(current().objects).toHaveLength(0);
    expect(state().past).toHaveLength(1);
    await act(async () => {
      fireEvent.paste(canvas(), { clipboardData });
    });
    expect(current().objects).toHaveLength(objects.length);
    expect(deserializeDocument(serializeDocument(current()))).toEqual(current());
    act(() => state().undo());
    act(() => state().undo());
    expect(current().objects).toEqual(objects);
  });
  it.each(['ctrlKey', 'metaKey'])(
    'cuts and pastes the selected circuit via %s+X/V and restores it with undo',
    async (modifier) => {
      const objects = [
        ...parallelSources().objects,
        createRectangle({ x: -50, y: -140 }, { x: 430, y: 140 }),
        createBrace('brace', { x: 0, y: 160 }, { x: 400, y: 160 }),
      ];
      renderSelection(objects);
      await act(async () => {
        fireEvent.keyDown(canvas(), { key: 'x', [modifier]: true });
      });
      expect(current().objects).toHaveLength(0);
      expect(state().past).toHaveLength(1);
      await act(async () => {
        fireEvent.keyDown(canvas(), { key: 'v', [modifier]: true });
      });
      expect(current().objects).toHaveLength(objects.length);
      expect(deserializeDocument(serializeDocument(current()))).toEqual(current());
      act(() => state().undo());
      act(() => state().undo());
      expect(current().objects).toEqual(objects);
    },
  );
  it.each(['input', 'textarea', 'contenteditable'])(
    'preserves native cut when editing a %s',
    (kind) => {
      const source = createComponent('currentSource', { x: 0, y: 0 });
      renderSelection([source]);
      const before = current();
      let target: HTMLElement;
      if (kind === 'input') target = screen.getByLabelText('Etichetta componente');
      else {
        target = document.createElement(kind === 'textarea' ? 'textarea' : 'div');
        if (kind === 'contenteditable') target.setAttribute('contenteditable', 'true');
        document.body.append(target);
      }
      const event = new KeyboardEvent('keydown', {
        key: 'x',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      const native = new Event('cut', { bubbles: true, cancelable: true });
      target.dispatchEvent(native);
      expect(native.defaultPrevented).toBe(false);
      expect(current()).toBe(before);
      expect(state().past).toHaveLength(0);
      if (kind !== 'input') target.remove();
    },
  );
  it('preserves cut inside the inline editor and leaves the selected component intact', () => {
    const c = createComponent('currentSource', { x: 0, y: 0 });
    renderSelection([c]);
    fireEvent.keyDown(canvas(), { key: 'Enter' });
    const textbox = screen.getByRole('textbox', { name: 'Modifica testo sul foglio' });
    const before = current();
    fireEvent.keyDown(textbox, { key: 'x', metaKey: true });
    expect(current()).toBe(before);
    expect(state().past).toHaveLength(0);
    fireEvent.keyDown(textbox, { key: 'Escape' });
  });
});
