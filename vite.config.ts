import { defineConfig } from 'vite';
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
});
