import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Same fix as the main sreditor package's vitest.config.ts -- see that
    // file's comment for why 'forks' is needed on this environment.
    pool: 'forks',
  },
});
