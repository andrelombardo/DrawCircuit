// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PropertySelect } from '../src/components/properties/PropertyControls';

const renderSelect = (value: string | number | undefined) => {
  const onChange = vi.fn();
  render(
    <PropertySelect label="Stile linea" value={value} onChange={onChange}>
      <option value="solid">Continua</option>
      <option value="dashed">Tratteggiata</option>
      <option value="dotted">Puntinata</option>
    </PropertySelect>,
  );
  return onChange;
};
const trigger = () => screen.getByRole('button', { name: 'Stile linea' });
const option = (name: string) => screen.getByRole('menuitemradio', { name });

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('shared property choice menus', () => {
  it('exposes the current choice and commits only a different option, then restores focus', () => {
    const onChange = renderSelect('dashed');
    expect(trigger().textContent).toBe('Tratteggiata');
    expect(trigger().getAttribute('aria-description')).toBe('Tratteggiata');
    expect(trigger().getAttribute('aria-pressed')).toBeNull();
    expect(document.querySelector('select')).toBeNull();
    fireEvent.click(trigger());
    expect(screen.getByRole('menu', { name: 'Stile linea' }).parentElement?.parentElement).toBe(
      document.body,
    );
    expect(option('Tratteggiata').getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(option('Tratteggiata'));
    fireEvent.click(option('Tratteggiata'));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(trigger());
    fireEvent.click(option('Puntinata'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('dotted');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('navigates by arrows and typeahead without leaking drawing shortcuts', () => {
    const onChange = renderSelect('dashed');
    const canvasShortcut = vi.fn();
    window.addEventListener('keydown', canvasShortcut);
    try {
      fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
      expect(document.activeElement).toBe(option('Tratteggiata'));
      fireEvent.keyDown(document.activeElement!, { key: 'p' });
      expect(document.activeElement).toBe(option('Puntinata'));
      fireEvent.keyDown(document.activeElement!, { key: 'Home' });
      expect(document.activeElement).toBe(option('Continua'));
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
      expect(document.activeElement).toBe(option('Puntinata'));
      fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
      expect(onChange).toHaveBeenCalledExactlyOnceWith('dotted');
      expect(canvasShortcut).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('keydown', canvasShortcut);
    }
  });

  it('keeps mixed values until an explicit choice is made', () => {
    const onChange = renderSelect(undefined);
    expect(trigger().textContent).toBe('Valori misti');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(trigger());
    for (const item of within(screen.getByRole('menu')).getAllByRole('menuitemradio'))
      expect(item.getAttribute('aria-checked')).toBe('false');
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(trigger());
    fireEvent.click(option('Continua'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('solid');
  });

  it('dismisses with Escape, Tab and outside pointer without committing', () => {
    const onChange = renderSelect('dashed');
    for (const key of ['Escape', 'Tab']) {
      fireEvent.click(trigger());
      fireEvent.keyDown(document.activeElement!, { key });
      expect(screen.queryByRole('menu')).toBeNull();
      expect(document.activeElement).toBe(trigger());
    }
    fireEvent.click(trigger());
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('treats zero as a selected value and skips disabled choices', () => {
    const onChange = vi.fn();
    render(
      <PropertySelect label="Rotazione" value={0} onChange={onChange}>
        <option value={0}>0°</option>
        <option value={45} disabled>
          45°
        </option>
        <option value={90}>90°</option>
      </PropertySelect>,
    );
    fireEvent.click(screen.getByLabelText('Rotazione'));
    expect(option('0°').getAttribute('aria-checked')).toBe('true');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(option('90°'));
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledExactlyOnceWith('90');
  });
});
