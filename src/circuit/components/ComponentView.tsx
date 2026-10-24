import { memo } from 'react';
import type { CircuitComponent } from '../../model/types';
import { localToWorld } from '../../utils/geometry';
import { componentRegistry } from '../../model/catalog';
import { Symbol } from './Symbol';
export const ComponentView = memo(function ComponentView({
  object: o,
  terminals,
  selected = false,
}: {
  object: CircuitComponent;
  terminals: boolean;
  selected?: boolean;
}) {
  const bounds = componentRegistry[o.type].bounds;
  return (
    <g data-object={o.id} className="circuit-object">
      <g transform={`translate(${o.x} ${o.y}) rotate(${o.rotation}) scale(${o.scale ?? 1})`}>
        <rect {...bounds} rx={5} className="object-hit" />
        <g
          className={selected ? 'selected-symbol' : undefined}
          opacity={o.opacity}
          data-selected={selected || undefined}
        >
          <Symbol type={o.type} color={o.color} width={o.width/(o.scale ?? 1)} bodyText={o.bodyText}
            rotation={o.rotation} />
        </g>
      </g>
      <g className="terminal-handles" data-visible={terminals} aria-hidden="true">
        {o.terminals.map((t) => {
          const p = localToWorld(o, { x: t.localX, y: t.localY });
          return (
            <g key={t.id} data-terminal={t.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={0.01}
                stroke="transparent"
                strokeWidth={14}
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={p.x} cy={p.y} r={4} className="terminal" />
            </g>
          );
        })}
      </g>
    </g>
  );
});
