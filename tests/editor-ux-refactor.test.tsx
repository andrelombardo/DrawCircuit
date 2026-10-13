// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { createComponent } from '../src/model/catalog';
import { createWire, createRectangle, createTextAnnotation } from '../src/model/factories';
import {
  createCurrent,
  createPolarity,
  electricalDrawingGeometry,
} from '../src/annotations/electrical';
import type { CircuitDocument, CircuitObject, ElectricalAnnotation } from '../src/model/types';
import { useEditorStore } from '../src/store/editorStore';
import { exportPNG } from '../src/png/exporter';
import { download } from '../src/utils/files';
import { getExportSelection } from '../src/tikz/selection';
import {
  distributionPlan,
  distributeSelection,
  layoutTargets,
} from '../src/utils/selectionGeometry';
import { measurementBounds } from '../src/utils/measurementGeometry';
import { unionBounds } from '../src/utils/visualBounds';
import { wirePoints } from '../src/utils/geometry';
import { openSelectionMenu } from './helpers/selectionMenu';
import { serializeDocument, deserializeDocument } from '../src/model/serialization';
vi.mock('../src/png/exporter', () => ({ exportPNG: vi.fn(), copyPNG: vi.fn() }));
vi.mock('../src/utils/files', async (original) => ({
  ...(await original<typeof import('../src/utils/files')>()),
  download: vi.fn(),
}));
const state = () => useEditorStore.getState();
const doc = (objects: CircuitObject[]): CircuitDocument => ({
  version: 1,
  title: 'Verifica UX',
  objects,
});
const component = (x = 0, y = 0) => createComponent('resistor', { x, y });
function setup(objects: CircuitObject[], selection = objects.map((o) => o.id)) {
  useEditorStore.setState({ document: doc(objects), selection });
  render(<App />);
}
function edit(
  label: string,
  value: string,
  scope: HTMLElement = screen.getByRole('region', { name: 'Proprietà' }),
) {
  const field = within(scope).getByLabelText(label);
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}
const annotation = () =>
  state().document.objects.find((o) => o.kind === 'electrical') as ElectricalAnnotation;
beforeEach(() => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
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
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width: 1200,
    height: 900,
    right: 1200,
    bottom: 900,
    toJSON: () => ({}),
  });
  vi.mocked(exportPNG).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
  useEditorStore.setState({
    document: doc([]),
    selection: [],
    activeLabel: null,
    tool: 'select',
    past: [],
    future: [],
    gestureStart: null,
    notice: '',
    splittingWireId: null,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('selection PNG and compact commands', () => {
  it.each([false, true])(
    'downloads the captured semantic subset, including internal wires and annotations (multiple=%s)',
    async (multiple) => {
      const a = component(),
        b = component(220),
        outside = component(600);
      const wire = createWire(
        { kind: 'terminal', componentId: a.id, terminalId: 'b' },
        { kind: 'terminal', componentId: b.id, terminalId: 'a' },
      );
      const polarity = createPolarity(a)!;
      const current = createCurrent(wire, { x: 110, y: 0 }, doc([a, b, wire]));
      const original = doc([a, b, outside, wire, polarity, current]);
      const ids = multiple ? [a.id, b.id] : [a.id];
      setup(original.objects, ids);
      openSelectionMenu();
      expect(state().selection).toEqual(ids);
      fireEvent.click(screen.getByRole('menuitem', { name: 'Salva come immagine' }));
      act(() => state().select([outside.id]));
      await waitFor(() => expect(download).toHaveBeenCalledOnce());
      expect(exportPNG).toHaveBeenCalledExactlyOnceWith(getExportSelection(original, ids));
      expect(download).toHaveBeenCalledWith(
        expect.any(Blob),
        'Verifica-UX-selezione.png',
        'image/png',
      );
      expect(state().past).toHaveLength(0);
      expect(state().document).toEqual(original);
    },
  );
  it('reports a failed PNG without changing selection, document or history', async () => {
    const a = component();
    setup([a]);
    vi.mocked(exportPNG).mockRejectedValueOnce(new Error('PNG troppo grande'));
    openSelectionMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Salva come immagine' }));
    await waitFor(() => expect(state().notice).toBe('PNG troppo grande'));
    expect(download).not.toHaveBeenCalled();
    expect(state().selection).toEqual([a.id]);
    expect(state().past).toHaveLength(0);
  });
  it('keeps toolbar undo/redo and shortcuts without an Edit menu', () => {
    const a = component();
    setup([a]);
    expect(screen.queryByRole('button', { name: 'Modifica' })).toBeNull();
    fireEvent.keyDown(window, { key: 'd', ctrlKey: true });
    expect(state().document.objects).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /^Annulla/ }));
    expect(state().document.objects).toEqual([a]);
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(state().document.objects).toHaveLength(2);
  });
});

