import katex from 'katex';

const primeCharacter = /['‘’′]/u;
const superscriptPrimeCharacter = /['‘’′`]/u;
const barePrimeSource = /^[A-Za-z\u0370-\u03ff]['‘’′`]+$/u;
export const isMathSource = (source: string): boolean =>
  /[_^\\$\u0370-\u03ff]/u.test(source) || barePrimeSource.test(source.trim());

/** Return the end of a TeX group without interpreting or rewriting its contents. */
function groupEnd(source: string, start: number): number {
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '\\') i++;
    else if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return i + 1;
  }
  return source.length;
}

const textCommands = new Set([
  'text',
  'textrm',
  'textnormal',
  'textbf',
  'textit',
  'textsf',
  'texttt',
  'textsc',
  'textup',
  'textmd',
  'textsl',
  'mbox',
  'operatorname',
  'url',
  'href',
]);

/** Only math primes change: TeX prose arguments and all other script sizes stay intact. */
function normalizePrimes(source: string): string {
  let result = '';
  for (let i = 0; i < source.length;) {
    if (source[i] === '\\') {
      const command = /^\\([a-zA-Z]+|.)/u.exec(source.slice(i));
      if (command) {
        let end = i + command[0].length;
        if (textCommands.has(command[1])) {
          if (source[end] === '*') end++;
          const argumentsCount = command[1] === 'href' ? 2 : 1;
          for (let argument = 0; argument < argumentsCount; argument++) {
            while (/\s/u.test(source[end] ?? '') && end < source.length) end++;
            end = source[end] === '{' ? groupEnd(source, end) : Math.min(end + 1, source.length);
          }
        } else if (command[1] === 'verb') {
          if (source[end] === '*') end++;
          const close = source.indexOf(source[end], end + 1);
          end = close < 0 ? source.length : close + 1;
        }
        result += source.slice(i, end);
        i = end;
        continue;
      }
    }
    if (source[i] === '^' || source[i] === '_') {
      const superscript = source[i] === '^';
      const characters = superscript ? superscriptPrimeCharacter : primeCharacter;
      let start = i + 1;
      while (/\s/u.test(source[start] ?? '') && start < source.length) start++;
      let end = start;
      let primes = '';
      if (source[start] === '{') {
        end = groupEnd(source, start);
        const argument = source.slice(start + 1, end - 1);
        const primeOnly = superscript
          ? /^(?:['‘’′`]|\\prime(?![a-zA-Z])|\s)+$/u
          : /^(?:['‘’′]|\\prime(?![a-zA-Z])|\s)+$/u;
        if (source[end - 1] === '}' && primeOnly.test(argument)) primes = argument;
      } else {
        while (characters.test(source[end] ?? '') && end < source.length) end++;
        primes = source.slice(start, end);
      }
      if (characters.test(primes)) {
        const normalized = primes.replace(superscript ? /['‘’′`]/gu : /['‘’′]/gu, '\\prime');
        result += `${source.slice(i, start)}{${normalized}}`;
        i = end;
        continue;
      }
    }
    // Bare mathematical primes must enter the same pipeline as explicit scripts.
    // Keep TeX shorthand beside another script so KaTeX can merge it (A'^{2}).
    if (superscriptPrimeCharacter.test(source[i]) && /[\p{L}\]}]/u.test(source[i - 1] ?? '')) {
      let end = i;
      while (superscriptPrimeCharacter.test(source[end] ?? '') && end < source.length) end++;
      const primes = source.slice(i, end);
      const followedByScript = /^\s*[_^]/u.test(source.slice(end));
      result += followedByScript
        ? "'".repeat(primes.length)
        : `^{${'\\prime'.repeat(primes.length)}}`;
      i = end;
      continue;
    }
    result += /[‘’′]/u.test(source[i]) ? "'" : source[i];
    i++;
  }
  return result;
}

/** Rendering/export normalization never changes the stored user source. */
export const normalizeLatex = (source: string, forceMath = false): string => {
  const aliases = source.replace(/\\ohm(?![a-zA-Z])/g, '\\Omega');
  return superscriptPrimeCharacter.test(aliases) && (forceMath || isMathSource(source))
    ? normalizePrimes(aliases)
    : aliases;
};
export const mathContent = (source: string): string =>
  source.startsWith('$') && source.endsWith('$') && source.length > 1
    ? source.slice(1, -1)
    : source;
export type LatexResult =
  | { kind: 'plain' | 'invalid'; source: string; html?: undefined }
  | { kind: 'math'; source: string; html: string };
const cache = new Map<string, LatexResult>();

/** The Comic Relief override cannot use KaTeX's prime metrics. Restore only the
 * mathematical prime glyph; text-command contents and every other glyph remain
 * untouched. The same HTML is measured by editor and vector export. */
function markMathPrimes(html: string): string {
  const spans: string[][] = [];
  return html.replace(/<span\b[^>]*>|<\/span>/gu, (tag, index: number) => {
    if (tag === '</span>') {
      spans.pop();
      return tag;
    }
    const classes = /\bclass="([^"]*)"/u.exec(tag)?.[1].split(/\s/u) ?? [];
    const math = spans.some((parent) => parent.includes('katex-html'));
    const text = spans.some(
      (parent) => parent.includes('text') || parent.includes('mtext') || parent.includes('mop'),
    );
    spans.push(classes);
    return math && !text && /^′+<\/span>/u.test(html.slice(index + tag.length))
      ? tag.replace(/\bclass="([^"]*)"/u, 'class="$1 math-prime"')
      : tag;
  });
}

/** KaTeX is the single math engine for canvas, live preview and export validation. */
export function renderLatex(source: string, forceMath = false): LatexResult {
  if (!forceMath && !isMathSource(source)) return { kind: 'plain', source };
  const key = `${forceMath}:${source}`;
  const cached = cache.get(key);
  if (cached) return cached;
  let result: LatexResult;
  try {
    result = {
      kind: 'math',
      source,
      html: markMathPrimes(
        katex.renderToString(mathContent(normalizeLatex(source, forceMath)), {
          output: 'htmlAndMathml',
          throwOnError: true,
          trust: false,
          strict: 'ignore',
          maxExpand: 1000,
          maxSize: 20,
        }),
      ),
    };
  } catch {
    result = { kind: 'invalid', source };
  }
  if (cache.size >= 256) cache.delete(cache.keys().next().value!);
  cache.set(key, result);
  return result;
}
