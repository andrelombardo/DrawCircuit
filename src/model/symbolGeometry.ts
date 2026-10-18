/** Shared, code-native geometry: SVG previews/canvas and exact pure-TikZ fallbacks. */
export type SymbolShape = (
  | { kind: 'path'; d: string; fill?: 'white'; dashed?: boolean }
  | { kind: 'circle'; x: number; y: number; r: number; fill?: 'white' | 'currentColor' }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; fill?: 'white' }
  | { kind: 'text'; x: number; y: number; text: string; size: number; body?: boolean }
) & { measurement?: false | { segments: [number, number][] } };
export const path = (d: string, fill?: 'white', dashed?: boolean): SymbolShape => ({
  kind: 'path',
  d,
  fill,
  dashed,
});
export const circle = (x = 0, y = 0, r = 20, fill: 'white' | 'currentColor' = 'white'): SymbolShape => ({
  kind: 'circle',
  x,
  y,
  r,
  fill,
});
export const rect = (x: number, y: number, width: number, height: number): SymbolShape => ({
  kind: 'rect',
  x,
  y,
  width,
  height,
  fill: 'white',
});
export const text = (value: string, x = 0, y = 1, size = 20, body = false): SymbolShape => ({
  kind: 'text',
  x,
  y,
  text: value,
  size,
  body,
});
export const head = (x: number, y: number, angle = 0): SymbolShape => {
  const r = (angle * Math.PI) / 180;
  const p = (dx: number, dy: number) =>
    `${x + dx * Math.cos(r) - dy * Math.sin(r)} ${y + dx * Math.sin(r) + dy * Math.cos(r)}`;
  return path(`M${p(-5, -3)}L${x} ${y} ${p(-5, 3)}`);
};
// Authored paths render/export unchanged. Body metadata selects drawable segment
// ranges, keeping leads and auxiliary marks outside measurement geometry.
export const leadPath = (d: string): SymbolShape => ({ ...path(d), measurement: false });
export const bodyPath = (d: string, ...segments: [number, number][]): SymbolShape => ({
  ...path(d),
  measurement: { segments },
});
export const auxiliary = (shapes: SymbolShape[]): SymbolShape[] =>
  shapes.map((shape) => ({ ...shape, measurement: false }));
export const leads = leadPath('M-40 0H-20 M20 0H40');
export const resistor = [leads, rect(-20, -9, 40, 18)];
export const americanResistor = [
  bodyPath('M-40 0H-24L-20-9-12 9-4-9 4 9 12-9 20 9 24 0H40', [1, 7]),
];
export const capacitor = [bodyPath('M-40 0H-6M6 0H40M-6-17V17M6-17V17', [2, 3])];
export const polarizedCapacitor = [
  bodyPath('M-40 0H-6M9 0H40M-6-17V17M9-17Q2 0 9 17M-19-14H-11M-15-18V-10', [2, 3]),
];
export const inductor = [
  bodyPath(
    'M-40 0H-24 C-24-18-12-18-12 0 C-12-18 0-18 0 0 C0-18 12-18 12 0 C12-18 24-18 24 0 H40',
    [1, 4],
  ),
];
export const variable = auxiliary([path('M-21 22L23-23'), head(23, -23, -46)]);
export const current = [path('M-12 0H12'), head(12, 0)];
// Perpendicular to the terminal axis: horizontal when the source is vertical.
export const currentBar = [path('M0-10V10')];
export const voltage = [path('M-11-5V5M-16 0H-6M7 0H15')];
export const source = (inside: SymbolShape[] = [], dependent = false) => [
  leads,
  dependent ? path('M-22 0L0-22 22 0 0 22Z', 'white') : circle(),
  ...inside,
];
export const directedSource = (inside: SymbolShape[], dependent = false) => [
  ...source(inside, dependent),
  ...auxiliary([circle(-28, -18, 3, 'currentColor')]),
];
export const sine = [path('M-14 0C-10-15-4-15 0 0C4 15 10 15 14 0')];
export const diodeBody = path('M-14-14L12 0-14 14Z', 'white');
export const diodeLeads = leadPath('M-40 0H-14M12 0H40');
export const diode = [diodeBody, diodeLeads, path('M12-14V14')];
export const lightRays = (incoming = false) =>
  auxiliary([
    path('M1-21L13-33M11-17L23-29'),
    head(incoming ? 1 : 13, incoming ? -21 : -33, incoming ? 135 : -45),
    head(incoming ? 11 : 23, incoming ? -17 : -29, incoming ? 135 : -45),
  ]);
