// @vitest-environment jsdom
import { exportObsidian } from './helpers/unoptimizedObsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { componentRegistry, createComponent } from '../src/model/catalog';
import { createWire } from '../src/model/factories';
import { componentTypes, ROTATIONS, isRotation } from '../src/model/types';
import type { CircuitDocument, Point, Rotation } from '../src/model/types';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import {
  localToWorld,
  objectBounds,
  resolveEndpoint,
  safeWirePoints,
  wirePoints,
} from '../src/utils/geometry';
import { cloneObjects, extractSelection, rotateObjects } from '../src/utils/operations';
import { getMeasurementBounds } from '../src/utils/measurementGeometry';
import { wireCandidate } from '../src/utils/wires';
import { findSnapCandidate, snappedPosition } from '../src/smartPlacement/findCandidates';
import {
  createPersonalBlock,
  instantiatePersonalBlock,
  parsePersonalBlocks,
  serializePersonalBlocks,
} from '../src/personalBlocks/library';
import { saveDocumentNow, STORAGE_KEY, useEditorStore } from '../src/store/editorStore';
import { exportSVG } from '../src/svg/exporter';
import { pngDimensions } from '../src/png/exporter';
import { exportTikz, tikzCoordinate } from '../src/tikz/exporter';
import { isExportableObject } from '../src/tikz/validation';
import { CANVAS_UNITS_PER_CM, formatNumber } from '../src/tikz/units';
import { symbolMeasurementBounds } from '../src/model/symbolBounds';
import { createBrace } from '../src/annotations/brace';

const document = (objects: CircuitDocument['objects']): CircuitDocument => ({
  version: 1,
  title: 'Eight angles',
  objects,
});
const expectedPoint = (origin: Point, point: Point, rotation: Rotation): Point => {
  const angle = (rotation * Math.PI) / 180;
  return {
    x: origin.x + point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: origin.y + point.x * Math.sin(angle) + point.y * Math.cos(angle),
  };
};
const closePoint = (actual: Point, expected: Point) => {
  expect(actual.x).toBeCloseTo(expected.x, 9);
  expect(actual.y).toBeCloseTo(expected.y, 9);
};
const requested = [
  'resistor',
  'capacitor',
  'diode',
  'voltageSource',
  'xnorGate',
  'opAmp',
  'npn',
] as const;

beforeEach(() => {
  const saved = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
  });
  useEditorStore.setState({
    document: document([]),
    selection: [],
    activeLabel: null,
    tool: 'select',
    past: [],
    future: [],
    gestureStart: null,
    placementRotation: 0,
  });
});

