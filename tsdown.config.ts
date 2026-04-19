import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/cli.ts', 'src/index.ts'],
  format: 'esm',
  target: 'node20',
  dts: true,
  clean: true,
  outDir: 'dist',
});
