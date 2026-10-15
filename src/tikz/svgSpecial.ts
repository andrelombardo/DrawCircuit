/** Call only with trusted SVG whose user text/attributes are already XML-escaped.
 * Short, commented lines avoid TikZJax's TeX input buffer limit without inserting
 * spaces into SVG or font data. Chunk before escaping # to keep \string intact. */
export function svgSpecialPayload(svg: string, preserveWhitespace = false): string {
  const source = svg.replace(/\r?\n/g, ' ');
  const chunks: string[] = [];
  for (let start = 0; start < source.length;) {
    let end = Math.min(start + 1000, source.length);
    // TeX skips leading spaces on a continued line. Move the boundary before a
    // nonspace instead. The legacy path remains available byte for byte.
    if (preserveWhitespace) while (end > start + 1 && /\s/.test(source[end] ?? '')) end--;
    chunks.push(source.slice(start, end));
    start = end;
  }
  return chunks.map((chunk) => chunk.replace(/#/g, '\\string#')).join('%\n');
}
