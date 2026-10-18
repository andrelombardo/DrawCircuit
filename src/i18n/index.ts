import { create } from 'zustand';
import { italian } from './it';

export type Language = 'en' | 'it';
const preferenceKey = 'drawcircuit.language.v1';
function savedLanguage(): Language {
  try {
    return localStorage.getItem(preferenceKey) === 'it' ? 'it' : 'en';
  } catch {
    return 'en';
  }
}

export const useLanguage = create<{
  language: Language;
  setLanguage: (language: Language) => void;
}>((set) => ({
  language: savedLanguage(),
  setLanguage(language) {
    set({ language });
    try {
      localStorage.setItem(preferenceKey, language);
    } catch {
      // Language selection remains available when storage is blocked.
    }
  },
}));

/** Translate complete messages; keep interpolation independent of word order. */
export function t(message: string, values: Record<string, string | number> = {}): string {
  const text = useLanguage.getState().language === 'it' ? (italian[message] ?? message) : message;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}

/** Search both languages without changing the selected UI language. */
export function searchText(messages: string[]): string {
  return messages.flatMap((message) => [message, italian[message] ?? '']).join(' ');
}
