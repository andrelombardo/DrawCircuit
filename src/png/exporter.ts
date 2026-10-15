import type { CircuitDocument } from '../model/types';
import { exportSVG } from '../svg/exporter';
import { CIRCUIT_FONT } from '../model/fonts';
import { isMathSource } from '../math/latex';

export const PNG_SCALE = 4;
export const PNG_MAX_DIMENSION = 16_384;
export const PNG_MAX_PIXELS = 32_000_000;
export const PNG_PADDING = 8;
const fontURLs = import.meta.glob<string>('/node_modules/katex/dist/fonts/*.woff2', {
  eager: true,
  query: '?url',
  import: 'default',
});
const fontData = new Map<string, Promise<string>>();
const dataURL = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Impossibile leggere il font.'));
    reader.readAsDataURL(blob);
  });

/** SVG images have an isolated font context: embed the same local KaTeX fonts. */
export async function embedSVGFonts(svg: string): Promise<string> {
  const rules = await Promise.all(
    Object.entries(fontURLs).map(async ([path, url]) => {
      const match = /\/(KaTeX_[^-]+)-(Regular|Bold|Italic|BoldItalic)\.woff2$/.exec(path);
      if (!match || !svg.includes(match[1])) return '';
      let data = fontData.get(url);
      if (!data) {
        data = fetch(url)
          .then((response) => {
            if (!response.ok) throw new Error('Impossibile caricare i font per il PNG.');
            return response.blob();
          })
          .then(dataURL);
        fontData.set(url, data);
        data.catch(() => fontData.delete(url));
      }
      return `@font-face{font-family:${match[1]};font-style:${match[2].includes('Italic') ? 'italic' : 'normal'};font-weight:${match[2].includes('Bold') ? '700' : '400'};src:url(${await data}) format('woff2');}`;
    }),
  );
  return svg.replace('</title>', `</title><style>${rules.join('')}</style>`);
}

export function pngDimensions(svg: string, scale = PNG_SCALE) {
  const bounds = /viewBox="([^"]+)"/.exec(svg)?.[1].trim().split(/\s+/).map(Number);
  if (!bounds || !Number.isFinite(scale) || scale <= 0)
    throw new Error('Dimensioni PNG non valide.');
  if (
    bounds.length !== 4 ||
    bounds.some((n) => !Number.isFinite(n)) ||
    bounds[2] <= 0 ||
    bounds[3] <= 0
  )
    throw new Error('Dimensioni PNG non valide.');
  const [, , sourceWidth, sourceHeight] = bounds;
  // Keep normal drawings at 4×. Large drawings share one reduced scale, preserving
  // their aspect ratio while bounding the RGBA allocation (128 MB at most).
  const effectiveScale = Math.min(
    scale,
    PNG_MAX_DIMENSION / sourceWidth,
    PNG_MAX_DIMENSION / sourceHeight,
    Math.sqrt(PNG_MAX_PIXELS / (sourceWidth * sourceHeight)),
  );
  if (effectiveScale < Math.min(1, scale))
    throw new Error('PNG troppo grande: esporta una selezione più piccola.');
  let width = Math.min(PNG_MAX_DIMENSION, Math.max(1, Math.ceil(sourceWidth * effectiveScale)));
  let height = Math.min(PNG_MAX_DIMENSION, Math.max(1, Math.ceil(sourceHeight * effectiveScale)));
  // Ceil can cross the pixel budget; leave space for that final pixel on each axis.
  if (width * height > PNG_MAX_PIXELS) {
    // Floor the actual bounded dimensions. Recomputing a scale then taking ceil
    // can round straight back up and exceed the budget for fractional viewBoxes.
    width = Math.max(1, Math.floor(sourceWidth * effectiveScale));
    height = Math.max(1, Math.floor(sourceHeight * effectiveScale));
  }
  return { width, height };
}

/** Font ink bounds can differ from SVG text metrics. Crop only transparent pixels,
 * then give all four edges the same margin without changing the drawing scale.
 * Scan in strips to avoid another full-size RGBA allocation for large circuits. */
