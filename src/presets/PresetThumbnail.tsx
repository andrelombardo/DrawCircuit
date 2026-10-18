import { memo, useMemo } from 'react';
import { Symbol } from '../circuit/components/Symbol';
import { documentBounds, pointsPath, wirePoints } from '../utils/geometry';
import { instantiatePreset } from './instantiate';
import type { CircuitPreset } from './types';

export const PresetThumbnail = memo(function PresetThumbnail({
  preset,
}: {
  preset: CircuitPreset;
}) {
  const drawing = useMemo(() => {
    if (preset.thumbnail) {
      const { nodes } = preset.thumbnail;
      const minX = Math.min(...nodes.map((n) => n.x)) - 24,
        minY = Math.min(...nodes.map((n) => n.y)) - 24;
      return {
        ...preset.thumbnail,
        bounds: {
          x: minX,
          y: minY,
          width: Math.max(...nodes.map((n) => n.x)) - minX + 24,
          height: Math.max(...nodes.map((n) => n.y)) - minY + 24,
        },
      };
    }
    const doc = {
      version: 1 as const,
      title: '',
      objects: instantiatePreset(preset, { x: 0, y: 0 }, 0, { version: 1, title: '', objects: [] }),
    };
    const bounds = documentBounds(doc);
    return {
      bounds: {
        x: bounds.x + 36,
        y: bounds.y + 36,
        width: bounds.width - 72,
        height: bounds.height - 72,
      },
      components: doc.objects.flatMap((o) => (o.kind === 'component' ? [o] : [])),
      paths: doc.objects.flatMap((o) =>
        o.kind === 'wire' ? [pointsPath(wirePoints(o, doc))] : [],
      ),
      nodes: doc.objects.flatMap((o) => (o.kind === 'junction' ? [o] : [])),
    };
  }, [preset]);
  const { bounds } = drawing;
  return (
    <svg
      className="preset-thumbnail"
      width={78}
      height={54}
      viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth={1.2}>
        {drawing.paths.map((path, i) => (
          <path key={i} d={path} />
        ))}
        {drawing.components.map((o, i) => (
          <g key={i} transform={`translate(${o.x} ${o.y}) rotate(${o.rotation})`}>
            <Symbol type={o.type} width={1.2} bodyText={o.type === 'blackBox' ? '' : undefined}
              rotation={o.rotation} />
          </g>
        ))}
        {drawing.nodes.map((node, i) => (
          <circle key={i} cx={node.x} cy={node.y} r={5} fill="currentColor" stroke="none" />
        ))}
      </g>
    </svg>
  );
});
