import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import 'katex/dist/katex.min.css';
import './styles.css';
import { isDesktop } from './desktop/environment';

async function start() {
  const ready = isDesktop() ? await (await import('./desktop/bootstrap')).bootstrapDesktop() : null;
  const { default: App } = await import('./App');
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  await ready?.();
}
void start().catch(async (error) => {
  const root = document.getElementById('root')!;
  root.textContent = `Impossibile aprire DrawCircuit. ${String(error)}`;
  if (isDesktop()) await (await import('@tauri-apps/api/window')).getCurrentWindow().show();
});
