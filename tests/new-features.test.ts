import { exportObsidian } from './helpers/unoptimizedObsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createComponent } from '../src/model/catalog';
import { createJunction, createTextAnnotation, createWire } from '../src/model/factories';
import { emptyDocument } from '../src/model/demo';
import type {
  CircuitDocument,
  CircuitObject,
  ComponentType,
  ElectricalAnnotation,
  Rotation,
} from '../src/model/types';
import { deserializeDocument, serializeDocument } from '../src/model/serialization';
import {
  createPersonalBlock,
  instantiatePersonalBlock,
  parsePersonalBlocks,
  serializePersonalBlocks,
  usePersonalBlocks,
  PERSONAL_BLOCKS_KEY,
} from '../src/personalBlocks/library';
import {
  createCurrent,
  electricalDrawingGeometry,
  createElectrical,
  createPolarity,
  electricalGeometry,
} from '../src/annotations/electrical';
import { compatibleReplacements, replaceComponent } from '../src/model/replacement';
import { wireCrossings } from '../src/utils/crossings';
import { extractSelection, removeObjects, rotateObjects } from '../src/utils/operations';
import { insertJunction } from '../src/utils/wires';
import { moveObject, resolveEndpoint } from '../src/utils/geometry';
import { exportTikz } from '../src/tikz/exporter';
import { selectionDocument } from '../src/tikz/selection';
import { exportSVG } from '../src/svg/exporter';
import { saveDocumentNow, useEditorStore } from '../src/store/editorStore';
import manifest from '../public/manifest.webmanifest?raw';
const webManifest = JSON.parse(manifest) as { icons: { src: string }[]; display_override?: string };
const documentFor = (objects: CircuitObject[]): CircuitDocument => ({
  ...emptyDocument(),
  objects,
});
const free = (x: number, y: number) => ({ kind: 'free' as const, point: { x, y } });
const straight = (x1: number, y1: number, x2: number, y2: number) =>
  createWire(free(x1, y1), free(x2, y2));
