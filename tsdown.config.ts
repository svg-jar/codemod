import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/cli.ts', 'src/codemod.ts'],
  format: 'esm',
  target: 'node20',
  dts: true,
  clean: true,
  outDir: 'dist',
});
