import { exportObsidian } from './helpers/unoptimizedObsidian';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import {
  createCurrent,
  currentWireGaps,
  detachElectrical,
  electricalDrawingGeometry,
  wireDrawingPaths,
} from '../src/annotations/electrical';
import { ElectricalView } from '../src/circuit/annotations/ElectricalView';
import { WireView } from '../src/circuit/wires/WireView';
import { CircuitLayer } from '../src/components/editor/CircuitLayer';
import { createComponent } from '../src/model/catalog';
import { createWire } from '../src/model/factories';
import { emptyDocument } from '../src/model/demo';
import { serializeDocument } from '../src/model/serialization';
import { exportSVG } from '../src/svg/exporter';
import { exportTikz } from '../src/tikz/exporter';
import { getExportSelection } from '../src/tikz/selection';
import { distance, midpoint, pointsPath, localToWorld, wirePoints } from '../src/utils/geometry';
import { currentZoomFixture } from './helpers/currentZoomFixture';
import type { CircuitDocument, ElectricalAnnotation, Point } from '../src/model/types';

function visibleMarkup(current: ElectricalAnnotation, doc: CircuitDocument, zoom: number) {
  return renderToStaticMarkup(<ElectricalView object={current} doc={doc} zoom={zoom} />).replace(
    /<path[^>]+stroke="transparent"[^>]*><\/path>/,
    '',
  );
}

function fixture(end: Point = { x: 400, y: 0 }) {
  const wire = createWire({ kind: 'free', point: { x: 0, y: 0 } }, { kind: 'free', point: end });
  const source = { ...emptyDocument(), objects: [wire] };
  const current = createCurrent(wire, { x: end.x / 2, y: end.y / 2 }, source);
  current.label.text = '';
  const doc: CircuitDocument = { ...source, objects: [wire, current] };
  return { wire, current, doc };
}

function raster(zoom: number, grid = false) {
  const { wire, current, doc } = fixture();
  const points = wirePoints(wire, doc);
  const markup = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="200">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="3" r="0.8" fill="#94a3b8" />
        </pattern>
      </defs>
      <rect width="1000" height="200" fill="white" />
      {grid && <rect width="1000" height="200" fill="url(#grid)" />}
      <g transform={`translate(500 100) scale(${zoom}) translate(-200 0)`}>
        <WireView
          object={wire}
          points={points}
          paths={wireDrawingPaths(points, currentWireGaps(doc).get(wire.id))}
        />
        <ElectricalView object={current} doc={doc} zoom={zoom} hideLabel />
      </g>
    </svg>,
  );
  return new Resvg(markup).render();
}

