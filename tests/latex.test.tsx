// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MathText, LatexPreview } from '../src/circuit/annotations/MathText';
import { normalizeLatex, renderLatex } from '../src/math/latex';
import { createComponent } from '../src/model/catalog';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import { COLORS } from '../src/model/types';
import { exportStandalone, exportTikz, texText, escapeTex } from '../src/tikz/exporter';

const examples = [
  'R_1',
  'r_{AB}',
  'V_{th}',
  'I_{cc}',
  '50 \\ohm',
  '10 k\\ohm',
  '2.2 M\\ohm',
  '10 \\mu F',
  '220 \\mu H',
  '\\frac{R_1 R_2}{R_1 + R_2}',
  '\\sqrt{R_1 R_2}',
  '\\Delta V',
  '\\alpha',
  '\\beta',
  '\\gamma',
  '\\omega',
  '\\Omega',
  '\\mu',
  'R_1 = 50 \\ohm',
  'V_{AB} = 12 V',
  'Z_{eq}',
  'R_{th}',
];
describe('shared genuine LaTeX rendering', () => {
  it.each(examples)('renders %s with KaTeX and retains the source', (source) => {
    const result = renderLatex(source);
    expect(result.kind).toBe('math');
    expect(result.source).toBe(source);
    expect(result.html).toContain('class="katex"');
    expect(result.html).toContain('<math');
    expect(renderToStaticMarkup(<MathText text={source} color={COLORS.blue} />)).toContain(
      '<foreignObject',
    );
    expect(renderToStaticMarkup(<LatexPreview text={source} />)).toContain('class="katex"');
  });
  it('uses actual fraction, radical and subscript math structures', () => {
    expect(renderLatex('\\frac{R_1 R_2}{R_1 + R_2}').html).toContain('<mfrac>');
    expect(renderLatex('\\sqrt{R_1 R_2}').html).toContain('<msqrt>');
    expect(renderLatex('r_{AB}').html).toContain('<msub>');
  });
  it.each(['R_{', 'R__1', '\\frac{R_1}{', '\\unknowncommand'])(
    'keeps invalid source editable: %s',
    (source) => {
      expect(renderLatex(source)).toEqual({ kind: 'invalid', source });
      const markup = renderToStaticMarkup(
        <MathText text={source} color={COLORS.blue} labelId="test" />,
      );
      expect(markup).toContain('data-latex-error="true"');
      expect(markup).toContain('data-label="test"');
      expect(texText(source)).toBe(escapeTex(source));
    },
  );
  it.each(['maglia 1', 'A', '5 mA', '12 V'])('keeps plain text in Comic Relief: %s', (source) => {
    expect(renderLatex(source).kind).toBe('plain');
    expect(renderToStaticMarkup(<MathText text={source} color={COLORS.red} />)).toContain(
      'data-font="Comic Relief"',
    );
  });
  it('normalizes only the complete electrical alias command', () => {
    expect(normalizeLatex('10 k\\ohm + \\Omega + \\alpha')).toBe('10 k\\Omega + \\Omega + \\alpha');
    expect(normalizeLatex('\\ohmega')).toBe('\\ohmega');
  });
  it('does not allow source HTML or trusted link commands to create interactive HTML', () => {
    const markup = renderToStaticMarkup(<LatexPreview text={'<img src=x onerror=alert(1)>_1'} />);
    expect(markup).not.toContain('<img');
    expect(renderLatex('\\href{javascript:alert(1)}{X}').html).not.toContain('href=');
  });
});
describe('single-source component migration', () => {
  it.each([
    ['R_1', '50 \\ohm', 'R_1'],
    ['', '50 \\ohm', '50 \\ohm'],
    ['   ', '50 \\ohm', '50 \\ohm'],
    ['R_{AB}', undefined, 'R_{AB}'],
    [undefined, '50 \\ohm', '50 \\ohm'],
    ['', '', ''],
  ])('migrates label %s and legacy value %s to %s', (label, value, expected) => {
    const component = createComponent('resistor', { x: 80, y: 40 });
    const raw = {
      version: 1,
      title: 'legacy',
      objects: [
        { ...component, label: { ...component.label, text: label, fontFamily: 'Kalam' }, value },
      ],
    };
    const restored = deserializeDocument(JSON.stringify(raw));
    expect(restored.objects[0]).toMatchObject({
      label: { text: expected, offset: component.label.offset },
    });
    expect(restored.objects[0]).not.toHaveProperty('value');
    expect(serializeDocument(restored)).not.toContain('fontFamily');
    expect(serializeDocument(restored)).not.toContain('"value"');
    expect(deserializeDocument(serializeDocument(restored))).toEqual(restored);
  });
  it('accepts legacy shorthand and a missing label without losing geometry', () => {
    const component = createComponent('resistor', { x: 80, y: 40 });
    for (const label of ['R1', undefined]) {
      const raw = {
        version: 1,
        title: 'legacy',
        objects: [{ ...component, label, value: '50 \\ohm' }],
      };
      expect(deserializeDocument(JSON.stringify(raw)).objects[0]).toMatchObject({
        x: 80,
        y: 40,
        terminals: component.terminals,
        label: { text: label ?? '50 \\ohm' },
      });
    }
  });
  it('removes legacy font metadata from junctions and annotations', () => {
    const raw = {
      version: 1,
      title: 'legacy',
      objects: [
        {
          kind: 'junction',
          id: 'j',
          x: 0,
          y: 0,
          color: COLORS.ink,
          label: {
            text: 'A',
            offset: { x: 0, y: -24 },
            fontSize: 22,
            rotation: 0,
            color: COLORS.red,
            fontFamily: 'Inter',
          },
        },
        {
          kind: 'text',
          id: 't',
          x: 0,
          y: 0,
          text: 'maglia 1',
          fontSize: 22,
          rotation: 0,
          align: 'start',
          color: COLORS.blue,
          fontFamily: 'Default',
        },
      ],
    };
    expect(serializeDocument(deserializeDocument(JSON.stringify(raw)))).not.toContain('fontFamily');
  });
});
describe('genuine LaTeX export', () => {
  it.each(examples)('preserves valid TeX and normalizes only aliases: %s', (source) => {
    expect(texText(source)).toBe(`$${normalizeLatex(source)}$`);
  });
  it('shares component, node and annotation export without a second value', () => {
    const resistor = createComponent('resistor', { x: 0, y: 0 });
    resistor.label.text = 'R_1 = 50 \\ohm';
    const doc = { version: 1 as const, title: 'math', objects: [resistor] };
    const code = exportTikz(doc);
    expect(code).toContain('$R_1 = 50 \\Omega$');
    expect(code).not.toContain('\\ohm');
    expect(exportStandalone(doc)).toContain('\\usepackage{circuitikz}');
    expect(serializeDocument(doc)).toContain('R_1 = 50 \\\\ohm');
  });
});
