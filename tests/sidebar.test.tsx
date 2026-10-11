// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../src/App';
import { emptyDocument } from '../src/model/demo';
import { useEditorStore } from '../src/store/editorStore';
import { SIDEBAR_STORAGE_KEY } from '../src/components/palette/useSidebarPreferences';
import { serializeDocument } from '../src/model/serialization';
import type { Point } from '../src/model/types';
const stored = new Map<string, string>();
const observers: { callback: () => void; element?: Element }[] = [];
function canvas() {
  return screen.getByTestId('circuit-canvas');
}
function rectangle(left: number, width: number, height = 700) {
  return {
    x: left,
    y: 0,
    left,
    top: 0,
    right: left + width,
    bottom: height,
    width,
    height,
    toJSON: () => ({}),
  };
}
function viewport() {
  return canvas()
    .querySelector(':scope > g')!
    .getAttribute('transform')!
    .match(/-?\d+(?:\.\d+)?/g)!
    .map(Number);
}
function notifyResize() {
  act(() => {
    observers.filter((o) => o.element === canvas()).forEach((o) => o.callback());
    vi.advanceTimersByTime(20);
  });
}
function click(point: Point) {
  const [x, y, zoom] = viewport(),
    box = canvas().getBoundingClientRect();
  const event = {
    clientX: box.left + x + point.x * zoom,
    clientY: y + point.y * zoom,
    button: 0,
    pointerId: 1,
  };
  fireEvent.pointerDown(canvas(), event);
  fireEvent.pointerUp(canvas(), event);
}
function key(key: string) {
  fireEvent.keyDown(canvas(), { key });
}
beforeEach(() => {
  stored.clear();
  observers.length = 0;
  vi.useFakeTimers();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
  });
  vi.stubGlobal(
    'PointerEvent',
    class extends MouseEvent {
      pointerId = 1;
    },
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      callback: () => void;
      constructor(callback: () => void) {
        this.callback = callback;
      }
      observe(element: Element) {
        observers.push({ callback: this.callback, element });
      }
      disconnect() {}
    },
  );
  for (const method of ['setPointerCapture', 'releasePointerCapture']) {
    Object.defineProperty(Element.prototype, method, { configurable: true, value: vi.fn() });
  }
  Object.defineProperty(Element.prototype, 'hasPointerCapture', {
    configurable: true,
    value: () => false,
  });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const shell = document.querySelector<HTMLElement>('.component-sidebar');
    const width =
      !shell || shell.hidden
        ? 0
        : Math.min(480, Math.max(200, Number.parseFloat(shell.style.width)));
    if (this.classList.contains('component-sidebar')) return rectangle(0, width);
    if (this.getAttribute('data-testid') === 'circuit-canvas')
      return rectangle(width, 1280 - width);
    return rectangle(0, 100);
  });
  useEditorStore.setState({
    document: emptyDocument(),
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
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe('persistent resizable component sidebar', () => {
  it('hides, reopens and restores visibility/width without including UI preferences in JSON', () => {
    render(<App />);
    expect(screen.getByLabelText('Nascondi componenti').closest('.palette-heading')).toBeTruthy();
    expect(document.querySelector('.topbar .sidebar-toggle')).toBeNull();
    expect(
      screen.getByRole('toolbar', { name: 'Strumenti di disegno' }).closest('.editor'),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Titolo circuito')).toBeNull();
    const separator = screen.getByRole('separator', { name: 'Ridimensiona barra componenti' });
    fireEvent.keyDown(separator, { key: 'End' });
    expect(separator.getAttribute('aria-valuenow')).toBe('480');
    expect(screen.getByRole('complementary').getBoundingClientRect).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Nascondi componenti' }));
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(canvas().getBoundingClientRect().width).toBe(1280);
    expect(screen.getByLabelText('Mostra componenti').closest('.editor')).toBeTruthy();
    expect(JSON.parse(stored.get(SIDEBAR_STORAGE_KEY)!)).toEqual({ visible: false, width: 480 });
    cleanup();
    render(<App />);
    expect(screen.queryByRole('complementary')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Mostra componenti' }));
    expect(
      screen
        .getByRole('separator', { name: 'Ridimensiona barra componenti' })
        .getAttribute('aria-valuenow'),
    ).toBe('480');
    expect(canvas().getBoundingClientRect().width).toBe(800);
    expect(serializeDocument(useEditorStore.getState().document)).not.toMatch(
      /sidebar|visible|480/,
    );
  });
  it('clamps pointer resize to min/max and double click restores the default', () => {
    render(<App />);
    const separator = screen.getByRole('separator', { name: 'Ridimensiona barra componenti' });
    fireEvent.pointerDown(separator, { clientX: 232, button: 0 });
    fireEvent.pointerMove(separator, { clientX: -1000 });
    expect(separator.getAttribute('aria-valuenow')).toBe('200');
    fireEvent.pointerMove(separator, { clientX: 2000 });
    expect(separator.getAttribute('aria-valuenow')).toBe('460.8'); // 45% of the 1024px jsdom window.
    fireEvent.pointerUp(separator);
    fireEvent.doubleClick(separator);
    expect(separator.getAttribute('aria-valuenow')).toBe('232');
    cleanup();
    render(<App />);
    expect(
      screen
        .getByRole('separator', { name: 'Ridimensiona barra componenti' })
        .getAttribute('aria-valuenow'),
    ).toBe('232');
  });
  it('keeps zoom and the world centre through show/hide and resize; placement, smart snap, wire and pan still work', () => {
    render(<App />);
    fireEvent.wheel(canvas(), { clientX: 620, clientY: 300, deltaY: -150 });
    const before = viewport(),
      size = canvas().getBoundingClientRect();
    const centre = [
      (size.width / 2 - before[0]) / before[2],
      (size.height / 2 - before[1]) / before[2],
    ];
    fireEvent.click(screen.getByRole('button', { name: 'Nascondi componenti' }));
    notifyResize();
    const hidden = viewport(),
      hiddenSize = canvas().getBoundingClientRect();
    expect(hidden[2]).toBe(before[2]);
    expect((hiddenSize.width / 2 - hidden[0]) / hidden[2]).toBeCloseTo(centre[0]);
    expect((hiddenSize.height / 2 - hidden[1]) / hidden[2]).toBeCloseTo(centre[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Mostra componenti' }));
    notifyResize();
    fireEvent.keyDown(screen.getByRole('separator', { name: 'Ridimensiona barra componenti' }), {
      key: 'End',
    });
    notifyResize();
    expect(viewport()[2]).toBe(before[2]);
    fireEvent.click(screen.getByRole('button', { name: 'Inserisci resistenza' }));
    click({ x: 0, y: 0 });
    key('v');
    fireEvent.click(screen.getByRole('button', { name: 'Inserisci condensatore' }));
    const [x, y, zoom] = viewport(),
      box = canvas().getBoundingClientRect();
    fireEvent.pointerMove(canvas(), {
      clientX: box.left + x + 80 * zoom,
      clientY: y,
      pointerId: 1,
    });
    click({ x: 80, y: 0 });
    key('v');
    expect(
      useEditorStore.getState().document.objects.filter((o) => o.kind === 'wire'),
    ).toHaveLength(1);
    key('w');
    click({ x: -40, y: 0 });
    click({ x: -140, y: 0 });
    key('Enter');
    key('Escape');
    expect(
      useEditorStore.getState().document.objects.filter((o) => o.kind === 'wire'),
    ).toHaveLength(2);
    const camera = viewport();
    key('h');
    fireEvent.pointerDown(canvas(), { clientX: 900, clientY: 300, button: 0 });
    fireEvent.pointerMove(canvas(), { clientX: 930, clientY: 320, buttons: 1 });
    fireEvent.pointerUp(canvas(), { clientX: 930, clientY: 320 });
    expect(viewport()[0]).toBeCloseTo(camera[0] + 30);
    const zoomBefore = viewport()[2];
    fireEvent.wheel(canvas(), { clientX: 900, clientY: 300, deltaY: -100 });
    expect(viewport()[2]).toBeGreaterThan(zoomBefore);
  });
  it('ignores malformed preferences and tolerates unavailable storage', () => {
    stored.set(SIDEBAR_STORAGE_KEY, '{bad');
    render(<App />);
    expect(
      screen
        .getByRole('separator', { name: 'Ridimensiona barra componenti' })
        .getAttribute('aria-valuenow'),
    ).toBe('232');
    cleanup();
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw Error('disabled');
      },
      setItem: () => {
        throw Error('disabled');
      },
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Nascondi componenti' }));
    expect(screen.getByRole('button', { name: 'Mostra componenti' })).toBeDefined();
  });
});
