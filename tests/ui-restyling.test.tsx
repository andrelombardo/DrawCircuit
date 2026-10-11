// @vitest-environment jsdom
import { chooseSelectionColor } from './helpers/selectionMenu';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Canvas } from '../src/components/editor/Canvas';
import { createComponent } from '../src/model/catalog';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import { COLORS } from '../src/model/types';
import type { CircuitComponent } from '../src/model/types';
import { saveDocumentNow, STORAGE_KEY, useEditorStore } from '../src/store/editorStore';
import {
  createPersonalBlock,
  instantiatePersonalBlock,
  parsePersonalBlocks,
  serializePersonalBlocks,
} from '../src/personalBlocks/library';
import { exportObsidian, exportTikz } from '../src/tikz/exporter';
import { exportSVG } from '../src/svg/exporter';

const saved = new Map<string, string>();
let clipboard = '';
const component = () => useEditorStore.getState().document.objects[0] as CircuitComponent;
const openStyle = () =>
  expect(screen.getByRole('group', { name: 'Stile selezione' })).toBeDefined();
const input = (label: string) => screen.getByLabelText(`Colore ${label} personalizzato`);
const choose = (label: string, value: string) => {
  fireEvent.input(input(label), { target: { value } });
  fireEvent.change(input(label), { target: { value } });
};
const select = () => act(() => useEditorStore.getState().select(['test-resistor']));
beforeEach(() => {
  saved.clear();
  clipboard = '';
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
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 1280,
    bottom: 800,
    width: 1280,
    height: 800,
    toJSON: () => ({}),
  });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        clipboard = text;
      },
      readText: async () => clipboard,
    },
  });
  useEditorStore.setState({
    document: {
      version: 1,
      title: 'RGB',
      objects: [
        {
          ...createComponent('resistor', { x: 0, y: 0 }),
          id: 'test-resistor',
        },
      ],
    },
    selection: ['test-resistor'],
    tool: 'select',
    past: [],
    future: [],
    gestureStart: null,
    storageError: false,
    notice: '',
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('native custom color workflow', () => {
  it('keeps symbol/label colors independent, commits native input/change once and restores presets', () => {
    render(<Canvas />);
    openStyle();
    expect(input('simbolo').getAttribute('type')).toBe('color');
    choose('simbolo', '#ff9500');
    expect(component()).toMatchObject({ color: '#ff9500', label: { color: COLORS.blue } });
    expect(useEditorStore.getState().past).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Colore simbolo' }).textContent).toContain('FF9500');
    choose('etichetta', '#af52de');
    expect(component()).toMatchObject({ color: '#ff9500', label: { color: '#af52de' } });
    expect(useEditorStore.getState().past).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Colore etichetta' }).textContent).toContain(
      'AF52DE',
    );
    openStyle();
    openStyle();
    expect((input('simbolo') as HTMLInputElement).value).toBe('#ff9500');
    fireEvent.click(input('simbolo'));
    fireEvent.click(input('simbolo'));
    expect(useEditorStore.getState().past).toHaveLength(2);
    act(() => useEditorStore.getState().select([]));
    select();
    openStyle();
    expect((input('etichetta') as HTMLInputElement).value).toBe('#af52de');
    chooseSelectionColor('Simbolo', 'Blu');
    expect(component()).toMatchObject({ color: COLORS.blue, label: { color: '#af52de' } });
    expect(screen.getByRole('button', { name: 'Colore simbolo' }).textContent).toContain(
      COLORS.blue.slice(1).toUpperCase(),
    );
    chooseSelectionColor('Etichetta', 'Rosso');
    expect(component().label.color).toBe(COLORS.red);
    expect(screen.getByRole('button', { name: 'Colore etichetta' }).textContent).toContain(
      COLORS.red.slice(1).toUpperCase(),
    );
  });
  it('survives undo/redo, JSON, local persistence, duplicate, clipboard, personal blocks and all exports', async () => {
    render(<Canvas />);
    openStyle();
    choose('simbolo', '#ff9500');
    choose('etichetta', '#af52de');
    act(() => useEditorStore.getState().undo());
    expect(component()).toMatchObject({ color: '#ff9500', label: { color: COLORS.blue } });
    act(() => useEditorStore.getState().redo());
    expect(component()).toMatchObject({ color: '#ff9500', label: { color: '#af52de' } });
    const doc = useEditorStore.getState().document;
    const expected = { color: '#ff9500', label: { color: '#af52de' } };
    expect(deserializeDocument(serializeDocument(doc)).objects[0]).toMatchObject(expected);
    expect(saveDocumentNow()).toBe(true);
    expect(deserializeDocument(saved.get(STORAGE_KEY)!).objects[0]).toMatchObject(expected);
    select();
    act(() => useEditorStore.getState().duplicate());
    expect(useEditorStore.getState().document.objects[1]).toMatchObject(expected);
    select();
    const canvas = screen.getByTestId('circuit-canvas');
    await act(async () => fireEvent.keyDown(canvas, { key: 'c', ctrlKey: true }));
    await act(async () => fireEvent.keyDown(canvas, { key: 'v', ctrlKey: true }));
    expect(useEditorStore.getState().document.objects[2]).toMatchObject(expected);
    const block = createPersonalBlock(doc, ['test-resistor'], 'RGB resistor');
    const restored = parsePersonalBlocks(serializePersonalBlocks([block]))[0];
    expect(instantiatePersonalBlock(restored, { x: 100, y: 100 }, 90, doc)[0]).toMatchObject(
      expected,
    );
    for (const output of [exportTikz(doc), exportObsidian(doc)]) {
      expect(output).toContain('{HTML}{FF9500}');
      expect(output).toContain('{HTML}{AF52DE}');
    }
    expect(exportSVG(doc)).toContain('stroke="#ff9500"');
    expect(exportSVG(doc)).toContain('fill="#af52de"');
  });
  it('applies every offered line/text size and exposes only useful component menu actions', () => {
    render(<Canvas />);
    openStyle();
    const width = screen.getByLabelText('Spessore linea') as HTMLSelectElement;
    for (const option of Array.from(width.options)) {
      fireEvent.change(width, { target: { value: option.value } });
      expect(component().width).toBe(Number(option.value));
    }
    const size = screen.getByLabelText('Dimensione testo') as HTMLSelectElement;
    for (const option of Array.from(size.options)) {
      fireEvent.change(size, { target: { value: option.value } });
      expect(component().label.fontSize).toBe(Number(option.value));
    }

    fireEvent.click(screen.getByRole('button', { name: 'Comandi selezione' }));
    expect(screen.getByRole('menuitem', { name: 'Sostituisci…' })).toBeDefined();
    expect(screen.getByRole('menuitem', { name: 'Salva come blocco' })).toBeDefined();
    expect(screen.queryByText('Ruota label')).toBeNull();
  });
});
