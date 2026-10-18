import { t } from '../../i18n';
import type { DistanceGuide } from '../../utils/smartGuides';
export function DistanceGuideLayer({ guides, zoom }: { guides: DistanceGuide[]; zoom: number }) {
  return (
    <g data-layer="distance-guides" pointerEvents="none" aria-hidden="true">
      {guides.map((g, i) => {
        const horizontal = g.axis === 'x',
          rail = g.displayAt ?? g.at,
          mid = (g.from + g.to) / 2,
          tick = 4 / zoom;
        const value =
          Math.abs(g.value - Math.round(g.value)) < 0.01
            ? String(Math.round(g.value))
            : g.value.toFixed(1);
        const x = horizontal ? mid : rail,
          y = horizontal ? rail : mid,
          width = (value.length * 6.5 + 12) / zoom,
          height = 20 / zoom;
        return (
          <g
            key={i}
            className={`distance-guide${g.equal ? ' equal-spacing' : ''}`}
            data-axis={g.axis}
            data-measurement={g.measurement ?? 'gaps'}
            data-distance={value}
            data-equal={g.equal || undefined}
          >
            <path
              strokeWidth={1 / zoom}
              d={
                horizontal
                  ? `M${g.from} ${rail}H${g.to}M${g.from} ${g.at}V${rail + tick}M${g.to} ${g.at}V${rail + tick}M${g.from} ${rail - tick}V${rail + tick}M${g.to} ${rail - tick}V${rail + tick}`
                  : `M${rail} ${g.from}V${g.to}M${g.at} ${g.from}H${rail + tick}M${g.at} ${g.to}H${rail + tick}M${rail - tick} ${g.from}H${rail + tick}M${rail - tick} ${g.to}H${rail + tick}`
              }
            />
            <rect
              className="measurement-chip"
              x={x - width / 2}
              y={y - height / 2}
              width={width}
              height={height}
              rx={3 / zoom}
            />
            <title>
              {g.measurement === 'centers' ? t('Center distance') : t('Clearance')}: {value} u
            </title>
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11 / zoom}>
              {value}
            </text>
          </g>
        );
      })}
    </g>
  );
}
