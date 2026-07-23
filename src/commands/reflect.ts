import * as clack from '@clack/prompts';
import { appendRevision, readAnchor } from '../anchor.js';
import { startInterview } from '../interview.js';
import { draftReflection } from '../llm/anchor.js';

export async function reflect(cwd: string): Promise<void> {
  const anchorText = readAnchor(cwd);
  if (anchorText === null) {
    console.error('No anchor document found. Run `sreditor init` first.');
    process.exitCode = 1;
    return;
  }

  clack.intro('sreditor reflect');

  const interview = startInterview();
  try {
    const whatChangedRaw = await interview.ask(
      'What has changed in your understanding since the anchor was last written?',
    );
    const whyRaw = await interview.ask('Why — what did you learn or discover?');

    const draft = await draftReflection(anchorText, { whatChangedRaw, whyRaw });

    clack.note(`What changed: ${draft.whatChanged}\nWhy: ${draft.why}`, 'Drafted revision');

    if (!(await interview.confirm('Append this revision to your anchor document?'))) {
      clack.outro('Not saved.');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const body = `**What changed:** ${draft.whatChanged}\n**Why:** ${draft.why}`;
    appendRevision(cwd, `Revision ${today}`, body);

    clack.outro('Appended to .sreditor/anchor.md');
  } finally {
    interview.close();
  }
}