export function pngContentFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
) {
  let left = width,
    top = height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < height; y += 128) {
    const rows = Math.min(128, height - y);
    const { data } = context.getImageData(0, y, width, rows);
    for (let row = 0; row < rows; row++)
      for (let x = 0; x < width; x++) {
        if (data[(row * width + x) * 4 + 3] === 0) continue;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y + row);
        bottom = Math.max(bottom, y + row);
      }
  }
  if (right < left) return { x: 0, y: 0, width, height };
  const inkWidth = right - left + 1,
    inkHeight = bottom - top + 1;
  // Never exceed the existing dimension/pixel budgets, including rounding.
  const padding = Math.max(
    0,
    Math.min(
      Math.round(PNG_PADDING * scale),
      Math.floor((width - inkWidth) / 2),
      Math.floor((height - inkHeight) / 2),
    ),
  );
  return {
    x: left - padding,
    y: top - padding,
    width: inkWidth + padding * 2,
    height: inkHeight + padding * 2,
  };
}

export async function rasterizeSVG(svg: string, scale = PNG_SCALE): Promise<Blob> {
  const { width, height } = pngDimensions(svg, scale);
  // Give the SVG image its final physical size before decoding, so the browser
  // rasterizes vector paths/text directly at the output resolution.
  const sizedSVG = svg.replace(/<svg\b[^>]*>/, (tag) =>
    tag
      .replace(/\s(?:width|height)="[^"]*"/g, '')
      .replace(/>$/, ` width="${width}" height="${height}">`),
  );
  const url = URL.createObjectURL(new Blob([sizedSVG], { type: 'image/svg+xml' }));
  let canvas: HTMLCanvasElement | undefined;
  let trimmed: HTMLCanvasElement | undefined;
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Impossibile rasterizzare il circuito.'));
      image.src = url;
    });
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas PNG non disponibile.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);
    const sourceWidth = Number(/viewBox="([^"]+)"/.exec(svg)![1].trim().split(/\s+/)[2]);
    const frame = pngContentFrame(context, width, height, width / sourceWidth);
    trimmed = document.createElement('canvas');
    trimmed.width = frame.width;
    trimmed.height = frame.height;
    const output = trimmed.getContext('2d');
    if (!output) throw new Error('Canvas PNG non disponibile.');
    // Integer translation preserves every original antialiased pixel.
    output.drawImage(canvas, -frame.x, -frame.y);
    canvas.width = canvas.height = 0;
    return await new Promise<Blob>((resolve, reject) =>
      trimmed!.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Impossibile creare il PNG.'))),
        'image/png',
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
    // Release the large backing store as soon as the encoded blob is available.
    if (canvas) canvas.width = canvas.height = 0;
    if (trimmed) trimmed.width = trimmed.height = 0;
  }
}

/** Loading after layout is too late: KaTeX first requests glyph faces when its
 * temporary measurement nodes are inserted. Prime them before exportSVG measures. */
export async function preparePNGFonts(doc: CircuitDocument): Promise<void> {
  if (!document.fonts) return;
  const sources = doc.objects.flatMap((o) =>
    o.kind === 'text' ? [o.text] : 'label' in o ? [o.label.text] : [],
  );
  const text = sources.join(' ');
  const requests = [
    document.fonts.load(`400 22px ${CIRCUIT_FONT}`, text || 'DrawCircuit'),
    document.fonts.load(`700 22px ${CIRCUIT_FONT}`, text || 'DrawCircuit'),
  ];
  if (sources.some((source) => isMathSource(source))) {
    for (const path of Object.keys(fontURLs)) {
      const match = /\/(KaTeX_[^-]+)-(Regular|Bold|Italic|BoldItalic)\.woff2$/.exec(path);
      if (!match) continue;
      const style = match[2].includes('Italic') ? 'italic' : 'normal';
      const weight = match[2].includes('Bold') ? '700' : '400';
      requests.push(document.fonts.load(`${style} ${weight} 22px ${match[1]}`, text));
    }
  }
  await Promise.all(requests);
  await document.fonts.ready;
}

export async function exportPNG(doc: CircuitDocument): Promise<Blob> {
  await preparePNGFonts(doc);
  return rasterizeSVG(await embedSVGFonts(exportSVG(doc, { transparent: true })));
}

/** Pass the promise immediately to preserve clipboard user activation on Safari. */
export async function copyPNG(doc: CircuitDocument) {
  if (
    typeof ClipboardItem === 'undefined' ||
    !navigator.clipboard?.write ||
    (ClipboardItem.supports && !ClipboardItem.supports('image/png'))
  )
    throw new Error('Questo browser non consente la copia immagine. Usa Scarica PNG.');
  const png = exportPNG(doc);
  // A denied clipboard can reject before the image promise settles.
  void png.catch(() => {});
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
}
