// Preserve TeX/XML escaping. Printable ASCII can pass through a special directly;
// every TeX metacharacter, control and non-ASCII codepoint stays a numeric entity.
const encode = (value: string, quote = '') =>
  Array.from(value, (c) =>
    /[&<>%#{}\\^_~$]/.test(c) ||
    (c === ' ' && !quote) ||
    c === quote ||
    c.codePointAt(0)! < 32 ||
    c.codePointAt(0)! > 126
      ? `&#${c.codePointAt(0)};`
      : c,
  ).join('');
function serialize(node: Node): string {
  if (node.nodeType === 3) return encode(node.textContent ?? '');
  if (node.nodeType !== 1) return '';
  const e = node as Element;
  const attributes = [...e.attributes]
    .map((a) => {
      const quote = a.value.includes('"') && !a.value.includes("'") ? "'" : '"';
      return ` ${a.name}=${quote}${encode(a.value, quote)}${quote}`;
    })
    .join('');
  const children = [...e.childNodes].map(serialize).join('');
  return children
    ? `<${e.tagName}${attributes}>${children}</${e.tagName}>`
    : `<${e.tagName}${attributes}/>`;
}

/** Isolated, trusted fragments from canvasTextLayout only. Keep each text run,
 * position and painter's order; factor inherited font properties if profitable. */
export function compactCanvasSvg(source: string): string {
  if (typeof DOMParser === 'undefined') return source;
  const doc = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${source}</svg>`,
    'image/svg+xml',
  );
  if (doc.querySelector('parsererror')) return source;
  const root = doc.documentElement;
  const direct = [...root.childNodes].map(serialize).join('');
  const text = [...root.querySelectorAll('text')];
  const group = doc.createElementNS(root.namespaceURI, 'g');
  for (const property of ['font-family', 'font-size', 'font-style', 'font-weight']) {
    if (text.length < 2 || text.some((t) => !t.hasAttribute(property))) continue;
    const counts = new Map<string, number>();
    for (const t of text) {
      const value = t.getAttribute(property)!;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    const [value, count] = [...counts].sort((a, b) => b[1] - a[1])[0];
    if (count < 2) continue;
    group.setAttribute(property, value);
    for (const t of text) if (t.getAttribute(property) === value) t.removeAttribute(property);
  }
  group.append(...root.childNodes);
  const inherited = serialize(group);
  return [source, direct, inherited].reduce((a, b) => (b.length < a.length ? b : a));
}