describe('electrical properties without navigation', () => {
  it('resizes the inspector with arrows without moving the selected circuit or creating undo', () => {
    setup([component()]);
    const original = state().document;
    const resizer = screen.getByRole('separator', { name: 'Ridimensiona proprietà' });
    resizer.focus();
    fireEvent.keyDown(resizer, { key: 'ArrowLeft' });
    fireEvent.keyUp(resizer, { key: 'ArrowLeft' });
    expect(resizer.getAttribute('aria-valuenow')).toBe('302');
    expect(state().document).toBe(original);
    expect(state().past).toHaveLength(0);
    expect(state().gestureStart).toBeNull();
  });

  it('toggles polarity, edits LaTeX, sign, offsets and style while the host stays selected', () => {
    const host = component();
    setup([host]);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Polarità e tensione' }));
    expect(state().selection).toEqual([host.id]);
    const section = screen.getByRole('region', { name: 'Annotazioni elettriche' });
    edit('Etichetta tensione', 'V_{AB}', section);
    fireEvent.click(within(section).getByRole('button', { name: 'Inverti polarità' }));
    edit('Offset annotazione X', '17', section);
    edit('Offset etichetta Y', '-9', section);
    edit('Opacità simbolo', '99', section);
    edit('Opacità etichetta', '10', section);
    fireEvent.change(within(section).getByLabelText('Dimensione testo'), {
      target: { value: '28' },
    });
    expect(annotation()).toMatchObject({
      componentId: host.id,
      label: { text: 'V_{AB}', opacity: 0.1, fontSize: 28, offset: { y: -9 } },
      reversed: true,
      offset: { x: 17 },
      opacity: 0.99,
    });
    expect(state().document.objects[0]).toEqual(host);
    expect(state().selection).toEqual([host.id]);
    const edited = state().document;
    fireEvent.click(screen.getByRole('checkbox', { name: 'Polarità e tensione' }));
    expect(state().document.objects).toEqual([host]);
    act(() => state().undo());
    expect(state().document).toEqual(edited);
    act(() => state().redo());
    expect(state().document.objects).toEqual([host]);
    expect(deserializeDocument(serializeDocument(edited))).toEqual(edited);
  });
  it('edits an existing current on its wire, keeps the branch and does not duplicate it', () => {
    const wire = createWire(
      { kind: 'free', point: { x: 0, y: 0 } },
      { kind: 'free', point: { x: 300, y: 200 } },
      [{ x: 300, y: 0 }],
    );
    const current = createCurrent(wire, { x: 150, y: 0 }, doc([wire]));
    setup([wire, current], [wire.id]);
    const section = screen.getByRole('region', { name: 'Annotazioni elettriche' });
    edit('Etichetta corrente', 'I_R', section);
    fireEvent.click(within(section).getByRole('button', { name: 'Inverti verso corrente' }));
    fireEvent.change(within(section).getByLabelText('Tratto del filo'), { target: { value: '1' } });
    edit('Posizione sul tratto', '75', section);
    edit('Offset etichetta X', '12', section);
    expect(annotation()).toMatchObject({
      wireId: wire.id,
      wireSegment: { index: 1, ratio: 0.75 },
      reversed: true,
      label: { text: 'I_R', offset: { x: 12 } },
    });
    const drawing = electricalDrawingGeometry(annotation(), state().document);
    expect(drawing.start.x).toBe(300);
    expect(drawing.end.x).toBe(300);
    expect(state().document.objects[0]).toEqual(wire);
    expect(state().selection).toEqual([wire.id]);
    openSelectionMenu();
    expect(screen.queryByRole('menuitem', { name: 'Corrente sul filo' })).toBeNull();
    expect(state().document.objects).toHaveLength(2);
    expect(state().past).toHaveLength(5);
  });
  it('adds current directly from wire properties with one undo and keeps the wire context', () => {
    const wire = createWire(
      { kind: 'free', point: { x: 0, y: 0 } },
      { kind: 'free', point: { x: 200, y: 0 } },
    );
    setup([wire]);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Corrente' }));
    expect(annotation().wireId).toBe(wire.id);
    expect(state().selection).toEqual([wire.id]);
    expect(state().past).toHaveLength(1);
    act(() => state().undo());
    expect(state().document.objects).toEqual([wire]);
    act(() => state().redo());
    expect(state().document.objects).toHaveLength(2);
  });
  it.each(['connector2', 'notGate', 'npn'] as const)(
    'does not invent electrical properties for %s',
    (type) => {
      setup([createComponent(type, { x: 0, y: 0 })]);
      expect(screen.queryByRole('region', { name: 'Annotazioni elettriche' })).toBeNull();
      expect(screen.queryByLabelText('Etichetta corrente')).toBeNull();
    },
  );
  it('preserves and independently edits multiple annotations in legacy documents', () => {
    const host = component(),
      a = createPolarity(host)!,
      b = createPolarity(host)!;
    setup([host, a, b], [host.id]);
    const groups = screen.getAllByRole('group', { name: /^Polarità e tensione/ });
    expect(groups).toHaveLength(2);
    edit('Etichetta tensione', 'V_2', groups[1]);
    expect(state().document.objects[1]).toEqual(a);
    expect(state().document.objects[2]).toMatchObject({ label: { text: 'V_2' } });
  });
  it('commits a hosted color picker gesture as one undo without coloring its host', () => {
    const host = component(),
      a = createPolarity(host)!;
    setup([host, a], [host.id]);
    const section = screen.getByRole('region', { name: 'Annotazioni elettriche' });
    const picker = within(section).getByLabelText('Colore simbolo personalizzato');
    fireEvent.pointerDown(picker);
    fireEvent.input(picker, { target: { value: '#112233' } });
    fireEvent.input(picker, { target: { value: '#334455' } });
    expect(state().past).toHaveLength(0);
    fireEvent.change(picker, { target: { value: '#334455' } });
    expect(state().past).toHaveLength(1);
    expect(state().document.objects[0]).toEqual(host);
    act(() => state().undo());
    expect(state().document.objects).toEqual([host, a]);
  });
});

