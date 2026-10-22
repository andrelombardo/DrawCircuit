import { linePoints } from '../../utils/geometry';
import { highlightPaintGroups } from '../../annotations/highlight';
import { HighlightView } from '../../circuit/annotations/HighlightView';
import type { Highlight } from '../../model/types';
import { GraphicView } from '../../circuit/annotations/GraphicView';
import { drawingWireGaps } from '../../utils/wireRendering';
import { BraceView } from '../../circuit/annotations/BraceView';
import { WireBridges } from '../../circuit/wires/WireBridges';
import { ElectricalView } from '../../circuit/annotations/ElectricalView';
import { wireDrawingPaths } from '../../annotations/electrical';
import { memo, useMemo } from 'react';
import type { CircuitDocument } from '../../model/types';
import { isLooseEndpoint, wirePoints } from '../../utils/geometry';
import { ComponentView } from '../../circuit/components/ComponentView';
import { WireView } from '../../circuit/wires/WireView';
import { JunctionView } from '../../circuit/junctions/JunctionView';
import { ArrowView } from '../../circuit/annotations/ArrowView';
import { LoopArrowView } from '../../circuit/annotations/LoopArrowView';
import { MathText } from '../../circuit/annotations/MathText';
import { inlineTextTarget } from '../../utils/labels';
import { SelectionLayer } from './SelectionLayer';
export const CircuitLayer = memo(function CircuitLayer({
  doc,
  selection,
  terminals,
  nearbyComponents = [],
  zoom,
  activeLabel = null,
  editingTextId,
  editingLabelId,
  hoveredArrow,
  highlightDraft,
}: {
  doc: CircuitDocument;
  highlightDraft?: Highlight | null;
  selection: string[];
  terminals: boolean;
  nearbyComponents?: string[];
  zoom: number;
  activeLabel?: string | null;
  editingTextId?: string;
  editingLabelId?: string;
  hoveredArrow?: string | null;
}) {
  const selected = useMemo(() => new Set(selection), [selection]);
  const nearby = useMemo(() => new Set(nearbyComponents), [nearbyComponents]);
  const currentGaps = useMemo(() => drawingWireGaps(doc), [doc]);
  const wires = useMemo(
    () =>
      doc.objects.flatMap((o) =>
        o.kind === 'wire' ? [{ object: o, points: wirePoints(o, doc) }] : [],
      ),
    [doc],
  );
  return (
    <>
      <g data-layer="highlights">
        {highlightPaintGroups(doc).map((group) => (
          <g key={group[0].id} opacity={group[0].opacity}>
            {group.map((object) => (
              <HighlightView key={object.id} object={object} doc={doc} grouped />
            ))}
          </g>
        ))}
        {highlightDraft && (
          <g pointerEvents="none">
            <HighlightView object={highlightDraft} doc={doc} interactive={false} />
          </g>
        )}
      </g>
      <g data-layer="graphics">
        {doc.objects.map((o) =>
          o.kind === 'rectangle' || o.kind === 'circle' || o.kind === 'line' ? (
            <GraphicView key={o.id} object={o} points={o.kind === 'line' ? linePoints(o, doc) : undefined} />
          ) : null,
        )}
      </g>
      <g data-layer="wires">
        {wires.map(({ object, points }) => (
          <WireView
            key={object.id}
            object={object}
            points={points}
            looseStart={isLooseEndpoint(object.startEndpoint, doc)}
            looseEnd={isLooseEndpoint(object.endEndpoint, doc)}
            paths={wireDrawingPaths(points, currentGaps.get(object.id))}
          />
        ))}
      </g>
      <WireBridges doc={doc} />
      <g data-layer="components">
        {doc.objects.map((o) =>
          o.kind === 'component' ? (
            <ComponentView
              key={o.id}
              object={o}
              selected={selected.has(o.id) && activeLabel !== o.id}
              terminals={
                terminals || (selection.length === 1 && selected.has(o.id)) || nearby.has(o.id)
              }
            />
          ) : null,
        )}
      </g>
      <g data-layer="junctions">
        {doc.objects.map((o) =>
          o.kind === 'junction' ? (
            <JunctionView
              key={o.id}
              object={o}
              selected={selected.has(o.id) && activeLabel !== o.id}
            />
          ) : null,
        )}
      </g>
      <g data-layer="annotations">
        {doc.objects.map((o) =>
          o.kind === 'brace' ? (
            <BraceView
              key={o.id}
              object={o}
              zoom={zoom}
              labelSelected={selected.has(o.id) && activeLabel === o.id}
              hideLabel
            />
          ) : o.kind === 'electrical' ? (
            <ElectricalView
              key={o.id}
              object={o}
              doc={doc}
              selected={selected.has(o.id) && activeLabel !== o.id}
              labelSelected={selected.has(o.id) && activeLabel === o.id}
              hideLabel
              zoom={zoom}
            />
          ) : o.kind === 'arrow' ? (
            <ArrowView key={o.id} object={o} zoom={zoom} />
          ) : o.kind === 'loop-arrow' ? (
            <LoopArrowView key={o.id} object={o} zoom={zoom} />
          ) : o.kind === 'text' && o.id !== editingTextId ? (
            <g
              key={o.id}
              data-object={o.id}
              className={`circuit-object${selected.has(o.id) ? ' selected-symbol' : ''}`}
            >
              <MathText
                text={o.text}
                x={o.x}
                y={o.y}
                color={o.color}
                opacity={o.opacity}
                fontSize={o.fontSize}
                align={o.align}
                rotation={o.rotation}
              />
            </g>
          ) : null,
        )}
      </g>
      <g data-layer="labels">
        {doc.objects.map((o) => {
          if (!('label' in o) || o.id === editingLabelId) return null;
          const target = inlineTextTarget(o, doc)!;
          return (
            <g key={o.id} data-object={o.id}>
              <MathText
                text={target.text}
                x={target.point.x}
                y={target.point.y}
                color={target.color}
                opacity={target.opacity}
                fontSize={target.fontSize}
                rotation={target.rotation}
                labelId={o.id}
                selected={selected.has(o.id) && activeLabel === o.id}
              />
            </g>
          );
        })}
      </g>
      <SelectionLayer
        doc={doc}
        hoveredArrow={hoveredArrow}
        selection={selection.filter((id) => id !== activeLabel)}
        zoom={zoom}
      />
    </>
  );
});
