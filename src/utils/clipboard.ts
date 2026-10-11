import type { CircuitDocument } from '../model/types';
import { deserializeDocument, serializeDocument } from '../model/serialization';
import { extractSelection } from './operations';
let fallback: CircuitDocument | null = null;
/** Returning a promise guarantees a valid session copy already exists. */
export function copySelection(
  doc: CircuitDocument,
  ids: string[],
  clipboardData?: DataTransfer | null,
): Promise<void> | null {
  if (!ids.length) return null;
  let raw: string;
  try {
    raw = serializeDocument(extractSelection(doc, ids));
    const copied = deserializeDocument(raw);
    if (!copied.objects.length) return null;
    fallback = copied;
  } catch {
    return null;
  }
  try {
    clipboardData?.setData('text/plain', raw);
  } catch {
    /* The validated session fallback and asynchronous clipboard write still work. */
  }
  return (async () => {
    try {
      await navigator.clipboard.writeText(raw);
    } catch {
      /* Session copy is available. */
    }
  })();
}
export async function pasteSelection(nativeText?: string): Promise<CircuitDocument | null> {
  if (nativeText !== undefined) {
    try {
      if (nativeText.trim().startsWith('{')) return deserializeDocument(nativeText);
    } catch {
      /* An unrelated or invalid native clipboard must not modify the document. */
    }
    return fallback;
  }
  try {
    const raw = await navigator.clipboard.readText();
    if (raw.trim().startsWith('{')) return deserializeDocument(raw);
  } catch {
    /* Clipboard denied or unrelated/invalid data: use the last valid session copy. */
  }
  return fallback;
}