describe('45 degree component geometry', () => {
  it.each(componentTypes)(
    '%s preserves real terminals, wire snapping, hit bounds and JSON at all eight angles',
    (type) => {
      for (const rotation of ROTATIONS) {
        const component = { ...createComponent(type, { x: -120.5, y: 80.25 }), rotation };
        const doc = document([component]);
        expect(deserializeDocument(serializeDocument(doc))).toEqual(doc);
        expect(isExportableObject(component)).toBe(true);
        const bounds = objectBounds(component, doc);
        for (const terminal of component.terminals) {
          const endpoint = {
            kind: 'terminal' as const,
            componentId: component.id,
            terminalId: terminal.id,
          };
          const point = expectedPoint(
            component,
            { x: terminal.localX, y: terminal.localY },
            rotation,
          );
          closePoint(resolveEndpoint(endpoint, doc), point);
          const candidate = wireCandidate(point, doc, 2);
          expect(candidate.kind).toBe('terminal');
          if (candidate.kind === 'terminal') expect(candidate.endpoint).toEqual(endpoint);
          expect(point.x).toBeGreaterThanOrEqual(bounds.x - 1e-9);
          expect(point.x).toBeLessThanOrEqual(bounds.x + bounds.width + 1e-9);
          expect(point.y).toBeGreaterThanOrEqual(bounds.y - 1e-9);
          expect(point.y).toBeLessThanOrEqual(bounds.y + bounds.height + 1e-9);
          const snap = findSnapCandidate(
            doc,
            type,
            { x: component.x + 2, y: component.y + 1 },
            rotation,
            1,
            terminal.id,
          )!;
          expect(snap).toBeTruthy();
          closePoint(snappedPosition(type, rotation, snap), component);
        }
      }
    },
  );

  it('validates exactly the supported numeric angles', () => {
    for (const angle of ROTATIONS) expect(isRotation(angle)).toBe(true);
    for (const angle of [22.5, 360, -45, '45', NaN, Infinity])
      expect(isRotation(angle)).toBe(false);
  });

  it('keeps coincident diagonal terminal connections invisible', () => {
    const component = { ...createComponent('resistor', { x: 0, y: 0 }), rotation: 45 as const };
    const point = localToWorld(component, { x: 40, y: 0 });
    const wire = createWire(
      { kind: 'terminal', componentId: component.id, terminalId: 'b' },
      { kind: 'free', point },
    );
    const doc = document([component, wire]);
    expect(wirePoints(wire, doc)).toEqual([point]);
    expect(safeWirePoints(wire, doc)).toEqual([point]);
  });

  it.each(requested)(
    '%s keeps diagonal lead-outs aligned to pins and authored wire waypoints fixed',
    (type) => {
      for (const rotation of [45, 135, 225, 315] as Rotation[]) {
        const component = { ...createComponent(type, { x: 40, y: 60 }), rotation };
        for (const terminal of component.terminals) {
          const wire = createWire(
            { kind: 'terminal', componentId: component.id, terminalId: terminal.id },
            { kind: 'free', point: { x: 360, y: -280 } },
            [{ x: 240, y: 180 }],
          );
          const doc = document([component, wire]);
          for (const route of [wirePoints(wire, doc), safeWirePoints(wire, doc)]) {
            closePoint(
              route[0],
              expectedPoint(component, { x: terminal.localX, y: terminal.localY }, rotation),
            );
            const delta = { x: route[1].x - route[0].x, y: route[1].y - route[0].y };
            expect(Math.abs(delta.x)).toBeCloseTo(Math.abs(delta.y), 9);
            expect(route).toContainEqual({ x: 240, y: 180 });
            expect(route.at(-1)).toEqual({ x: 360, y: -280 });
            route
              .slice(2)
              .forEach((point, i) =>
                expect(point.x === route[i + 1].x || point.y === route[i + 1].y).toBe(true),
              );
          }
          expect(wire.vertices).toEqual([{ x: 240, y: 180 }]);
        }
      }
    },
  );

  it('keeps distant automatic bends stable and rotates the readable label offset', () => {
    const component = createComponent('resistor', { x: 0, y: 0 });
    const wire = createWire(
      { kind: 'terminal', componentId: component.id, terminalId: 'b' },
      { kind: 'free', point: { x: 400, y: 200 } },
    );
    const doc = document([component, wire]);
    const original = wirePoints(wire, doc);
    const next = rotateObjects(doc, [component.id]);
    const updated = next.objects.find((o) => o.kind === 'wire')!;
    if (updated.kind !== 'wire') throw Error();
    expect(updated.vertices).toEqual(original.slice(1, -1));
    expect(updated.startEndpoint).toEqual(wire.startEndpoint);
    expect(updated.endEndpoint).toEqual(wire.endEndpoint);
    const rotated = next.objects[0];
    if (rotated.kind !== 'component') throw Error();
    expect(rotated.rotation).toBe(45);
    expect(rotated.label.rotation).toBe(0);
    closePoint(rotated.label.offset, expectedPoint({ x: 0, y: 0 }, component.label.offset, 45));
  });

  it('measures circles, triangles and curves in their actual rotated geometry', () => {
    for (const rotation of ROTATIONS) {
      const source = { ...createComponent('voltageSource', { x: 100, y: 120 }), rotation };
      expect(getMeasurementBounds(source)).toEqual({ x: 80, y: 100, width: 40, height: 40 });
    }
    const triangle = { ...createComponent('opAmp', { x: 0, y: 0 }), rotation: 45 as const };
    const actual = getMeasurementBounds(triangle);
    const vertices = [
      { x: -24, y: -32 },
      { x: 24, y: 0 },
      { x: -24, y: 32 },
    ].map((point) => expectedPoint(triangle, point, 45));
    expect(actual.width).toBeCloseTo(
      Math.max(...vertices.map((p) => p.x)) - Math.min(...vertices.map((p) => p.x)),
      9,
    );
    expect(actual.height).toBeCloseTo(
      Math.max(...vertices.map((p) => p.y)) - Math.min(...vertices.map((p) => p.y)),
      9,
    );
    // Rotating before finding extrema must solve both transformed cubic axes.
    const bounds = symbolMeasurementBounds(
      [{ kind: 'path', d: 'M0 0C0 100 100 100 100 0' }],
      (point) => expectedPoint({ x: 0, y: 0 }, point, 45),
    );
    const samples = Array.from({ length: 10001 }, (_, i) => {
      const t = i / 10000,
        u = 1 - t;
      return expectedPoint(
        { x: 0, y: 0 },
        { x: 3 * u * t * t * 100 + t ** 3 * 100, y: 3 * u * t * 100 },
        45,
      );
    });
    expect(bounds.x).toBeCloseTo(Math.min(...samples.map((p) => p.x)), 5);
    expect(bounds.y).toBeCloseTo(Math.min(...samples.map((p) => p.y)), 5);
    expect(bounds.x + bounds.width).toBeCloseTo(Math.max(...samples.map((p) => p.x)), 5);
    expect(bounds.y + bounds.height).toBeCloseTo(Math.max(...samples.map((p) => p.y)), 5);
  });
});

