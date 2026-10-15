import { createComponent } from '../../src/model/catalog';
import baselineComplex from './evidence/before/complex.json';
import {
  createTextAnnotation,
  createRectangle,
  createLine,
  createWire,
} from '../../src/model/factories';
import {
  componentTypes,
  ROTATIONS,
  type CircuitDocument,
  type CircuitObject,
} from '../../src/model/types';

const documentOf = (title: string, objects: CircuitObject[]): CircuitDocument => ({
  version: 1,
  title,
  objects: objects.map((o, i) => ({ ...o, id: `object-${i}` })),
});
export const repeated = (count: number, mixed = true): CircuitDocument =>
  documentOf(
    `${count} componenti`,
    Array.from({ length: count }, (_, i) => {
      const c = createComponent(
        mixed
          ? (['resistor', 'capacitor', 'inductor', 'voltageSource', 'diode'] as const)[i % 5]
          : 'resistor',
        {
          x: (i % 10) * 150,
          y: Math.floor(i / 10) * 120,
        },
      );
      c.label.text = `R_${i + 1}`;
      return c;
    }),
  );
const textDocument = (title: string, sources: string[]) =>
  documentOf(
    title,
    sources.map((s, i) => ({
      ...createTextAnnotation({ x: (i % 2) * 580, y: Math.floor(i / 2) * 110 }, s),
      fontSize: 24,
      align: 'middle' as const,
    })),
  );
