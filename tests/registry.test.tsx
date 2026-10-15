import { rotateObjects } from '../src/utils/operations';
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  catalog,
  categories,
  componentRegistry,
  createComponent,
  matchesComponent,
  terminalsFor,
} from '../src/model/catalog';
import { COLORS, componentTypes } from '../src/model/types';
import type { CircuitDocument, Rotation, TextAnnotation } from '../src/model/types';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import {
  endpointDirection,
  localToWorld,
  objectBounds,
  resolveEndpoint,
  rotatePoint,
} from '../src/utils/geometry';
import { wireCandidate } from '../src/utils/wires';
import { MathText } from '../src/circuit/annotations/MathText';
import { Symbol } from '../src/circuit/components/Symbol';
import { CIRCUIT_FONT } from '../src/model/fonts';
import { exportStandalone, exportTikz } from '../src/tikz/exporter';
import { svgPathToTikz } from '../src/tikz/symbolGeometry';

describe('expanded component registry', () => {
  it('has 72 unique types, 12 categories, geometry, canonical independent pins, and export strategies', () => {
    expect(catalog).toHaveLength(72);
    expect(new Set(catalog.map((d) => d.type)).size).toBe(72);
    expect(Object.keys(componentRegistry).sort()).toEqual([...componentTypes].sort());
    expect(new Set(catalog.map((d) => d.group))).toEqual(new Set(categories));
    for (const d of catalog) {
      expect(d.shapes.length).toBeGreaterThan(0);
      expect(d.terminals.length).toBeGreaterThan(0);
      expect(new Set(d.terminals.map((t) => t.id)).size).toBe(d.terminals.length);
      expect(new Set(d.terminals.map((t) => `${t.localX},${t.localY}`)).size).toBe(
        d.terminals.length,
      );
      expect(renderToStaticMarkup(<Symbol type={d.type} />)).toMatch(/<(path|rect|circle)/);
      expect(terminalsFor(d.type)).not.toBe(d.terminals);
      for (const shape of d.shapes)
        if (shape.kind === 'path')
          expect(svgPathToTikz(shape.d, (p) => `(${p.x},${p.y})`)).not.toContain('NaN');
    }
  });
  it('keeps American zigzag and European resistors distinct in search, SVG and CircuitikZ', () => {
    const american = componentRegistry.americanResistor;
    expect(american.terminals).toEqual(componentRegistry.resistor.terminals);
    for (const alias of ['zig zag', 'zig-zag', 'americana', 'american resistor'])
      expect(matchesComponent(american, alias)).toBe(true);
    expect(renderToStaticMarkup(<Symbol type="americanResistor" />)).not.toContain('<rect');
    expect(renderToStaticMarkup(<Symbol type="resistor" />)).toContain('<rect');
    const doc: CircuitDocument = {
      version: 1,
      title: 'Both resistor conventions',
      objects: [
        createComponent('americanResistor', { x: 0, y: 0 }),
        createComponent('resistor', { x: 160, y: 0 }),
      ],
    };
    const code = exportTikz(doc);
    expect(code).toContain('to[R, american resistors,');
    expect(code).toContain('to[R, fill=');
    expect(deserializeDocument(serializeDocument(doc))).toEqual(doc);
  });
  it.each(componentTypes)(
    'round-trips %s with semantic wire endpoints, exact quarter turns, snap targets and enclosing hitbox',
    (type) => {
      for (const rotation of [0, 90, 180, 270] as Rotation[]) {
        const c = { ...createComponent(type, { x: 140, y: 200 }), rotation };
        const wires = c.terminals.map((t, i) => ({
          kind: 'wire' as const,
          id: `w${i}`,
          startEndpoint: { kind: 'terminal' as const, componentId: c.id, terminalId: t.id },
          endEndpoint: { kind: 'free' as const, point: { x: 500 + i * 20, y: 500 } },
          vertices: [],
          color: COLORS.ink,
          width: 2,
        }));
        const doc: CircuitDocument = { version: 1, title: type, objects: [c, ...wires] };
        expect(deserializeDocument(serializeDocument(doc))).toEqual(doc);
        let spun = doc;
        for (let quarter = 0; quarter < 4; quarter++) {
          spun = rotateObjects(spun, [c.id]);
          spun = rotateObjects(spun, [c.id]);
          expect(spun.objects[0]).toMatchObject({
            x: c.x,
            y: c.y,
            rotation: (rotation + (quarter + 1) * 90) % 360,
          });
        }
        const final = spun.objects[0];
        if (final.kind !== 'component') throw Error();
        expect(final.rotation).toBe(c.rotation);
        expect(final.label.rotation).toBe(c.label.rotation);
        expect(final.label.offset.x).toBeCloseTo(c.label.offset.x, 9);
        expect(final.label.offset.y).toBeCloseTo(c.label.offset.y, 9);
        // The automatic branch is frozen on the first turn so distant bends stay fixed.
        spun.objects.slice(1).forEach((object, i) => {
          if (object.kind !== 'wire') throw Error();
          expect(object.startEndpoint).toEqual(wires[i].startEndpoint);
          expect(object.endEndpoint).toEqual(wires[i].endEndpoint);
        });
        const bounds = objectBounds(c, doc);
        for (const t of c.terminals) {
          const expected = rotatePoint({ x: t.localX, y: t.localY }, rotation);
          const point = { x: 140 + expected.x, y: 200 + expected.y };
          expect(
            resolveEndpoint({ kind: 'terminal', componentId: c.id, terminalId: t.id }, doc),
          ).toEqual(point);
          const candidate = wireCandidate(point, doc, 1);
          expect(candidate.kind).toBe('terminal');
          if (candidate.kind !== 'terminal') throw new Error('Expected terminal snap');
          expect(candidate.endpoint).toEqual({
            kind: 'terminal',
            componentId: c.id,
            terminalId: t.id,
          });
          expect(point.x).toBeGreaterThanOrEqual(bounds.x);
          expect(point.x).toBeLessThanOrEqual(bounds.x + bounds.width);
          expect(point.y).toBeGreaterThanOrEqual(bounds.y);
          expect(point.y).toBeLessThanOrEqual(bounds.y + bounds.height);
          const expectedAxis =
            rotation === 90 || rotation === 270 ? (t.direction === 'x' ? 'y' : 'x') : t.direction;
          expect(
            endpointDirection({ kind: 'terminal', componentId: c.id, terminalId: t.id }, doc),
          ).toBe(expectedAxis);
        }
        const code = exportTikz(doc);
        expect(code).toContain(`% Component: ${type}`);
        expect(code).not.toMatch(/undefined|NaN|to\[null/);
        for (const wire of wires)
          expect(
            resolveEndpoint(wire.startEndpoint, {
              ...doc,
              objects: [{ ...c, x: c.x + 80, y: c.y + 40 }, ...wires],
            }),
          ).toEqual({
            ...localToWorld(c, {
              x: c.terminals[Number(wire.id.slice(1))].localX,
              y: c.terminals[Number(wire.id.slice(1))].localY,
            }),
            x: resolveEndpoint(wire.startEndpoint, doc).x + 80,
            y: resolveEndpoint(wire.startEndpoint, doc).y + 40,
          });
      }
    },
  );
  it('preserves all 21 legacy types and their terminal IDs/positions', () => {
    for (const type of componentTypes.slice(0, 21)) {
      const pins = terminalsFor(type).map(({ id, localX, localY }) => ({ id, localX, localY }));
      const expected =
        type === 'ground'
          ? [{ id: 'a', localX: 0, localY: -40 }]
          : type === 'transformer'
            ? [
                { id: 'a', localX: -40, localY: -40 },
                { id: 'b', localX: -40, localY: 40 },
                { id: 'c', localX: 40, localY: -40 },
                { id: 'd', localX: 40, localY: 40 },
              ]
            : [
                { id: 'a', localX: -40, localY: 0 },
                { id: 'b', localX: 40, localY: 0 },
                ...(type === 'potentiometer' ? [{ id: 'w', localX: 0, localY: -40 }] : []),
              ];
      expect(pins).toEqual(expected);
    }
  });
  it('finds Italian/English aliases, case-insensitively and without accents', () => {
    const search = (q: string) => catalog.filter((d) => matchesComponent(d, q)).map((d) => d.type);
    expect(search('res')).toEqual(
      expect.arrayContaining(['resistor', 'variableResistor', 'photoresistor']),
    );
    expect(search('mos')).toEqual(['nmos', 'pmos']);
    expect(search('GROUND')).toEqual(['ground', 'signalGround', 'chassisGround']);
    expect(search('resistenza')).toContain('resistor');
    expect(search('operational amplifier')).toEqual(['opAmp']);
    expect(search('batteria')).toEqual(['battery', 'singleCellBattery']);
    expect(search('xxnonexistent')).toEqual([]);
  });
});

describe('circuit font and compatible JSON', () => {
  it('preserves generic block internal text and uses Comic Relief for ordinary circuit content', () => {
    const c = createComponent('blackBox', { x: 0, y: 0 });
    c.bodyText = 'H(s)';
    const free: TextAnnotation = {
      kind: 'text',
      id: 'text',
      x: 10,
      y: 50,
      text: 'ADC',
      fontSize: 24,
      color: COLORS.red,
      rotation: 0,
      align: 'start',
    };
    const doc: CircuitDocument = { version: 1, title: 'Font', objects: [c, free] };
    expect(deserializeDocument(serializeDocument(doc))).toEqual(doc);
    expect(renderToStaticMarkup(<MathText text="A" color={COLORS.blue} />)).toContain(
      'data-font="Comic Relief"',
    );
    expect(renderToStaticMarkup(<Symbol type="blackBox" bodyText="H(s)" />)).toContain(
      'Comic Relief',
    );
    expect(exportStandalone(doc)).not.toContain('Kalam');
    expect(CIRCUIT_FONT).toBe('"Comic Relief", cursive');
  });
  it('discards legacy font choices while preserving layout and pins', () => {
    const c = createComponent('resistor', { x: 0, y: 0 });
    c.terminals = c.terminals.map(({ id, localX, localY }) => ({ id, localX, localY }));
    const raw = {
      version: 1,
      title: 'Legacy',
      objects: [{ ...c, label: { ...c.label, fontFamily: 'Kalam' } }],
    };
    const restored = deserializeDocument(JSON.stringify(raw));
    expect(restored.objects[0]).toEqual(c);
    expect(serializeDocument(restored)).not.toContain('fontFamily');
  });
  it('ignores legacy font names but rejects forged pins and body text on a non-block', () => {
    const c = createComponent('npn', { x: 0, y: 0 });
    const parse = (object: unknown) =>
      deserializeDocument(JSON.stringify({ version: 1, title: 'x', objects: [object] }));
    expect(() =>
      parse({ ...c, label: { ...c.label, fontFamily: 'untrusted-font' } }),
    ).not.toThrow();
    expect(() =>
      parse({ ...c, terminals: c.terminals.map((t) => ({ ...t, name: 'fake' })) }),
    ).toThrow();
    expect(() => parse({ ...c, bodyText: 'not a block' })).toThrow();
  });
});
