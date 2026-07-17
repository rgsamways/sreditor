import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts', 'src/migrate.ts', 'src/refresh.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
});
