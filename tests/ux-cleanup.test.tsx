import { openSelectionMenu } from './helpers/selectionMenu';
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from '../src/App';
import { useEditorStore } from '../src/store/editorStore';
import { emptyDocument } from '../src/model/demo';
import { createComponent } from '../src/model/catalog';
import { createBrace, braceGeometry } from '../src/annotations/brace';
import { rotatePoint, midpoint } from '../src/utils/geometry';
import { SIDEBAR_STORAGE_KEY } from '../src/components/palette/useSidebarPreferences';
import { ZOOM_STORAGE_KEY, readZoomPreference } from '../src/components/editor/zoomPreferences';
import { getExportSelection } from '../src/tikz/selection';
import { copyPNG, exportPNG } from '../src/png/exporter';
import * as files from '../src/utils/files';
import type { BraceAnnotation, Rotation } from '../src/model/types';

vi.mock('../src/png/exporter', () => ({ copyPNG: vi.fn(), exportPNG: vi.fn() }));
const stored = new Map<string, string>();
const state = () => useEditorStore.getState();
const canvas = () => screen.getByTestId('circuit-canvas');
const zoom = () =>
  Number(
    canvas()
      .querySelector(':scope > g')!
      .getAttribute('transform')!
      .match(/scale\(([^)]+)\)/)![1],
  );
const key = (key: string, extra = {}, target: Element = canvas()) =>
  fireEvent.keyDown(target, { key, ...extra });
