import { italian } from './it';

/** Translate complete messages; keep interpolation independent of word order. */
export function t(message: string, values: Record<string, string | number> = {}): string {
  const text = italian[message] ?? message;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}

/** Search Italian labels and their original message keys. */
export function searchText(messages: string[]): string {
  return messages.flatMap((message) => [message, italian[message] ?? '']).join(' ');
}