export function fixtures(): Record<string, CircuitDocument> {
  const complex = structuredClone(baselineComplex) as CircuitDocument;
  const unicode = textDocument('Unicode', [
    'Rete elettrica: più capacità, già è così — 50 Ω',
    'ÀÁÂÃÄÅ ÆÇÈÉÊË ÌÍÎÏ ÐÑÒÓÔÕÖ ØÙÚÛÜ ÝÞß',
    'àáâãäå æçèéêë ìíîï ðñòóôõö øùúûü ýþÿ',
    'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ αβγδεζηθικλμνξοπρστυφχψω',
    'Кириллица: АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
    'āăąćĉċčďđēĕėęěĝğġģĥħĩīĭįİı Őő Űű Șș Țț',
    'Decomposti: e\u0301 a\u0308 A\u030a i\u0301; ﬁ ﬂ; العربية 日本語 中文',
    '\\mathbf{ÀÉΩЖ}_{123}+\\text{caffè più}',
  ]);
  const formulas = textDocument('Formule', [
    '\\frac{R_1 R_2}{R_1+R_2}=\\sqrt{L/C}',
    '\\mathbf{V}_{out}=\\sum_{k=1}^{10}\\frac{a_k}{1+s\\tau_k}',
    '\\int_0^{\\infty} e^{-st} f(t)\\,dt',
    '\\begin{pmatrix}R_1 & -R_2\\\\-R_2 & R_3\\end{pmatrix}',
    '\\overline{V}_{AB}^{\\prime\\prime}=\\hat{I} Z',
    '\\left(\\frac{a+b}{c+d}\\right)^2+\\sqrt[3]{x^2+1}',
    '\\color{red}{R_1}+\\color{blue}{R_2}=\\text{totale}',
    '\\underbrace{R_1+R_2+R_3}_{R_{eq}}',
    '\\mathbb{R}\\ni x\\quad\\therefore x\\geq 0',
    '\\frac{d^2v}{dt^2}+2\\zeta\\omega_0\\frac{dv}{dt}+\\omega_0^2v=0',
    "V''+I^{\\prime}=\\textbf{Ingresso}",
    '\\begin{cases}x^2&x>0\\\\-x&x\\leq0\\end{cases}',
  ]);
  const catalog = documentOf(
    'Catalogo 72 × 8',
    componentTypes.flatMap((type, i) =>
      ROTATIONS.map((rotation, j) => {
        const c = createComponent(type, { x: j * 160, y: i * 130 });
        return { ...c, rotation, label: { ...c.label, text: j === 0 ? type : '' } };
      }),
    ),
  );
  const compositing = documentOf(
    'Compositing',
    [0, 1, 2, 3].flatMap((i) => [
      { ...createComponent('resistor', { x: 45 * i, y: 0 }), opacity: i ? 0.35 : 1 },
      {
        ...createRectangle({ x: i * 30 - 90, y: 20 }, { x: i * 30 + 20, y: 100 }),
        fill: '#f05533',
        fillOpacity: 0.35,
        opacity: 0.7,
        lineStyle: 'dashed' as const,
      },
      { ...createLine({ x: 0, y: i * 10 }, { x: 200, y: i * 10 }), opacity: 0.3, width: 12 },
      {
        ...createTextAnnotation({ x: i * 10, y: 150 }, '\\mathbf{R}_1'),
        rotation: ROTATIONS[i + 1],
        opacity: 0.45,
      },
    ]),
  );
  const crossings = documentOf(
    'Fili e incroci',
    [0.35, 1].flatMap((opacity, i) => [
      {
        ...createWire(
          { kind: 'free', point: { x: -50, y: i * 200 } },
          { kind: 'free', point: { x: 150, y: i * 200 } },
        ),
        opacity,
        lineStyle: 'dashed' as const,
      },
      {
        ...createWire(
          { kind: 'free', point: { x: 50, y: i * 200 - 80 } },
          { kind: 'free', point: { x: 50, y: i * 200 + 80 } },
        ),
        opacity,
        width: 4,
      },
    ]),
  );
  const long = textDocument('Buffer e sicurezza', [
    'A^{' + '\\prime'.repeat(60) + '}',
    'Testo: %#{}\\$& <xml> "citazione" _ ^ ~',
    'prima\n\nterza',
  ]);
  long.objects.forEach((o) => {
    if (o.kind === 'text') o.rotation = 270;
  });
  const annotations = documentOf('Annotazioni, riflessioni e Unicode supplementare', [
    ...(['current', 'polarity', 'voltage'] as const).map((mode, i): CircuitObject => ({
      kind: 'electrical',
      id: mode,
      mode,
      start: { x: i * 180, y: 0 },
      end: { x: i * 180 + 100, y: 0 },
      ratio: 0.5,
      offset: { x: 0, y: 30 },
      reversed: i !== 0,
      color: '#3478ad',
      width: 3,
      opacity: 0.65,
      label: {
        text: `I_${i}`,
        offset: { x: 0, y: 0 },
        fontSize: 23,
        rotation: ROTATIONS[i],
        color: '#ba3a42',
      },
    })),
    {
      kind: 'brace',
      id: 'bracket',
      type: 'bracket',
      start: { x: 0, y: 90 },
      end: { x: 380, y: 90 },
      side: -1,
      color: '#269978',
      width: 3,
      opacity: 0.55,
      label: {
        text: '\\frac{1}{2}',
        offset: { x: 0, y: 0 },
        fontSize: 22,
        rotation: 0,
        color: '#269978',
      },
    },
    {
      kind: 'arrow',
      id: 'mirrored',
      type: 'arc',
      start: { x: 0, y: 200 },
      end: { x: 100, y: 200 },
      arcRotation: 45,
      arcMirrored: true,
      controlPoints: [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ],
      reversed: true,
      color: '#df4949',
      width: 2,
      opacity: 0.5,
    },
    {
      ...createTextAnnotation({ x: 180, y: 180 }, '日本語 العربية 🙂 𝔸 e\u0301'),
      rotation: 315,
      opacity: 0.8,
    },
    {
      ...createTextAnnotation({ x: 180, y: 260 }, ' '.repeat(3) + 'testo con spazi '.repeat(70)),
      fontSize: 18,
    },
  ]);
  return {
    resistor: repeated(1, false),
    five: repeated(5),
    twenty: repeated(20),
    hundred: repeated(100),
    formulas,
    unicode,
    complex,
    catalog,
    compositing,
    crossings,
    long,
    annotations,
    repeated: repeated(400, false),
    empty: documentOf('Vuoto', []),
  };
}

export const benchmarkNames = [
  'resistor',
  'five',
  'twenty',
  'hundred',
  'formulas',
  'unicode',
  'complex',
];
