// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Canvas } from '../src/components/editor/Canvas';
import { useEditorStore } from '../src/store/editorStore';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import { electricalDrawingGeometry } from '../src/annotations/electrical';
import { exportSVG } from '../src/svg/exporter';
import { exportTikz, exportObsidian } from '../src/tikz/exporter';
import { moveSelection } from '../src/utils/operations';
import { currentZoomFixture } from './helpers/currentZoomFixture';
import { ZOOM_STORAGE_KEY } from '../src/components/editor/zoomPreferences';

const state = () => useEditorStore.getState();
const canvas = () => screen.getByTestId('circuit-canvas');
const zooms = [0.15, 0.5, 1, 2, 4];
function zoomTo(zoom: number) {
  const previous = Number(localStorage.getItem(ZOOM_STORAGE_KEY));
  fireEvent.wheel(canvas(), {
    deltaY: -Math.log(zoom / previous) / 0.002,
    clientX: 600,
    clientY: 400,
  });
  expect(Number(localStorage.getItem(ZOOM_STORAGE_KEY))).toBeCloseTo(zoom);
}
function visibleGeometry() {
  const clone = canvas().querySelector(':scope > g')!.cloneNode(true) as SVGElement;
  clone.removeAttribute('transform');
  // Screen-space hit corridors and selection affordances are intentionally separate.
  clone
    .querySelectorAll('[stroke="transparent"], [data-layer="selection"]')
    .forEach((e) => e.remove());
  return clone.outerHTML;
}
beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  localStorage.setItem(ZOOM_STORAGE_KEY, '1');
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
    right: 1200,
    bottom: 800,
    width: 1200,
    height: 800,
    toJSON: () => ({}),
  });
  useEditorStore.setState({
    document: currentZoomFixture(),
    selection: [],
    activeLabel: null,
    tool: 'select',
    past: [],
    future: [],
    gestureStart: null,
    notice: '',
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('current geometry follows real canvas zoom', () => {
  it('changes only the camera at 15/50/100/200/400%, with identical visible geometry, document and exports', () => {
    render(<Canvas />);
    const doc = state().document;
    const before = serializeDocument(doc);
    const visible = visibleGeometry();
    const exports = [exportSVG(doc), exportTikz(doc), exportObsidian(doc)];
    for (const zoom of zooms) {
      zoomTo(zoom);
      expect(visibleGeometry()).toBe(visible);
      expect(serializeDocument(state().document)).toBe(before);
      expect(state().document).toBe(doc);
      expect(state().past).toEqual([]);
      expect([
        exportSVG(state().document),
        exportTikz(state().document),
        exportObsidian(state().document),
      ]).toEqual(exports);
      for (const current of doc.objects.filter((o) => o.kind === 'electrical')) {
        const g = electricalDrawingGeometry(current, doc);
        const group = canvas().querySelector(`[data-electrical][data-object="${current.id}"]`)!;
        expect(group.querySelector('g[stroke]')?.getAttribute('stroke-width')).toBe(
          String(current.width),
        );
        const label = canvas().querySelector(`[data-layer="labels"] [data-label="${current.id}"]`)!;
        const fontSize =
          label.querySelector<HTMLElement>('.math-label-content')?.style.fontSize ??
          label.getAttribute('font-size');
        expect(parseFloat(fontSize!)).toBe(current.label.fontSize);
        expect(g.labelFontSize).toBe(22); // same document font size as R_1
      }
    }
  });

  it.each(['i', 'i_2'])(
    'keeps %s inline editing aligned with the visible label at every zoom',
    (label) => {
      render(<Canvas />);
      for (const zoom of zooms) {
        zoomTo(zoom);
        const current = state().document.objects.find((o) => o.id === `current-${label}`)!;
        if (current.kind !== 'electrical') throw new Error('Current missing');
        const g = electricalDrawingGeometry(current, state().document);
        fireEvent.doubleClick(canvas().querySelector(`[data-label="${current.id}"]`)!);
        const input = screen.getByLabelText('Modifica testo sul foglio');
        expect(parseFloat(input.style.fontSize)).toBeCloseTo(g.labelFontSize);
        expect(
          Number(input.closest('form')!.style.transform.match(/scale\(([^)]+)/)![1]),
        ).toBeCloseTo(zoom);
        const transform = canvas()
          .querySelector(':scope > g')!
          .getAttribute('transform')!
          .match(/-?\d+(?:\.\d+)?/g)!
          .map(Number);
        const form = input.closest('form')!;
        expect(parseFloat(form.style.left)).toBeCloseTo(g.labelPoint.x * zoom + transform[0]);
        expect(parseFloat(form.style.top)).toBeCloseTo(g.labelPoint.y * zoom + transform[1]);
        fireEvent.keyDown(input, { key: 'Escape' });
      }
    },
  );

  it('preserves edits, attachment, undo/redo and reload after zooming through both extremes', () => {
    render(<Canvas />);
    zoomTo(0.15);
    zoomTo(4);
    const before = state().document;
    act(() => {
      for (const id of ['current-i', 'current-i_2'])
        state().update(id, (o) =>
          o.kind === 'electrical'
            ? {
                ...o,
                reversed: true,
                color: '#269978',
                label: { ...o.label, text: `${o.label.text}_x`, offset: { x: 9, y: -7 } },
              }
            : o,
        );
      state().commit(moveSelection(state().document, ['wire-top', 'top-1'], { x: 40, y: 20 }));
      state().update('top-1', (o) =>
        o.kind === 'wire'
          ? {
              ...o,
              vertices: [
                { x: 40, y: -100 },
                { x: 60, y: -100 },
              ],
            }
          : o,
      );
    });
    const edited = state().document;
    const geometry = edited.objects
      .filter((o) => o.kind === 'electrical')
      .map((o) => electricalDrawingGeometry(o, edited));
    for (const zoom of zooms) {
      zoomTo(zoom);
      expect(state().document).toBe(edited);
    }
    const steps = state().past.length;
    act(() => {
      for (let i = 0; i < steps; i++) state().undo();
    });
    expect(state().document).toEqual(before);
    act(() => {
      for (let i = 0; i < steps; i++) state().redo();
    });
    expect(state().document).toEqual(edited);
    const reloaded = deserializeDocument(serializeDocument(edited));
    expect(
      reloaded.objects
        .filter((o) => o.kind === 'electrical')
        .map((o) => electricalDrawingGeometry(o, reloaded)),
    ).toEqual(geometry);
    cleanup();
    useEditorStore.setState({ document: reloaded });
    render(<Canvas />);
    expect(serializeDocument(state().document)).toBe(serializeDocument(edited));
  });
});
