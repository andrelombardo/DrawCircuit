interface WindowLayoutSource {
  isFullscreen(): Promise<boolean>;
  onResized(handler: () => void): Promise<() => void>;
  onFocusChanged(handler: () => void): Promise<() => void>;
}

/** Native fullscreen is independent of the browser's Fullscreen API. */
export async function trackWindowLayout(
  source: WindowLayoutSource,
  root: HTMLElement = document.documentElement,
) {
  let active = true;
  let revision = 0;
  const refresh = async () => {
    const request = ++revision;
    const fullscreen = await source.isFullscreen();
    if (active && request === revision) root.dataset.desktopFullscreen = String(fullscreen);
  };
  const report = (error: unknown) => {
    if (active) console.warn('Impossibile aggiornare il layout della finestra.', error);
  };
  const changed = () => void refresh().catch(report);
  const stopResize = await source.onResized(changed);
  const stopFocus = await source.onFocusChanged(changed);
  await refresh().catch(report);
  return () => {
    active = false;
    revision++;
    stopResize();
    stopFocus();
  };
}
