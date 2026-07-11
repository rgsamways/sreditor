import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // On Node v25.8.0 + Windows, the default 'threads' pool (worker_threads)
    // intermittently corrupted worker state at startup ("Vitest failed to find
    // the runner" / "Cannot read properties of undefined (reading 'config')").
    // 'forks' uses separate OS processes with explicit IPC instead of shared
    // worker_threads memory, which resolved it -- confirmed with 20+ consecutive
    // clean runs across npm test/npx vitest/direct binary invocations, with no
    // performance cost (actually faster than the file-serialization workaround
    // this replaced, since files run in parallel again).
    pool: 'forks',
  },
});
