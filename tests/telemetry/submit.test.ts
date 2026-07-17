import { createServer, type Server } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setStatsOptIn } from '../../src/statsConfig.js';
import { submitStatsIfOptedIn } from '../../src/telemetry/submit.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sreditor-telemetry-submit-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  delete process.env.SREDITOR_STATS_URL;
  vi.restoreAllMocks();
});

describe('submitStatsIfOptedIn', () => {
  it('makes no network call at all when not opted in', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    await submitStatsIfOptedIn(dir);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('never throws when the stats endpoint immediately destroys the connection', async () => {
    setStatsOptIn(dir, true);

    const server: Server = createServer((_req, res) => {
      res.destroy();
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;
    process.env.SREDITOR_STATS_URL = `http://127.0.0.1:${port}/v1/stats`;

    await expect(submitStatsIfOptedIn(dir)).resolves.toBeUndefined();

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('never throws when the stats endpoint is entirely unreachable', async () => {
    setStatsOptIn(dir, true);
    process.env.SREDITOR_STATS_URL = 'http://127.0.0.1:1/v1/stats';

    await expect(submitStatsIfOptedIn(dir)).resolves.toBeUndefined();
  });
});
