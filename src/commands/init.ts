import * as clack from '@clack/prompts';
import { createAnchor, readAnchor } from '../anchor.js';
import { startInterview } from '../interview.js';
import { draftAnchor } from '../llm/anchor.js';

export async function init(cwd: string): Promise<void> {
  if (readAnchor(cwd) !== null) {
    console.error('An anchor document already exists. Use `sreditor reflect` to add a revision instead.');
    process.exitCode = 1;
    return;
  }

  clack.intro('sreditor init');

  const interview = startInterview();
  try {
    const goalRaw = await interview.ask('What are you trying to build, in one sentence?');
    const uncertaintyRaw = await interview.ask(
      "What's the part of this you're genuinely unsure how to solve — not just haven't gotten around to, but don't actually know the answer to yet?",
    );
    const successCriteriaRaw = await interview.ask(
      'How would you know if you\'d solved it? What would "it worked" look like?',
    );

    const draft = await draftAnchor({ goalRaw, uncertaintyRaw, successCriteriaRaw });

    clack.note(
      `Goal: ${draft.goal}\nGenuine uncertainty: ${draft.uncertainty}\nSuccess criteria: ${draft.successCriteria}`,
      'Drafted anchor',
    );

    if (!(await interview.confirm('Save this as your anchor document?'))) {
      clack.outro('Not saved.');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const body = `**Goal:** ${draft.goal}\n**Genuine uncertainty:** ${draft.uncertainty}\n**Success criteria:** ${draft.successCriteria}`;
    createAnchor(cwd, draft.goal, `Revision ${today} (original)`, body);

    clack.outro('Saved to .sreditor/anchor.md');
  } finally {
    interview.close();
  }
}
