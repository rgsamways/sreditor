import { openSpecAdapter } from '../adapters/openspec.js';
import { c } from '../cliUi.js';

export function scan(cwd: string): void {
  if (!openSpecAdapter.isAvailable(cwd)) {
    console.error(c.red('No OpenSpec archive found (expected openspec/changes/archive/).'));
    process.exitCode = 1;
    return;
  }

  const changes = openSpecAdapter.listChanges(cwd);

  if (changes.length === 0) {
    console.log(c.gray('No archived changes found.'));
    return;
  }

  console.log(c.bold(`Found ${changes.length} archived change${changes.length === 1 ? '' : 's'}:`));
  for (const change of changes) {
    const fileList = Object.keys(change.files).join(', ') || '(no artifact files found)';
    console.log(`  - ${c.cyan(change.id)} [${fileList}]`);
  }
}
