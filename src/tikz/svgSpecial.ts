/** Call only with trusted SVG whose user text/attributes are already XML-escaped.
 * Short, commented lines avoid TikZJax's TeX input buffer limit without inserting
 * spaces into SVG or font data. Chunk before escaping # to keep \string intact. */
export function svgSpecialPayload(svg: string): string {
  return (svg.replace(/\r?\n/g, ' ').match(/.{1,1000}/g) ?? [])
    .map((chunk) => chunk.replace(/#/g, '\\string#'))
    .join('%\n');
}
