// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { DrawingToolbar } from '../src/components/toolbar/Toolbar';
import { actionMenuPosition } from '../src/components/toolbar/actionMenuPosition';
import { useEditorStore } from '../src/store/editorStore';
import { emptyDocument } from '../src/model/demo';

const pencil = () => screen.getByRole('button', { name: 'Disegno e annotazioni' });
const item = (name: string) => screen.getByRole('menuitem', { name });
const renderToolbar = () =>
  render(
    <div className="editor">
      <DrawingToolbar />
    </div>,
  );

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  useEditorStore.setState({
    document: emptyDocument(),
    selection: [],
    tool: 'select',
    past: [],
    future: [],
    gestureStart: null,
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('compact pencil drawing menu', () => {
  it('has only the requested toolbar actions and exposes the drawing tools in grouped vertical order', () => {
    renderToolbar();
    const toolbar = screen.getByRole('toolbar', { name: 'Strumenti di disegno' });
    expect(
      within(toolbar)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual([
      'Sposta toolbar',
      'Selezione (V)',
      'Testo',
      'Disegno e annotazioni',
      'Annulla (⌘/Ctrl Z)',
      'Ripeti (⌘/Ctrl Shift Z)',
      'Sposta vista (H o Space)',
      'Esporta',
    ]);
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(pencil());
    const menu = screen.getByRole('menu', { name: 'Disegno e annotazioni' });
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((button) => button.textContent),
    ).toEqual([
      'Filo',
      'Nodo',
      'Freccia',
      'Maglia',
      'Graffa / Staffa',
      'Polarità + / -',
      'Tensione tra due punti',
      'Corrente sul filo',
    ]);
    expect(within(menu).getAllByRole('separator')).toHaveLength(2);
    for (const button of within(menu).getAllByRole('menuitem'))
      expect(button.querySelector('.action-menu-icon svg')).toBeTruthy();
    expect(item('Freccia').querySelector('svg')?.classList.contains('lucide-arrow-right')).toBe(
      true,
    );
    expect(item('Maglia').querySelector('path')?.getAttribute('d')).toContain('H8');
  });

  it('activates integrated current in one click and accents the active tool', () => {
    renderToolbar();
    fireEvent.click(pencil());
    fireEvent.click(item('Corrente sul filo'));
    expect(useEditorStore.getState().tool).toBe('current');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(pencil().getAttribute('aria-pressed')).toBe('true');
  });

  it('navigates keyboard levels, wraps items, returns with Left/Escape and restores trigger focus', () => {
    useEditorStore.setState({ selection: ['selected-wire'] });
    renderToolbar();
    fireEvent.keyDown(pencil(), { key: 'ArrowDown' });
    for (let i = 0; i < 4; i++) fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(item('Graffa'));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(item('Staffa'));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(screen.queryByRole('menuitem', { name: 'Graffa' })).toBeNull();
    expect(document.activeElement).toBe(item('Graffa / Staffa'));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('menuitem', { name: 'Graffa' })).toBeNull();
    expect(document.activeElement).toBe(item('Graffa / Staffa'));
    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(document.activeElement).toBe(item('Filo'));
    fireEvent.keyDown(document.activeElement!, { key: 'n' });
    expect(document.activeElement).toBe(item('Nodo'));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(pencil());
    expect(useEditorStore.getState().selection).toEqual(['selected-wire']);
  });

  it('executes a keyboard choice and clears the drawing accent on Escape from the root menu', () => {
    renderToolbar();
    fireEvent.keyDown(pencil(), { key: 'ArrowDown' });
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(useEditorStore.getState().tool).toBe('wire');
    expect(pencil().getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(pencil());
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(useEditorStore.getState().tool).toBe('select');
    expect(pencil().getAttribute('aria-pressed')).toBe('false');
  });

  it('keeps the brace submenu open while the pointer traverses its gap and closes on outside click', () => {
    vi.useFakeTimers();
    renderToolbar();
    fireEvent.click(pencil());
    fireEvent.pointerEnter(item('Graffa / Staffa'));
    act(() => vi.advanceTimersByTime(110));
    const child = screen.getByRole('menu', { name: 'Graffa / Staffa' });
    fireEvent.pointerLeave(screen.getByRole('menu', { name: 'Disegno e annotazioni' }));
    act(() => vi.advanceTimersByTime(200));
    fireEvent.pointerEnter(child);
    act(() => vi.advanceTimersByTime(1000));
    expect(item('Graffa')).toBeTruthy();
    fireEvent.pointerDown(item('Staffa'));
    expect(item('Graffa')).toBeTruthy();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('dismisses with Tab and prevents menu keys from reaching drawing shortcuts', () => {
    renderToolbar();
    const shortcut = vi.fn();
    window.addEventListener('keydown', shortcut);
    fireEvent.click(pencil());
    fireEvent.keyDown(item('Filo'), { key: 'w' });
    expect(shortcut).not.toHaveBeenCalled();
    fireEvent.keyDown(item('Filo'), { key: 'Tab' });
    expect(screen.queryByRole('menu')).toBeNull();
    window.removeEventListener('keydown', shortcut);
  });
});

describe('viewport collision geometry', () => {
  it('opens a bottom toolbar menu above its trigger and clamps its right edge', () => {
    expect(
      actionMenuPosition(
        { left: 880, right: 912, top: 650, bottom: 680 },
        { width: 244, height: 300 },
        { width: 1000, height: 700 },
      ),
    ).toEqual({ left: 748, top: 344, side: 'above' });
  });
  it('flips nested menus to the left and clamps their vertical position', () => {
    expect(
      actionMenuPosition(
        { left: 940, right: 972, top: 670, bottom: 690 },
        { width: 158, height: 80 },
        { width: 1000, height: 700 },
        true,
      ),
    ).toEqual({ left: 776, top: 612, side: 'left' });
  });
  it('chooses the available right side and stays within very small viewports', () => {
    expect(
      actionMenuPosition(
        { left: 5, right: 40, top: 10, bottom: 30 },
        { width: 100, height: 80 },
        { width: 200, height: 110 },
        true,
      ),
    ).toEqual({ left: 46, top: 8, side: 'right' });
  });
});
