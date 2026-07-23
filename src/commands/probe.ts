import * as clack from '@clack/prompts';
import { appendProbeSection, findDraftChange, hasExistingProbeSection, readDraftProposal } from '../openspecDraft.js';
import { startInterview } from '../interview.js';
import { draftProbeAddendum } from '../llm/probe.js';

export async function probe(cwd: string, changeId: string): Promise<void> {
  if (findDraftChange(cwd, changeId) === null) {
    console.error(
      `No draft change found at openspec/changes/${changeId}/. Check the change id and that it hasn't already been archived.`,
    );
    process.exitCode = 1;
    return;
  }

  clack.intro('sreditor probe');
  clack.note(
    'Probing is most valuable before implementation starts — the earlier you run this, the fresher the uncertainty.',
  );

  const interview = startInterview();
  try {
    const existingProposal = readDraftProposal(cwd, changeId) ?? '';
    if (hasExistingProbeSection(existingProposal)) {
      if (!(await interview.confirm('This change already has a probe addendum. Add another one?'))) {
        clack.outro('Not saved.');
        return;
      }
    }

    const approachRaw = await interview.ask(
      "What approach are you planning to take here — do you already know it'll work, or is there something genuinely uncertain about it?",
    );
    const uncertaintyRaw = await interview.ask(
      "If there's something uncertain, what specifically don't you know, and what are the alternatives you're weighing?",
    );
    const resolutionRaw = await interview.ask("What would you need to see or test to know which one's right?");

    const draft = await draftProbeAddendum({ approachRaw, uncertaintyRaw, resolutionRaw });

    clack.note(
      `Uncertainty: ${draft.uncertainty}\nAlternatives considered: ${draft.alternativesConsidered}\nHow to resolve: ${draft.howToResolve}`,
      'Drafted probe addendum',
    );

    if (!(await interview.confirm('Save this addendum to the proposal?'))) {
      clack.outro('Not saved.');
      return;
    }

    const body = `**Uncertainty:** ${draft.uncertainty}\n**Alternatives considered:** ${draft.alternativesConsidered}\n**How to resolve:** ${draft.howToResolve}`;
    appendProbeSection(cwd, changeId, body);

    clack.outro(`Appended to openspec/changes/${changeId}/proposal.md`);
  } finally {
    interview.close();
  }
}
