import type { Point } from '../model/types';
/** Only the authored SVG path subset is accepted; unsupported geometry fails visibly. */
export function svgPathToTikz(d: string, coordinate: (p: Point) => string): string {
  const tokens = d.match(/[MLHVCQZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi) ?? [];
  if (d.replace(/[MLHVCQZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?|[\s,]/gi, '') !== '')
    throw new Error('Unsupported symbol path.');
  let i = 0,
    command = '',
    current = { x: 0, y: 0 },
    start = current;
  const chunks: string[] = [];
  let subpath: string[] = [],
    hasGeometry = false;
  const flush = () => {
    if (hasGeometry) chunks.push(...subpath);
    subpath = [];
    hasGeometry = false;
  };
  const differs = (a: Point, b: Point) => a.x !== b.x || a.y !== b.y;
  const segment = (end: Point) => {
    if (differs(current, end)) {
      subpath.push(`-- ${coordinate(end)}`);
      hasGeometry = true;
    }
    current = end;
  };
  const number = () => {
    const n = Number(tokens[i++]);
    if (!Number.isFinite(n)) throw new Error('Invalid symbol coordinate.');
    return n;
  };
  const point = () => ({ x: number(), y: number() });
  while (i < tokens.length) {
    if (/^[MLHVCQZ]$/.test(tokens[i])) command = tokens[i++];
    if (command === 'Z') {
      if (hasGeometry) subpath.push('-- cycle');
      current = start;
      command = '';
      continue;
    }
    if (command === 'M') {
      flush();
      current = point();
      start = current;
      subpath.push(coordinate(current));
      command = 'L';
    } else if (command === 'L') {
      segment(point());
    } else if (command === 'H') {
      segment({ ...current, x: number() });
    } else if (command === 'V') {
      segment({ ...current, y: number() });
    } else if (command === 'C') {
      const a = point(),
        b = point(),
        end = point();
      if ([a, b, end].some((p) => differs(p, current))) {
        subpath.push(`.. controls ${coordinate(a)} and ${coordinate(b)} .. ${coordinate(end)}`);
        hasGeometry = true;
      }
      current = end;
    } else if (command === 'Q') {
      const q = point(),
        end = point();
      const a = {
        x: current.x + (2 * (q.x - current.x)) / 3,
        y: current.y + (2 * (q.y - current.y)) / 3,
      };
      const b = { x: end.x + (2 * (q.x - end.x)) / 3, y: end.y + (2 * (q.y - end.y)) / 3 };
      if ([q, end].some((p) => differs(p, current))) {
        subpath.push(`.. controls ${coordinate(a)} and ${coordinate(b)} .. ${coordinate(end)}`);
        hasGeometry = true;
      }
      current = end;
    } else throw new Error('Unsupported symbol path command.');
  }
  flush();
  return chunks.join(' ');
}
