import { createAngle, normalizeAngle } from '../annotations/angle';
import { makeId } from '../model/catalog';
import { createJunction, createTextAnnotation } from '../model/factories';
import type { CircuitObject, LineAnnotation, Point, Rotation } from '../model/types';
import { add, rotatePoint } from '../utils/geometry';
import type { CircuitPreset } from './types';

const ink = '#183B71';
function diagram(gauss: boolean, origin: Point, rotation: Rotation): CircuitObject[] {
  const point = (x: number, y: number) => add(origin, rotatePoint({ x, y }, rotation));
  const objects: CircuitObject[] = [];
  const line = (a: Point, b: Point, arrowhead?: 'open', dashed = false): LineAnnotation => ({
    kind: 'line', id: makeId(), start: a, end: b, routing: 'free', color: ink, width: 2,
    ...(arrowhead ? { arrowhead } : {}), ...(dashed ? { lineStyle: 'dashed', dashLength: 14, dashGap: 12 } : {}),
  });
  const text = (x: number, y: number, value: string, fontSize = 24) => ({
    ...createTextAnnotation(point(x, y), value), color: ink, fontSize, rotation,
  });
  objects.push(line(point(-180, 0), point(190, 0), 'open'), line(point(0, 160), point(0, -170), 'open'),
    text(218, 0, gauss ? '\\mathrm{Re}' : 'x'), text(-28, -174, gauss ? '\\mathrm{Im}' : 'y'),
    text(0, -218, gauss ? 'Piano di Gauss' : 'Assi cartesiani', 28));
  if (!gauss) return objects;
  const center = point(0, 0), radius = 120, circleId = makeId();
  objects.push({ kind: 'circle', id: circleId, x: center.x-radius, y: center.y-radius,
    width: radius*2, height: radius*2, color: ink, strokeWidth: 2, fill: 'none',
    lineStyle: 'dashed', dashLength: 14, dashGap: 12 });
  for (const degrees of [72, 118, 160]) {
    const end = point(radius*Math.cos(degrees*Math.PI/180), -radius*Math.sin(degrees*Math.PI/180));
    const ray = line(center, end, undefined, true);
    ray.startEndpoint = { kind: 'shape', shapeId: circleId, anchor: { x: .5, y: .5 } };
    ray.endEndpoint = { kind: 'shape', shapeId: circleId, anchor: {
      x: .5+.5*Math.cos((degrees-rotation)*Math.PI/180), y: .5-.5*Math.sin((degrees-rotation)*Math.PI/180),
    } };
    objects.push(ray);
  }
  const degrees = 42, end = point(radius*Math.cos(degrees*Math.PI/180), -radius*Math.sin(degrees*Math.PI/180));
  const node = { ...createJunction(end, 'X(0)'), color: ink, radius: 3.5 };
  node.label = { ...node.label, color: ink, offset: rotatePoint({ x: 42, y: -8 }, rotation) };
  const vector = line(center, end, 'open');
  vector.startEndpoint = { kind: 'shape', shapeId: circleId, anchor: { x: .5, y: .5 } };
  vector.endEndpoint = { kind: 'junction', junctionId: node.id };
  const angle = createAngle(center, point(32, 0));
  angle.startAngle = normalizeAngle(-rotation);
  angle.sweepAngle = degrees;
  angle.showRays = false;
  angle.label.text = '\\varphi_x';
  angle.color = angle.label.color = ink;
  objects.push(vector, node, angle);
  for (const tick of [-radius, radius])
    objects.push(line(point(tick, -7), point(tick, 7)), line(point(-7, tick), point(7, tick)));
  return objects;
}

export const diagramPresets: CircuitPreset[] = [
  { id: 'cartesian-axes', name: 'Cartesian axes', shortName: 'Cartesian axes', category: 'Diagrams',
    keywords: ['assi', 'ascisse', 'ordinate', 'coordinate', 'x y', 'grafico'], components: [], junctions: [], wires: [],
    graphics: (point, rotation) => diagram(false, point, rotation) },
  { id: 'gauss-plane', name: 'Gauss plane', shortName: 'Gauss plane', category: 'Diagrams',
    keywords: ['gauss', 'piano complesso', 'fasore', 'vettore', 'angolo', 'Re Im'], components: [], junctions: [], wires: [],
    graphics: (point, rotation) => diagram(true, point, rotation) },
];
