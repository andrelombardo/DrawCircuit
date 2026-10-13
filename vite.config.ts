import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaOptions } from './src/pwa/config';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), VitePWA({ ...pwaOptions, disable: mode === 'desktop' })],
  build: {
    rollupOptions: {
      output: { manualChunks: (id) => (id.includes('/node_modules/katex/') ? 'latex' : undefined) },
    },
  },

  test: {
    // Long DOM workflows compete for CPU when Vitest uses every available core.
    // Match the release runner without weakening assertions or test timeouts.
    maxWorkers: 2,
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
}));
