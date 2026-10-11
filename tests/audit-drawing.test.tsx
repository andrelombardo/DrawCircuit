// @vitest-environment jsdom
import { chooseSelectionCommand, chooseSelectionColor } from './helpers/selectionMenu';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';
import { catalog } from '../src/model/catalog';
import { emptyDocument } from '../src/model/demo';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import type {
  CircuitComponent,
  CircuitDocument,
  CircuitObject,
  ComponentType,
  Wire,
} from '../src/model/types';
import { STORAGE_KEY, useEditorStore } from '../src/store/editorStore';
import { exportStandalone } from '../src/tikz/exporter';
import { resolveEndpoint, wirePoints } from '../src/utils/geometry';
import { simplifyPolyline } from '../src/utils/wires';

const stored = new Map<string, string>();
beforeEach(() => {
  stored.clear();
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
    Object.defineProperty(SVGElement.prototype, method, { configurable: true, value: vi.fn() });
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
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:audit'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  useEditorStore.setState({
    document: emptyDocument(),
    selection: [],
    tool: 'select',
    past: [],
    future: [],
    gestureStart: null,
    placementRotation: 0,
    arrowType: 'straight',
    notice: '',
    storageError: false,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function svg() {
  return screen.getByTestId('circuit-canvas');
}
function point(x: number, y: number) {
  const n = svg()
    .querySelector(':scope > g')!
    .getAttribute('transform')!
    .match(/-?\d+(?:\.\d+)?/g)!
    .map(Number);
  return { clientX: 200 + n[0] + x * n[2], clientY: n[1] + y * n[2], pointerId: 1, button: 0 };
}
function click(x: number, y: number) {
  fireEvent.pointerDown(svg(), point(x, y));
  fireEvent.pointerUp(svg(), point(x, y));
}
function key(key: string, extra: Record<string, boolean> = {}) {
  fireEvent.keyDown(svg(), { key, ...extra });
}
function current() {
  return useEditorStore.getState().document;
}
function place(type: ComponentType, x: number, y: number, rotation = 0): CircuitComponent {
  const definition = catalog.find((c) => c.type === type)!;
  fireEvent.click(
    screen.getByRole('button', { name: `Inserisci ${definition.name.toLowerCase()}` }),
  );
  for (let angle = 0; angle < rotation; angle += 45) key('r');
  click(x, y);
  key('Escape');
  const c = current().objects.at(-1)!;
  expect(c).toMatchObject({ kind: 'component', type, x, y, rotation });
  return c as CircuitComponent;
}
function select(o: CircuitObject) {
  key('v');
  const hit =
    svg().querySelector(
      `[data-layer="${o.kind === 'component' ? 'components' : o.kind === 'junction' ? 'junctions' : 'annotations'}"] [data-object="${o.id}"] ${o.kind === 'component' ? '.object-hit' : o.kind === 'junction' ? 'circle' : 'text'}`,
    ) ?? svg().querySelector(`[data-object="${o.id}"] path`)!;
  const p =
    o.kind === 'wire'
      ? resolveEndpoint(o.startEndpoint, current())
      : o.kind === 'arrow' || o.kind === 'electrical' || o.kind === 'brace' || o.kind === 'line'
        ? o.start
        : o;
  fireEvent.pointerDown(hit, point(p.x, p.y));
  fireEvent.pointerUp(svg(), point(p.x, p.y));
  expect(useEditorStore.getState().selection).toContain(o.id);
}
function rename(o: CircuitObject, text: string) {
  select(o);
  key('Enter');
  fireEvent.change(screen.getByLabelText('Modifica testo sul foglio'), { target: { value: text } });
  fireEvent.submit(screen.getByLabelText('Modifica testo sul foglio').closest('form')!);
}
function connect(points: number[][], free = false): Wire {
  key('w');
  points.forEach(([x, y]) => click(x, y));
  if (free) key('Enter');
  key('Escape');
  const w = current().objects.at(-1)!;
  expect(w.kind).toBe('wire');
  expect(wirePoints(w as Wire, current()).length).toBeGreaterThan(1);
  return w as Wire;
}
function terminal(c: CircuitComponent, id: string) {
  const p = resolveEndpoint({ kind: 'terminal', componentId: c.id, terminalId: id }, current());
  return [p.x, p.y];
}
function node(x: number, y: number, text: string) {
  key('n');
  click(x, y);
  const n = current().objects.find((o) => o.kind === 'junction' && o.x === x && o.y === y)!;
  rename(n, text);
  return n;
}
function drag(o: CircuitObject, from: number[], to: number[]) {
  select(o);
  const hit = svg().querySelector(
    `[data-object="${o.id}"] ${o.kind === 'component' ? '.object-hit' : 'circle'}`,
  )!;
  fireEvent.pointerDown(hit, point(from[0], from[1]));
  fireEvent.pointerMove(svg(), point(to[0], to[1]));
  fireEvent.pointerUp(svg(), point(to[0], to[1]));
}
function drawArrow(tool: 'a' | 'l', a: number[], b: number[]) {
  key(tool);
  fireEvent.pointerDown(svg(), point(a[0], a[1]));
  fireEvent.pointerMove(svg(), point(b[0], b[1]));
  fireEvent.pointerUp(svg(), point(b[0], b[1]));
  return current().objects.at(-1)!;
}
async function fixture(name: string) {
  const doc = current();
  expect(serializeDocument(deserializeDocument(serializeDocument(doc)))).toBe(
    serializeDocument(doc),
  );
  const tex = exportStandalone(doc);
  expect(tex).not.toMatch(/NaN|undefined/);
  const fs = await vi.importActual<{ writeFileSync: (path: string, data: string) => void }>(
    'node:fs',
  );
  fs.writeFileSync(`/private/tmp/drawcircuit-audit-${name}.json`, serializeDocument(doc));
  fs.writeFileSync(`/private/tmp/drawcircuit-audit-${name}.tex`, tex);
}
function restoreSerialized(raw: string) {
  act(() => useEditorStore.getState().replace(deserializeDocument(raw)));
  expect(serializeDocument(current())).toBe(raw);
}

describe('audit: actual rendered drawing workflows (jsdom, not manual browser)', () => {
  it('completes the 25-step golden network and preserves serialization, replacement and autosave exactly', async () => {
    const error = vi.spyOn(console, 'error');
    render(<App />);
    act(() => useEditorStore.getState().replace(emptyDocument()));
    const rs = [
      place('resistor', -120, 0),
      place('resistor', 120, 0),
      place('resistor', 0, -160),
      place('resistor', -240, 120, 90),
      place('resistor', 0, 120, 90),
      place('resistor', 240, 120, 90),
    ];
    const names = ['r_{AB}', 'r_{BC}', 'r_{AC}', 'r_{AD}', 'r_{BD}', 'r_{CD}'];
    rs.forEach((r, i) => rename(r, names[i]));
    const nodes = [node(-240, 0, 'A'), node(0, 0, 'B'), node(240, 0, 'C'), node(0, 220, 'D')];
    connect([terminal(rs[0], 'a'), [-240, 0]]);
    connect([terminal(rs[0], 'b'), [0, 0]]);
    connect([terminal(rs[1], 'a'), [0, 0]]);
    connect([terminal(rs[1], 'b'), [240, 0]]);
    connect([terminal(rs[2], 'a'), [-240, -160], [-240, 0]]);
    connect([terminal(rs[2], 'b'), [240, -160], [240, 0]]);
    rs.slice(3).forEach((r, i) =>
      connect([
        terminal(r, 'a'),
        [
          [-240, 0],
          [0, 0],
          [240, 0],
        ][i],
      ]),
    );
    connect([terminal(rs[3], 'b'), [-240, 220], [0, 220]]);
    connect([terminal(rs[4], 'b'), [0, 220]]);
    connect([terminal(rs[5], 'b'), [240, 220], [0, 220]]);
    expect(current().objects.filter((o) => o.kind === 'wire')).toHaveLength(12);
    drawArrow('l', [-200, 40], [-40, 180]);
    drawArrow('l', [40, 40], [200, 180]);
    chooseSelectionCommand('Inverti freccia');
    expect(
      current()
        .objects.filter((o) => o.kind === 'loop-arrow')
        .map((o) => o.direction),
    ).toEqual(['clockwise', 'counterclockwise']);
    drawArrow('a', [-80, -240], [80, -240]);
    fireEvent.click(screen.getByRole('button', { name: 'Testo' }));
    click(-80, 300);
    const text = current().objects.at(-1)!;
    fireEvent.doubleClick(
      screen
        .getByTestId('circuit-canvas')
        .querySelector(`[data-layer="annotations"] [data-object="${text.id}"]`)!,
    );
    fireEvent.change(screen.getByLabelText('Modifica testo sul foglio'), {
      target: { value: 'Maglie r_{AB}' },
    });
    fireEvent.submit(screen.getByLabelText('Modifica testo sul foglio').closest('form')!);
    expect(screen.queryByRole('combobox', { name: 'Font' })).toBeNull();
    select(rs[0]);
    expect(screen.queryByRole('combobox', { name: 'Font' })).toBeNull();

    chooseSelectionColor('Etichetta', 'Viola');

    key('d', { metaKey: true });
    expect(current().objects.filter((o) => o.kind === 'component')).toHaveLength(7);
    drag(rs[3], [-240, 120], [-220, 120]);
    drag(nodes[1], [0, 0], [20, 20]);
    const beforeBranch = current();
    connect(
      [
        [-240, -80],
        [-360, -80],
        [-360, 60],
      ],
      true,
    );
    const afterBranch = current();
    expect(afterBranch.objects.filter((o) => o.kind === 'junction')).toHaveLength(5);
    key('z', { metaKey: true });
    expect(current()).toEqual(beforeBranch);
    key('z', { metaKey: true, shiftKey: true });
    expect(current()).toEqual(afterBranch);
    const saved = serializeDocument(current());
    act(() => useEditorStore.getState().replace(emptyDocument()));
    expect(current().objects).toHaveLength(0);
    restoreSerialized(saved);
    fireEvent.click(screen.getByRole('button', { name: /^Esporta$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'File .tex' }));
    expect((screen.getByLabelText('Codice TikZ generato') as HTMLTextAreaElement).value).toContain(
      'arc[',
    );
    await fixture('golden');
    await waitFor(() => expect(stored.get(STORAGE_KEY)).toBe(saved), { timeout: 1500 });
    cleanup();
    vi.resetModules();
    const restored = await import('../src/store/editorStore');
    expect(serializeDocument(restored.useEditorStore.getState().document)).toBe(saved);
    expect(error).not.toHaveBeenCalled();
  }, 10000);

  it('draws B: source, resistor, capacitor, switch and ground as a complete connected circuit', async () => {
    render(<App />);
    const v = place('voltageSource', -240, 120, 90),
      r = place('resistor', -120, 0),
      s = place('openSwitch', 120, 0),
      c = place('capacitor', 240, 120, 90),
      g = place('ground', 0, 260);
    node(-240, 0, 'A');
    node(0, 0, 'B');
    node(240, 0, 'C');
    node(0, 220, 'D');
    connect([terminal(v, 'a'), [-240, 0]]);
    connect([[-240, 0], terminal(r, 'a')]);
    connect([terminal(r, 'b'), [0, 0]]);
    connect([[0, 0], terminal(s, 'a')]);
    connect([terminal(s, 'b'), [240, 0]]);
    connect([[240, 0], terminal(c, 'a')]);
    connect([terminal(c, 'b'), [240, 220], [0, 220]]);
    connect([terminal(v, 'b'), [-240, 220], [0, 220]]);
    connect([[0, 220], terminal(g, 'a')]);
    await fixture('workflow-b');
  });

  it('draws C: NPN base, collector and emitter with two resistors, source and ground', async () => {
    render(<App />);
    const q = place('npn', 0, 0),
      rb = place('resistor', -160, 0),
      rc = place('resistor', 20, -140, 90),
      v = place('voltageSource', -320, -80, 90),
      g = place('ground', 20, 120);
    connect([terminal(rb, 'b'), terminal(q, 'base')]);
    connect([terminal(rc, 'b'), terminal(q, 'collector')]);
    connect([terminal(q, 'emitter'), terminal(g, 'a')]);
    connect([terminal(v, 'a'), [-320, -240], [20, -240], terminal(rc, 'a')]);
    connect([terminal(v, 'b'), [-320, 0], terminal(rb, 'a')]);
    rename(q, 'Q_{NPN}');
    await fixture('workflow-c');
  });

  it('draws D: op amp with feedback resistor/capacitor, source and reference', async () => {
    render(<App />);
    const op = place('opAmp', 0, 0),
      r = place('resistor', 0, -120),
      c = place('capacitor', 0, -220),
      v = place('voltageSource', -240, -80, 90),
      g = place('ground', -120, 120);
    node(-120, -20, 'IN');
    node(120, 0, 'OUT');
    connect([terminal(op, 'inverting'), [-120, -20]]);
    connect([terminal(op, 'output'), [120, 0]]);
    connect([[-120, -20], [-120, -120], terminal(r, 'a')]);
    connect([terminal(r, 'b'), [120, -120], [120, 0]]);
    connect([[-120, -20], [-180, -20], [-180, -220], terminal(c, 'a')]);
    connect([terminal(c, 'b'), [180, -220], [180, 0], [120, 0]]);
    connect([terminal(op, 'nonInverting'), [-120, 20], terminal(g, 'a')]);
    connect([terminal(v, 'a'), [-240, -20], [-120, -20]]);
    connect([terminal(v, 'b'), [-240, 80], terminal(g, 'a')]);
    await fixture('workflow-d');
  });

  it('draws E: three-pin input connector, AND, NOT, output port and two-pin connector', async () => {
    render(<App />);
    const input = place('connector3', -240, 0, 180),
      and = place('andGate', -80, 0),
      not = place('notGate', 80, 0),
      output = place('port', 240, 0),
      connector = place('connector2', 360, 120);
    connect([terminal(input, 'pin1'), [-160, 20], [-160, -20], terminal(and, 'input1')]);
    connect([terminal(input, 'pin3'), terminal(and, 'input2')]);
    connect([terminal(and, 'output'), terminal(not, 'input')]);
    connect([terminal(not, 'output'), terminal(output, 'connection')]);
    connect([terminal(not, 'output'), [160, 0], [160, 100], terminal(connector, 'pin1')]);
    connect([terminal(input, 'pin2'), [-180, 0], [-180, 140], terminal(connector, 'pin2')]);
    rename(output, 'OUTPUT');
    await fixture('workflow-e');
  });
});

describe('audit: snapping, cancellation, topology and history edges', () => {
  it.each([0.15, 1, 4])('keeps a terminal hittable eight screen pixels away at zoom %s', (zoom) => {
    render(<App />);
    const r = place('resistor', 0, 0);
    node(400, 0, 'B');
    fireEvent.wheel(svg(), { deltaY: -Math.log(zoom / 1.45) / 0.002, clientX: 700, clientY: 350 });
    key('w');
    click(-40, 8 / zoom);
    click(400, 0);
    key('Escape');
    expect(current().objects.at(-1)).toMatchObject({
      kind: 'wire',
      startEndpoint: { kind: 'terminal', componentId: r.id, terminalId: 'a' },
      endEndpoint: { kind: 'junction' },
    });
  });

  it('supports terminal-free, free-terminal, junction-junction and junction-free routes without dangling references', async () => {
    render(<App />);
    const r = place('resistor', 0, 0);
    node(-240, 0, 'A');
    node(240, 0, 'B');
    connect([terminal(r, 'a'), [-100, -100]], true);
    connect([[100, -100], terminal(r, 'b')]);
    connect([
      [-240, 0],
      [-240, 200],
      [240, 200],
      [240, 0],
    ]);
    connect(
      [
        [240, 0],
        [320, 80],
      ],
      true,
    );
    expect(deserializeDocument(serializeDocument(current()))).toEqual(current());
    await fixture('endpoint-kinds');
  });

  it('cancels a provisional crossing split and rejects a zero-length wire without committing history', () => {
    render(<App />);
    connect(
      [
        [-200, 0],
        [200, 0],
      ],
      true,
    );
    const before = current(),
      count = useEditorStore.getState().past.length;
    key('w');
    click(0, 0);
    expect(current().objects.filter((o) => o.kind === 'junction')).toHaveLength(1);
    fireEvent.pointerCancel(svg(), point(0, 80));
    expect(current()).toEqual(before);
    expect(useEditorStore.getState().past).toHaveLength(count);
    const r = place('resistor', 0, 120);
    const start = current(),
      history = useEditorStore.getState().past.length;
    key('w');
    click(...(terminal(r, 'a') as [number, number]));
    click(...(terminal(r, 'a') as [number, number]));
    key('Escape');
    expect(current()).toEqual(start);
    expect(useEditorStore.getState().past).toHaveLength(history);
  });

  it('removes redundant waypoints after dragging while preserving a deliberate backtrack', () => {
    render(<App />);
    const w = connect(
      [
        [-200, 0],
        [-100, 0],
        [-100, 80],
        [100, 80],
      ],
      true,
    );
    select(w);
    const handle = svg().querySelector('[data-handle="vertex:0"] circle')!;
    fireEvent.pointerDown(handle, point(-100, 0));
    fireEvent.pointerMove(svg(), point(-200, 0));
    fireEvent.pointerUp(svg(), point(-200, 0));
    const updated = current().objects.find((o) => o.id === w.id)!;
    expect(updated.kind).toBe('wire');
    expect(wirePoints(updated as Wire, current())).toEqual([
      { x: -200, y: 0 },
      { x: -200, y: 80 },
      { x: 100, y: 80 },
    ]);
    expect(
      simplifyPolyline([
        { x: 0, y: 0 },
        { x: 80, y: 0 },
        { x: 40, y: 0 },
      ]),
    ).toHaveLength(3);
  });

  it('deletes a component, preserves its wires as free ends and restores the topology with one undo', () => {
    render(<App />);
    const r = place('resistor', 0, 0);
    node(-200, 0, 'A');
    node(200, 0, 'B');
    connect([[-200, 0], terminal(r, 'a')]);
    connect([terminal(r, 'b'), [200, 0]]);
    const before = current();
    select(r);
    key('Delete');
    const wires = current().objects.filter((o): o is Wire => o.kind === 'wire');
    expect(wires).toHaveLength(2);
    expect(
      wires.every((w) => w.startEndpoint.kind !== 'terminal' && w.endEndpoint.kind !== 'terminal'),
    ).toBe(true);
    key('z', { ctrlKey: true });
    expect(current()).toEqual(before);
    key('z', { ctrlKey: true, shiftKey: true });
    expect(() => deserializeDocument(serializeDocument(current()))).not.toThrow();
  });

  it('undoes and redoes a long mixed sequence with immutable snapshots and atomic Quick Junction', () => {
    render(<App />);
    const snapshots: CircuitDocument[] = [current()];
    const save = () => snapshots.push(current());
    const r = place('resistor', 0, 0);
    save();
    drag(r, [0, 0], [40, 40]);
    save();
    key('r');
    save();
    connect(
      [
        [40, 0],
        [200, 0],
      ],
      true,
    );
    save();
    key('n');
    click(200, 0);
    save();
    connect(
      [
        [120, 0],
        [120, -100],
      ],
      true,
    );
    save();
    rename(
      current().objects.find((o) => o.id === r.id)!,
      'r_{audit}',
    );
    save();
    drawArrow('l', [240, 0], [400, 120]);
    save();

    chooseSelectionColor('Simbolo', 'Verde');

    save();
    key('d', { ctrlKey: true });
    save();
    key('Delete');
    save();
    for (let i = snapshots.length - 2; i >= 0; i--) {
      key('z', { ctrlKey: true });
      expect(current()).toEqual(snapshots[i]);
    }
    for (let i = 1; i < snapshots.length; i++) {
      key('z', { ctrlKey: true, shiftKey: true });
      expect(current()).toEqual(snapshots[i]);
    }
    expect(() => deserializeDocument(serializeDocument(current()))).not.toThrow();
  });

  it('rejects malformed imports without replacing the current drawing and renders legacy fonts after old JSON import', async () => {
    render(<App />);
    const r = place('resistor', 0, 0);
    const before = current();
    for (const raw of [
      '{bad',
      JSON.stringify({ ...before, objects: [{ ...r, id: '' }] }),
      JSON.stringify({ ...before, objects: [{ ...r, rotation: 22.5 }] }),
    ]) {
      expect(() => deserializeDocument(raw)).toThrow();
      expect(current()).toEqual(before);
    }
    const legacy = {
      ...r,
      label: { ...r.label, fontFamily: undefined },
      terminals: r.terminals.map(({ id, localX, localY }) => ({ id, localX, localY })),
    };
    restoreSerialized(serializeDocument({ ...emptyDocument(), objects: [legacy] }));
    expect(
      svg().querySelector(`[data-object="${r.id}"] [data-source]`)?.getAttribute('data-source'),
    ).toBe(r.label.text);
  });

  it('autosaves the latest committed drawing while an unfinished wire gesture remains open', () => {
    vi.useFakeTimers();
    try {
      render(<App />);
      place('resistor', 0, 0);
      const committed = serializeDocument(current());
      act(() => vi.advanceTimersByTime(100));
      key('w');
      click(-40, 0);
      click(-160, -120);
      act(() => vi.advanceTimersByTime(1000));
      expect(stored.get(STORAGE_KEY)).toBe(committed);
    } finally {
      vi.useRealTimers();
    }
  });

  it('new circuit during Quick Junction cancels the provisional split before recording undo', () => {
    render(<App />);
    connect(
      [
        [-200, 0],
        [200, 0],
      ],
      true,
    );
    const committed = current();
    key('w');
    click(0, 0);
    expect(current().objects.filter((o) => o.kind === 'junction')).toHaveLength(1);
    act(() => useEditorStore.getState().replace(emptyDocument()));
    key('z', { metaKey: true });
    expect(current()).toEqual(committed);
  });
});
