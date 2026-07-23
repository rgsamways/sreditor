import { openSpecAdapter } from '../adapters/openspec.js';
import { c, spin } from '../cliUi.js';
import { startInterview } from '../interview.js';
import { createClient, DEFAULT_MODEL, MODEL_INPUT_PRICE_PER_MTOK, MODEL_OUTPUT_PRICE_PER_MTOK } from '../llm/client.js';
import { buildRollupRequest, ROLLUP_MAX_TOKENS, runRollup } from '../llm/rollup.js';
import { judgmentsFile } from '../paths.js';
import { readJsonl } from '../persistence/jsonl.js';
import { computeDateRange, findUnjudgedChangeIds, latestJudgmentPerChange, saveRollupOutput } from '../rollup.js';
import { submitStatsIfOptedIn } from '../telemetry/submit.js';
import type { JudgmentRecord } from './judge.js';

function estimateCost(inputTokens: number): { inputCost: number; outputCeiling: number } {
  const inputCost = (inputTokens / 1_000_000) * MODEL_INPUT_PRICE_PER_MTOK;
  const outputCeiling = (ROLLUP_MAX_TOKENS / 1_000_000) * MODEL_OUTPUT_PRICE_PER_MTOK;
  return { inputCost, outputCeiling };
}

export async function rollup(cwd: string, skipConfirm = false): Promise<void> {
  const allRecords = readJsonl<JudgmentRecord>(judgmentsFile(cwd));
  const records = latestJudgmentPerChange(allRecords);

  if (records.length === 0) {
    console.log(c.gray('No judged changes yet. Run `sreditor judge` first.'));
    return;
  }

  if (openSpecAdapter.isAvailable(cwd)) {
    const judgedIds = new Set(records.map((record) => record.changeId));
    const unjudged = findUnjudgedChangeIds(openSpecAdapter.listChanges(cwd), judgedIds);
    if (unjudged.length > 0) {
      console.log(
        c.yellow(
          `Note: ${unjudged.length} archived change(s) have not been judged yet and will not be included: ${unjudged.join(', ')}`,
        ),
      );
    }
  }

  const request = buildRollupRequest(records);
  const client = createClient();
  const tokenCount = await spin('Estimating cost...', () =>
    client.messages.countTokens({
      model: DEFAULT_MODEL,
      system: request.system,
      messages: request.messages,
    }),
  );

  const { inputCost, outputCeiling } = estimateCost(tokenCount.input_tokens);
  console.log(
    `Estimated cost: input ~${tokenCount.input_tokens} tokens (~$${inputCost.toFixed(4)}), output up to $${outputCeiling.toFixed(4)} (ceiling, actual usage is very likely lower).`,
  );

  if (!skipConfirm) {
    const interview = startInterview();
    let proceed: boolean;
    try {
      proceed = await interview.confirm('Proceed with rollup?');
    } finally {
      interview.close();
    }
    if (!proceed) {
      console.log(c.gray('Not run.'));
      return;
    }
  }

  const projects = await spin('Building rollup...', () => runRollup(records));
  saveRollupOutput(cwd, { generatedAt: new Date().toISOString(), projects });

  const recordsById = new Map(records.map((record) => [record.changeId, record]));

  console.log(c.green(`\n${projects.length} project${projects.length === 1 ? '' : 's'} (saved to .sreditor/rollup.json):\n`));
  for (const project of projects) {
    const contributing = project.contributingChangeIds
      .map((id) => recordsById.get(id))
      .filter((record): record is JudgmentRecord => record !== undefined);

    console.log(`- ${c.bold(project.name)} (${c.dim(computeDateRange(contributing))})`);
    console.log(`  changes: ${project.contributingChangeIds.join(', ')}`);
    console.log(`  confidence: ${project.confidence}`);
    console.log(`  uncertainty: ${project.uncertainty}`);
    console.log(`  investigation: ${project.investigation}`);
    console.log(`  advancement: ${project.advancement}\n`);
  }

  await submitStatsIfOptedIn(cwd);
}
