import { createComponent } from '../../src/model/catalog';
import { createJunction, createWire } from '../../src/model/factories';
import type { CircuitDocument, CircuitObject, Junction } from '../../src/model/types';
export function parallelSources(xs = [0, 140, 300]): CircuitDocument {
  const sources = xs.map((x, i) => {
    const o = createComponent('currentSource', { x, y: 0 }, i + 1);
    o.id = `source-${i + 1}`;
    o.rotation = 270;
    o.label.text = `I_${i + 1}`;
    o.label.offset = { x: -44, y: 0 };
    return o;
  });
  const nodes: Junction[] = xs.flatMap((x, i) =>
    [-100, 100].map((y, j) => ({ ...createJunction({ x, y }, ''), id: `rail-${i + 1}-${j}` })),
  );
  const objects: CircuitObject[] = [...sources, ...nodes];
  const junction = (j: Junction) => ({ kind: 'junction' as const, junctionId: j.id });
  sources.forEach((o, i) => {
    objects.push(
      createWire(
        { kind: 'terminal', componentId: o.id, terminalId: o.terminals[1].id },
        junction(nodes[i * 2]),
      ),
    );
    objects.push(
      createWire(
        { kind: 'terminal', componentId: o.id, terminalId: o.terminals[0].id },
        junction(nodes[i * 2 + 1]),
      ),
    );
    if (i < xs.length - 1)
      for (let j = 0; j < 2; j++)
        objects.push(createWire(junction(nodes[i * 2 + j]), junction(nodes[(i + 1) * 2 + j])));
  });
  for (let j = 0; j < 2; j++)
    objects.push({
      ...createWire(junction(nodes.at(-2 + j)!), {
        kind: 'free',
        point: { x: 400, y: j ? 100 : -100 },
      }),
      id: `extension-${j}`,
    });
  return { version: 1, title: 'Tre generatori in parallelo', objects };
}
