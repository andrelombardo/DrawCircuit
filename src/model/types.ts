export interface Point {
  x: number;
  y: number;
}
export type Rotation = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;
export const ROTATIONS: readonly Rotation[] = [0, 45, 90, 135, 180, 225, 270, 315];
export function isRotation(value: unknown): value is Rotation {
  return typeof value === 'number' && ROTATIONS.includes(value as Rotation);
}
export const componentTypes = [
  'resistor',
  'capacitor',
  'polarizedCapacitor',
  'inductor',
  'variableResistor',
  'potentiometer',
  'voltageSource',
  'currentSource',
  'battery',
  'dependentVoltage',
  'dependentCurrent',
  'diode',
  'led',
  'zener',
  'openSwitch',
  'closedSwitch',
  'ground',
  'ammeter',
  'voltmeter',
  'transformer',
  'blackBox',
  'thermistor',
  'photoresistor',
  'variableCapacitor',
  'variableInductor',
  'acVoltageSource',
  'acCurrentSource',
  'genericVoltageSource',
  'genericCurrentSource',
  'singleCellBattery',
  'photodiode',
  'schottky',
  'varactor',
  'npn',
  'pnp',
  'nmos',
  'pmos',
  'njfet',
  'pjfet',
  'spdt',
  'pushButtonNO',
  'pushButtonNC',
  'dpst',
  'dpdt',
  'ohmmeter',
  'galvanometer',
  'signalGround',
  'chassisGround',
  'centerTapTransformer',
  'coupledInductors',
  'opAmp',
  'comparator',
  'andGate',
  'orGate',
  'notGate',
  'nandGate',
  'norGate',
  'xorGate',
  'xnorGate',
  'buffer',
  'terminal',
  'testPoint',
  'connector2',
  'connector3',
  'port',
  'fuse',
  'lamp',
  'motor',
  'speaker',
  'buzzer',
  'circleBlock',
  'americanResistor',
] as const;
export type ComponentType = (typeof componentTypes)[number];
export interface Terminal {
  id: string;
  localX: number;
  localY: number;
  name?: string;
  direction?: 'x' | 'y';
}
export interface Label {
  text: string;
  offset: Point;
  color: string;
  /** Independent of HEX color; missing means fully opaque. */
  opacity?: number;
  fontSize: number;
  rotation: Rotation;
}
export interface CircuitComponent {
  kind: 'component';
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: Rotation;
  terminals: Terminal[];
  label: Label;
  bodyText?: string;
  color: string;
  /** Independent of HEX color; missing means fully opaque. */
  opacity?: number;
  width: number;
}
export interface Junction {
  kind: 'junction';
  id: string;
  x: number;
  y: number;
  label: Label;
  color: string;
  /** Independent of HEX color; missing means fully opaque. */
  opacity?: number;
}
export type Endpoint =
  | { kind: 'terminal'; componentId: string; terminalId: string }
  | { kind: 'junction'; junctionId: string }
  | { kind: 'free'; point: Point };
export type WireRouting = 'orthogonal' | '45' | 'free';
export interface Wire {
  /** Missing in v1 documents means orthogonal. */
  routing?: WireRouting;
  kind: 'wire';
  id: string;
  startEndpoint: Endpoint;
  endEndpoint: Endpoint;
  vertices: Point[];
  color: string;
  /** Independent of HEX color; missing means fully opaque. */
  opacity?: number;
  width: number;
}
export interface TextAnnotation {
  kind: 'text';
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  /** Independent of HEX color; missing means fully opaque. */
  opacity?: number;
  fontSize: number;
  align: 'start' | 'middle' | 'end';
  rotation: Rotation;
}
export interface ArrowAnnotation {
  kind: 'arrow';
  id: string;
  type: 'straight' | 'curve' | 'arc';
  /** Orientation/reflection of legacy circular arrows. */
  arcRotation?: number;
  arcMirrored?: boolean;
  start: Point;
  end: Point;
  controlPoints: [Point, Point];
  color: string;
  /** Independent of HEX color; missing means fully opaque. */
  opacity?: number;
  width: number;
  reversed: boolean;
}
export interface LoopArrow {
  kind: 'loop-arrow';
  /** Rotation of the ellipse around its center, in degrees. */
  rotation?: number;
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 'clockwise' | 'counterclockwise';
  /** Normalized ellipse parameter: top=0, right=.25, bottom=.5, left=.75. */
  arrowPosition: number;
  color: string;
  /** Independent of HEX color; missing means fully opaque. */
  opacity?: number;
  strokeWidth: number;
}
export interface ElectricalAnnotation {
  kind: 'electrical';
  id: string;
  mode: 'current' | 'polarity' | 'voltage';
  start: Point;
  end: Point;
  wireId?: string;
  /** Legacy JSON field; all currents render integrated. External is accepted only for migration. */
  currentPlacement?: 'external' | 'inline';
  /** Position on the chosen route segment, independent of other segment lengths. */
  wireSegment?: { index: number; ratio: number };
  componentId?: string;
  ratio: number;
  offset: Point;
  reversed: boolean;
  label: Label;
  color: string;
  /** Independent of HEX color; missing means fully opaque. */
  opacity?: number;
  width: number;
}
export interface BraceAnnotation {
  kind: 'brace';
  id: string;
  type: 'brace' | 'bracket';
  start: Point;
  end: Point;
  /** Side of the directed baseline, flipped without changing endpoints. */
  side: 1 | -1;
  label: Label;
  color: string;
  /** Independent of HEX color; missing means fully opaque. */
  opacity?: number;
  width: number;
}
export type CircuitObject =
  | CircuitComponent
  | Junction
  | Wire
  | TextAnnotation
  | ArrowAnnotation
  | LoopArrow
  | ElectricalAnnotation
  | BraceAnnotation;
export interface CircuitDocument {
  version: 1;
  title: string;
  objects: CircuitObject[];
}
export type Tool =
  | 'select'
  | 'wire'
  | 'junction'
  | 'text'
  | 'arrow'
  | 'loop-arrow'
  | 'current'
  | 'polarity'
  | 'voltage'
  | 'brace'
  | 'bracket'
  | 'pan'
  | 'preset'
  | ComponentType;
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
export const COLORS = {
  ink: '#171a20',
  blue: '#2463cb',
  red: '#df4949',
  green: '#269978',
  purple: '#8855c2',
};
export const GRID = 20;
