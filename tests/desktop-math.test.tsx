// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MathText } from '../src/circuit/annotations/MathText';

vi.mock('../src/math/vectorLayout', () => ({
  vectorMathLayout: () => ({
    svg: '<text x="-12" y="3">R</text><text x="2" y="8">1</text>',
    alignWidth: 30,
    bounds: { x: -15, y: -12, width: 30, height: 24 },
  }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('keeps native math, its hit area and source under the same SVG position and rotation', () => {
  Object.defineProperty(window, '__TAURI_INTERNALS__', { configurable: true, value: {} });
  const { container, rerender } = render(
    <svg>
      <MathText
        text="R_1"
        x={140}
        y={80}
        rotation={90}
        align="start"
        color="#2463cb"
        labelId="r1"
        selected
      />
    </svg>,
  );
  const label = container.querySelector('[data-label="r1"]')!;
  expect(label.getAttribute('transform')).toBe('translate(140 80) rotate(90)');
  expect(label.getAttribute('data-source')).toBe('R_1');
  expect(label.getAttribute('data-active-label')).toBe('true');
  expect(label.querySelector('foreignObject')).toBeNull();
  expect(label.querySelector('rect')?.getAttribute('width')).toBe('30');
  expect(label.querySelector('g')?.getAttribute('transform')).toBe('translate(15 0)');
  rerender(
    <svg>
      <MathText text="R_1" x={240} y={180} align="end" color="#2463cb" labelId="r1" />
    </svg>,
  );
  expect(label.querySelector('g')?.getAttribute('transform')).toBe('translate(-15 0)');
  delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
});