describe('coherent inspector controls', () => {
  it('uses one absolute rotation field and preserves the distant wire branch in one undo', () => {
    const host = component();
    const wire = createWire(
      { kind: 'terminal', componentId: host.id, terminalId: 'b' },
      { kind: 'free', point: { x: 260, y: 120 } },
    );
    setup([host, wire], [host.id]);
    const original = state().document;
    const fixed = wirePoints(wire, original).at(-1);
    expect(screen.getAllByLabelText('Rotazione')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /^Ruota/ })).toBeNull();
    fireEvent.change(screen.getByLabelText('Rotazione'), { target: { value: '90' } });
    expect(state().document.objects[0]).toMatchObject({ x: host.x, y: host.y, rotation: 90 });
    const routed = state().document.objects[1];
    expect(routed.kind).toBe('wire');
    if (routed.kind !== 'wire') throw new Error('Expected connected wire');
    expect(routed.vertices.length).toBeGreaterThan(0);
    expect(wirePoints(routed, state().document).at(-1)).toEqual(fixed);
    expect(state().selection).toEqual([host.id]);
    expect(state().past).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Rotazione'), { target: { value: '90' } });
    expect(state().past).toHaveLength(1);
    act(() => state().undo());
    expect(state().document).toEqual(original);
  });

  it('names collective rotation as a group increment and keeps its relative geometry', () => {
    const a = component(),
      b = component(200);
    setup([a, b]);
    expect(screen.queryByLabelText('Rotazione')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ruota gruppo di 45° (R)' }));
    const [afterA, afterB] = state().document.objects;
    if (afterA.kind !== 'component' || afterB.kind !== 'component')
      throw new Error('Expected components');
    expect(afterA.rotation).toBe(45);
    expect(afterB.rotation).toBe(45);
    expect(Math.hypot(afterB.x - afterA.x, afterB.y - afterA.y)).toBeCloseTo(200);
    expect(afterA.x).not.toBe(a.x);
    expect(state().past).toHaveLength(1);
    act(() => state().undo());
    expect(state().document.objects).toEqual([a, b]);
  });

  it('keeps annotation styling in an accessible disclosure without losing its state or host context', () => {
    const host = component(),
      a = createPolarity(host)!;
    setup([host, a], [host.id]);
    const section = screen.getByRole('region', { name: 'Annotazioni elettriche' });
    expect(within(section).getByText('Etichetta tensione', { exact: true })).toBeDefined();
    const summary = within(section).getByText('Stile annotazione').closest('summary')!;
    const details = summary.parentElement as HTMLDetailsElement;
    expect(details.open).toBe(false);
    fireEvent.click(summary);
    expect(details.open).toBe(true);
    edit('Opacità simbolo', '99', section);
    expect(details.open).toBe(true);
    expect(state().document.objects[0]).toEqual(host);
    expect(state().past).toHaveLength(1);
    expect(state().selection).toEqual([host.id]);
    fireEvent.click(summary);
    expect(details.open).toBe(false);
    expect(state().past).toHaveLength(1);
    act(() => state().undo());
    expect(state().document.objects).toEqual([host, a]);
  });

  it('lets inspector controls own their keyboard keys without rotating or editing the canvas', () => {
    const host = component(),
      a = createPolarity(host)!;
    setup([host, a], [host.id]);
    const original = state().document;
    const button = screen.getByRole('button', { name: 'Inverti polarità' });
    button.focus();
    fireEvent.keyDown(button, { key: 'r' });
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyDown(button, { key: ' ', code: 'Space' });
    expect(state().document).toBe(original);
    expect(state().activeLabel).toBeNull();
    expect(state().past).toHaveLength(0);
    const summary = screen.getByText('Stile annotazione').closest('summary')!;
    summary.focus();
    fireEvent.keyDown(summary, { key: 'r' });
    expect(state().document).toBe(original);
    expect(state().selection).toEqual([host.id]);
  });

  it('keeps undo and redo working while the absolute rotation selector has focus', () => {
    const host = component();
    setup([host]);
    const control = screen.getByLabelText('Rotazione');
    control.focus();
    fireEvent.change(control, { target: { value: '45' } });
    fireEvent.keyDown(control, { key: 'z', metaKey: true });
    expect(state().document.objects[0]).toMatchObject({ rotation: 0 });
    expect(state().future).toHaveLength(1);
    fireEvent.keyDown(control, { key: 'z', metaKey: true, shiftKey: true });
    expect(state().document.objects[0]).toMatchObject({ rotation: 45 });
    expect(state().past).toHaveLength(1);
    expect(state().selection).toEqual([host.id]);
  });
});

