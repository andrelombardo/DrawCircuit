import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

// Use Vite's existing TypeScript loader; no test framework or new dependency is needed.
const saved = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
  },
});
const server = await createServer({
  configFile: false,
  logLevel: 'silent',
  server: {
    middlewareMode: true,
    hmr: false,
    watch: null,
  },
});
after(() => server.close());
const { eraseHighlights, eraseTopHighlight, HighlightEraserGesture, splitHighlightCurve } =
  await server.ssrLoadModule('/src/annotations/eraseHighlight.ts');
const { highlightCurves, highlightDrawing, moveHighlightEndpoint, highlightPaintGroups } =
  await server.ssrLoadModule('/src/annotations/highlight.ts');
const { serializeDocument, deserializeDocument } = await server.ssrLoadModule(
  '/src/model/serialization.ts',
);
const { demoDocument } = await server.ssrLoadModule('/src/model/demo.ts');
const { useEditorStore: store } = await server.ssrLoadModule('/src/store/editorStore.ts');
const { cloneObjects, extractSelection, rotateObjects } = await server.ssrLoadModule(
  '/src/utils/operations.ts',
);
const {
  createPersonalBlock,
  instantiatePersonalBlock,
  serializePersonalBlocks,
  parsePersonalBlocks,
} = await server.ssrLoadModule('/src/personalBlocks/library.ts');
const { exportSVG } = await server.ssrLoadModule('/src/svg/exporter.tsx');
const line = (id = 'stroke', y = 0) => ({
  kind: 'highlight',
  id,
  mode: 'free',
  color: '#FACC15',
  opacity: 0.4,
  width: 10,
  smoothing: false,
  points: [
    { x: 0, y },
    { x: 100, y },
  ],
});
const document = (...objects) => ({ version: 1, title: 'Eraser test', objects });
const reset = (doc) =>
  store.setState({
    document: doc,
    past: [],
    future: [],
    gestureStart: null,
    selection: [],
    activeLabel: null,
    tool: 'select',
  });
const close = (actual, expected, tolerance = 1e-6) =>
  assert(Math.abs(actual - expected) < tolerance, `${actual} should equal ${expected}`);
const at = (curve, t) => splitHighlightCurve(curve, t)[0].end;

test('a click waits for release and removes only the topmost overlapping highlight', () => {
  const bottom = line('bottom'),
    top = line('top');
  const doc = document(bottom, top);
  const gesture = new HighlightEraserGesture(doc, { x: 50, y: 0 }, 160, 1);
  assert.equal(gesture.advance({ x: 52, y: 0 }), doc);
  assert.deepEqual(gesture.finish({ x: 51, y: 0 }).objects, [bottom]);
  assert.equal(eraseTopHighlight(doc, { x: 50, y: 30 }), doc);
});

test('diameter affects dragging, never whole-stroke click targeting', () => {
  const doc = document(line());
  for (const size of [6, 160]) {
    const gesture = new HighlightEraserGesture(doc, { x: 50, y: 20 }, size, 1);
    assert.equal(gesture.finish({ x: 50, y: 20 }), doc);
  }
});

test('screen-space intent threshold is zoom-independent and cannot delete at pointerdown', () => {
  for (const zoom of [0.25, 1, 4]) {
    const doc = document(line());
    const gesture = new HighlightEraserGesture(doc, { x: 50, y: 0 }, 6, zoom);
    assert.equal(gesture.advance({ x: 50, y: 3 / zoom }), doc);
    const result = gesture.finish({ x: 50, y: 5 / zoom });
    assert.equal(gesture.dragged, true);
    assert.equal(result.objects.length, 2);
    assert(result.objects.every((o) => o.points.length >= 2));
  }
});

test('partial erasure splits a stroke into independent, styled pieces with exact straight endpoints', () => {
  const stroke = line();
  const result = eraseHighlights(document(stroke), { x: 50, y: -20 }, { x: 50, y: 20 }, 5);
  assert.equal(result.objects.length, 2);
  assert.equal(result.objects[0].id, stroke.id);
  assert.notEqual(result.objects[1].id, stroke.id);
  close(result.objects[0].points.at(-1).x, 40);
  close(result.objects[1].points[0].x, 60);
  for (const piece of result.objects) {
    assert.equal(piece.color, stroke.color);
    assert.equal(piece.opacity, stroke.opacity);
    assert.equal(piece.width, stroke.width);
    assert.equal(piece.mode, 'free');
  }
});

test('continuous sweeps erase between distant pointer samples and affect all overlapping strokes', () => {
  const a = line('a'),
    b = { ...line('b'), color: '#86EFAC' },
    untouched = line('far', 500);
  const doc = document(a, b, untouched);
  const gesture = new HighlightEraserGesture(doc, { x: 50, y: -200 }, 10, 1);
  const result = gesture.finish({ x: 50, y: 200 });
  assert.equal(result.objects.filter((o) => o !== untouched).length, 4);
  assert.equal(result.objects.at(-1), untouched);
  assert.deepEqual(doc.objects, [a, b, untouched]);
});

