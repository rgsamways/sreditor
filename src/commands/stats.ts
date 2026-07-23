import { c } from '../cliUi.js';
import { readStatsConfig, setStatsOptIn } from '../statsConfig.js';
import { buildStatsPayload } from '../telemetry/aggregate.js';

export function statsOn(cwd: string): void {
  setStatsOptIn(cwd, true);
  const payload = buildStatsPayload(cwd);
  console.log(
    `Usage stats sharing is now ${c.green('ON')}. Nothing but the fields below is ever sent -- no project name, no reasoning text, no change ids.`,
  );
  console.log(JSON.stringify(payload, null, 2));
  console.log('\nRun `sreditor stats off` at any time to stop.');
}

export function statsOff(cwd: string): void {
  setStatsOptIn(cwd, false);
  console.log(`Usage stats sharing is now ${c.gray('OFF')}. Nothing will be sent from this project going forward.`);
}

export function statsShow(cwd: string): void {
  const config = readStatsConfig(cwd);
  const payload = buildStatsPayload(cwd);
  const state = config.statsOptIn ? c.green('ON') : c.gray('OFF');
  console.log(`Sharing is currently ${state}. This is the exact payload that would be sent -- nothing has been sent.`);
  console.log(JSON.stringify(payload, null, 2));
}