export const switchShape = (closed = false, push = false, y = 0): SymbolShape[] => [
  bodyPath(`M-40 ${y}H-17M17 ${y}H40M-15 ${y}L13 ${y + (closed ? 0 : -19)}`, [2, 2]),
  circle(-16, y, 2.5),
  circle(16, y, 2.5),
  ...(push ? [path(`M0 ${y - 28}V${y - 10}M-8 ${y - 28}H8`)] : []),
];
export const earthGround = [bodyPath('M0-40V0M-19 0H19M-12 7H12M-5 14H5', [1, 3])];
export const signalGround = [
  {
    ...path('M0-40V0M-17 0L0 18 17 0Z', 'white'),
    measurement: { segments: [[1, 3]] },
  } as SymbolShape,
];
export const chassisGround = [
  bodyPath('M0-40V0M-20 0H20M-16 0L-25 12M0 0L-9 12M16 0L7 12', [1, 4]),
];
export const transformerCoils =
  'M-40-40H-20V-24 C-2-24-2-12-20-12 C-2-12-2 0-20 0 C-2 0-2 12-20 12 C-2 12-2 24-20 24 V40H-40 M40-40H20V-24 C2-24 2-12 20-12 C2-12 2 0 20 0 C2 0 2 12 20 12 C2 12 2 24 20 24 V40H40';
export const transformerWinding = bodyPath(transformerCoils, [2, 5], [10, 13]);
export const transformer = [transformerWinding, path('M-3-25V25M3-25V25')];
export const bjt = (pnp = false): SymbolShape[] => [
  bodyPath('M-40 0H-12M-12-18V18M-12-10L20-30V-40M-12 10L20 30V40', [1, 2], [4, 4]),
  head(pnp ? 0 : 17, pnp ? 17.5 : 28.1, pnp ? -148 : 32),
];
export const fet = (p = false, jfet = false): SymbolShape[] => [
  bodyPath(`M-40 0H${jfet ? -6 : -16}M-6-20V20M-6-14H20V-40M-6 14H20V40`, [1, 2], [4, 4]),
  ...(jfet
    ? [head(p ? -18 : -7, 0, p ? 180 : 0)]
    : [
        path('M-16-18V18'),
        path('M-6 0H9'),
        head(p ? 8 : -5, 0, p ? 0 : 180),
        ...(p ? [circle(-22, 0, 3)] : []),
      ]),
];
export const spdt = (y = 0, spacing = 20): SymbolShape[] => [
  bodyPath(
    `M-40 ${y}H-17M17 ${y - spacing}H40M17 ${y + spacing}H40M-15 ${y}L14 ${y - spacing}`,
    [3, 3],
  ),
  circle(-16, y, 2.5),
  circle(16, y - spacing, 2.5),
  circle(16, y + spacing, 2.5),
];
export const analog = (comparator = false): SymbolShape[] => [
  leadPath('M-40-20H-24M-40 20H-24M24 0H40'),
  path('M-24-32L24 0-24 32Z', 'white'),
  text('−', -16, -18, 14),
  text('+', -16, 18, 14),
  ...(comparator ? [text('>', 0, 0, 15)] : []),
];
export const gate = (family: 'and' | 'or' | 'xor' | 'buffer', inverted = false): SymbolShape[] => {
  const one = family === 'buffer';
  const shape =
    family === 'and'
      ? 'M-20-28H0C35-28 35 28 0 28H-20Z'
      : one
        ? 'M-20-25L22 0-20 25Z'
        : 'M-24-28Q0-28 24 0Q0 28-24 28Q-8 0-24-28Z';
  return [
    leadPath(
      one ? 'M-40 0H-20' : family === 'and' ? 'M-40-20H-20M-40 20H-20' : 'M-40-20H-18M-40 20H-18',
    ),
    path(shape, 'white'),
    ...(family === 'xor' ? [path('M-30-28Q-14 0-30 28')] : []),
    ...(inverted
      ? [circle(28, 0, 4), leadPath('M32 0H40')]
      : [leadPath(one ? 'M22 0H40' : 'M24 0H40')]),
  ];
};
export const connector = (pins: number): SymbolShape[] => [
  rect(-18, -30, 36, 60),
  ...Array.from({ length: pins }, (_, i) => {
    const y = pins === 2 ? -20 + i * 40 : -20 + i * 20;
    return [leadPath(`M-40 ${y}H-5`), circle(-3, y, 3)];
  }).flat(),
];
export const block = (round = false): SymbolShape[] => [
  leads,
  round ? circle(0, 0, 24) : rect(-24, -20, 48, 40),
  text('=', 0, 0, 13, true),
];

export function symbolText(shape: Extract<SymbolShape, { kind: 'text' }>, bodyText?: string) {
  const value = shape.body ? (bodyText ?? shape.text) : shape.text;
  return {
    value,
    size: shape.body ? Math.min(shape.size, (40 / Math.max(1, value.length)) * 1.7) : shape.size,
  };
}