const joined = () => {
  const c = createComponent('resistor', { x: 340, y: 260 }, 1),
    j = createJunction({ x: 500, y: 260 }, 'A');
  const w = createWire(
    { kind: 'terminal', componentId: c.id, terminalId: c.terminals[1].id },
    { kind: 'junction', junctionId: j.id },
  );
  const doc = documentFor([c, w, j, createTextAnnotation({ x: 340, y: 340 }, 'V_{out}')]);
  const a = createCurrent(w, { x: 440, y: 260 }, doc);
  a.label.offset = { x: 14, y: 9 };
  doc.objects.push(a);
  return doc;
};
beforeEach(() => {
  usePersonalBlocks.setState({ blocks: [], error: '' });
  useEditorStore.setState({
    document: emptyDocument(),
    selection: [],
    past: [],
    future: [],
    gestureStart: null,
    tool: 'select',
    pendingPresetId: null,
  });
  vi.restoreAllMocks();
});
describe('personal blocks', () => {
  it('normalizes selection coordinates, retains ordinary kinds, label offsets and validates JSON', () => {
    const doc = joined(),
      b = createPersonalBlock(
        doc,
        doc.objects.map((o) => o.id),
        '  Generatore reale ',
      );
    expect(b.name).toBe('Generatore reale');
    expect(b.document.objects.map((o) => o.kind)).toEqual(doc.objects.map((o) => o.kind));
    expect(b.document.objects[0]).not.toMatchObject({ x: 340, y: 260 });
    expect(b.document.objects.at(-1)).toMatchObject({ label: { offset: { x: 14, y: 9 } } });
    expect(parsePersonalBlocks(serializePersonalBlocks([b]))).toEqual([b]);
    expect(() => createPersonalBlock(doc, [], 'Vuoto')).toThrow();
    expect(() => createPersonalBlock(doc, [doc.objects[0].id], ' ')).toThrow();
  });
  it.each([0, 90, 180, 270] as Rotation[])(
    'remaps every ID and endpoint at rotation %i',
    (rotation) => {
      const doc = joined(),
        b = createPersonalBlock(
          doc,
          doc.objects.map((o) => o.id),
          'Mio blocco',
        ),
        objects = instantiatePersonalBlock(b, { x: 600, y: 400 }, rotation, doc),
        next = documentFor(objects);
      expect(new Set(objects.map((o) => o.id)).size).toBe(objects.length);
      expect(objects.every((o) => !doc.objects.some((p) => p.id === o.id))).toBe(true);
      expect(() => deserializeDocument(serializeDocument(next))).not.toThrow();
      const wire = objects.find((o) => o.kind === 'wire')!;
      expect(wire.kind === 'wire' && resolveEndpoint(wire.startEndpoint, next)).toEqual(
        expect.objectContaining({ x: expect.any(Number) }),
      );
      const a = objects.find((o) => o.kind === 'electrical') as ElectricalAnnotation;
      expect(a.wireId).toBe(wire.id);
    },
  );
  it('repeated insertion avoids standard names while preserving semantic labels', () => {
    const a = createComponent('resistor', { x: 0, y: 0 }, 1),
      b = createComponent('resistor', { x: 160, y: 0 }, 2);
    b.label.text = 'R_{th}';
    const template = createPersonalBlock(documentFor([a, b]), [a.id, b.id], 'Due R');
    let doc = documentFor([a]);
    for (let i = 0; i < 3; i++) {
      const inserted = instantiatePersonalBlock(template, { x: i * 200, y: 200 }, 0, doc);
      doc = { ...doc, objects: [...doc.objects, ...inserted] };
    }
    const labels = doc.objects.flatMap((o) => (o.kind === 'component' ? [o.label.text] : []));
    expect(labels.filter((l) => /^R_\d+$/.test(l))).toEqual(['R_1', 'R_2', 'R_3', 'R_4']);
    expect(labels.filter((l) => l === 'R_{th}')).toHaveLength(3);
  });
  it.each([false, true])(
    'reserves preserved labels before naming a mixed block (reverse: %s)',
    (reverse) => {
      const retained = createComponent('capacitor', { x: 0, y: 0 }, 1),
        automatic = createComponent('resistor', { x: 160, y: 0 }, 2);
      // Replace preserves labels, so a capacitor may legitimately retain R_1.
      retained.label.text = 'R_1';
      const source = reverse ? [automatic, retained] : [retained, automatic],
        block = createPersonalBlock(
          documentFor(source),
          source.map((o) => o.id),
          'Bipoli',
        );
      let existing = emptyDocument();
      for (let i = 0; i < 2; i++) {
        const inserted = instantiatePersonalBlock(block, { x: 0, y: i * 200 }, 0, existing);
        expect(
          inserted.find((o) => o.kind === 'component' && o.type === 'capacitor'),
        ).toMatchObject({
          label: { text: 'R_1' },
        });
        expect(inserted.find((o) => o.kind === 'component' && o.type === 'resistor')).toMatchObject(
          {
            label: { text: `R_${i + 2}` },
          },
        );
        existing = { ...existing, objects: [...existing.objects, ...inserted] };
      }
    },
  );
  it('rotates wire-only, arrow and loop blocks about their relative origin', () => {
    const objects: CircuitObject[] = [
      straight(100, 100, 200, 100),
      {
        kind: 'arrow',
        id: 'arrow',
        type: 'curve',
        start: { x: 100, y: 120 },
        end: { x: 200, y: 120 },
        controlPoints: [
          { x: 120, y: 140 },
          { x: 160, y: 140 },
        ],
        width: 2,
        color: '#df4949',
        reversed: false,
      },
      {
        kind: 'loop-arrow',
        id: 'loop',
        x: 100,
        y: 180,
        width: 100,
        height: 60,
        arrowPosition: 0.2,
        direction: 'clockwise',
        color: '#df4949',
        strokeWidth: 2,
      },
    ];
    const block = createPersonalBlock(
      documentFor(objects),
      objects.map((o) => o.id),
      'Grafica',
    );
    const result = instantiatePersonalBlock(block, { x: 0, y: 0 }, 90, emptyDocument());
    expect(result[0]).toMatchObject({
      kind: 'wire',
      startEndpoint: { point: { x: 0, y: 0 } },
      endEndpoint: { point: { x: 0, y: 100 } },
    });
    expect(result[2]).toMatchObject({
      kind: 'loop-arrow',
      width: 100,
      height: 60,
      rotation: 90,
      arrowPosition: 0.2,
    });
  });
  it('persists separately, renames/deletes and imports a library with fresh block IDs', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: () => null, setItem });
    const doc = joined(),
      b = createPersonalBlock(
        doc,
        doc.objects.map((o) => o.id),
        'Uno',
      );
    usePersonalBlocks.getState().add(b);
    usePersonalBlocks.getState().rename(b.id, 'Due');
    const saved = setItem.mock.calls.at(-1)!;
    expect(saved[0]).toBe(PERSONAL_BLOCKS_KEY);
    expect(parsePersonalBlocks(saved[1])[0].name).toBe('Due');
    usePersonalBlocks.getState().import(saved[1]);
    expect(usePersonalBlocks.getState().blocks[1].id).not.toBe(b.id);
    usePersonalBlocks.getState().remove(b.id);
    expect(usePersonalBlocks.getState().blocks).toHaveLength(1);
    expect(useEditorStore.getState().document.objects).toHaveLength(0);
  });
  it('rejects malformed imports atomically and surfaces quota failures', () => {
    const doc = joined(),
      b = createPersonalBlock(
        doc,
        doc.objects.map((o) => o.id),
        'Uno',
      );
    usePersonalBlocks.getState().add(b);
    expect(() => usePersonalBlocks.getState().import('{"version":1,"blocks":[{}]}')).toThrow();
    expect(usePersonalBlocks.getState().blocks).toHaveLength(1);
    expect(() => parsePersonalBlocks(serializePersonalBlocks([b, b]))).toThrow();
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw Error('quota');
      },
      getItem: () => null,
    });
    usePersonalBlocks.getState().rename(b.id, 'Disponibile in memoria');
    expect(usePersonalBlocks.getState().error).toMatch(/JSON/);
  });
  it('includes internal wires and detaches external electrical references safely', () => {
    const doc = joined(),
      b = createPersonalBlock(doc, [doc.objects[0].id, doc.objects[2].id], 'Collegati');
    expect(b.document.objects.some((o) => o.kind === 'wire')).toBe(true);
    const a = doc.objects.at(-1)!;
    const only = extractSelection(doc, [a.id]);
    expect(only.objects[0]).toMatchObject({ wireId: undefined });
    expect(() => deserializeDocument(serializeDocument(only))).not.toThrow();
  });
});
describe('wire crossings are visual and never create electrical nodes', () => {
  it('bridges the horizontal wire deterministically and caches unchanged documents', () => {
    const h = straight(-100, 0, 100, 0),
      v = straight(0, -100, 0, 100),
      doc = documentFor([v, h]);
    const before = serializeDocument(doc);
    expect(wireCrossings(doc)).toHaveLength(1);
    expect(wireCrossings(doc)[0].horizontal.id).toBe(h.id);
    expect(wireCrossings(doc)).toBe(wireCrossings(doc));
    expect(serializeDocument(doc)).toBe(before);
    for (const output of [exportTikz(doc), exportObsidian(doc)]) {
      expect(output).toContain('horizontal bridge');
      expect(output).not.toContain('\\fill[');
    }
    expect(exportSVG(doc)).toContain(' C ');
  });
  it('Quick Junction splits both wires and deletion restores the crossing without dangling references', () => {
    const doc = documentFor([straight(-100, 0, 100, 0), straight(0, -100, 0, 100)]),
      { doc: connected, junction } = insertJunction(doc, { x: 0, y: 0 });
    expect(wireCrossings(connected)).toHaveLength(0);
    expect(connected.objects.filter((o) => o.kind === 'wire')).toHaveLength(4);
    expect(exportTikz(connected)).toContain('\\fill[');
    const after = removeObjects(connected, [junction.id]);
    expect(wireCrossings(after)).toHaveLength(1);
    expect(() => deserializeDocument(serializeDocument(after))).not.toThrow();
    expect(after.objects.filter((o) => o.kind === 'wire')).toHaveLength(4);
    expect(exportSVG(after)).toContain(' C ');
  });
  it('excludes T endpoints, shared terminals, parallel wires and a wire crossing itself', () => {
    const t = documentFor([straight(-100, 0, 100, 0), straight(0, 0, 0, 100)]);
    expect(wireCrossings(t)).toHaveLength(0);
    expect(
      wireCrossings(documentFor([straight(-100, 0, 100, 0), straight(-100, 20, 100, 20)])),
    ).toHaveLength(0);
    const own = createWire(free(-100, 0), free(0, 100), [
      { x: 100, y: 0 },
      { x: 100, y: -100 },
      { x: 0, y: -100 },
    ]);
    expect(wireCrossings(documentFor([own]))).toHaveLength(0);
  });
  it('indexes a dense grid and reuses its result over 500 viewport frames', () => {
    const objects: CircuitObject[] = [];
    for (let i = 0; i < 80; i++) {
      objects.push(straight(-100, i * 20, 1700, i * 20), straight(i * 20, -100, i * 20, 1700));
    }
    const doc = documentFor(objects),
      result = wireCrossings(doc);
    expect(result).toHaveLength(6400);
    for (let i = 0; i < 500; i++) expect(wireCrossings(doc)).toBe(result);
  });
  it('does not fail all exports because one wire has a dangling terminal', () => {
    const bad = createWire(
      { kind: 'terminal', componentId: 'missing', terminalId: 'a' },
      free(0, 0),
    );
    const doc = documentFor([bad, straight(0, 0, 100, 0)]);
    expect(() => exportSVG(doc)).not.toThrow();
    expect(() => exportTikz(doc)).not.toThrow();
  });
});
describe('dedicated electrical annotations', () => {
  it.each([
    [0, 0, 200, 0],
    [0, 0, 0, 200],
  ])('attaches current along a horizontal or vertical wire (%i,%i → %i,%i)', (x1, y1, x2, y2) => {
    const w = straight(x1, y1, x2, y2),
      doc = documentFor([w]),
      o = createCurrent(w, { x: 100, y: 100 }, doc),
      g = electricalGeometry(o, doc);
    expect(x1 === x2 ? g.start.x === g.end.x : g.start.y === g.end.y).toBe(true);
    expect(o.label.text).toBe('i_1');
    expect(o.wireId).toBe(w.id);
    expect(electricalGeometry({ ...o, reversed: true }, doc).arrowEnd).toEqual(g.arrowEnd);
    const moved = { ...doc, objects: [moveObject(w, { x: 40, y: 60 }, new Set())] };
    expect(electricalGeometry(o, moved).start).toEqual({ x: g.start.x + 40, y: g.start.y + 60 });
  });
  it('retains label offsets, follows a split wire and detaches when its owner is deleted', () => {
    const w = straight(0, 0, 400, 0),
      doc = documentFor([w]),
      o = createCurrent(w, { x: 300, y: 0 }, doc);
    o.label.text = 'i_{AB}';
    o.label.offset = { x: 7, y: 11 };
    doc.objects.push(o);
    const g = electricalGeometry(o, doc),
      split = insertJunction(doc, { x: 100, y: 0 }).doc,
      a = split.objects.find((x) => x.id === o.id) as ElectricalAnnotation;
    expect(a.wireId).not.toBe(w.id);
    expect(electricalGeometry(a, split).start).toEqual(g.start);
    const detached = removeObjects(doc, [w.id]).objects[0] as ElectricalAnnotation;
    expect(detached.wireId).toBeUndefined();
    expect(electricalDrawingGeometry(detached, documentFor([detached]))).toMatchObject({
      ...electricalDrawingGeometry(o, doc),
      wireGap: null,
    });
  });
  it('polarity maps only two terminals, follows rotation and reverses signs', () => {
    const c = createComponent('resistor', { x: 100, y: 200 }, 1),
      o = createPolarity(c)!;
    expect(o.componentId).toBe(c.id);
    expect(createPolarity(createComponent('npn', { x: 0, y: 0 }, 1))).toBeNull();
    const doc = documentFor([c, o]),
      rotated = rotateObjects(rotateObjects(doc, [c.id, o.id]), [c.id, o.id]),
      g = electricalGeometry(rotated.objects[1] as ElectricalAnnotation, rotated);
    const horizontal = electricalGeometry(o, doc);
    expect(horizontal.labelPoint.y).toBeGreaterThan(c.y);
    expect(horizontal.start.y).toBeLessThan(c.y);
    expect(g.start.x).toBeCloseTo(g.end.x, 9);
    expect(g.labelPoint.x).toBeLessThan(c.x);
    expect(g.start.x).toBeGreaterThan(c.x);
    expect(exportSVG(documentFor([c, { ...o, reversed: true }]))).toContain('&#8722;');
  });
  it.each(['current', 'polarity', 'voltage'] as const)(
    'round-trips and exports %s with LaTeX, color, offsets and reverse',
    (mode) => {
      const o = createElectrical(mode, { x: 10, y: 20 }, { x: 130, y: 160 }, '\\Delta V');
      o.reversed = true;
      o.offset = { x: 3, y: 4 };
      o.label.offset = { x: 11, y: 12 };
      const doc = documentFor([o]);
      expect(deserializeDocument(serializeDocument(doc))).toEqual(doc);
      expect(exportTikz(doc)).toContain(`Electrical annotation: ${mode}`);
      expect(exportObsidian(doc)).toContain(`Electrical annotation: ${mode}`);
      const svg = exportSVG(doc);
      expect(svg).not.toContain('foreignObject');
      expect(svg).toContain('#df4949');
      expect(svg).toContain('#2463cb');
      expect(svg).not.toMatch(/NaN|undefined/);
    },
  );
  it('rejects invalid annotation references and numeric geometry', () => {
    const o = createElectrical('current', { x: 0, y: 0 }, { x: 10, y: 0 }, 'i_1');
    expect(() =>
      deserializeDocument(serializeDocument(documentFor([{ ...o, wireId: 'absent' }]))),
    ).toThrow();
    expect(() => deserializeDocument(JSON.stringify(documentFor([{ ...o, ratio: 2 }])))).toThrow();
    expect(() =>
      deserializeDocument(
        JSON.stringify(documentFor([{ ...o, offset: JSON.parse('{"x":null,"y":0}') }])),
      ),
    ).toThrow();
  });
});
describe('safe component replacement', () => {
  it.each([
    ['resistor', 'capacitor'],
    ['capacitor', 'inductor'],
    ['npn', 'pnp'],
    ['nmos', 'pmos'],
  ] as [ComponentType, ComponentType][])(
    'maps %s → %s preserving geometry, references and styles',
    (from, to) => {
      const c = createComponent(from, { x: 200, y: 400 }, 1);
      c.rotation = 270;
      c.label.offset = { x: 17, y: 31 };
      c.label.text = 'Z_{eq}';
      c.color = '#8855c2';
      c.width = 3;
      const wires = c.terminals.map((t) =>
          createWire({ kind: 'terminal', componentId: c.id, terminalId: t.id }, free(500, 400)),
        ),
        doc = documentFor([c, ...wires]);
      const result = replaceComponent(doc, c.id, to);
      expect(result.objects[0]).toMatchObject({
        id: c.id,
        type: to,
        x: 200,
        y: 400,
        rotation: 270,
        label: c.label,
        color: c.color,
        width: 3,
      });
      wires.forEach((w, i) => {
        const after = result.objects[i + 1];
        expect(after).toMatchObject({
          kind: 'wire',
          id: w.id,
          startEndpoint: { componentId: c.id },
        });
        expect(after.kind === 'wire' && resolveEndpoint(after.startEndpoint, result)).toEqual(
          resolveEndpoint(w.startEndpoint, doc),
        );
      });
      expect(() => deserializeDocument(serializeDocument(result))).not.toThrow();
      expect(serializeDocument(result)).not.toContain(`"type": "${from}"`);
    },
  );
  it('excludes unsafe terminal mappings and retains labels without guessing their provenance', () => {
    const c = createComponent('resistor', { x: 0, y: 0 }, 1);
    expect(compatibleReplacements(c)).not.toContain('opAmp');
    expect(() => replaceComponent(documentFor([c]), c.id, 'opAmp')).toThrow();
    expect(compatibleReplacements(createComponent('npn', { x: 0, y: 0 }, 1))).toEqual(['pnp']);
    expect(replaceComponent(documentFor([c]), c.id, 'capacitor').objects[0]).toMatchObject({
      label: { text: 'R_1' },
    });
  });
  it('records the entire replacement as one Undo/Redo operation', () => {
    const doc = joined(),
      id = doc.objects[0].id;
    useEditorStore.setState({ document: doc });
    useEditorStore.getState().replaceComponent(id, 'capacitor');
    expect(useEditorStore.getState().past).toHaveLength(1);
    const replaced = useEditorStore.getState().document;
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().document).toEqual(doc);
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().document).toEqual(replaced);
  });
});
describe('pure SVG and PWA contracts', () => {
  it('exports full content and the existing selection projection, with tight finite viewBox and no UI', () => {
    const doc = joined(),
      svg = exportSVG(doc);
    expect(svg).toContain('<svg xmlns=');
    expect(svg).toContain('viewBox=');
    expect(svg).toContain('Comic Relief');
    expect(svg).toContain('<circle');
    expect(svg).toContain('<path');
    expect(svg).not.toMatch(/foreignObject|data-layer|selection|grid|handle|undefined|NaN/);
    const selected = exportSVG(selectionDocument(doc, [doc.objects[0].id]));
    expect(selected).not.toContain('<circle');
    expect(selected.length).toBeLessThan(svg.length);
    expect(exportSVG(emptyDocument())).toContain('viewBox="-12 -12 24 24"');
  });
  it('uses relative manifest URLs and standard standalone installation icons', () => {
    const m = webManifest;
    expect(m).toMatchObject({
      name: 'DrawCircuit',
      display: 'standalone',
      theme_color: '#2463e8',
      start_url: './',
      scope: './',
    });
    expect(m && typeof m === 'object' && m.display_override).toBeUndefined();
    expect(m && typeof m === 'object' && m.icons?.map((icon) => icon.src)).toEqual([
      'icons/drawcircuit-blue-192.png',
      'icons/drawcircuit-blue-512.png',
      'icons/maskable-drawcircuit-blue-512.png',
    ]);
  });
  it('flushes committed work before update, rejects active gestures and handles storage failure', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: () => null, setItem });
    const doc = joined();
    useEditorStore.setState({ document: doc });
    expect(saveDocumentNow()).toBe(true);
    expect(deserializeDocument(setItem.mock.calls[0][1])).toEqual(doc);
    useEditorStore.getState().beginGesture();
    expect(saveDocumentNow()).toBe(false);
    useEditorStore.getState().cancelGesture();
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw Error('quota');
      },
      getItem: () => null,
    });
    expect(saveDocumentNow()).toBe(false);
    expect(useEditorStore.getState().storageError).toBe(true);
  });
});