test('one sweep can produce more than two fragments without bridging erased gaps', () => {
  const stroke = {
    ...line(),
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ],
  };
  const result = eraseHighlights(document(stroke), { x: 50, y: -20 }, { x: 50, y: 70 }, 5);
  assert.equal(result.objects.length, 3);
  assert(result.objects.every((o) => o.curves.length === o.points.length - 1));
  assert.equal(new Set(result.objects.map((o) => o.id)).size, 3);
});

test('curved survivors retain the original Bezier geometry instead of being resmoothed', () => {
  const curve = {
    start: { x: 0, y: 0 },
    a: { x: 100 / 3, y: 80 },
    b: { x: 200 / 3, y: -80 },
    end: { x: 100, y: 0 },
  };
  const stroke = {
    ...line(),
    width: 2,
    points: [curve.start, curve.end],
    curves: [{ a: curve.a, b: curve.b }],
  };
  const doc = document(stroke);
  const result = eraseHighlights(doc, { x: 50, y: -100 }, { x: 50, y: 100 }, 1);
  assert.equal(result.objects.length, 2);
  const left = highlightCurves(result.objects[0], result)[0][0];
  close(left.end.x, 48);
  for (const t of [0.05, 0.1, 0.3, 0.45]) {
    const original = at(curve, t),
      retained = at(left, t / 0.48);
    close(original.x, retained.x);
    close(original.y, retained.y);
  }
});

test('legacy smoothed freehand and multi-route highlights keep all uncut curve controls', () => {
  const stroke = {
    ...line(),
    smoothing: true,
    points: [
      { x: 0, y: 0 },
      { x: 40, y: 20 },
      { x: 80, y: 0 },
      { x: 120, y: 20 },
    ],
  };
  const doc = document(stroke);
  const original = highlightCurves(stroke, doc)[0][0];
  const result = eraseHighlights(doc, { x: 100, y: -50 }, { x: 100, y: 50 }, 3);
  assert.deepEqual(highlightCurves(result.objects[0], result)[0][0], original);
  const separate = {
    ...line('separate'),
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
    ],
    breaks: [2],
  };
  assert.equal(
    eraseHighlights(document(separate), { x: 50, y: -10 }, { x: 50, y: 10 }, 2).objects.length,
    3,
  );
});

test('misses and tangential contact retain the document and object identities', () => {
  const doc = document(line());
  assert.equal(eraseHighlights(doc, { x: -50, y: 300 }, { x: 150, y: 300 }, 5), doc);
  assert.equal(eraseHighlights(doc, { x: 50, y: 10 }, { x: 50, y: 10 }, 5), doc);
});

test('circuit objects, electrical topology, labels, and user data are untouched', () => {
  const circuit = demoDocument();
  const doc = { ...circuit, objects: [...circuit.objects, line()] };
  const result = eraseHighlights(doc, { x: 50, y: -1000 }, { x: 50, y: 1000 }, 100);
  for (const object of circuit.objects)
    assert.equal(
      result.objects.find((o) => o.id === object.id),
      object,
    );
});

test('smart and legacy component highlights can be erased over their electrical hosts', () => {
  const circuit = demoDocument();
  const component = circuit.objects.find((o) => o.kind === 'component');
  const legacy = { ...line('legacy'), mode: 'component', componentId: component.id };
  delete legacy.points;
  const smart = {
    ...line('smart'),
    mode: 'smart',
    spans: [{ componentId: component.id, terminalId: 'a', start: 0, end: 1 }],
  };
  delete smart.points;
  const doc = { ...circuit, objects: [...circuit.objects, legacy, smart] };
  const result = eraseHighlights(
    doc,
    { x: component.x, y: component.y - 50 },
    { x: component.x, y: component.y + 50 },
    2,
  );
  assert.equal(
    result.objects.find((o) => o.id === component.id),
    component,
  );
  assert(result.objects.filter((o) => o.kind === 'highlight').every((o) => o.mode === 'free'));
});

test('a whole drag is one undo/redo action, including all splits and original properties', () => {
  const doc = document(line('a'), line('b', 20));
  reset(doc);
  const gesture = new HighlightEraserGesture(doc, { x: 30, y: -30 }, 10, 1);
  store.getState().beginGesture();
  store.getState().preview(gesture.advance({ x: 30, y: 50 }));
  store.getState().preview(gesture.advance({ x: 70, y: 50 }));
  store.getState().preview(gesture.finish({ x: 70, y: -30 }));
  store.getState().endGesture();
  const erased = store.getState().document;
  assert.equal(store.getState().past.length, 1);
  store.getState().undo();
  assert.equal(store.getState().document, doc);
  store.getState().redo();
  assert.equal(store.getState().document, erased);
  assert.equal(erased.objects.length, 6);
});

