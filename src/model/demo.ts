import { createComponent } from './catalog';
import { COLORS } from './types';
import type { CircuitDocument, Junction, Wire, CircuitComponent } from './types';
export function demoDocument(): CircuitDocument {
  const junctions: Junction[] = [
    ['A', -240, 0],
    ['B', 0, 0],
    ['C', 240, 0],
    ['D', 0, 220],
  ].map(([name, x, y]) => ({
    kind: 'junction',
    id: `node-${name}`,
    x: Number(x),
    y: Number(y),
    label: {
      text: String(name),
      offset:
        name === 'D'
          ? { x: 0, y: 34 }
          : name === 'B'
            ? { x: 0, y: -30 }
            : { x: name === 'A' ? -26 : 26, y: 5 },
      color: COLORS.red,
      fontSize: 27,
      rotation: 0,
    },
    color: COLORS.ink,
  }));
  const components: CircuitComponent[] = [
    ['AB', -120, 0, 0],
    ['BC', 120, 0, 0],
    ['AC', 0, -160, 0],
    ['AD', -240, 120, 90],
    ['BD', 0, 120, 90],
    ['CD', 240, 120, 90],
  ].map(([label, x, y, r]) => ({
    ...createComponent('resistor', { x: Number(x), y: Number(y) }),
    id: `r-${label}`,
    rotation: Number(r) as 0 | 90,
    label: {
      text: `r_{${label}}`,
      offset: r === 90 ? { x: label === 'AD' ? -44 : 44, y: 0 } : { x: 0, y: -30 },
      color: COLORS.blue,
      fontSize: 23,
      rotation: 0,
    },
  }));
  const wires: Wire[] = [];
  const connect = (
    componentId: string,
    terminalId: string,
    node: string,
    vertices: { x: number; y: number }[] = [],
  ) =>
    wires.push({
      kind: 'wire',
      id: `w-${componentId}-${terminalId}`,
      startEndpoint: { kind: 'terminal', componentId, terminalId },
      endEndpoint: { kind: 'junction', junctionId: `node-${node}` },
      vertices,
      color: COLORS.ink,
      width: 2,
    });
  for (const edge of ['AB', 'BC', 'AD', 'BD', 'CD']) {
    connect(`r-${edge}`, 'a', edge[0]);
    connect(`r-${edge}`, 'b', edge[1]);
  }
  connect('r-AC', 'a', 'A', [{ x: -240, y: -160 }]);
  connect('r-AC', 'b', 'C', [{ x: 240, y: -160 }]);
  return {
    version: 1,
    title: 'Resistive network · four junctions',
    objects: [
      ...wires,
      ...components,
      ...junctions,
      {
        kind: 'arrow',
        id: 'loop-left',
        type: 'arc',
        start: { x: -204, y: 108 },
        end: { x: -36, y: 108 },
        controlPoints: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
        color: COLORS.red,
        width: 1.8,
        reversed: false,
      },
      {
        kind: 'text',
        id: 'loop-label',
        x: -120,
        y: 117,
        text: 'loop 1',
        color: COLORS.red,
        fontSize: 20,
        align: 'middle',
        rotation: 0,
      },
      {
        kind: 'arrow',
        id: 'current-arrow',
        type: 'curve',
        start: { x: -170, y: -60 },
        end: { x: -65, y: -60 },
        controlPoints: [
          { x: -155, y: -83 },
          { x: -80, y: -83 },
        ],
        color: COLORS.red,
        width: 1.8,
        reversed: false,
      },
      {
        kind: 'text',
        id: 'current-label',
        x: -120,
        y: -100,
        text: 'i_1',
        color: COLORS.red,
        fontSize: 23,
        align: 'middle',
        rotation: 0,
      },
    ],
  };
}
