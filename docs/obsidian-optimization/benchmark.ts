import 'katex/dist/katex.min.css';
import '../../src/fonts/comic-relief.css';
import '../../src/styles.css';
import { prepareCircuitFonts } from '../../src/model/fonts';
import { exportObsidian, exportTikz, exportStandalone } from '../../src/tikz/exporter';
import { exportSVG } from '../../src/svg/exporter';
import { exportPNG, preparePNGFonts, rasterizeSVG, embedSVGFonts } from '../../src/png/exporter';
import { fixtures, benchmarkNames, repeated } from './fixtures';
import { subsetFont } from '../../src/tikz/fontSubset';
import regular from '../../src/tikz/font-data/regular.json';
import originalRegular from '../../src/fonts/comic-relief/ComicRelief-Regular.woff2?inline';
import originalBold from '../../src/fonts/comic-relief/ComicRelief-Bold.woff2?inline';

const all = fixtures();
await prepareCircuitFonts();
for (const doc of Object.values(all)) await preparePNGFonts(doc);
await document.fonts.ready;
const api = {
  names: Object.keys(all),
  benchmarkNames,
  async fontRegression() {
    const failures: unknown[] = [];
    let cases = 0;
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 100;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    for (const weight of [400, 700] as const) {
      const full = new FontFace(
        'RegressionFull',
        `url(${weight === 400 ? originalRegular : originalBold})`,
        { weight: String(weight) },
      );
      await full.load();
      document.fonts.add(full);
      for (const codepoint of [...Object.keys(regular.cmap).map(Number), -1]) {
        const c = codepoint < 0 ? '日本語 العربية 🙂𝔸' : String.fromCodePoint(codepoint);
        const text = /\p{Mark}/u.test(c) ? `A${c}` : c;
        const subset = new FontFace('RegressionSubset', `url(${subsetFont(weight, text)})`, {
          weight: String(weight),
        });
        await subset.load();
        document.fonts.add(subset);
        for (const size of [9.5, 15.4, 22, 27, 36]) {
          const pixels: Uint8ClampedArray[] = [];
          const metrics: number[][] = [];
          for (const family of ['RegressionFull', 'RegressionSubset']) {
            context.clearRect(0, 0, 220, 100);
            context.font = `${weight} ${size}px ${family}, cursive`;
            context.textBaseline = 'alphabetic';
            context.fillText(text, 10, 60);
            const m = context.measureText(text);
            metrics.push([
              m.width,
              m.actualBoundingBoxLeft,
              m.actualBoundingBoxRight,
              m.actualBoundingBoxAscent,
              m.actualBoundingBoxDescent,
              m.fontBoundingBoxAscent,
              m.fontBoundingBoxDescent,
            ]);
            pixels.push(context.getImageData(0, 0, 220, 100).data);
          }
          cases++;
          let delta = 0;
          for (let i = 0; i < pixels[0].length; i++) if (pixels[0][i] !== pixels[1][i]) delta++;
          if (delta || JSON.stringify(metrics[0]) !== JSON.stringify(metrics[1]))
            failures.push({ weight, codepoint, size, differentChannels: delta, metrics });
        }
        document.fonts.delete(subset);
      }
      document.fonts.delete(full);
    }
    return { cases, failures, pass: failures.length === 0 };
  },
  async capture(name: string, images: boolean, compact = true) {
    const doc = all[name];
    const before = JSON.stringify(doc);
    const start = performance.now();
    const md = exportObsidian(doc, { compact });
    const exportMs = performance.now() - start;
    const raw = exportTikz(doc),
      standalone = exportStandalone(doc),
      svg = exportSVG(doc);
    const png = images ? new Uint8Array(await (await exportPNG(doc)).arrayBuffer()) : null;
    if (JSON.stringify(doc) !== before) throw new Error('Document mutated');
    return { doc, md, raw, standalone, svg, png: png ? Array.from(png) : null, exportMs };
  },
  async variants(name: string) {
    const svg = await embedSVGFonts(exportSVG(all[name], { transparent: true }));
    const rows = [];
    for (const scale of [1, 2, 4]) {
      const png = await rasterizeSVG(svg, scale);
      rows.push({
        scale,
        opaque: false,
        data: Array.from(new Uint8Array(await png.arrayBuffer())),
      });
      if (scale === 4) {
        const image = await createImageBitmap(png);
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
        image.close();
        const white = await new Promise<Blob>((resolve) =>
          canvas.toBlob((blob) => resolve(blob!), 'image/png'),
        );
        rows.push({
          scale,
          opaque: true,
          data: Array.from(new Uint8Array(await white.arrayBuffer())),
        });
      }
    }
    return rows;
  },
  async scenario(count: number) {
    let tikz = 0,
      png = 0,
      reference = 0;
    const circuits = [];
    for (let i = 0; i < count; i++) {
      const doc = repeated(1 + (i % 20));
      const first = doc.objects[0];
      if ('label' in first) first.label.text = `Circuito_${i + 1}`;
      const t = new TextEncoder().encode(exportObsidian(doc)).length;
      const p = (await exportPNG(doc)).size;
      const r = new TextEncoder().encode(`![[circuit-${i + 1}.png]]`).length;
      tikz += t;
      png += p;
      reference += r;
      circuits.push({
        components: 1 + (i % 20),
        label: `Circuito_${i + 1}`,
        tikzBytes: t,
        pngBytes: p,
        referenceBytes: r,
      });
    }
    return {
      count,
      tikz,
      png,
      reference,
      singleNoteTikz: tikz + 2 * (count - 1),
      singleNotePng: reference + 2 * (count - 1),
      circuits,
    };
  },
  async pngDecode(name: string) {
    const blob = await (
      await fetch(`/docs/obsidian-optimization/evidence/after/${name}.png`)
    ).blob();
    const times = [];
    for (let i = 0; i < 7; i++) {
      const url = URL.createObjectURL(blob),
        image = new Image();
      const start = performance.now();
      image.src = url;
      await image.decode();
      const decoded = performance.now() - start;
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext('2d')!.drawImage(image, 0, 0);
      times.push({ decodeMs: decoded, decodeAndDrawMs: performance.now() - start });
      canvas.width = canvas.height = 0;
      URL.revokeObjectURL(url);
    }
    return { name, times };
  },
};
Object.assign(window, { optimizationBenchmark: api });
document.querySelector('#status')!.textContent = 'Pronto';
