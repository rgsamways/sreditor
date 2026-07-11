import { openSpecAdapter } from '../adapters/openspec.js';
import { judgmentsFile } from '../paths.js';
import { readJsonl } from '../persistence/jsonl.js';

export function status(cwd: string): void {
  const adapterAvailable = openSpecAdapter.isAvailable(cwd);
  const changeCount = adapterAvailable ? openSpecAdapter.listChanges(cwd).length : 0;
  const judgedCount = readJsonl(judgmentsFile(cwd)).length;

  console.log(`Source: ${adapterAvailable ? 'openspec (detected)' : 'none detected'}`);
  console.log(`Archived changes: ${changeCount}`);
  console.log(`Judged: ${judgedCount}`);
  console.log(`Unjudged: ${Math.max(changeCount - judgedCount, 0)}`);
  console.log('Anchor document: not found (sreditor init not yet run)');
}