describe('45 degree editing and export lifecycle', () => {
  it('preserves axis-aligned annotation geometry and JSON in mixed component selections', () => {
    const component = createComponent('resistor', { x: 0, y: 0 });
    const brace = createBrace('brace', { x: -60, y: 80 }, { x: 60, y: 80 });
    const doc = document([component, brace]);
    const mixed = rotateObjects(doc, [component.id, brace.id]);
    expect(mixed.objects[0]).toMatchObject({ rotation: 45 });
    expect(() => deserializeDocument(serializeDocument(mixed))).not.toThrow();
    const rotatedBrace = mixed.objects[1];
    if (rotatedBrace.kind !== 'brace') throw Error();
    expect(rotatedBrace.start.x).toBe(rotatedBrace.end.x);
    const annotationOnly = rotateObjects(document([brace]), [brace.id]).objects[0];
    if (annotationOnly.kind !== 'brace') throw Error();
    expect(annotationOnly.start.x).toBe(annotationOnly.end.x);
  });
  it('cycles R through every angle, supports undo/redo, saves localStorage, and preserves component45 in personal blocks and clipboard clones', () => {
    const component = createComponent('resistor', { x: 60, y: 80 });
    useEditorStore.setState({ document: document([component]), selection: [component.id] });
    for (const rotation of [...ROTATIONS.slice(1), 0]) {
      useEditorStore.getState().rotate();
      expect(useEditorStore.getState().document.objects[0]).toMatchObject({
        rotation,
        x: 60,
        y: 80,
      });
    }
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().document.objects[0]).toMatchObject({ rotation: 315 });
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().document.objects[0]).toMatchObject({ rotation: 0 });
    useEditorStore.getState().select([component.id]);
    useEditorStore.getState().rotate();
    const doc = useEditorStore.getState().document;
    expect(saveDocumentNow()).toBe(true);
    expect(deserializeDocument(localStorage.getItem(STORAGE_KEY)!).objects[0]).toMatchObject({
      rotation: 45,
    });
    const copied = deserializeDocument(serializeDocument(extractSelection(doc, [component.id])));
    expect(cloneObjects(copied, { x: 40, y: 40 })[0]).toMatchObject({ rotation: 45 });
    const block = createPersonalBlock(doc, [component.id], 'Diagonal resistor');
    const parsed = parsePersonalBlocks(serializePersonalBlocks([block]))[0];
    expect(instantiatePersonalBlock(parsed, { x: 400, y: 400 }, 0, doc)[0]).toMatchObject({
      rotation: 45,
    });
    expect(instantiatePersonalBlock(parsed, { x: 400, y: 400 }, 45, doc)[0]).toMatchObject({
      rotation: 90,
    });
  });

  it.each(requested)(
    '%s exports all eight real angles through SVG/PNG dimensions/native TikZ/Obsidian',
    (type) => {
      for (const rotation of ROTATIONS) {
        const component = { ...createComponent(type, { x: 120, y: 100 }), rotation };
        const doc = document([component]);
        const svg = exportSVG(doc);
        expect(svg).toContain(`translate(120 100) rotate(${rotation})`);
        expect(svg).not.toMatch(/data-terminal|terminal-hit|data-hit/);
        expect(pngDimensions(svg).width).toBeGreaterThan(0);
        const tikz = exportTikz(doc),
          obsidian = exportObsidian(doc);
        expect(tikz).toContain(`% Component: ${type}`);
        expect(obsidian).toContain(`% Component: ${type}`);
        for (const terminal of component.terminals) {
          const point = localToWorld(component, { x: terminal.localX, y: terminal.localY });
          expect(tikz).toContain(tikzCoordinate(point));
          expect(obsidian).toContain(
            `(${formatNumber(point.x / CANVAS_UNITS_PER_CM)},${formatNumber(-point.y / CANVAS_UNITS_PER_CM)})`,
          );
        }
        if (componentRegistry[type].tikz.kind === 'node')
          expect(tikz).toContain(`rotate=${-rotation}`);
        expect(tikz + obsidian).not.toMatch(/NaN|undefined/);
      }
    },
  );
});