beforeEach(() => {
  stored.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
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
  for (const method of ['setPointerCapture', 'releasePointerCapture', 'hasPointerCapture'])
    Object.defineProperty(Element.prototype, method, {
      configurable: true,
      value: method === 'hasPointerCapture' ? () => false : vi.fn(),
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
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
  vi.mocked(copyPNG).mockReset().mockResolvedValue(undefined);
  vi.mocked(exportPNG)
    .mockReset()
    .mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
  vi.spyOn(files, 'download').mockImplementation(() => {});
  useEditorStore.setState({
    document: emptyDocument(),
    selection: [],
    past: [],
    future: [],
    gestureStart: null,
    tool: 'select',
    notice: '',
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('sidebar shortcut received by the app', () => {
  it('uses the button preference, ignores repeat and leaves the document/history intact', () => {
    render(<App />);
    const doc = state().document;
    key('t', {});
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(JSON.parse(stored.get(SIDEBAR_STORAGE_KEY)!).visible).toBe(false);
    key('t', { repeat: true });
    expect(screen.queryByRole('complementary')).toBeNull();
    key('t', {});
    expect(screen.getByRole('complementary')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Nascondi componenti' }));
    key('t', {});
    expect(screen.getByRole('complementary')).toBeTruthy();
    expect(state().document).toBe(doc);
    expect(state().past).toEqual([]);
  });
  it('toggles with bare T on other platforms while keeping Ctrl+T compatible', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
    render(<App />);
    key('t', { ctrlKey: true });
    expect(screen.queryByRole('complementary')).toBeNull();
    key('t');
    expect(screen.getByRole('complementary')).toBeTruthy();
    expect(state().tool).toBe('select');
    fireEvent.click(screen.getByRole('button', { name: 'Testo' }));
    expect(state().tool).toBe('text');
  });
  it('ignores search, annotation editing, textarea, contenteditable, menus and dialogs', () => {
    const brace = createBrace('brace', { x: 0, y: 0 }, { x: 200, y: 0 });
    useEditorStore.setState({
      document: { ...emptyDocument(), objects: [brace] },
      selection: [brace.id],
    });
    render(<App />);
    const unchanged = () => expect(screen.getByRole('complementary')).toBeTruthy();
    key('t', {}, screen.getByRole('textbox', { name: 'Cerca componenti' }));
    unchanged();
    key('t', {}, screen.getByRole('textbox', { name: 'Etichetta annotazione' }));
    unchanged();
    key('Enter');
    key('t', {}, screen.getByLabelText('Modifica testo sul foglio'));
    unchanged();
    fireEvent.keyDown(screen.getByLabelText('Modifica testo sul foglio'), { key: 'Escape' });
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    Object.defineProperty(editable, 'isContentEditable', { value: true });
    document.body.append(editable);
    key('t', {}, editable);
    unchanged();
    editable.remove();
    fireEvent.click(screen.getByRole('button', { name: 'Disegno e annotazioni' }));
    key('t', {});
    unchanged();
    fireEvent.click(screen.getByRole('button', { name: 'Disegno e annotazioni' }));
    fireEvent.click(screen.getByRole('button', { name: 'Esporta' }));
    key('t', {}, screen.getByRole('textbox', { name: 'Codice TikZ generato' }));
    unchanged();
    key('t', {});
    unchanged();
    expect(state().past).toEqual([]);
  });
  it('advertises Cmd+T only in a Mac standalone window, never in a browser tab', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Aiuto' }));
    expect(screen.queryByText('⌘T')).toBeNull();
    expect(screen.getByText('Mostra/nascondi componenti')).toBeTruthy();
    expect(screen.getByText('T', { selector: 'kbd' })).toBeTruthy();
    cleanup();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Aiuto' }));
    expect(screen.getByText('⌘T')).toBeTruthy();
  });
  it('toggles with a selected annotation unless its property popover is open', () => {
    const brace = createBrace('brace', { x: 0, y: 0 }, { x: 200, y: 0 });
    useEditorStore.setState({
      document: { ...emptyDocument(), objects: [brace] },
      selection: [brace.id],
    });
    render(<App />);
    key('t', {}, canvas());
    expect(screen.queryByRole('complementary')).toBeNull();
    key('t', {}, canvas());
    expect(screen.getByRole('complementary')).toBeTruthy();

    const input = screen.getByLabelText('Etichetta annotazione');
    input.focus();
    key('t', {}, input);
    expect(screen.getByRole('complementary')).toBeTruthy();
    input.blur();
    key('t', {}, canvas());
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(state().selection).toEqual([brace.id]);
    expect(state().past).toEqual([]);
  });
});

describe('zoom UI preference', () => {
  it.each([0.5, 1.25, 2])('restores %s after remount without auto-fit overwriting it', (value) => {
    stored.set(ZOOM_STORAGE_KEY, JSON.stringify(value));
    render(<App />);
    expect(zoom()).toBe(value);
    const doc = state().document;
    cleanup();
    render(<App />);
    expect(zoom()).toBe(value);
    expect(state().document).toBe(doc);
    expect(state().past).toEqual([]);
    expect(JSON.stringify(doc)).not.toContain('zoom');
  });
  it('persists wheel/buttons/fit but does not persist pan', () => {
    stored.set(ZOOM_STORAGE_KEY, '1.25');
    render(<App />);
    fireEvent.wheel(canvas(), { clientX: 800, clientY: 350, deltaY: -100 });
    expect(Number(stored.get(ZOOM_STORAGE_KEY))).toBe(zoom());
    fireEvent.click(screen.getByRole('button', { name: 'Riduci zoom' }));
    expect(Number(stored.get(ZOOM_STORAGE_KEY))).toBe(zoom());
    key('1');
    const fitted = zoom();
    expect(Number(stored.get(ZOOM_STORAGE_KEY))).toBe(fitted);
    key('h');
    fireEvent.pointerDown(canvas(), { clientX: 800, clientY: 350, button: 0 });
    fireEvent.pointerMove(canvas(), { clientX: 840, clientY: 370 });
    fireEvent.pointerUp(canvas());
    expect(Number(stored.get(ZOOM_STORAGE_KEY))).toBe(fitted);
    expect(stored.get(ZOOM_STORAGE_KEY)).not.toMatch(/x|y/);
    cleanup();
    render(<App />);
    expect(zoom()).toBe(fitted);
  });
  it.each(['NaN', '-500', '0', 'null', '"1.25"', '{}', '{broken', '1e999'])(
    'ignores invalid saved data %s',
    (raw) => {
      stored.set(ZOOM_STORAGE_KEY, raw);
      expect(readZoomPreference()).toBeNull();
      render(<App />);
      expect(Number.isFinite(zoom())).toBe(true);
      expect(zoom()).toBeGreaterThanOrEqual(0.15);
      expect(zoom()).toBeLessThanOrEqual(4);
    },
  );
  it.each([
    ['999999', 4],
    ['0.001', 0.15],
  ] as const)('clamps valid finite data %s', (raw, expected) => {
    stored.set(ZOOM_STORAGE_KEY, raw);
    render(<App />);
    expect(zoom()).toBe(expected);
  });
  it('keeps zoom functional with unavailable storage', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw Error('blocked');
      },
      setItem() {
        throw Error('blocked');
      },
    });
    render(<App />);
    const before = zoom();
    key('+');
    expect(zoom()).toBeGreaterThan(before);
  });
});

describe('annotation and placement cleanup', () => {
  it('keeps inline insertion and removes pin controls and Option from placement hints', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Inserisci resistenza' }));
    expect(document.querySelector('.smart-placement-options')).toBeNull();
    const inline = screen.getByRole('button', { name: 'Inserisci in filo' });
    expect(inline.closest('.editor-bottom')).toBeTruthy();
    fireEvent.click(inline);
    expect(inline.getAttribute('aria-pressed')).toBe('true');
    key('r');
    expect(state().placementRotation).toBe(45);
    expect(document.querySelector('.editor-bottom [role="status"]')!.textContent).not.toContain(
      'Alt/Option',
    );
    key('Escape');
    fireEvent.click(screen.getByRole('button', { name: 'Inserisci amplificatore operazionale' }));
    expect(screen.queryByRole('button', { name: /Collega terminale/ })).toBeNull();
    expect(screen.queryByText('Collega terminale:')).toBeNull();
    expect(screen.queryByText('Nessuno')).toBeNull();
  });
  it('groups all drawing tools under the pencil and opens one nested menu at a time', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Disegno e annotazioni' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Graffa / Staffa' }));
    expect(screen.getByRole('menuitem', { name: 'Graffa' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Staffa' })).toBeTruthy();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Corrente sul filo' }));
    expect(screen.queryByRole('menuitem', { name: 'Graffa' })).toBeNull();
    expect(useEditorStore.getState().tool).toBe('current');
    expect(screen.queryByRole('menu')).toBeNull();
    key('Escape');
    expect(screen.queryByRole('menuitem', { name: 'Integrata' })).toBeNull();
    key('Escape');
    expect(screen.queryByRole('menu')).toBeNull();
  });
  it.each(['brace', 'bracket'] as const)(
    'rotates %s through four R presses with fixed centre, style, label offset and exact Undo/Redo',
    (type) => {
      const brace = createBrace(type, { x: 10, y: 60 }, { x: 310, y: 60 });
      brace.side = -1;
      brace.width = 3;
      brace.color = '#8855c2';
      brace.label = {
        ...brace.label,
        text: 'R_{eq}',
        offset: { x: 9, y: -7 },
        color: '#2463cb',
        fontSize: 28,
      };
      useEditorStore.setState({
        document: { ...emptyDocument(), objects: [brace] },
        selection: [brace.id],
      });
      render(<App />);
      const centre = midpoint(brace.start, brace.end);
      openSelectionMenu();
      expect(screen.getByRole('button', { name: 'Ruota 90° (R)' })).toBeTruthy();
      fireEvent.keyDown(window, { key: 'Escape' });
      for (let i = 1; i <= 4; i++) {
        key('r');
        const rotated = state().document.objects[0] as BraceAnnotation;
        expect(midpoint(rotated.start, rotated.end)).toEqual(centre);
        expect(rotated.label.offset).toEqual(
          rotatePoint(brace.label.offset, ((i * 90) % 360) as Rotation),
        );
        expect(rotated).toMatchObject({
          id: brace.id,
          type,
          side: -1,
          color: brace.color,
          width: 3,
          label: { text: 'R_{eq}', color: '#2463cb', fontSize: 28 },
        });
        expect(canvas().querySelector('[data-layer="annotations"] path')!.getAttribute('d')).toBe(
          braceGeometry(rotated).d,
        );
        expect(canvas().querySelectorAll('[data-handle]')).toHaveLength(2);
        const final = state().document;
        act(() => state().undo());
        act(() => state().redo());
        expect(state().document).toEqual(final);
        act(() => state().select([brace.id]));
      }
      expect(state().document.objects).toEqual([brace]);
      expect(state().past).toHaveLength(4);

      const ui = [
        ...document.querySelectorAll(
          'button,input,select,textarea,summary,[role="dialog"],.property-control > span',
        ),
      ].map(
        (el) =>
          `${el.getAttribute('aria-label') ?? ''} ${el.getAttribute('title') ?? ''} ${el.getAttribute('placeholder') ?? ''} ${el.tagName === 'INPUT' ? '' : el.textContent}`,
      );
      expect(ui.join(' ')).not.toMatch(/\blabel\b/i);
    },
  );
});

