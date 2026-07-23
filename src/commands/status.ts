import { countRevisions, lastRevisionHeading, readAnchor } from '../anchor.js';
import { openSpecAdapter } from '../adapters/openspec.js';
import { c } from '../cliUi.js';
import { judgmentsFile } from '../paths.js';
import { readJsonl } from '../persistence/jsonl.js';

export function status(cwd: string): void {
  const adapterAvailable = openSpecAdapter.isAvailable(cwd);
  const changeCount = adapterAvailable ? openSpecAdapter.listChanges(cwd).length : 0;
  const judgedIds = new Set(readJsonl<{ changeId: string }>(judgmentsFile(cwd)).map((record) => record.changeId));
  const judgedCount = judgedIds.size;
  const unjudgedCount = Math.max(changeCount - judgedCount, 0);

  console.log(`Source: ${adapterAvailable ? c.green('openspec (detected)') : c.yellow('none detected')}`);
  console.log(`Archived changes: ${changeCount}`);
  console.log(`Judged: ${c.green(String(judgedCount))}`);
  console.log(`Unjudged: ${unjudgedCount > 0 ? c.yellow(String(unjudgedCount)) : c.green('0')}`);

  const anchorText = readAnchor(cwd);
  if (anchorText === null) {
    console.log(c.yellow('Anchor document: not found (sreditor init not yet run)'));
  } else {
    const revisions = countRevisions(anchorText);
    console.log(
      c.green(
        `Anchor document: ${revisions} revision${revisions === 1 ? '' : 's'}, most recent: ${lastRevisionHeading(anchorText)}`,
      ),
    );
  }
}
