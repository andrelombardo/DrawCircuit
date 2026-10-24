import { AngleView } from '../../circuit/annotations/AngleView';
import { highlightPaintGroups } from '../../annotations/highlight';
import { HighlightView } from '../../circuit/annotations/HighlightView';
import type { Highlight } from '../../model/types';
import { GraphicView } from '../../circuit/annotations/GraphicView';
import { drawingWireGaps } from '../../utils/wireRendering';
import { BraceView } from '../../circuit/annotations/BraceView';
import { WireBridges } from '../../circuit/wires/WireBridges';
import { ElectricalView } from '../../circuit/annotations/ElectricalView';
import { wireDrawingPaths } from '../../annotations/electrical';
import { cloneElement, isValidElement, memo, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { CircuitDocument, CircuitObject } from '../../model/types';
import { isLooseEndpoint, wirePoints } from '../../utils/geometry';
import { ComponentView } from '../../circuit/components/ComponentView';
import { WireView } from '../../circuit/wires/WireView';
import { JunctionView } from '../../circuit/junctions/JunctionView';
import { ArrowView } from '../../circuit/annotations/ArrowView';
import { LoopArrowView } from '../../circuit/annotations/LoopArrowView';
import { MathText } from '../../circuit/annotations/MathText';
import { inlineTextTarget } from '../../utils/labels';
import { SelectionLayer } from './SelectionLayer';
import { objectBorders, paintVariants, parentFrame } from '../../model/shapeAppearance';
import { dashPattern } from '../../utils/strokeStyle';
function Appearance({ object, children }: { object: CircuitObject; children: ReactNode }) {
  const renderer = isValidElement<{ object: CircuitObject }>(children) && children.props.object ? children : null;
  const normalized = renderer ? cloneElement(renderer, { object: { ...object, styleOpacity: 1, blendMode: 'normal' } }) : children;
  const variants = renderer ? paintVariants(object) : null;
  const borders = [...objectBorders(object)].reverse().filter((p) => p.enabled);
  return <g opacity={object.styleOpacity ?? 1} style={{ mixBlendMode: object.blendMode ?? 'normal' }} data-appearance={object.id}>
    {variants && renderer ? <>
      <g opacity={0}>{normalized}</g>
      {variants.map((variant, i) => <g key={i} pointerEvents="none" aria-hidden="true" strokeDasharray={borders[i] && dashPattern(borders[i], borders[i].width)?.join(' ')}>
        {cloneElement(renderer, { object: variant })}
      </g>)}
    </> : normalized}
  </g>;
}
function TextView({ object, selected }: { object: Extract<CircuitObject, { kind: 'text' }>; selected: boolean }) {
  return <g data-object={object.id} className={`circuit-object${selected ? ' selected-symbol' : ''}`}>
    <MathText text={object.text} x={object.x} y={object.y} color={object.color} opacity={object.opacity}
      fontSize={object.fontSize} align={object.align} rotation={object.rotation} />
  </g>;
}
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
  scope,
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
  scope?: string;
}) {
  const objects = useMemo(() => {
    const frame = scope && doc.objects.find((o) => o.id === scope);
    const ids = frame && frame.kind === 'rectangle' && frame.frame ? new Set(frame.frame.children) : null;
    return doc.objects.filter((o) => ids ? ids.has(o.id) : !parentFrame(doc, o.id));
  }, [doc, scope]);
  const selected = useMemo(() => new Set(selection), [selection]);
  const nearby = useMemo(() => new Set(nearbyComponents), [nearbyComponents]);
  const currentGaps = useMemo(() => drawingWireGaps(doc), [doc]);
  const wires = useMemo(
    () =>
      objects.flatMap((o) =>
        o.kind === 'wire' ? [{ object: o, points: wirePoints(o, doc) }] : [],
      ),
    [doc, objects],
  );
  return (
    <>
      <g data-layer="highlights">
        {highlightPaintGroups({ ...doc, objects }).map((group) => {
          const first = group[0], paints = first.borders ? [...first.borders].reverse().filter((p) => p.enabled) : [{ id: 'stroke', color: first.color, opacity: first.opacity, width: first.width }];
          return <g key={first.id} opacity={first.styleOpacity ?? 1} style={{ mixBlendMode: first.blendMode ?? 'normal' }}>
            {paints.map((paint) => <g key={paint.id} opacity={paint.opacity}>
              {group.map((object) => <HighlightView key={object.id} object={{ ...object, color: paint.color, width: paint.width }} doc={doc} grouped />)}
            </g>)}
          </g>;
        })}
        {!scope && highlightDraft && (
          <g pointerEvents="none">
            <HighlightView object={highlightDraft} doc={doc} interactive={false} />
          </g>
        )}
      </g>
      <g data-layer="graphics">
        {objects.map((o) =>
          o.kind === 'rectangle' || o.kind === 'circle' || o.kind === 'line' ? (
            o.kind === 'rectangle' && o.frame ? <Appearance key={o.id} object={o}>
              <GraphicView object={{ ...o, styleOpacity: 1, blendMode: 'normal' }} doc={doc} />
              <CircuitLayer doc={doc} scope={o.id} selection={selection} terminals={terminals} nearbyComponents={nearbyComponents}
                zoom={zoom} activeLabel={activeLabel} editingTextId={editingTextId} editingLabelId={editingLabelId} hoveredArrow={hoveredArrow} />
            </Appearance> : o.kind === 'line' ? <Appearance key={o.id} object={o}><GraphicView object={o} doc={doc} /></Appearance> : <GraphicView key={o.id} object={o} doc={doc} />
          ) : null,
        )}
      </g>
      <g data-layer="wires">
        {wires.map(({ object, points }) => (
          <Appearance key={object.id} object={object}><WireView
            object={object}
            points={points}
            looseStart={isLooseEndpoint(object.startEndpoint, doc)}
            looseEnd={isLooseEndpoint(object.endEndpoint, doc)}
            paths={wireDrawingPaths(points, currentGaps.get(object.id))}
          /></Appearance>
        ))}
      </g>
      <WireBridges doc={doc} wireIds={wires.map(({ object }) => object.id)} />
      <g data-layer="components">
        {objects.map((o) =>
          o.kind === 'component' ? (
            <Appearance key={o.id} object={o}><ComponentView
              object={o}
              selected={selected.has(o.id) && activeLabel !== o.id}
              terminals={
                terminals || (selection.length === 1 && selected.has(o.id)) || nearby.has(o.id)
              }
            /></Appearance>
          ) : null,
        )}
      </g>
      <g data-layer="junctions">
        {objects.map((o) =>
          o.kind === 'junction' ? (
            <Appearance key={o.id} object={o}><JunctionView
              object={o}
              selected={selected.has(o.id) && activeLabel !== o.id}
            /></Appearance>
          ) : null,
        )}
      </g>
      <g data-layer="annotations">
        {objects.map((o) =>
          o.kind === 'angle' ? <Appearance key={o.id} object={o}><AngleView object={o} zoom={zoom} hideLabel /></Appearance> : o.kind === 'brace' ? (
            <Appearance key={o.id} object={o}><BraceView
              object={o}
              zoom={zoom}
              labelSelected={selected.has(o.id) && activeLabel === o.id}
              hideLabel
            /></Appearance>
          ) : o.kind === 'electrical' ? (
            <Appearance key={o.id} object={o}><ElectricalView
              object={o}
              doc={doc}
              selected={selected.has(o.id) && activeLabel !== o.id}
              labelSelected={selected.has(o.id) && activeLabel === o.id}
              hideLabel
              zoom={zoom}
            /></Appearance>
          ) : o.kind === 'arrow' ? (
            <Appearance key={o.id} object={o}><ArrowView object={o} zoom={zoom} /></Appearance>
          ) : o.kind === 'loop-arrow' ? (
            <Appearance key={o.id} object={o}><LoopArrowView object={o} zoom={zoom} /></Appearance>
          ) : o.kind === 'text' && o.id !== editingTextId ? (
            <Appearance key={o.id} object={o}><TextView object={o} selected={selected.has(o.id)} /></Appearance>
          ) : null,
        )}
      </g>
      <g data-layer="labels">
        {objects.map((o) => {
          if (!('label' in o) || o.id === editingLabelId) return null;
          const target = inlineTextTarget(o, doc)!;
          return (
            <g key={o.id} data-object={o.id} opacity={o.styleOpacity ?? 1} style={{ mixBlendMode: o.blendMode ?? 'normal' }}>
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
      {!scope && <SelectionLayer
        doc={doc}
        hoveredArrow={hoveredArrow}
        selection={selection.filter((id) => id !== activeLabel)}
        zoom={zoom}
      />}
    </>
  );
});
