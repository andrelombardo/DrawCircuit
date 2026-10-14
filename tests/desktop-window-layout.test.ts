// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { trackWindowLayout } from '../src/desktop/windowLayout';

function nativeWindow(fullscreen = false) {
  let resize = () => {};
  let focus = () => {};
  const stopResize = vi.fn();
  const stopFocus = vi.fn();
  const source = {
    isFullscreen: vi.fn().mockResolvedValue(fullscreen),
    onResized: async (handler: () => void) => {
      resize = handler;
      return stopResize;
    },
    onFocusChanged: async (handler: () => void) => {
      focus = handler;
      return stopFocus;
    },
  };
  return { source, resize: () => resize(), focus: () => focus(), stopResize, stopFocus };
}

describe('native window layout', () => {
  it('tracks native fullscreen on startup, resize and focus changes', async () => {
    const window = nativeWindow(true);
    const root = document.createElement('div');
    const stop = await trackWindowLayout(window.source, root);
    expect(root.dataset.desktopFullscreen).toBe('true');
    window.source.isFullscreen.mockResolvedValue(false);
    window.resize();
    await vi.waitFor(() => expect(root.dataset.desktopFullscreen).toBe('false'));
    window.source.isFullscreen.mockResolvedValue(true);
    window.focus();
    await vi.waitFor(() => expect(root.dataset.desktopFullscreen).toBe('true'));
    stop();
  });

  it('keeps the latest transition when native queries finish out of order', async () => {
    const window = nativeWindow();
    const root = document.createElement('div');
    const stop = await trackWindowLayout(window.source, root);
    let finishOldQuery!: (fullscreen: boolean) => void;
    const oldQuery = new Promise<boolean>((resolve) => (finishOldQuery = resolve));
    window.source.isFullscreen.mockReturnValueOnce(oldQuery).mockResolvedValueOnce(true);
    window.resize();
    window.focus();
    await vi.waitFor(() => expect(root.dataset.desktopFullscreen).toBe('true'));
    finishOldQuery(false);
    await oldQuery;
    expect(root.dataset.desktopFullscreen).toBe('true');
    stop();
  });

  it('removes subscriptions and ignores pending replies after disposal', async () => {
    const window = nativeWindow();
    const root = document.createElement('div');
    const stop = await trackWindowLayout(window.source, root);
    let finishQuery!: (fullscreen: boolean) => void;
    const pending = new Promise<boolean>((resolve) => (finishQuery = resolve));
    window.source.isFullscreen.mockReturnValueOnce(pending);
    window.resize();
    stop();
    finishQuery(true);
    await pending;
    expect(root.dataset.desktopFullscreen).toBe('false');
    expect(window.stopResize).toHaveBeenCalledOnce();
    expect(window.stopFocus).toHaveBeenCalledOnce();
  });

  it('recovers after a failed native query without interrupting app startup', async () => {
    const window = nativeWindow();
    const root = document.createElement('div');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      window.source.isFullscreen.mockRejectedValueOnce(new Error('Window is transitioning'));
      const stop = await trackWindowLayout(window.source, root);
      expect(root.dataset.desktopFullscreen).toBeUndefined();
      window.source.isFullscreen.mockResolvedValue(true);
      window.focus();
      await vi.waitFor(() => expect(root.dataset.desktopFullscreen).toBe('true'));
      expect(warning).toHaveBeenCalledOnce();
      stop();
    } finally {
      warning.mockRestore();
    }
  });
});
