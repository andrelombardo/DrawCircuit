import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) =>
          id.includes('/node_modules/katex/') ? 'latex' : undefined,
      },
    },
  },
});
