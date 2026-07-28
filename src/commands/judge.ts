import { openSpecAdapter } from '../adapters/openspec.js';
import type { ChangeArtifact } from '../adapters/types.js';
import { readAnchor } from '../anchor.js';
import { c, createProgress } from '../cliUi.js';
import { compareDrift } from '../llm/drift.js';
import { judgeChange, type Judgment } from '../llm/judgment.js';
import { judgmentsFile } from '../paths.js';
import { appendJsonl, readJsonl } from '../persistence/jsonl.js';
import { submitStatsIfOptedIn } from '../telemetry/submit.js';

export interface JudgmentRecord extends Judgment {
  changeId: string;
  judgedAt: string;
  drift: string | null;
}

export function selectChangesToJudge(
  changes: ChangeArtifact[],
  judgedIds: Set<string>,
  targetId?: string,
): ChangeArtifact[] {
  if (targetId !== undefined) {
    const target = changes.find((change) => change.id === targetId);
    if (!target) {
      throw new Error(`No archived change found with id "${targetId}".`);
    }
    return [target];
  }

  return changes.filter((change) => !judgedIds.has(change.id));
}

export async function judge(cwd: string, targetId?: string): Promise<void> {
  if (!openSpecAdapter.isAvailable(cwd)) {
    console.error(c.red('No OpenSpec archive found (expected openspec/changes/archive/).'));
    process.exitCode = 1;
    return;
  }

  const changes = openSpecAdapter.listChanges(cwd);
  const judgedIds = new Set(readJsonl<JudgmentRecord>(judgmentsFile(cwd)).map((record) => record.changeId));
  const anchorText = readAnchor(cwd);

  let toJudge: ChangeArtifact[];
  try {
    toJudge = selectChangesToJudge(changes, judgedIds, targetId);
  } catch (error) {
    console.error(c.red(error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
    return;
  }

  if (toJudge.length === 0) {
    console.log(c.gray('No unjudged changes to judge.'));
    return;
  }

  let eligibleCount = 0;
  const results: Array<{ artifact: ChangeArtifact; judgment: Judgment; drift: string | null }> = [];

  const bar = createProgress(`Judging ${toJudge.length} change${toJudge.length === 1 ? '' : 's'}...`, toJudge.length);
  for (const artifact of toJudge) {
    bar.advance(0, `Judging ${artifact.id}...`);
    const judgment = await judgeChange(artifact, cwd);
    const drift = anchorText !== null ? (await compareDrift(anchorText, artifact)).narrative : null;

    const record: JudgmentRecord = {
      changeId: artifact.id,
      judgedAt: new Date().toISOString(),
      ...judgment,
      drift,
    };
    appendJsonl(judgmentsFile(cwd), record);

    if (judgment.eligible) {
      eligibleCount += 1;
    }

    results.push({ artifact, judgment, drift });
    bar.advance(1, `Judged ${artifact.id}`);
  }
  bar.stop(`Judged ${toJudge.length} change${toJudge.length === 1 ? '' : 's'} (${eligibleCount} eligible).`);

  for (const { artifact, judgment, drift } of results) {
    const eligibleLabel = judgment.eligible ? c.green(`eligible=${judgment.eligible}`) : c.red(`eligible=${judgment.eligible}`);
    console.log(`- ${c.bold(artifact.id)}: ${eligibleLabel} confidence=${judgment.confidence}`);
    console.log(`  uncertainty: ${judgment.uncertaintyStatement}`);
    console.log(`  investigation: ${judgment.investigationSteps}`);
    console.log(`  advancement: ${judgment.advancement}`);
    console.log(`  reasoning: ${judgment.reasoning}`);
    if (!judgment.eligible) {
      console.log(`  proximity: ${judgment.proximity}`);
      console.log(`  path to eligibility: ${judgment.pathToEligibility}`);
    }
    console.log(`  drift: ${drift ?? 'not available — no anchor, run `sreditor init`'}`);
  }

  await submitStatsIfOptedIn(cwd);
}
