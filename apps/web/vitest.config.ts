import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@near-by/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@near-by/types': path.resolve(__dirname, '../../packages/types/src'),
    },
  },
});
