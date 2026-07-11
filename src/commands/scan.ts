import { openSpecAdapter } from '../adapters/openspec.js';

export function scan(cwd: string): void {
  if (!openSpecAdapter.isAvailable(cwd)) {
    console.error('No OpenSpec archive found (expected openspec/changes/archive/).');
    process.exitCode = 1;
    return;
  }

  const changes = openSpecAdapter.listChanges(cwd);

  if (changes.length === 0) {
    console.log('No archived changes found.');
    return;
  }

  console.log(`Found ${changes.length} archived change${changes.length === 1 ? '' : 's'}:`);
  for (const change of changes) {
    const fileList = Object.keys(change.files).join(', ') || '(no artifact files found)';
    console.log(`  - ${change.id} [${fileList}]`);
  }
}
