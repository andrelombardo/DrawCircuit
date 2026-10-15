import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) =>
          id.includes('/src/tikz/font-data/')
            ? 'obsidian-fonts'
            : id.includes('/node_modules/katex/')
              ? 'latex'
              : undefined,
      },
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
});
