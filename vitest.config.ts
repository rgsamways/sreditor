import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Vitest 4.1.10 + Node v25.8.0 on Windows intermittently corrupts worker-pool
    // state under file parallelism ("Cannot read properties of undefined (reading
    // 'config')" / "failed to find the runner"). The suite is small enough that
    // running files serially costs about a second and is fully reliable.
    fileParallelism: false,
  },
});
