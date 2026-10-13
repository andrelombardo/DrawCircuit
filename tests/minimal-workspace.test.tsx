// @vitest-environment jsdom
import { chooseDrawingTool } from './helpers/drawingMenu';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from '../src/App';
import { emptyDocument } from '../src/model/demo';
import { serializeDocument } from '../src/model/serialization';
import { useEditorStore } from '../src/store/editorStore';
import { TOOLBAR_STORAGE_KEY } from '../src/components/toolbar/useFloatingToolbar';

const saved = new Map<string, string>();
let width = 1280,
  height = 800;
const rect = (x: number, y: number, w: number, h: number) => ({
  x,
  y,
  left: x,
  top: y,
  right: x + w,
  bottom: y + h,
  width: w,
  height: h,
  toJSON: () => ({}),
});
beforeEach(() => {
  saved.clear();
  width = 1280;
  height = 800;
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
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
    value: () => true,
  });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const sidebar = document.querySelector<HTMLElement>('.component-sidebar');
    const left = sidebar && !sidebar.hidden ? 232 : 0;
    if (this.classList.contains('main-tools')) {
      const toolbar = this as HTMLElement;
      return rect(
        left + parseFloat(toolbar.style.left || '0'),
        parseFloat(toolbar.style.top || '14'),
        439,
        38,
      );
    }
    if (this.classList.contains('editor') || this.getAttribute('data-testid') === 'circuit-canvas')
      return rect(left, 0, width - left, height);
    return rect(0, 0, 100, 30);
  });
  useEditorStore.setState({
    document: emptyDocument(),
    tool: 'select',
    selection: [],
    past: [],
    future: [],
    gestureStart: null,
    storageError: false,
    notice: '',
    grid: true,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const toolbar = () => screen.getByRole('toolbar', { name: 'Strumenti di disegno' }) as HTMLElement;
const grip = () => screen.getByRole('button', { name: 'Sposta toolbar' });
function dragTo(x: number, y: number, cancel = false) {
  const r = toolbar().getBoundingClientRect();
  fireEvent.pointerDown(grip(), { clientX: r.left + 8, clientY: r.top + 8, button: 0 });
  fireEvent.pointerMove(grip(), { clientX: x + 8, clientY: y + 8, buttons: 1 });
  if (cancel) fireEvent.pointerCancel(grip());
  else fireEvent.pointerUp(grip());
}
it('removes header, branding, file management and status text; places export inside the drawing toolbar', () => {
  render(<App />);
  expect(document.querySelector('header')).toBeNull();
  for (const name of ['Menu file', 'Apri file JSON', 'Titolo circuito'])
    expect(screen.queryByLabelText(name)).toBeNull();
  expect(document.body.textContent).not.toMatch(
    /DrawCircuit|Salvataggio locale automatico|Solo sul tuo dispositivo/,
  );
  expect(screen.getByRole('button', { name: 'Esporta' }).closest('[role="toolbar"]')).toBe(
    toolbar(),
  );
  expect(screen.getByRole('button', { name: 'Aiuto' }).classList.contains('floating-surface')).toBe(
    true,
  );
  expect(parseFloat(toolbar().style.left)).toBe((1048 - 439) / 2);
  expect(parseFloat(toolbar().style.top)).toBe(14);
  fireEvent.click(screen.getByRole('button', { name: 'Griglia (G)' }));
  expect(useEditorStore.getState().grid).toBe(false);
  expect(useEditorStore.getState().notice).toBe('');
});
it('drags only from the grip, preserves drawing state and restores normalized position after reload and resize', () => {
  render(<App />);
  chooseDrawingTool('Filo');
  const doc = serializeDocument(useEditorStore.getState().document);
  dragTo(700, 350);
  expect(parseFloat(toolbar().style.left)).toBe(468);
  expect(parseFloat(toolbar().style.top)).toBe(350);
  expect(useEditorStore.getState().tool).toBe('wire');
  expect(serializeDocument(useEditorStore.getState().document)).toBe(doc);
  expect(useEditorStore.getState().gestureStart).toBeNull();
  const position = JSON.parse(saved.get(TOOLBAR_STORAGE_KEY)!);
  expect(position.x).toBeGreaterThan(0);
  expect(position.x).toBeLessThan(1);
  expect(position.y).toBeGreaterThan(0);
  expect(position.y).toBeLessThan(1);
  cleanup();
  render(<App />);
  expect(parseFloat(toolbar().style.left)).toBeCloseTo(468);
  expect(parseFloat(toolbar().style.top)).toBeCloseTo(350);
  width = 1024;
  height = 768;
  act(() => window.dispatchEvent(new Event('resize')));
  const r = toolbar().getBoundingClientRect();
  expect(r.left).toBeGreaterThanOrEqual(246);
  expect(r.right).toBeLessThanOrEqual(1010);
  expect(r.bottom).toBeLessThanOrEqual(704);
  expect(saved.get(TOOLBAR_STORAGE_KEY)).toBe(JSON.stringify(position));
});
it('keeps the toolbar inside the editor, avoids the collapsed sidebar button and reserves bottom controls', () => {
  render(<App />);
  dragTo(-1000, -1000);
  expect(toolbar().style.left).toBe('14px');
  expect(toolbar().style.top).toBe('14px');
  fireEvent.click(screen.getByRole('button', { name: 'Nascondi componenti' }));
  expect(
    screen
      .getByRole('button', { name: 'Mostra componenti' })
      .classList.contains('floating-surface'),
  ).toBe(true);
  dragTo(-1000, -1000);
  expect(toolbar().style.left).toBe('58px');
  dragTo(10000, 10000);
  const r = toolbar().getBoundingClientRect();
  expect(r.right).toBe(1266);
  expect(r.bottom).toBe(736);
  fireEvent.click(screen.getByRole('button', { name: 'Mostra componenti' }));
  expect(toolbar().getBoundingClientRect().right).toBe(1266);
  expect(toolbar().getAttribute('data-menu-above')).toBe('true');
});
it('cancels a pointer drag without changing the saved preference and tolerates invalid or inaccessible storage', () => {
  saved.set(TOOLBAR_STORAGE_KEY, '{broken');
  render(<App />);
  const original = toolbar().style.left;
  dragTo(800, 200, true);
  expect(toolbar().style.left).toBe(original);
  expect(saved.get(TOOLBAR_STORAGE_KEY)).toBe('{broken');
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
  dragTo(800, 200);
  expect(toolbar().style.top).toBe('200px');
});
it('keeps normalized UI preferences outside serialized circuit data', () => {
  render(<App />);
  fireEvent.keyDown(grip(), { key: 'ArrowDown' });
  expect(toolbar().style.top).toBe('24px');
  expect(saved.has(TOOLBAR_STORAGE_KEY)).toBe(true);
  expect(serializeDocument(useEditorStore.getState().document)).not.toMatch(/toolbar|sidebar/);
});

it('keeps the top toolbar between native window controls and reacts when the overlay changes', () => {
  const overlay = Object.assign(new EventTarget(), {
    visible: true,
    getTitlebarAreaRect: () => rect(80, 0, width - 240, 38),
  });
  Object.defineProperty(navigator, 'windowControlsOverlay', {
    configurable: true,
    get: () => undefined,
  });
  vi.spyOn(
    navigator as Navigator & { windowControlsOverlay?: typeof overlay },
    'windowControlsOverlay',
    'get',
  ).mockReturnValue(overlay);
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Nascondi componenti' }));
  dragTo(-1000, -1000);
  expect(toolbar().getBoundingClientRect().left).toBe(94);
  expect(toolbar().style.top).toBe('14px');
  dragTo(10000, -1000);
  expect(toolbar().getBoundingClientRect().right).toBe(width - 160 - 14);
  width = 600;
  act(() => overlay.dispatchEvent(new Event('geometrychange')));
  expect(toolbar().style.top).toBe('46px');
  overlay.visible = false;
  act(() => overlay.dispatchEvent(new Event('geometrychange')));
  expect(toolbar().style.top).toBe('14px');
});
