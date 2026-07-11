import { openSpecAdapter } from '../adapters/openspec.js';
import type { ChangeArtifact } from '../adapters/types.js';
import { readAnchor } from '../anchor.js';
import { compareDrift } from '../llm/drift.js';
import { judgeChange, type Judgment } from '../llm/judgment.js';
import { judgmentsFile } from '../paths.js';
import { appendJsonl, readJsonl } from '../persistence/jsonl.js';

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
    console.error('No OpenSpec archive found (expected openspec/changes/archive/).');
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
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  if (toJudge.length === 0) {
    console.log('No unjudged changes to judge.');
    return;
  }

  let eligibleCount = 0;

  for (const artifact of toJudge) {
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

    console.log(`- ${artifact.id}: eligible=${judgment.eligible} confidence=${judgment.confidence}`);
    console.log(`  drift: ${drift ?? 'not available — no anchor, run `sreditor init`'}`);
  }

  console.log(`\nJudged ${toJudge.length} change${toJudge.length === 1 ? '' : 's'} (${eligibleCount} eligible).`);
}
