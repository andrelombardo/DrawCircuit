import { t } from '../i18n';
import { useMemo } from 'react';
import { componentRegistry } from '../model/catalog';
import type { CircuitDocument, ComponentType, Endpoint, Point, Viewport } from '../model/types';
import { Symbol } from '../circuit/components/Symbol';
import { add, pointsPath, resolveEndpoint, rotatePoint, wirePoints } from '../utils/geometry';
import { placementIndex } from './spatialIndex';
import type { PlacementPreview } from './types';

export function PlacementLayer({
  doc,
  type,
  preview,
  continueEndpoint,
  viewport,
  size,
}: {
  doc: CircuitDocument;
  type: ComponentType | null;
  preview: PlacementPreview | null;
  continueEndpoint: Endpoint | null;
  viewport: Viewport;
  size: { width: number; height: number };
}) {
  const z = viewport.zoom;
  const targets = useMemo(
    () =>
      type
        ? placementIndex(doc).targetsIn({
            x: -viewport.x / z - 20 / z,
            y: -viewport.y / z - 20 / z,
            width: size.width / z + 40 / z,
            height: size.height / z + 40 / z,
          })
        : [],
    [doc, type, viewport, size.width, size.height, z],
  );
  const handles = useMemo(
    () =>
      targets.map((t) => (
        <g key={t.key} data-connection-target={t.key} data-connected={t.connected}>
          <circle
            cx={t.point.x}
            cy={t.point.y}
            r={4 / z}
            fill={t.connected ? '#5681a5' : 'white'}
            stroke="#5681a5"
            strokeWidth={1.2 / z}
            opacity={0.8}
          />
        </g>
      )),
    [targets, z],
  );
  let continuation: Point | null = null;
  if (continueEndpoint) {
    try {
      continuation = resolveEndpoint(continueEndpoint, doc);
    } catch {
      /* Removed target. */
    }
  }
  const active =
    preview?.phase === 'snapped'
      ? preview.candidate.point
      : preview?.phase === 'anchored' || preview?.phase === 'anchor-target'
        ? preview.target.point
        : null;
  const ts = type ? componentRegistry[type].terminals : [];
  let connectionPath = '';
  if (preview?.phase === 'anchored' && type) {
    const t = ts.find((t) => t.id === preview.terminalId)!;
    const wire = {
      kind: 'wire' as const,
      id: 'preview',
      startEndpoint: preview.target.endpoint,
      endEndpoint: {
        kind: 'free' as const,
        point: add(preview.position, rotatePoint({ x: t.localX, y: t.localY }, preview.rotation)),
      },
      vertices: [],
      color: '#269978',
      width: 2,
    };
    connectionPath = pointsPath(wirePoints(wire, doc));
  }
  return (
    <g data-layer="smart-placement" pointerEvents="none">
      {handles}
      {continuation && (
        <g data-quick-continue="true">
          <circle
            cx={continuation.x}
            cy={continuation.y}
            r={8 / z}
            fill="none"
            stroke="#269978"
            strokeWidth={1.5 / z}
          />
          <circle
            cx={continuation.x}
            cy={continuation.y}
            r={3.5 / z}
            fill="white"
            stroke="#269978"
            strokeWidth={1.3 / z}
          />
        </g>
      )}
      {preview?.guides.map((g, i) => (
        <path
          key={i}
          d={pointsPath([g.start, g.end])}
          className="smart-guide"
          strokeWidth={1 / z}
        />
      ))}
      {connectionPath && (
        <path
          data-connection-preview="true"
          d={connectionPath}
          fill="none"
          stroke="#269978"
          strokeWidth={1.8 / z}
          strokeDasharray={`${5 / z} ${4 / z}`}
        />
      )}
      {preview?.phase === 'inline-candidate' && (
        <g data-inline-preview="true">
          <path d={pointsPath(preview.candidate.cuts)} stroke="white" strokeWidth={8 / z} />
          {preview.candidate.cuts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={8 / z}
              fill="#e8f6ef"
              stroke="#269978"
              strokeWidth={1.5 / z}
            />
          ))}
        </g>
      )}
      {type && preview && (
        <g data-placement-phase={preview.phase}>
          <g
            transform={`translate(${preview.position.x} ${preview.position.y}) rotate(${preview.rotation})`}
            opacity={preview.phase === 'free' || preview.phase === 'anchor-target' ? 0.4 : 0.7}
          >
            <Symbol
              type={type}
              bodyText={componentRegistry[type].internalText}
              rotation={preview.rotation}
            />
          </g>
          {ts.map((t) => {
            const p = add(
              preview.position,
              rotatePoint({ x: t.localX, y: t.localY }, preview.rotation),
            );
            const chosen =
              (preview.phase === 'snapped' && preview.candidate.terminalId === t.id) ||
              (preview.phase === 'anchored' && preview.terminalId === t.id);
            return (
              <g key={t.id} data-preview-terminal={t.id}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4.5 / z}
                  fill={chosen ? '#269978' : 'white'}
                  stroke="#269978"
                  strokeWidth={1.4 / z}
                />
              </g>
            );
          })}
        </g>
      )}
      {active && (
        <g data-smart-snap="true">
          <circle
            cx={active.x}
            cy={active.y}
            r={10 / z}
            fill="#269978"
            fillOpacity={0.1}
            stroke="#269978"
            strokeWidth={1.3 / z}
          />
          <circle cx={active.x} cy={active.y} r={4 / z} fill="#269978" />
        </g>
      )}
      {preview?.phase === 'inline-candidate' && (
        <text
          x={preview.position.x}
          y={preview.position.y - 24 / z}
          fontSize={12 / z}
          textAnchor="middle"
          fill="#21795d"
        >
          {t('Insert into wire · click to confirm')}{' '}
        </text>
      )}
    </g>
  );
}