describe('current annotations in document space', () => {
  it.each([
    { x: 400, y: 0 },
    { x: 0, y: 400 },
    { x: -400, y: 0 },
    { x: 0, y: -400 },
  ])('keeps shaft, head, stroke and label proportional at 15/50/100/200/400%% on %j', (end) => {
    const { wire, current, doc } = fixture(end);
    const original = serializeDocument(doc),
      route = wirePoints(wire, doc);
    for (const zoom of [0.15, 0.5, 1, 2, 4]) {
      const g = electricalDrawingGeometry(current, doc);
      expect(visibleMarkup(current, doc, zoom)).toBe(visibleMarkup(current, doc, 1));
      const external = { ...current, currentPlacement: 'external' as const };
      for (const reversed of [false, true]) {
        for (const annotation of [current, external]) {
          const directed = { ...annotation, reversed };
          expect(visibleMarkup(directed, doc, zoom)).toBe(visibleMarkup(directed, doc, 1));
        }
      }
      expect(g.fallback).toBe(false);
      expect(distance(g.start, g.end)).toBeCloseTo(36);
      expect(distance(g.head[0], g.head[2])).toBeCloseTo(9);
      expect(g.strokeWidth).toBeCloseTo(current.width);
      expect(g.labelFontSize).toBeCloseTo(current.label.fontSize);
      expect(midpoint(g.start, g.end)).toEqual(midpoint(route[0], route.at(-1)!));
      expect(g.wireGap?.start).toEqual(g.start);
      expect(g.wireGap?.end).toEqual(g.end);
      const reverse = electricalDrawingGeometry({ ...current, reversed: true }, doc);
      expect(reverse.arrowEnd).toEqual(g.arrowStart);
      expect(reverse.arrowStart).toEqual(g.arrowEnd);
      expect(reverse.start).toEqual(g.start);
      expect(reverse.end).toEqual(g.end);
      expect(reverse.wireGap).toEqual(g.wireGap);
      expect(reverse.labelPoint).toEqual(g.labelPoint);
      expect(reverse.strokeWidth).toBe(g.strokeWidth);
    }
    expect(serializeDocument(doc)).toBe(original);
    expect(wirePoints(wire, doc)).toEqual(route);
  });

  it.each(['golden', 'circuit'])(
    'golden raster: %s is identical when normalized to the same scale',
    (scene) => {
      const doc = currentZoomFixture(scene);
      const rasters = [0.15, 0.5, 1, 2, 4].map((zoom) => {
        // Normalize only the viewport: any inverse zoom inside the visible scene
        // survives this transform and produces different pixels.
        const markup = renderToStaticMarkup(
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1000"
            height="1000"
            viewBox={`${-250 * zoom} ${-250 * zoom} ${500 * zoom} ${500 * zoom}`}
          >
            <g transform={`scale(${zoom})`}>
              <CircuitLayer doc={doc} selection={[]} terminals={false} zoom={zoom} />
            </g>
          </svg>,
        );
        return new Resvg(markup).render().asPng();
      });
      for (const raster of rasters) expect(raster.equals(rasters[2])).toBe(true);
    },
  );

  it('preserves dots behind the old mask footprint and contains no background patch', () => {
    const rendered = raster(1, true);
    const pixel = (x: number, y: number) => {
      const offset = (y * rendered.width + x) * 4;
      return [...rendered.pixels.slice(offset, offset + 3)];
    };
    expect(pixel(500, 103)[2]).toBeLessThan(250); // grid dot 3px below shaft survives
    expect(pixel(500, 100)[0]).toBeGreaterThan(pixel(500, 100)[1] * 1.5); // red shaft
    for (const zoom of [0.15, 0.5, 1, 2, 4]) {
      const { current, doc } = fixture();
      const markup = renderToStaticMarkup(
        <ElectricalView object={current} doc={doc} zoom={zoom} hideLabel />,
      );
      expect(markup).not.toContain('white');
      expect(markup).not.toMatch(/mask|<rect|<filter/);
    }
  });

  it('draws uninterrupted ink when shaft and wire have the same color', () => {
    const { wire, current, doc } = fixture();
    current.color = wire.color;
    const svg = exportSVG(doc),
      bounds = /viewBox="([^"]+)"/.exec(svg)![1].split(' ').map(Number);
    const rendered = new Resvg(svg, { fitTo: { mode: 'zoom', value: 4 } }).render();
    for (let x = 174; x <= 226; x++) {
      const px = Math.round((x - bounds[0]) * 4),
        py = Math.round(-bounds[1] * 4);
      const offset = (py * rendered.width + px) * 4;
      expect([...rendered.pixels.slice(offset, offset + 3)].every((value) => value < 80)).toBe(
        true,
      );
    }
  });

  it('splits only visible wire paths, keeping one semantic and hit-tested Wire', () => {
    const { wire, current, doc } = fixture(),
      points = wirePoints(wire, doc);
    const gaps = currentWireGaps(doc).get(wire.id)!;
    expect(wireDrawingPaths(points, gaps)).toEqual([
      [points[0], { x: 182, y: 0 }],
      [{ x: 218, y: 0 }, points[1]],
    ]);
    const markup = renderToStaticMarkup(
      <CircuitLayer doc={doc} selection={[]} terminals={false} zoom={1} />,
    );
    expect(markup).toContain('d="M 0 0 L 400 0" fill="none" stroke="transparent"');
    expect(markup).toContain('d="M 0 0 L 182 0 M 218 0 L 400 0"');
    expect(markup).not.toContain('data-current-mask');
    expect(doc.objects.filter((object) => object.kind === 'wire')).toEqual([wire]);
    expect(doc.objects.filter((object) => object.kind === 'junction')).toHaveLength(0);
    const another = { ...current, id: 'another', wireSegment: { index: 0, ratio: 0.52 } };
    const overlap = currentWireGaps({ ...doc, objects: [wire, current, another] }).get(wire.id)!;
    expect(wireDrawingPaths(points, overlap)).toEqual([
      [points[0], { x: 182, y: 0 }],
      [{ x: 226, y: 0 }, points[1]],
    ]);
  });

  it.each([45, 135, 225, 315] as const)(
    'follows the real %d° terminal lead and stays integrated even on short leads',
    (rotation) => {
      const component = { ...createComponent('resistor', { x: 0, y: 0 }), rotation };
      const point = localToWorld(component, { x: 40, y: 0 });
      const wire = createWire(
        { kind: 'terminal', componentId: component.id, terminalId: 'b' },
        { kind: 'free', point: { x: 160, y: 80 } },
      );
      const source = { ...emptyDocument(), objects: [component, wire] },
        route = wirePoints(wire, source);
      const current = createCurrent(wire, midpoint(point, route[1]), source);
      const doc = { ...source, objects: [...source.objects, current] },
        original = serializeDocument(doc);
      expect(current.wireSegment?.index).toBe(0);
      for (const zoom of [0.15, 0.5, 1, 2, 4]) {
        const g = electricalDrawingGeometry(current, doc);
        expect(visibleMarkup(current, doc, zoom)).toBe(visibleMarkup(current, doc, 1));
        const external = { ...current, currentPlacement: 'external' as const };
        for (const reversed of [false, true]) {
          for (const annotation of [current, external]) {
            const directed = { ...annotation, reversed };
            expect(visibleMarkup(directed, doc, zoom)).toBe(visibleMarkup(directed, doc, 1));
          }
        }
        const direction = { x: route[1].x - point.x, y: route[1].y - point.y };
        expect(
          (g.end.x - g.start.x) * direction.y - (g.end.y - g.start.y) * direction.x,
        ).toBeCloseTo(0);
        const length = distance(point, route[1]);
        const available = Math.max(0, length - 2 * Math.min(4, length / 6));
        expect(g.fallback).toBe(false);
        expect(!!g.wireGap).toBe(!g.fallback);
        expect(distance(g.start, g.end)).toBeCloseTo(g.fallback ? 36 : Math.min(36, available));
      }
      expect(serializeDocument(doc)).toBe(original);
    },
  );

  it('exports canonical zoom-1 split geometry to SVG/PNG/TikZ/Obsidian and selection', () => {
    const { current, wire, doc } = fixture(),
      drawing = electricalDrawingGeometry(current, doc);
    const canonical = [exportSVG(doc), exportTikz(doc), exportObsidian(doc)];
    for (const zoom of [0.15, 0.5, 1, 2, 4]) {
      expect(visibleMarkup(current, doc, zoom)).toBe(visibleMarkup(current, doc, 1));
      const external = { ...current, currentPlacement: 'external' as const };
      for (const reversed of [false, true]) {
        for (const annotation of [current, external]) {
          const directed = { ...annotation, reversed };
          expect(visibleMarkup(directed, doc, zoom)).toBe(visibleMarkup(directed, doc, 1));
        }
      }
      currentWireGaps(doc);
      expect([exportSVG(doc), exportTikz(doc), exportObsidian(doc)]).toEqual(canonical);
    }
    expect(canonical[0]).toContain(`d="${pointsPath([drawing.start, drawing.end])}"`);
    expect(canonical[0]).not.toContain('stroke="white"');
    const png = new Resvg(canonical[0]).render().asPng();
    expect([...png.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    for (const output of canonical.slice(1)) {
      const annotation = output.split('% Electrical annotation: current')[1];
      expect(annotation).not.toContain('draw=white');
      expect(annotation.match(/\\draw\[/g)).toHaveLength(2);
    }
    const subset = getExportSelection(doc, [wire.id]);
    expect(subset.objects).toHaveLength(2);
    expect(exportSVG(subset).match(/<path /g)).toHaveLength(3);
    const onlyCurrent = getExportSelection(doc, [current.id]);
    expect(onlyCurrent.objects).toHaveLength(1);
    expect(exportSVG(onlyCurrent).match(/<path /g)).toHaveLength(2);
  });

  it.each([
    { length: 400, ratio: 0 },
    { length: 400, ratio: 1 },
    { length: 30, ratio: 0.5 },
    { length: 20, ratio: 0.5 },
  ])(
    'freezes canonical current geometry when its host is excluded from export: %j',
    ({ length, ratio }) => {
      const { wire, current, doc } = fixture({ x: length, y: 0 });
      current.wireSegment = { index: 0, ratio };
      current.label.text = 'i';
      current.label.offset = { x: 8, y: -5 };
      const detached = detachElectrical(current, doc);
      const standalone = { ...doc, objects: [detached] };
      const source = electricalDrawingGeometry(current, doc);
      const exported = electricalDrawingGeometry(detached, standalone);
      expect(exported.start).toEqual(source.start);
      expect(exported.end).toEqual(source.end);
      exported.head.forEach((point, i) => {
        expect(point.x).toBeCloseTo(source.head[i].x, 10);
        expect(point.y).toBeCloseTo(source.head[i].y, 10);
      });
      expect(exported.labelPoint).toEqual(source.labelPoint);
      expect(detached.wireId).toBeUndefined();
      expect(doc.objects[0]).toBe(wire);
      const subset = getExportSelection(doc, [current.id]);
      const normalized = subset.objects[0];
      if (normalized.kind !== 'electrical') throw new Error('Current missing');
      const normalizedDrawing = electricalDrawingGeometry(normalized, subset);
      expect(distance(normalizedDrawing.start, normalizedDrawing.end)).toBeCloseTo(
        distance(source.start, source.end),
      );
      expect(normalizedDrawing.labelPoint.x - normalizedDrawing.start.x).toBeCloseTo(
        source.labelPoint.x - source.start.x,
        10,
      );
      expect(normalizedDrawing.labelPoint.y - normalizedDrawing.start.y).toBeCloseTo(
        source.labelPoint.y - source.start.y,
        10,
      );
      const canonical = exportSVG(subset);
      for (const zoom of [0.15, 0.5, 1, 2, 4]) {
        const drawing = electricalDrawingGeometry(normalized, subset);
        expect(visibleMarkup(normalized, subset, zoom)).toBe(visibleMarkup(normalized, subset, 1));
        expect(distance(drawing.start, drawing.end)).toBeCloseTo(
          distance(source.start, source.end),
        );
        expect(exportSVG(subset)).toBe(canonical);
      }
    },
  );

  it('scales down on short branches without leaving the wire', () => {
    for (const length of [48, 36, 26, 25, 16, 1, 0]) {
      const { current, wire, doc } = fixture({ x: length, y: 0 });
      const stored = serializeDocument(doc),
        g = electricalDrawingGeometry(current, doc);
      expect(g.fallback).toBe(false);
      expect(distance(g.start, g.end)).toBeCloseTo(
        Math.min(36, length - 2 * Math.min(4, length / 6)),
      );
      expect(midpoint(g.start, g.end).y).toBe(0);
      expect(current.currentPlacement).toBe('inline');
      expect(current.wireId).toBe(wire.id);
      expect(serializeDocument(doc)).toBe(stored);
      expect(exportSVG(doc)).not.toContain('NaN');
    }
  });

  it('keeps segment association through resize and remains integrated through resize', () => {
    const { current, wire, doc } = fixture({ x: 200, y: 0 });
    for (const length of [400, 20, 200]) {
      const resized = {
        ...wire,
        endEndpoint: { kind: 'free' as const, point: { x: length, y: 0 } },
      };
      const next = { ...doc, objects: [resized, current] },
        g = electricalDrawingGeometry(current, next);
      expect(midpoint(g.start, g.end).x).toBe(length / 2);
      expect(g.fallback).toBe(false);
      expect(current.wireSegment).toEqual({ index: 0, ratio: 0.5 });
    }
  });

  it('migrates external flags to the same integrated geometry and highlights only the annotation', () => {
    const { current, doc } = fixture(),
      external = { ...current, currentPlacement: 'external' as const };
    for (const zoom of [0.15, 0.5, 1, 2, 4]) {
      const drawing = electricalDrawingGeometry(external, doc);
      expect(visibleMarkup(external, doc, zoom)).toBe(visibleMarkup(external, doc, 1));
      expect(distance(drawing.start, drawing.end)).toBeCloseTo(36);
      expect(midpoint(drawing.start, drawing.end).y).toBeCloseTo(0);
      expect(drawing.strokeWidth).toBe(external.width);
      expect(drawing.wireGap).not.toBeNull();
      expect(drawing.labelPoint).toEqual(electricalDrawingGeometry(current, doc).labelPoint);
    }
    const markup = renderToStaticMarkup(
      <ElectricalView object={current} doc={doc} selected hideLabel />,
    );
    expect(markup).toContain('selected-symbol');
    expect(markup).toContain('stroke="transparent" stroke-width="20"');
    expect(markup).not.toContain('data-handle');
  });

  it('keeps a low-zoom group outline around the actual current label and head', () => {
    const { current, wire, doc } = fixture();
    current.label.text = 'i';
    for (const zoom of [0.15, 0.5, 1, 2, 4]) {
      const g = electricalDrawingGeometry(current, doc);
      expect(visibleMarkup(current, doc, zoom)).toBe(visibleMarkup(current, doc, 1));
      const external = { ...current, currentPlacement: 'external' as const };
      for (const reversed of [false, true]) {
        for (const annotation of [current, external]) {
          const directed = { ...annotation, reversed };
          expect(visibleMarkup(directed, doc, zoom)).toBe(visibleMarkup(directed, doc, 1));
        }
      }
      const markup = renderToStaticMarkup(
        <CircuitLayer doc={doc} selection={[wire.id, current.id]} terminals={false} zoom={zoom} />,
      );
      const group = /<rect ([^>]+)data-selection="group"/.exec(markup)![1];
      const attribute = (name: string) => Number(new RegExp(`${name}="([^"]+)"`).exec(group)![1]);
      const x = attribute('x'),
        y = attribute('y');
      const right = x + attribute('width'),
        bottom = y + attribute('height');
      for (const point of [
        ...g.head,
        { x: g.labelPoint.x, y: g.labelPoint.y + g.labelFontSize * 0.8 },
      ]) {
        expect(point.x).toBeGreaterThanOrEqual(x);
        expect(point.x).toBeLessThanOrEqual(right);
        expect(point.y).toBeGreaterThanOrEqual(y);
        expect(point.y).toBeLessThanOrEqual(bottom);
      }
    }
  });
});
