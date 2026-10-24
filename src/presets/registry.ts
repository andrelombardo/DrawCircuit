import { diagramPresets } from './diagrams';
import { searchText } from '../i18n';
import { GRID } from '../model/types';
import type { ComponentType, Point, Rotation } from '../model/types';
import type {
  CircuitPreset,
  PresetComponent,
  PresetEndpoint,
  PresetJunction,
  PresetThumbnail,
  PresetWire,
} from './types';

const p = (x: number, y: number): Point => ({ x: x * GRID, y: y * GRID });
const c = (
  key: string,
  type: ComponentType,
  x: number,
  y: number,
  label: string,
  rotation: Rotation = 0,
  labelOffset?: Point,
): PresetComponent => ({
  key,
  type,
  ...p(x, y),
  label,
  rotation,
  ...(labelOffset ? { labelOffset } : {}),
});
const j = (key: string, x: number, y: number, label = '', labelOffset?: Point): PresetJunction => ({
  key,
  ...p(x, y),
  label,
  ...(labelOffset ? { labelOffset } : {}),
});
const ep = (key: string): PresetEndpoint => {
  const [component, terminal] = key.split('.');
  return terminal ? { component, terminal } : { junction: key };
};
const w = (start: string, end: string, ...vertices: Point[]): PresetWire => ({
  start: ep(start),
  end: ep(end),
  ...(vertices.length ? { vertices } : {}),
});
type Layout = Pick<CircuitPreset, 'components' | 'junctions' | 'wires' | 'thumbnail'>;

