import { highlightPath, highlightPoints, highlightEndpointIndices } from '../../annotations/highlight';
import { arrowCenter, rotationHandle } from '../../utils/arrows';
import { braceGeometry } from '../../annotations/brace';
import { electricalDrawingGeometry } from '../../annotations/electrical';
import type { CircuitDocument, CircuitObject, Point } from '../../model/types';
import { arrowPath, pointsPath, rotatePoint, wirePoints } from '../../utils/geometry';
import { unionBounds, contentBounds } from '../../utils/visualBounds';
import { loopGeometry, loopPath } from '../../utils/loops';
function selectionBounds(object: CircuitObject, doc: CircuitDocument) {
  if (object.kind !== 'electrical' || object.mode !== 'current') return contentBounds(object, doc);
  const g = electricalDrawingGeometry(object, doc);
  const boxes = [g.start, g.end, ...g.head].map((point) => ({
    x: point.x - g.strokeWidth / 2,
    y: point.y - g.strokeWidth / 2,
    width: g.strokeWidth,
    height: g.strokeWidth,
  }));
  if (object.label.text) {
    const width = Math.max(g.labelFontSize, object.label.text.length * g.labelFontSize * 0.65);
    const height = g.labelFontSize * Math.max(1.6, object.label.text.split('\n').length * 1.4);
    for (const x of [-width / 2, width / 2])
      for (const y of [-height / 2, height / 2]) {
        const point = rotatePoint({ x, y }, object.label.rotation);
        boxes.push({
          x: g.labelPoint.x + point.x,
          y: g.labelPoint.y + point.y,
          width: 0,
          height: 0,
        });
      }
  }
  return unionBounds(boxes);
}
function Handle({
  p,
  name,
  zoom,
  square = false,
}: {
  p: Point;
  name: string;
  zoom: number;
  square?: boolean;
}) {
  return (
    <g data-handle={name} className={`handle-hit handle-${name.split(':')[0]}`}>
      <circle cx={p.x} cy={p.y} r={11 / zoom} fill="transparent" />
      {square ? (
        <rect
          x={p.x - 4 / zoom}
          y={p.y - 4 / zoom}
          width={8 / zoom}
          height={8 / zoom}
          className="control-handle"
        />
      ) : (
        <circle cx={p.x} cy={p.y} r={5 / zoom} className="control-handle" />
      )}
    </g>
  );
}
export function SelectionLayer({
  doc,
  selection,
  zoom,
  hoveredArrow,
}: {
  doc: CircuitDocument;
  selection: string[];
  hoveredArrow?: string | null;
  zoom: number;
}) {
  const selected = new Set(selection);
  const objects = doc.objects.filter((object) => selected.has(object.id));
  const single = objects.length === 1;
  return (
    <g data-layer="selection">
      {selection.length > 1 && (
        <rect
          {...unionBounds(objects.map((o) => selectionBounds(o, doc)))}
          className="selection-box"
          data-selection="group"
          pointerEvents="none"
        />
      )}
      {objects.map((o) => {
        const path =
          o.kind === 'highlight'
            ? highlightPath(o, doc)
            : o.kind === 'line'
              ? pointsPath([o.start, o.end])
              : o.kind === 'brace'
                ? braceGeometry(o).d
                : o.kind === 'wire'
                  ? pointsPath(wirePoints(o, doc))
                  : o.kind === 'arrow'
                    ? arrowPath(o)
                    : o.kind === 'loop-arrow'
                      ? loopPath(o)
                      : null;
        return (
          <g key={o.id} data-object={o.id}>
            {path ? (
              <path
                d={path}
                fill="none"
                stroke="#6695ed"
                opacity={0.2}
                strokeWidth={7}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            ) : null}
            {single && (
              <>
                {o.kind === 'highlight' && o.mode !== 'component' &&
                  (() => {
                    const points = highlightPoints(o, doc);
                    const indices =
                      o.mode === 'free' ? highlightEndpointIndices(o) : [0, points.length - 1];
                    return points.length ? (
                      <>
                        <Handle p={points[indices[0]]} name="highlightStart" zoom={zoom} />
                        <Handle p={points[indices[1]]} name="highlightEnd" zoom={zoom} />
                      </>
                    ) : null;
                  })()}
                {o.kind === 'wire' && (
                  <>
                    {o.vertices.map((p, i) => (
                      <Handle key={i} p={p} name={`vertex:${i}`} zoom={zoom} square />
                    ))}
                    {[wirePoints(o, doc)[0], wirePoints(o, doc).at(-1)!].map((p, i) => (
                      <Handle key={i} p={p} name={i ? 'wireEnd' : 'wireStart'} zoom={zoom} />
                    ))}
                  </>
                )}
                {o.kind === 'rectangle' && (
                  <>
                    <rect
                      x={o.x}
                      y={o.y}
                      width={o.width}
                      height={o.height}
                      className="selection-box"
                      fill="none"
                      pointerEvents="none"
                    />
                    {(['NW', 'NE', 'SW', 'SE'] as const).map((corner) => (
                      <Handle
                        key={corner}
                        name={`rect${corner}`}
                        zoom={zoom}
                        square
                        p={{
                          x: o.x + (corner.endsWith('E') ? o.width : 0),
                          y: o.y + (corner.startsWith('S') ? o.height : 0),
                        }}
                      />
                    ))}
                  </>
                )}
                {(o.kind === 'arrow' || o.kind === 'brace' || o.kind === 'line') && (
                  <>
                    {o.kind === 'arrow' && o.type === 'curve' && (
                      <>
                        <path
                          d={`M${o.start.x} ${o.start.y}L${o.controlPoints[0].x} ${o.controlPoints[0].y}M${o.end.x} ${o.end.y}L${o.controlPoints[1].x} ${o.controlPoints[1].y}`}
                          className="handle-line"
                          pointerEvents="none"
                        />
                        {o.controlPoints.map((p, i) => (
                          <Handle key={i} p={p} name={`control:${i}`} zoom={zoom} />
                        ))}
                      </>
                    )}
                    <Handle p={o.start} name="start" zoom={zoom} />
                    <Handle p={o.end} name="end" zoom={zoom} />
                  </>
                )}
                {o.kind === 'loop-arrow' && (
                  <>
                    <g
                      transform={`rotate(${o.rotation ?? 0} ${o.x + o.width / 2} ${o.y + o.height / 2})`}
                    >
                      <rect
                        x={o.x}
                        y={o.y}
                        width={o.width}
                        height={o.height}
                        className="handle-line"
                        fill="none"
                        pointerEvents="none"
                      />
                      <Handle p={o} name="loopNW" zoom={zoom} square />
                      <Handle
                        p={{ x: o.x + o.width, y: o.y + o.height }}
                        name="loopSE"
                        zoom={zoom}
                        square
                      />
                    </g>
                    <Handle p={loopGeometry(o).end} name="loopHead" zoom={zoom} />
                  </>
                )}
                {(o.kind === 'arrow' || o.kind === 'loop-arrow') && hoveredArrow === o.id && (
                  <g className="rotation-control" aria-label="Ruota freccia · Shift aggancia a 15°">
                    <path
                      d={pointsPath([arrowCenter(o), rotationHandle(o, zoom)])}
                      className="handle-line"
                      pointerEvents="none"
                      opacity={0.35}
                    />
                    <Handle p={rotationHandle(o, zoom)} name="rotate" zoom={zoom} />
                  </g>
                )}
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}
