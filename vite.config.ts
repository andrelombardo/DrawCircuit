import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaOptions } from './src/pwa/config';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const versions = JSON.parse(
  readFileSync(new URL('./release.config.json', import.meta.url), 'utf8'),
);
const commit =
  process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    VitePWA({ ...pwaOptions, disable: mode === 'desktop' }),
    {
      name: 'drawcircuit-release-metadata',
      transformIndexHtml: () =>
        ['version', 'channel', 'commit'].map((key) => ({
          tag: 'meta',
          attrs: {
            name: `drawcircuit-${key}`,
            content: String(
              {
                version:
                  process.env.DRAWCIRCUIT_VERSION ??
                  versions[mode === 'desktop' ? 'desktopVersion' : 'webVersion'],
                channel: mode === 'desktop' ? 'desktop' : 'web',
                commit,
              }[key as 'version' | 'channel' | 'commit'],
            ),
          },
          injectTo: 'head' as const,
        })),
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({
            version:
              process.env.DRAWCIRCUIT_VERSION ??
              versions[mode === 'desktop' ? 'desktopVersion' : 'webVersion'],
            channel: mode === 'desktop' ? 'desktop' : 'web',
            commit,
          }),
        });
      },
    },
  ],
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