function series(parts: ComponentType[]): Layout {
  const centers = parts.map((_, i) => (i - (parts.length - 1) / 2) * 8);
  const prefix: Partial<Record<ComponentType, string>> = {
    resistor: 'R',
    capacitor: 'C',
    inductor: 'L',
  };
  const counts = new Map<ComponentType, number>();
  return {
    components: parts.map((type, i) => {
      const count = (counts.get(type) ?? 0) + 1;
      counts.set(type, count);
      return c(`c${i}`, type, centers[i], 0, `${prefix[type]}_${count}`);
    }),
    junctions: [j('A', centers[0] - 4, 0, 'A'), j('B', centers.at(-1)! + 4, 0, 'B')],
    wires: [
      w('A', 'c0.a'),
      ...parts.slice(1).map((_, i) => w(`c${i}.b`, `c${i + 1}.a`)),
      w(`c${parts.length - 1}.b`, 'B'),
    ],
  };
}
function parallel(parts: ComponentType[], input = 'A'): Layout {
  const rows = parts.map((_, i) => (i - (parts.length - 1) / 2) * 8);
  const bus = [...new Set([...rows, 0])].sort((a, b) => a - b);
  const prefix: Partial<Record<ComponentType, string>> = {
    resistor: 'R',
    capacitor: 'C',
    inductor: 'L',
  };
  const counts = new Map<ComponentType, number>();
  const node = (side: string, y: number) => `${side}${y}`;
  return {
    components: parts.map((type, i) => {
      const count = (counts.get(type) ?? 0) + 1;
      counts.set(type, count);
      return c(`c${i}`, type, 0, rows[i], `${prefix[type]}_${count}`);
    }),
    junctions: [
      j('A', -12, 0, input, p(-1, -2)),
      j('B', 12, 0, 'B', p(1, -2)),
      ...bus.flatMap((y) => [j(node('left', y), -8, y), j(node('right', y), 8, y)]),
    ],
    wires: [
      w('A', node('left', 0)),
      w(node('right', 0), 'B'),
      ...bus
        .slice(1)
        .flatMap((y, i) => [
          w(node('left', bus[i]), node('left', y)),
          w(node('right', bus[i]), node('right', y)),
        ]),
      ...rows.flatMap((y, i) => [w(node('left', y), `c${i}.a`), w(`c${i}.b`, node('right', y))]),
    ],
  };
}
/** A miniature graph with diagonal bipoles, only for palette thumbnails. */
function thumbnail(nodes: Record<string, Point>, edges: [string, string][]): PresetThumbnail {
  const components: PresetThumbnail['components'] = [],
    paths: string[] = [];
  for (const [aKey, bKey] of edges) {
    const a = nodes[aKey],
      b = nodes[bKey],
      dx = b.x - a.x,
      dy = b.y - a.y;
    const length = Math.hypot(dx, dy),
      x = (a.x + b.x) / 2,
      y = (a.y + b.y) / 2;
    const ux = (dx / length) * 40,
      uy = (dy / length) * 40;
    components.push({
      type: 'resistor',
      x,
      y,
      rotation: (Math.atan2(dy, dx) * 180) / Math.PI,
    });
    paths.push(`M${a.x} ${a.y}L${x - ux} ${y - uy}M${x + ux} ${y + uy}L${b.x} ${b.y}`);
  }
  return { components, paths, nodes: Object.values(nodes) };
}
function star(): Layout {
  return {
    components: [
      c('r1', 'resistor', 0, -6, 'R_1', 90, p(2, 0)),
      c('r2', 'resistor', -6, 4, 'R_2'),
      c('r3', 'resistor', 6, 4, 'R_3'),
    ],
    junctions: [
      j('A', 0, -10, 'A'),
      j('B', -10, 4, 'B', p(-1, 2)),
      j('C', 10, 4, 'C', p(1, 2)),
      j('N', 0, 0, 'N', p(2, -2)),
    ],
    wires: [
      w('A', 'r1.a'),
      w('r1.b', 'N'),
      w('N', 'r2.b', p(-4, 0), p(-4, 4)),
      w('r2.a', 'B'),
      w('N', 'r3.a', p(4, 0), p(4, 4)),
      w('r3.b', 'C'),
    ],
    thumbnail: thumbnail({ A: p(0, -10), B: p(-10, 8), C: p(10, 8), N: p(0, 0) }, [
      ['A', 'N'],
      ['B', 'N'],
      ['C', 'N'],
    ]),
  };
}
function delta(): Layout {
  return {
    components: [
      c('ab', 'resistor', -8, 0, 'R_{AB}', 90, p(-3, 0)),
      c('bc', 'resistor', 0, 8, 'R_{BC}'),
      c('ca', 'resistor', 8, 0, 'R_{CA}', 90, p(3, 0)),
    ],
    junctions: [j('A', 0, -8, 'A'), j('B', -8, 8, 'B', p(-2, 2)), j('C', 8, 8, 'C', p(2, 2))],
    wires: [
      w('A', 'ab.a', p(-8, -8)),
      w('ab.b', 'B'),
      w('B', 'bc.a'),
      w('bc.b', 'C'),
      w('C', 'ca.b'),
      w('ca.a', 'A', p(8, -8)),
    ],
    thumbnail: thumbnail({ A: p(0, -10), B: p(-10, 8), C: p(10, 8) }, [
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'A'],
    ]),
  };
}
const divider: Layout = {
  components: [
    c('r1', 'resistor', 0, -6, 'R_1', 90, p(2, 0)),
    c('r2', 'resistor', 0, 2, 'R_2', 90, p(2, 0)),
    c('gnd', 'ground', 0, 10, ''),
  ],
  junctions: [
    j('in', 0, -10, 'V_{in}', p(-3, -1)),
    j('out', 0, -2, 'V_{out}', p(-3, 0)),
    j('bottom', 0, 6),
  ],
  wires: [
    w('in', 'r1.a'),
    w('r1.b', 'out'),
    w('out', 'r2.a'),
    w('r2.b', 'bottom'),
    w('bottom', 'gnd.a'),
  ],
};
const wheatstone: Layout = {
  components: [
    c('r1', 'resistor', -8, -5, 'R_1', 90, p(-2, 0)),
    c('r2', 'resistor', 8, -5, 'R_2', 90, p(2, 0)),
    c('r3', 'resistor', -8, 5, 'R_3', 90, p(-2, 0)),
    c('r4', 'resistor', 8, 5, 'R_4', 90, p(2, 0)),
    c('r5', 'resistor', 0, 0, 'R_5'),
  ],
  junctions: [
    j('A', 0, -10, 'A'),
    j('B', -8, 0, 'B', p(-2, 0)),
    j('C', 8, 0, 'C', p(2, 0)),
    j('D', 0, 10, 'D', p(0, 2)),
  ],
  wires: [
    w('A', 'r1.a', p(-8, -10)),
    w('r1.b', 'B'),
    w('A', 'r2.a', p(8, -10)),
    w('r2.b', 'C'),
    w('B', 'r3.a'),
    w('r3.b', 'D', p(-8, 10)),
    w('C', 'r4.a'),
    w('r4.b', 'D', p(8, 10)),
    w('B', 'r5.a'),
    w('r5.b', 'C'),
  ],
  thumbnail: thumbnail({ A: p(0, -10), B: p(-10, 0), C: p(10, 0), D: p(0, 10) }, [
    ['A', 'B'],
    ['A', 'C'],
    ['B', 'D'],
    ['C', 'D'],
    ['B', 'C'],
  ]),
};
function voltageEquivalent(v: string, r: string): Layout {
  return {
    components: [c('v', 'voltageSource', -8, 0, v, 90, p(-3, 0)), c('r', 'resistor', 0, -6, r)],
    junctions: [j('A', 8, -6, 'A', p(2, 0)), j('B', 8, 6, 'B', p(2, 0))],
    wires: [w('v.a', 'r.a', p(-8, -6)), w('r.b', 'A'), w('v.b', 'B', p(-8, 6))],
  };
}
function currentEquivalent(i: string, r: string): Layout {
  return {
    components: [
      c('i', 'currentSource', -8, 0, i, 90, p(-3, 0)),
      c('r', 'resistor', 8, 0, r, 90, p(3, 0)),
    ],
    junctions: [j('A', 0, -8, 'A'), j('B', 0, 8, 'B', p(0, 2))],
    wires: [
      w('A', 'i.a', p(-8, -8)),
      w('i.b', 'B', p(-8, 8)),
      w('A', 'r.a', p(8, -8)),
      w('r.b', 'B', p(8, 8)),
    ],
  };
}
const sourceResistor: Layout = {
  components: [
    c('v', 'voltageSource', -8, 0, 'V_1', 90, p(-3, 0)),
    c('r', 'resistor', 0, -6, 'R_1'),
  ],
  junctions: [],
  wires: [w('v.a', 'r.a', p(-8, -6)), w('r.b', 'v.b', p(8, -6), p(8, 6), p(-8, 6))],
};
const twoMeshes: Layout = {
  components: [
    c('r1', 'resistor', -6, -6, 'R_1'),
    c('r2', 'resistor', 6, -6, 'R_2'),
    c('r3', 'resistor', 0, 0, 'R_3', 90, p(2, 0)),
    c('v1', 'voltageSource', -12, 0, 'V_1', 90, p(-3, 0)),
    c('v2', 'voltageSource', 12, 0, 'V_2', 90, p(3, 0)),
  ],
  junctions: [j('top', 0, -6), j('bottom', 0, 6)],
  wires: [
    w('v1.a', 'r1.a', p(-12, -6)),
    w('r1.b', 'top'),
    w('top', 'r2.a'),
    w('r2.b', 'v2.a', p(12, -6)),
    w('v1.b', 'bottom', p(-12, 6)),
    w('v2.b', 'bottom', p(12, 6)),
    w('top', 'r3.a'),
    w('r3.b', 'bottom'),
  ],
};
const sourceLoad: Layout = {
  components: [
    c('v', 'voltageSource', -8, 0, 'V_s', 90, p(-3, 0)),
    c('r', 'resistor', 0, -6, 'R_s'),
    { ...c('load', 'blackBox', 8, 0, 'LOAD', 90, p(3, 0)), bodyText: '' },
  ],
  junctions: [],
  wires: [
    w('v.a', 'r.a', p(-8, -6)),
    w('r.b', 'load.a', p(8, -6)),
    w('load.b', 'v.b', p(8, 6), p(-8, 6)),
  ],
};
const preset = (
  id: string,
  name: string,
  shortName: string,
  category: CircuitPreset['category'],
  keywords: string[],
  layout: Layout,
): CircuitPreset => ({ id, name, shortName, category, keywords, ...layout });

