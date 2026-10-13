export const isDesktop = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
