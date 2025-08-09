import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: false, // no need for CLI typings
  minify: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
