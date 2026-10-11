import { translucentCrossing } from '../../utils/wireRendering';
import { memo } from 'react';
import type { CircuitDocument } from '../../model/types';
import { bridgePaths, wireCrossings } from '../../utils/crossings';
export const WireBridges = memo(function WireBridges({ doc }: { doc: CircuitDocument }) {
  return (
    <g data-layer="crossings" pointerEvents="none">
      {wireCrossings(doc).map((c) => {
        const p = bridgePaths(c),
          w = Math.max(c.horizontal.width, c.vertical.width) + 4;
        return (
          <g
            key={`${c.x}:${c.y}`}
            data-wire-crossing="unconnected"
            data-bridge-axis={c.bridgeAxis}
            data-over-wire={p.overWire.id}
            data-under-wire={p.underWire.id}
          >
            {!translucentCrossing(c) && (
              <>
                <path d={p.gap} fill="none" stroke="white" strokeWidth={w} />
                <path
                  d={p.under}
                  fill="none"
                  stroke={p.underWire.color}
                  strokeWidth={p.underWire.width}
                />
                <path d={p.arc} fill="none" stroke="white" strokeWidth={w} strokeLinecap="round" />
              </>
            )}
            <path
              opacity={p.overWire.opacity}
              d={p.arc}
              fill="none"
              stroke={p.overWire.color}
              strokeWidth={p.overWire.width}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </g>
  );
});
