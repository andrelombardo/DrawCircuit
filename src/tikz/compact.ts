/** Only trusted, generated TikZ is rewritten. Paths are never merged, and no
 * coordinate arithmetic or transforms are introduced. Macro expansion preserves
 * the original operations and their painting order. */
const name = (index: number) => {
  let value = '';
  do {
    value = String.fromCharCode(97 + (index % 26)) + value;
    index = Math.floor(index / 26) - 1;
  } while (index >= 0);
  return value;
};

export function compactTikzLines(source: string[]): string[] {
  const lines = source.filter((l) => !l.startsWith('%'));
  const styles = new Map<string, number[]>();
  lines.forEach((line, i) => {
    const match = /^\\(?:draw|fill|path|node)\[([^\x5b\x5d]+)\]/.exec(line);
    if (!match) return;
    const options = match[1];
    const indices = styles.get(options) ?? [];
    indices.push(i);
    styles.set(options, indices);
  });
  const definitions: string[] = [];
  for (const [options, indices] of styles) {
    const key = `dc${name(definitions.length)}`;
    const definition = `\\tikzset{${key}/.style={${options}}}`;
    const saving = indices.length * (options.length - key.length);
    if (saving <= definition.length + 1) continue;
    for (const i of indices) lines[i] = lines[i].replace(`[${options}]`, `[${key}]`);
    definitions.push(definition);
  }
  const groups = new Map<string, { index: number; values: string[] }[]>();
  lines.forEach((line, index) => {
    const match = /^(\\(?:draw|fill|path)(?:\[[^\x5b\x5d]+\])?\s+)([^\n]+);$/.exec(line);
    if (!match) return;
    const values: string[] = [];
    const template = match[2].replace(/-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi, (value) => {
      let i = values.indexOf(value);
      if (i === -1) {
        i = values.length;
        values.push(value);
      }
      return `#${i + 1}`;
    });
    if (!values.length || values.length > 9) return;
    const key = `${match[1]}${template};`;
    const entries = groups.get(key) ?? [];
    entries.push({ index, values });
    groups.set(key, entries);
  });
  const macros: string[] = [];
  for (const [template, entries] of groups) {
    if (entries.length < 2) continue;
    const macro = `\\dcg${name(macros.length)}`;
    const definition = `\\def${macro}${entries[0].values.map((_, i) => `#${i + 1}`).join('')}{${template}}`;
    const calls = entries.map((e) => `${macro}${e.values.map((v) => `{${v}}`).join('')}`);
    const originalSize = entries.reduce((n, e) => n + lines[e.index].length, 0);
    if (definition.length + 1 + calls.reduce((n, c) => n + c.length, 0) >= originalSize) continue;
    entries.forEach((e, i) => {
      lines[e.index] = calls[i];
    });
    macros.push(definition);
  }
  if (definitions.length || macros.length) lines.splice(1, 0, ...definitions, ...macros);
  return lines.join('\n').length < source.join('\n').length ? lines : source;
}