export const circuitPresets: CircuitPreset[] = [
  ...diagramPresets,
  preset(
    'resistors-series-2',
    '2 resistors in series',
    'Series ×2',
    'Resistors',
    ['2 resistors series', 'resistors in series'],
    series(['resistor', 'resistor']),
  ),
  preset(
    'resistors-series-3',
    '3 resistors in series',
    'Series ×3',
    'Resistors',
    ['3 resistors series', 'resistors in series'],
    series(['resistor', 'resistor', 'resistor']),
  ),
  preset(
    'resistors-parallel-2',
    '2 resistors in parallel',
    'Parallel ×2',
    'Resistors',
    ['2 resistors parallel', 'resistors in parallel'],
    parallel(['resistor', 'resistor']),
  ),
  preset(
    'resistors-parallel-3',
    '3 resistors in parallel',
    'Parallel ×3',
    'Resistors',
    ['3 resistors parallel', 'resistors in parallel'],
    parallel(['resistor', 'resistor', 'resistor']),
  ),
  preset(
    'resistor-star',
    'Star resistor network / Y',
    'Star / Y',
    'Resistors',
    ['star', 'resistor star', 'wye', 'stella', 'y network'],
    star(),
  ),
  preset(
    'resistor-delta',
    'Delta resistor network',
    'Delta / Δ',
    'Resistors',
    ['delta', 'triangle', 'triangolo'],
    delta(),
  ),
  preset(
    'voltage-divider',
    'Voltage divider',
    'Voltage divider',
    'Basic circuits',
    ['voltage divider', 'vin vout'],
    divider,
  ),
  preset(
    'current-divider',
    'Current divider',
    'Current divider',
    'Basic circuits',
    ['current divider', 'iin'],
    parallel(['resistor', 'resistor'], 'I_{in}'),
  ),
  preset(
    'wheatstone-bridge',
    'Wheatstone bridge',
    'Wheatstone',
    'Basic circuits',
    ['wheatstone bridge', 'ponte'],
    wheatstone,
  ),
  preset(
    'real-voltage-source',
    'Practical voltage source',
    'Voltage source',
    'Basic circuits',
    ['real voltage source', 'source series resistor'],
    voltageEquivalent('V_s', 'R_s'),
  ),
  preset(
    'real-current-source',
    'Practical current source',
    'Current source',
    'Basic circuits',
    ['real current source', 'source parallel resistor'],
    currentEquivalent('I_s', 'R_s'),
  ),
  preset(
    'thevenin',
    'Thévenin equivalent',
    'Thévenin',
    'Basic circuits',
    ['thevenin equivalent', 'thévenin equivalent', 'equivalent circuit of thevenin'],
    voltageEquivalent('V_{th}', 'R_{th}'),
  ),
  preset(
    'norton',
    'Norton equivalent',
    'Norton',
    'Basic circuits',
    ['norton equivalent', 'equivalent circuit of norton'],
    currentEquivalent('I_N', 'R_N'),
  ),
  preset(
    'rc-series',
    'Series RC',
    'Series RC',
    'RLC',
    ['series rc', 'resistor capacitor'],
    series(['resistor', 'capacitor']),
  ),
  preset(
    'rl-series',
    'Series RL',
    'Series RL',
    'RLC',
    ['series rl', 'resistor inductor'],
    series(['resistor', 'inductor']),
  ),
  preset(
    'rlc-series',
    'Series RLC',
    'Series RLC',
    'RLC',
    ['series rlc', 'resistor inductor capacitor'],
    series(['resistor', 'inductor', 'capacitor']),
  ),
  preset(
    'rc-parallel',
    'Parallel RC',
    'Parallel RC',
    'RLC',
    ['parallel rc', 'resistor capacitor'],
    parallel(['resistor', 'capacitor']),
  ),
  preset(
    'rl-parallel',
    'Parallel RL',
    'Parallel RL',
    'RLC',
    ['parallel rl', 'resistor inductor'],
    parallel(['resistor', 'inductor']),
  ),
  preset(
    'rlc-parallel',
    'Parallel RLC',
    'Parallel RLC',
    'RLC',
    ['parallel rlc', 'resistor inductor capacitor'],
    parallel(['resistor', 'inductor', 'capacitor']),
  ),
  preset(
    'source-resistor',
    'Voltage source and resistor',
    'Source + R',
    'Networks',
    ['voltage source resistor', 'simple circuit', 'simple circuit'],
    sourceResistor,
  ),
  preset(
    'two-meshes',
    'Two-loop network',
    'Two loops',
    'Networks',
    ['two meshes', 'two loops', 'mesh method'],
    twoMeshes,
  ),
  preset(
    'three-branches',
    'Three-branch network',
    'Three branches',
    'Networks',
    ['three branches', 'nodal network', 'nodal exercises'],
    star(),
  ),
  preset(
    'source-series-load',
    'Source, series resistor, and load',
    'Source + load',
    'Networks',
    ['source series resistor load', 'load', 'carico'],
    sourceLoad,
  ),
];
export const presetRegistry = Object.fromEntries(circuitPresets.map((item) => [item.id, item]));
const normalized = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export const matchesPreset = (item: CircuitPreset, search: string) =>
  normalized(searchText([item.name, item.shortName, item.category, ...item.keywords])).includes(
    normalized(search.trim()),
  );
