import { countRevisions, lastRevisionHeading, readAnchor } from '../anchor.js';
import { openSpecAdapter } from '../adapters/openspec.js';
import { judgmentsFile } from '../paths.js';
import { readJsonl } from '../persistence/jsonl.js';

export function status(cwd: string): void {
  const adapterAvailable = openSpecAdapter.isAvailable(cwd);
  const changeCount = adapterAvailable ? openSpecAdapter.listChanges(cwd).length : 0;
  const judgedIds = new Set(readJsonl<{ changeId: string }>(judgmentsFile(cwd)).map((record) => record.changeId));
  const judgedCount = judgedIds.size;

  console.log(`Source: ${adapterAvailable ? 'openspec (detected)' : 'none detected'}`);
  console.log(`Archived changes: ${changeCount}`);
  console.log(`Judged: ${judgedCount}`);
  console.log(`Unjudged: ${Math.max(changeCount - judgedCount, 0)}`);

  const anchorText = readAnchor(cwd);
  if (anchorText === null) {
    console.log('Anchor document: not found (sreditor init not yet run)');
  } else {
    const revisions = countRevisions(anchorText);
    console.log(`Anchor document: ${revisions} revision${revisions === 1 ? '' : 's'}, most recent: ${lastRevisionHeading(anchorText)}`);
  }
}
