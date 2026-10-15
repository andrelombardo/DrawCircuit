import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import 'katex/dist/katex.min.css';
import './styles.css';
import { retireLegacyOffline } from './pwa/retireLegacyOffline';

async function start() {
  if (import.meta.env.PROD)
    void retireLegacyOffline(new URL(import.meta.env.BASE_URL, document.baseURI).href);
  const { default: App } = await import('./App');
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
void start().catch((error) => {
  const root = document.getElementById('root')!;
  root.textContent = `Impossibile aprire DrawCircuit. ${String(error)}`;
});
