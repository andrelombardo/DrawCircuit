import type { VitePWAOptions } from 'vite-plugin-pwa';
/** Relative URLs keep the same build usable at /drawcircuit/ and other static hosts. */
export const pwaOptions: Partial<VitePWAOptions> = {
  registerType: 'prompt',
  injectRegister: null,
  includeAssets: ['favicon.svg', 'favicon-adaptive.svg', 'logo.png', 'icons/*.png'],
  manifest: {
    name: 'DrawCircuit',
    short_name: 'DrawCircuit',
    description: 'Disegna circuiti ed esportali in TikZ e SVG, anche offline.',
    start_url: './',
    scope: './',
    display: 'standalone',
    theme_color: '#2463e8',
    background_color: '#ffffff',
    lang: 'it',
    icons: [
      {
        src: 'icons/drawcircuit-blue-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'icons/drawcircuit-blue-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'icons/maskable-drawcircuit-blue-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,ttf}'],
    cleanupOutdatedCaches: true,
    navigateFallback: 'index.html',
    // A waiting worker is activated only by the explicit update action.
    skipWaiting: false,
    clientsClaim: true,
  },
};
