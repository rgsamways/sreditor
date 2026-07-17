import { readStatsConfig } from '../statsConfig.js';
import { buildStatsPayload } from './aggregate.js';

const DEFAULT_STATS_URL = 'https://api.sreditor.ca/v1/stats';
const SUBMIT_TIMEOUT_MS = 3000;

function statsUrl(): string {
  return process.env.SREDITOR_STATS_URL ?? DEFAULT_STATS_URL;
}

// Called at the very end of judge/rollup's own work. Must never throw, never
// reject, and never noticeably delay the caller -- a broken or unreachable
// stats endpoint is not this command's problem, whether that's a network
// outage, a bug in a not-yet-deployed server, or the developer simply never
// having opted in (the common case, checked first and cheap to short-circuit).
export async function submitStatsIfOptedIn(cwd: string): Promise<void> {
  try {
    const config = readStatsConfig(cwd);
    if (!config.statsOptIn) {
      return;
    }

    const payload = buildStatsPayload(cwd);
    await fetch(statsUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
    });
  } catch {
    // Intentionally swallowed -- see function comment.
  }
}