describe('explicit selection geometry and common properties', () => {
  it('shows 19 elements, both spacing axes and distinct groups; distributes in one undo', () => {
    const objects = Array.from({ length: 19 }, (_, i) => component(i * i * 100, i * 140));
    setup(objects);
    expect(screen.getByText('19 elementi selezionati')).toBeDefined();
    for (const name of ['Allineamento', 'Distribuzione', 'Spaziatura'])
      expect(screen.getByRole('group', { name })).toBeDefined();
    expect(screen.queryByLabelText('Asse spaziatura')).toBeNull();
    expect(screen.getByLabelText('Spaziatura orizzontale (u)')).toBeDefined();
    expect(screen.getByLabelText('Spaziatura verticale (u)')).toBeDefined();
    expect((screen.getByLabelText('Spaziatura orizzontale (u)') as HTMLInputElement).value).toBe(
      '',
    );
    expect(
      (screen.getByRole('button', { name: 'Applica spaziatura orizzontale' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    const bounds = unionBounds(objects.map((o) => measurementBounds(o, state().document)));
    expect((screen.getByLabelText('Posizione X') as HTMLInputElement).value).toBe(String(bounds.x));
    fireEvent.click(screen.getByRole('button', { name: 'Distribuisci orizzontalmente' }));
    const after = state().document;
    expect(after.objects[0]).toEqual(objects[0]);
    expect(after.objects.at(-1)).toEqual(objects.at(-1));
    expect(state().past).toHaveLength(1);
    act(() => state().undo());
    expect(state().document.objects).toEqual(objects);
    act(() => state().redo());
    expect(state().document).toEqual(after);
  });
  it('keeps exact X/Y drafts separate, refuses overlap and disables automatic distribution of two objects', () => {
    const a = component(),
      b = component(200, 200);
    setup([a, b]);
    expect(
      (screen.getByRole('button', { name: 'Distribuisci orizzontalmente' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.change(screen.getByLabelText('Spaziatura orizzontale (u)'), {
      target: { value: '0' },
    });
    expect(
      (screen.getByRole('button', { name: 'Applica spaziatura orizzontale' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect((screen.getByLabelText('Spaziatura verticale (u)') as HTMLInputElement).value).toBe('');
    fireEvent.change(screen.getByLabelText('Misura spaziatura'), { target: { value: 'gaps' } });
    fireEvent.click(screen.getByRole('button', { name: 'Applica spaziatura orizzontale' }));
    const [first, second] = state().document.objects.map((o) =>
      measurementBounds(o, state().document),
    );
    expect(second.x - first.x - first.width).toBeCloseTo(0);
    expect(state().past).toHaveLength(1);
  });
  it('does not apply incompatible transforms or stroke properties to mixed objects', () => {
    const a = component(),
      b = createRectangle({ x: 100, y: 100 }, { x: 200, y: 200 });
    setup([a, b]);
    expect(screen.queryByRole('region', { name: 'Trasformazioni' })).toBeNull();
    act(() => state().replace(doc([a, createTextAnnotation({ x: 200, y: 0 }, 'Nota')])));
    act(() => state().select(state().document.objects.map((o) => o.id)));
    expect(screen.queryByLabelText('Spessore linea')).toBeNull();
  });
  it('shows mixed opacity and changes compatible properties atomically', () => {
    const a = { ...component(), opacity: 0.2 },
      b = { ...component(200), opacity: 0.8 };
    setup([a, b]);
    expect(screen.getByLabelText('Opacità simbolo').getAttribute('placeholder')).toBe('Misto');
    edit('Opacità simbolo', '100');
    expect(state().document.objects.every((o) => o.opacity === 1)).toBe(true);
    expect(state().past).toHaveLength(1);
    act(() => state().undo());
    expect(state().document.objects).toEqual([a, b]);
  });
  it('preserves connected wires and attached annotation offsets in collective spacing', () => {
    const a = component(),
      b = component(300),
      c = component(700);
    const wire = createWire(
      { kind: 'terminal', componentId: a.id, terminalId: 'b' },
      { kind: 'terminal', componentId: b.id, terminalId: 'a' },
    );
    const polarity = createPolarity(b)!;
    const original = doc([a, b, c, wire, polarity]);
    const ids = original.objects.map((o) => o.id);
    expect(layoutTargets(original, ids).map((o) => o.id)).toEqual([a.id, b.id, c.id]);
    const result = distributeSelection(original, ids, 'x', 'centers', 200);
    expect(result.objects[1]).toMatchObject({ x: 200 });
    expect(result.objects[2]).toMatchObject({ x: 400 });
    expect(result.objects[3]).toMatchObject({
      startEndpoint: wire.startEndpoint,
      endEndpoint: wire.endEndpoint,
    });
    expect(result.objects[4]).toEqual(polarity);
    expect(distributionPlan(original, ids, 'x', 'centers', 1).reason).toContain('sovrappone');
    expect(distributeSelection(original, ids, 'x', 'centers', 1)).toBe(original);
  });
});