describe('direct PNG export actions', () => {
  it.each(['all', 'selection'] as const)(
    'copies and downloads %s immediately from the shared subset, keeping the format panel',
    async (scope) => {
      const component = createComponent('resistor', { x: 0, y: 0 });
      const brace = createBrace('brace', { x: 0, y: 60 }, { x: 240, y: 60 });
      const doc = { ...emptyDocument(), objects: [component, brace] };
      useEditorStore.setState({ document: doc, selection: [brace.id] });
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: 'Esporta' }));
      if (scope === 'selection')
        fireEvent.click(screen.getByRole('button', { name: 'Solo selezione' }));
      const expected = scope === 'selection' ? getExportSelection(doc, [brace.id]) : doc;
      expect(screen.queryByRole('button', { name: 'PNG' })).toBeNull();
      expect(screen.queryByText('PNG · 2×')).toBeNull();
      const code = (
        screen.getByRole('textbox', { name: 'Codice TikZ generato' }) as HTMLTextAreaElement
      ).value;
      await act(async () => {
        fireEvent.click(
          within(screen.getByRole('dialog')).getByRole('button', { name: 'Copia PNG' }),
        );
      });
      expect(copyPNG).toHaveBeenCalledWith(expected);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Scarica PNG' }));
      });
      expect(exportPNG).toHaveBeenCalledWith(expected);
      expect(files.download).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/\.png$/),
        'image/png',
      );
      expect(
        (screen.getByRole('textbox', { name: 'Codice TikZ generato' }) as HTMLTextAreaElement)
          .value,
      ).toBe(code);
    },
  );
  it('keeps selection disabled without a selection and PNG disabled for an empty document', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Esporta' }));
    for (const name of ['Solo selezione', 'Copia PNG', 'Scarica PNG'])
      expect(screen.getByRole('button', { name }).hasAttribute('disabled')).toBe(true);
  });
});
