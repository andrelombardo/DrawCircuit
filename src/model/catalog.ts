import { searchText } from '../i18n';
import { COLORS } from './types';
import type { CircuitComponent, ComponentType, Point, Terminal } from './types';
import * as g from './symbolGeometry';
import { symbolMeasurementBounds } from './symbolBounds';
export const categories = [
  'Passive components',
  'Sources',
  'Diodes',
  'Transistors',
  'Switches',
  'Measurement',
  'References',
  'Transformers',
  'Analog',
  'Digital',
  'Utilities',
  'Blocks',
] as const;
export type Category = (typeof categories)[number];
export interface ComponentDefinition {
  type: ComponentType;
  name: string;
  shortName: string;
  group: Category;
  prefix: string;
  searchTerms: string[];
  terminals: Terminal[];
  shapes: g.SymbolShape[];
  bounds: { x: number; y: number; width: number; height: number };
  /** Unpadded body geometry, derived once from the rendered shapes without leads. */
  measurementBounds: { x: number; y: number; width: number; height: number };
  labelOffset: Point;
  internalText?: string;
}
const terminal = (id: string, x: number, y: number, direction: 'x' | 'y' = 'x'): Terminal => ({
  id,
  name: id,
  localX: x,
  localY: y,
  direction,
});
// Existing IDs and positions are retained, including the old transformer and wiper.
const two = [terminal('a', -40, 0), terminal('b', 40, 0)];
const reference = [terminal('a', 0, -40, 'y')];
const transformerTerminals = [
  terminal('a', -40, -40),
  terminal('b', -40, 40),
  terminal('c', 40, -40),
  terminal('d', 40, 40),
];
const transistorTerminals = (control: string, upper: string, lower: string) => [
  terminal(control, -40, 0),
  terminal(upper, 20, -40, 'y'),
  terminal(lower, 20, 40, 'y'),
];
const analogTerminals = [
  terminal('inverting', -40, -20),
  terminal('nonInverting', -40, 20),
  terminal('output', 40, 0),
];
const gateTerminals = [
  terminal('input1', -40, -20),
  terminal('input2', -40, 20),
  terminal('output', 40, 0),
];
const unaryTerminals = [terminal('input', -40, 0), terminal('output', 40, 0)];
const def = (
  type: ComponentType,
  name: string,
  group: Category,
  prefix: string,
  shapes: g.SymbolShape[],
  aliases: string[],
  terminals = two,
  internalText?: string,
): ComponentDefinition => {
  const xs = terminals.map((t) => t.localX),
    ys = terminals.map((t) => t.localY);
  const x = Math.min(-46, ...xs.map((x) => x - 6)),
    y = Math.min(-34, ...ys.map((y) => y - 6));
  const right = Math.max(46, ...xs.map((x) => x + 6)),
    bottom = Math.max(34, ...ys.map((y) => y + 6));
  return {
    type,
    name,
    shortName: name,
    group,
    prefix,
    shapes,
    searchTerms: [type, ...aliases],
    terminals,
    bounds: { x, y, width: right - x, height: bottom - y },
    measurementBounds: symbolMeasurementBounds(shapes),
    // Use the rendered silhouette, including leads and auxiliary marks, rather
    // than the padded hit area. Leave room for half of the 22px label plus a gap.
    labelOffset: {
      x: 0,
      y:
        symbolMeasurementBounds(shapes.map((shape) => ({ ...shape, measurement: undefined }))).y -
        19,
    },
    ...(internalText !== undefined ? { internalText } : {}),
  };
};
/** Authoritative registry: metadata, SVG geometry and semantic pins. */
export const componentRegistry: Record<ComponentType, ComponentDefinition> = {
  resistor: def('resistor', 'Resistor', 'Passive components', 'R', g.resistor, [
    'resistor',
    'resistor',
  ]),
  americanResistor: def(
    'americanResistor',
    'American resistor',
    'Passive components',
    'R',
    g.americanResistor,
    ['american resistor', 'american resistor', 'resistor us', 'zig zag', 'zig-zag', 'usa'],
  ),
  capacitor: def('capacitor', 'Capacitor', 'Passive components', 'C', g.capacitor, [
    'capacitor',
    'capacity',
  ]),
  polarizedCapacitor: def(
    'polarizedCapacitor',
    'Polarized capacitor',
    'Passive components',
    'C',
    g.polarizedCapacitor,
    ['polarized capacitor', 'electrolytic', 'electrolytic'],
  ),
  inductor: def('inductor', 'Inductor', 'Passive components', 'L', g.inductor, [
    'inductor',
    'coil',
    'coil',
  ]),
  variableResistor: def(
    'variableResistor',
    'Variable resistor',
    'Passive components',
    'R',
    [...g.resistor, ...g.variable],
    ['variable resistor', 'rheostat', 'rheostat'],
  ),
  potentiometer: def(
    'potentiometer',
    'Potentiometer',
    'Passive components',
    'P',
    [...g.resistor, g.leadPath('M0-40V-11'), ...g.auxiliary([g.head(0, -11, 90)])],
    ['potentiometer', 'pot'],
    [...two, terminal('w', 0, -40, 'y')],
  ),
  voltageSource: def(
    'voltageSource',
    'DC voltage source',
    'Sources',
    'V',
    g.directedSource(g.voltageBar),
    ['dc voltage source', 'direct voltage'],
  ),
  currentSource: def(
    'currentSource',
    'DC current source',
    'Sources',
    'I',
    g.directedSource(g.currentBar),
    ['dc current source', 'direct current'],
  ),
  battery: def(
    'battery',
    'Multi-cell battery',
    'Sources',
    'E',
    [g.bodyPath('M-40 0H-12M12 0H40M-12-19V19M-4-10V10M4-19V19M12-10V10', [2, 5])],
    ['battery', 'multi-cell battery', 'battery'],
  ),
  dependentVoltage: def(
    'dependentVoltage',
    'Dependent voltage source',
    'Sources',
    'V',
    g.directedSource(g.voltageBar, true),
    ['dependent voltage source', 'controlled voltage'],
  ),
  dependentCurrent: def(
    'dependentCurrent',
    'Dependent current source',
    'Sources',
    'I',
    g.directedSource(g.currentBar, true),
    ['dependent current source', 'controlled current'],
  ),
  diode: def('diode', 'Diode', 'Diodes', 'D', g.diode, ['diode', 'standard diode']),
  led: def(
    'led',
    'LED',
    'Diodes',
    'D',
    [...g.diode, ...g.lightRays()],
    ['light emitting diode', 'light-emitting diode'],
  ),
  zener: def(
    'zener',
    'Zener diode',
    'Diodes',
    'D',
    [g.diodeBody, g.diodeLeads, g.path('M6-18H12V14H18')],
    ['zener diode'],
  ),
  openSwitch: def('openSwitch', 'Open switch', 'Switches', 'S', g.switchShape(), [
    'spst open switch',
  ]),
  closedSwitch: def('closedSwitch', 'Closed switch', 'Switches', 'S', g.switchShape(true), [
    'spst closed switch',
  ]),
  ground: def(
    'ground',
    'Earth ground',
    'References',
    '',
    g.earthGround,
    ['earth ground', 'ground', 'gnd', 'earth'],
    reference,
  ),
  ammeter: def('ammeter', 'Ammeter', 'Measurement', 'A', g.source([g.text('A')]), ['ammeter']),
  voltmeter: def('voltmeter', 'Voltmeter', 'Measurement', 'V', g.source([g.text('V')]), [
    'voltmeter',
  ]),
  transformer: def(
    'transformer',
    'Transformer',
    'Transformers',
    'T',
    g.transformer,
    ['transformer'],
    transformerTerminals,
  ),
  blackBox: def(
    'blackBox',
    'Rectangular block',
    'Blocks',
    'Z',
    g.block(),
    ['generic rectangle block', 'black box', 'generic block'],
    two,
    'BLACK BOX',
  ),
  thermistor: def(
    'thermistor',
    'Thermistor',
    'Passive components',
    'R',
    [...g.resistor, ...g.auxiliary([g.path('M-20 23L20-23H30'), g.text('T', 28, -10, 10)])],
    ['thermistor', 'ntc', 'ptc', 'resistor'],
  ),
  photoresistor: def(
    'photoresistor',
    'Photoresistor / LDR',
    'Passive components',
    'R',
    [...g.resistor, ...g.lightRays(true)],
    ['photoresistor', 'ldr', 'resistor'],
  ),
  variableCapacitor: def(
    'variableCapacitor',
    'Variable capacitor',
    'Passive components',
    'C',
    [...g.capacitor, ...g.variable],
    ['variable capacitor'],
  ),
  variableInductor: def(
    'variableInductor',
    'Variable inductor',
    'Passive components',
    'L',
    [...g.inductor, ...g.variable],
    ['variable inductor'],
  ),
  acVoltageSource: def(
    'acVoltageSource',
    'AC voltage source',
    'Sources',
    'V',
    g.directedSource([...g.sine, g.text('V', 0, 12, 9)]),
    ['ac voltage source', 'alternating voltage'],
  ),
  acCurrentSource: def(
    'acCurrentSource',
    'AC current source',
    'Sources',
    'I',
    g.directedSource([...g.sine, g.text('I', 0, 12, 9)]),
    ['ac current source', 'alternating current'],
  ),
  genericVoltageSource: def(
    'genericVoltageSource',
    'Generic voltage source',
    'Sources',
    'V',
    g.directedSource([g.text('V')]),
    ['generic voltage source'],
  ),
  genericCurrentSource: def(
    'genericCurrentSource',
    'Generic current source',
    'Sources',
    'I',
    g.directedSource([g.text('I')]),
    ['generic current source'],
  ),
  singleCellBattery: def(
    'singleCellBattery',
    'Single-cell battery',
    'Sources',
    'E',
    [g.bodyPath('M-40 0H-4M4 0H40M-4-19V19M4-10V10', [2, 3])],
    ['single cell battery', 'battery', 'battery'],
  ),
  photodiode: def(
    'photodiode',
    'Photodiode',
    'Diodes',
    'D',
    [...g.diode, ...g.lightRays(true)],
    ['photodiode'],
  ),
  schottky: def(
    'schottky',
    'Schottky diode',
    'Diodes',
    'D',
    [g.diodeBody, g.diodeLeads, g.path('M6-10V-16H12V16H18V10')],
    ['schottky diode'],
  ),
  varactor: def(
    'varactor',
    'Varicap diode',
    'Diodes',
    'D',
    [g.diodeBody, g.bodyPath('M-40 0H-14M18 0H40M12-14V14M18-14V14', [2, 3])],
    ['varactor', 'varicap diode'],
  ),
  npn: def(
    'npn',
    'NPN transistor',
    'Transistors',
    'Q',
    g.bjt(),
    ['bjt', 'npn transistor'],
    transistorTerminals('base', 'collector', 'emitter'),
  ),
  pnp: def(
    'pnp',
    'PNP transistor',
    'Transistors',
    'Q',
    g.bjt(true),
    ['bjt', 'pnp transistor'],
    transistorTerminals('base', 'collector', 'emitter'),
  ),
  nmos: def(
    'nmos',
    'NMOS MOSFET',
    'Transistors',
    'Q',
    g.fet(),
    ['nmos', 'mosfet', 'n channel'],
    transistorTerminals('gate', 'drain', 'source'),
  ),
  pmos: def(
    'pmos',
    'PMOS MOSFET',
    'Transistors',
    'Q',
    g.fet(true),
    ['pmos', 'mosfet', 'p channel'],
    transistorTerminals('gate', 'drain', 'source'),
  ),
  njfet: def(
    'njfet',
    'N-channel JFET',
    'Transistors',
    'Q',
    g.fet(false, true),
    ['n channel jfet'],
    transistorTerminals('gate', 'drain', 'source'),
  ),
  pjfet: def(
    'pjfet',
    'P-channel JFET',
    'Transistors',
    'Q',
    g.fet(true, true),
    ['p channel jfet'],
    transistorTerminals('gate', 'drain', 'source'),
  ),
  spdt: def(
    'spdt',
    'SPDT switch',
    'Switches',
    'S',
    g.spdt(),
    ['spdt switch'],
    [terminal('common', -40, 0), terminal('throw1', 40, -20), terminal('throw2', 40, 20)],
  ),
  pushButtonNO: def(
    'pushButtonNO',
    'Normally open push button',
    'Switches',
    'S',
    g.switchShape(false, true),
    ['push button normally open', 'no pushbutton'],
  ),
  pushButtonNC: def(
    'pushButtonNC',
    'Normally closed push button',
    'Switches',
    'S',
    g.switchShape(true, true),
    ['push button normally closed', 'nc pushbutton'],
  ),
  dpst: def(
    'dpst',
    'DPST switch',
    'Switches',
    'S',
    [
      ...g.switchShape(false, false, -20),
      ...g.switchShape(false, false, 20),
      g.path('M0-27V13', undefined, true),
    ],
    ['dpst switch'],
    [
      terminal('common1', -40, -20),
      terminal('output1', 40, -20),
      terminal('common2', -40, 20),
      terminal('output2', 40, 20),
    ],
  ),
  dpdt: def(
    'dpdt',
    'DPDT switch',
    'Switches',
    'S',
    [...g.spdt(-30), ...g.spdt(30), g.path('M0-40V20', undefined, true)],
    ['dpdt switch'],
    [
      terminal('common1', -40, -30),
      terminal('throw1a', 40, -50),
      terminal('throw1b', 40, -10),
      terminal('common2', -40, 30),
      terminal('throw2a', 40, 10),
      terminal('throw2b', 40, 50),
    ],
  ),
  ohmmeter: def('ohmmeter', 'Ohmmeter', 'Measurement', 'Ω', g.source([g.text('Ω')]), [
    'ohmmeter',
    'ohm meter',
  ]),
  galvanometer: def('galvanometer', 'Galvanometer', 'Measurement', 'G', g.source([g.text('G')]), [
    'galvanometer',
  ]),
  signalGround: def(
    'signalGround',
    'Signal ground',
    'References',
    '',
    g.signalGround,
    ['signal ground', 'gnd'],
    reference,
  ),
  chassisGround: def(
    'chassisGround',
    'Chassis ground',
    'References',
    '',
    g.chassisGround,
    ['chassis ground', 'gnd'],
    reference,
  ),
  centerTapTransformer: def(
    'centerTapTransformer',
    'Center-tapped transformer',
    'Transformers',
    'T',
    [...g.transformer, g.leadPath('M20 0H60')],
    ['center tap transformer', 'centertap'],
    [...transformerTerminals, terminal('centerTap', 60, 0)],
  ),
  coupledInductors: def(
    'coupledInductors',
    'Coupled inductors',
    'Transformers',
    'L',
    [g.transformerWinding],
    ['coupled inductors', 'coupled coils'],
    transformerTerminals,
  ),
  opAmp: def(
    'opAmp',
    'Operational amplifier',
    'Analog',
    'U',
    g.analog(),
    ['op amp', 'opamp', 'operational amplifier'],
    analogTerminals,
  ),
  comparator: def(
    'comparator',
    'Comparator',
    'Analog',
    'U',
    g.analog(true),
    ['comparator'],
    analogTerminals,
  ),
  andGate: def(
    'andGate',
    'AND gate',
    'Digital',
    'U',
    g.gate('and'),
    ['and gate', 'logic', 'logic'],
    gateTerminals,
  ),
  orGate: def(
    'orGate',
    'OR gate',
    'Digital',
    'U',
    g.gate('or'),
    ['or gate', 'logic', 'logic'],
    gateTerminals,
  ),
  notGate: def(
    'notGate',
    'NOT gate',
    'Digital',
    'U',
    g.gate('buffer', true),
    ['not gate', 'inverter', 'logic', 'logic'],
    unaryTerminals,
  ),
  nandGate: def(
    'nandGate',
    'NAND gate',
    'Digital',
    'U',
    g.gate('and', true),
    ['nand gate', 'logic', 'logic'],
    gateTerminals,
  ),
  norGate: def(
    'norGate',
    'NOR gate',
    'Digital',
    'U',
    g.gate('or', true),
    ['nor gate', 'logic', 'logic'],
    gateTerminals,
  ),
  xorGate: def(
    'xorGate',
    'XOR gate',
    'Digital',
    'U',
    g.gate('xor'),
    ['xor gate', 'logic', 'logic'],
    gateTerminals,
  ),
  xnorGate: def(
    'xnorGate',
    'XNOR gate',
    'Digital',
    'U',
    g.gate('xor', true),
    ['xnor gate', 'logic', 'logic'],
    gateTerminals,
  ),
  buffer: def(
    'buffer',
    'Buffer',
    'Digital',
    'U',
    g.gate('buffer'),
    ['buffer gate', 'logic', 'logic'],
    unaryTerminals,
  ),
  terminal: def(
    'terminal',
    'Terminal',
    'Utilities',
    '',
    [g.leadPath('M-40 0H-5'), g.circle(0, 0, 5)],
    ['terminal', 'connection'],
    [terminal('a', -40, 0)],
  ),
  testPoint: def(
    'testPoint',
    'Test point',
    'Utilities',
    'TP',
    [g.leadPath('M0 40V5'), g.circle(0, 0, 5)],
    ['test point', 'testpoint'],
    [terminal('a', 0, 40, 'y')],
  ),
  connector2: def(
    'connector2',
    '2-pin connector',
    'Utilities',
    'J',
    g.connector(2),
    ['connector 2 pin', 'connector'],
    [terminal('pin1', -40, -20), terminal('pin2', -40, 20)],
  ),
  connector3: def(
    'connector3',
    '3-pin connector',
    'Utilities',
    'J',
    g.connector(3),
    ['connector 3 pin', 'connector'],
    [terminal('pin1', -40, -20), terminal('pin2', -40, 0), terminal('pin3', -40, 20)],
  ),
  port: def(
    'port',
    'Generic port',
    'Utilities',
    '',
    [g.leadPath('M-40 0H-20'), g.path('M-20-12H10L22 0 10 12H-20Z', 'white')],
    ['generic port', 'port'],
    [terminal('connection', -40, 0)],
  ),
  fuse: def('fuse', 'Fuse', 'Utilities', 'F', [...g.resistor, g.path('M-20 0H20')], ['fuse']),
  lamp: def('lamp', 'Lamp', 'Utilities', 'H', g.source([g.path('M-14-14L14 14M-14 14L14-14')]), [
    'lamp',
    'light bulb',
    'lamp',
  ]),
  motor: def('motor', 'Motor', 'Utilities', 'M', g.source([g.text('M')]), ['motor']),
  speaker: def(
    'speaker',
    'Speaker',
    'Utilities',
    'LS',
    [
      g.leadPath('M-40 0H-12M12 0H40'),
      g.rect(-12, -7, 24, 14),
      g.path('M-12-7L-21-20H21L12-7Z', 'white'),
    ],
    ['speaker', 'loudspeaker'],
  ),
  buzzer: def(
    'buzzer',
    'Buzzer',
    'Utilities',
    'BZ',
    [
      g.leads,
      g.rect(-20, -12, 40, 24),
      ...g.auxiliary([g.path('M-10-19Q0-29 10-19M-15-25Q0-40 15-25')]),
    ],
    ['buzzer', 'buzzer'],
  ),
  circleBlock: def(
    'circleBlock',
    'Circular block',
    'Blocks',
    'Z',
    g.block(true),
    ['generic circle block', 'block'],
    two,
    'BLOCK',
  ),
};
export const catalog: ComponentDefinition[] = Object.values(componentRegistry);
const normalized = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export const matchesComponent = (definition: ComponentDefinition, search: string) =>
  normalized(searchText([definition.name, definition.group, ...definition.searchTerms])).includes(
    normalized(search.trim()),
  );
export const makeId = () => crypto.randomUUID();
export function terminalsFor(type: ComponentType): Terminal[] {
  return componentRegistry[type].terminals.map((t) => ({ ...t }));
}
export function createComponent(type: ComponentType, point: Point, index = 1): CircuitComponent {
  const definition = componentRegistry[type];
  return {
    kind: 'component',
    id: makeId(),
    type,
    ...point,
    rotation: 0,
    terminals: terminalsFor(type),
    label: {
      text: definition.prefix ? `${definition.prefix}_${index}` : '',
      offset: { ...definition.labelOffset },
      color: COLORS.blue,
      fontSize: 22,
      rotation: 0,
    },
    color: COLORS.ink,
    width: 2,
    ...(definition.internalText !== undefined ? { bodyText: definition.internalText } : {}),
  };
}