test('cancelled and empty eraser gestures add no history; size is session state only', () => {
  const doc = document(line());
  reset(doc);
  const gesture = new HighlightEraserGesture(doc, { x: 50, y: -30 }, 10, 1);
  store.getState().beginGesture();
  store.getState().preview(gesture.advance({ x: 50, y: 30 }));
  store.getState().cancelGesture();
  assert.equal(store.getState().document, doc);
  assert.equal(store.getState().past.length, 0);
  store.getState().beginGesture();
  store.getState().endGesture();
  store.getState().setEraserSize(48);
  assert.equal(store.getState().eraserSize, 48);
  assert.equal(store.getState().past.length, 0);
  assert.equal(store.getState().document, doc);
});

test('normal Delete removes a selected highlight without affecting the circuit', () => {
  const circuit = demoDocument(),
    stroke = line();
  const doc = { ...circuit, objects: [...circuit.objects, stroke] };
  reset(doc);
  store.getState().select([stroke.id]);
  store.getState().remove();
  assert.deepEqual(store.getState().document.objects, circuit.objects);
  store.getState().undo();
  assert.equal(store.getState().document, doc);
});

test('fragments survive JSON round trips, copying, duplication, block rotation, and vector export', () => {
  const doc = eraseHighlights(document(line()), { x: 50, y: -20 }, { x: 50, y: 20 }, 5);
  assert.deepEqual(deserializeDocument(serializeDocument(doc)), doc);
  const selected = extractSelection(
    doc,
    doc.objects.map((o) => o.id),
  );
  const copies = cloneObjects(selected, { x: 20, y: 30 });
  for (let i = 0; i < copies.length; i++) {
    close(copies[i].curves[0].a.x, doc.objects[i].curves[0].a.x + 20);
    close(copies[i].curves[0].a.y, doc.objects[i].curves[0].a.y + 30);
    assert.notEqual(copies[i].id, doc.objects[i].id);
  }
  const rotated = rotateObjects(
    doc,
    doc.objects.map((o) => o.id),
    90,
  );
  assert.notDeepEqual(rotated.objects[0].curves, doc.objects[0].curves);
  const block = createPersonalBlock(
    doc,
    doc.objects.map((o) => o.id),
    'Fragments',
  );
  const parsed = parsePersonalBlocks(serializePersonalBlocks([block]))[0];
  const inserted = instantiatePersonalBlock(parsed, { x: 0, y: 0 }, 90, document());
  assert.equal(inserted.length, doc.objects.length);
  assert(inserted.every((o) => o.curves.length === o.points.length - 1));
  const svg = exportSVG(doc, { transparent: true });
  for (const object of doc.objects) assert(svg.includes(highlightDrawing(object, doc)[0].d));
});

test('endpoint edits move the adjacent control but preserve the rest of a fragment', () => {
  const doc = eraseHighlights(document(line()), { x: 50, y: -20 }, { x: 50, y: 20 }, 5);
  const original = doc.objects[0];
  const moved = moveHighlightEndpoint(original, true, { x: 0, y: 10 });
  close(moved.curves[0].a.y, original.curves[0].a.y + 10);
  assert.deepEqual(moved.curves[0].b, original.curves[0].b);
  assert.deepEqual(moved.points.at(-1), original.points.at(-1));
});

test('malformed explicit controls are rejected while old JSON remains readable', () => {
  assert.deepEqual(deserializeDocument(serializeDocument(document(line()))).objects, [line()]);
  const invalid = { ...line(), curves: [] };
  assert.throws(() => deserializeDocument(JSON.stringify(document(invalid))));
  invalid.curves = [{ a: { x: NaN, y: 0 }, b: { x: 1, y: 0 } }];
  assert.throws(() => deserializeDocument(JSON.stringify(document(invalid))));
});

test('split pieces share paint opacity at untouched self-overlaps, while duplicates get a separate paint group', () => {
  const stroke = {
    ...line(),
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ],
  };
  const doc = eraseHighlights(document(stroke), { x: 80, y: -20 }, { x: 80, y: 20 }, 5);
  assert.equal(doc.objects.length, 4);
  assert.equal(highlightPaintGroups(doc).length, 1);
  assert.equal((exportSVG(doc, { transparent: true }).match(/opacity="0.4"/g) ?? []).length, 1);
  const copies = cloneObjects(doc, { x: 0, y: 0 });
  assert.notEqual(copies[0].paintGroup, doc.objects[0].paintGroup);
  assert.equal(highlightPaintGroups(document(...doc.objects, ...copies)).length, 2);
});
