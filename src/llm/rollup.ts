import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { JudgmentRecord } from '../commands/judge.js';
import { createClient, DEFAULT_MODEL } from './client.js';

const ROLLUP_SYSTEM_PROMPT = `You are grouping a set of already-judged software changes into CRA-shaped SR&ED "projects" — the level the Canada Revenue Agency actually wants a claim framed at, not individual changes in isolation.

Each change has already been judged against the CRA three-part test (eligible or not, with reasoning) and compared against the project's anchor for drift. Group related changes into projects that together tell one coherent SR&ED narrative: a shared technological uncertainty, a systematic investigation spanning multiple changes, and a resulting advancement. A change judged ineligible on its own may still belong in a project if the surrounding changes show it was one step in a longer investigation — do not discard ineligible changes, consider them for inclusion in whichever project they actually support.

You do NOT need to account for every input change in your response. Only return projects for changes that form or contribute to a genuine, coherent SR&ED narrative — including a single change with its own real narrative, as a project of one. Leave out any change that is ineligible and unrelated to everything else; it will be collected automatically afterward, at no cost to you, so do not invent a "leftover" or "other ineligible work" project to account for it. This keeps your output size proportional to how many genuine narratives actually exist, not to how many changes were judged.

Every project you do return has an \`eligibleForFiling\` flag. In practice this should almost always be true, since you're now only asked to report genuine narratives — set it false only in the rare case a project exists for a reason other than a real, defensible SR&ED claim.

For each project, write three separate fields mirroring CRA Form T661 Part 2's line structure — do not combine them into one narrative:
- uncertainty (Line 242, target under 350 words): the shared technological uncertainty.
- investigation (Line 244, target under 700 words): the systematic investigation across the project's changes, in chronological order — hypotheses, experiments, results, conclusions.
- advancement (Line 246, target under 350 words): the technological advancement achieved.

These are target lengths, not hard requirements — write what the evidence actually supports; do not pad or compress content just to hit a count. Reason and narrate in plain language. Do not invent a numeric or categorical score for a project — these three fields are the substantive record, the same as the individual judgments and drift comparisons they're built from.

If the underlying judgments contain quantified metrics or benchmarks, carry those specific numbers through into the project-level fields rather than abstracting them away when combining changes — strong CRA narratives are grounded in concrete measurements, and aggregation should not lose that specificity.`;

const ProjectSchema = z.object({
  name: z.string().describe('A short, descriptive name for this project.'),
  contributingChangeIds: z.array(z.string()).describe('The change ids that make up this project.'),
  uncertainty: z.string().describe('CRA Form T661 Line 242: the shared technological uncertainty for this project, target under 350 words.'),
  investigation: z
    .string()
    .describe('CRA Form T661 Line 244: the systematic investigation across this project\'s changes, chronological, target under 700 words.'),
  advancement: z.string().describe('CRA Form T661 Line 246: the technological advancement achieved, target under 350 words.'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence in this project grouping and its eligibility narrative.'),
  eligibleForFiling: z
    .boolean()
    .describe(
      'True only for a genuine, defensible SR&ED narrative meant for an actual CRA filing. False for bookkeeping-only groupings like a bucket of unrelated ineligible changes.',
    ),
});

const RollupSchema = z.object({
  projects: z.array(ProjectSchema),
});

export type Project = z.infer<typeof ProjectSchema>;

function formatJudgmentForRollup(record: JudgmentRecord): string {
  // Ineligible records' uncertainty/investigation/advancement fields are typically
  // honest "none found" boilerplate (per the judge prompt) -- reasoning already
  // carries the substance, so skip the redundant fields to keep rollup's input
  // (and the model's incentive to write a matching amount of output) proportional
  // to how many changes actually have a real narrative to report.
  if (!record.eligible) {
    return [
      `Change id: ${record.changeId}`,
      `Eligible (Layer 1): false`,
      `Reasoning: ${record.reasoning}`,
      `Drift: ${record.drift ?? 'not available'}`,
    ].join('\n');
  }

  return [
    `Change id: ${record.changeId}`,
    `Eligible (Layer 1): true`,
    `Uncertainty: ${record.uncertaintyStatement}`,
    `Investigation: ${record.investigationSteps}`,
    `Advancement: ${record.advancement}`,
    `Reasoning: ${record.reasoning}`,
    `Drift: ${record.drift ?? 'not available'}`,
  ].join('\n');
}

export function buildRollupPrompt(records: JudgmentRecord[]): string {
  const body = records.map(formatJudgmentForRollup).join('\n\n---\n\n');
  return `Judged changes to group into projects:\n\n${body}\n\nGroup these into CRA-shaped projects.`;
}

export interface RollupRequest {
  system: string;
  messages: { role: 'user'; content: string }[];
}

export function buildRollupRequest(records: JudgmentRecord[]): RollupRequest {
  return {
    system: ROLLUP_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildRollupPrompt(records) }],
  };
}

export const ROLLUP_MAX_TOKENS = 16384;

const UNGROUPED_PROJECT_NAME = 'Other judged, ungrouped work';

// Changes the model leaves out (see prompt: it's told not to spend output on a
// "leftover ineligible" bucket) are assembled here in code, not by the LLM --
// zero additional output tokens, and immune to the truncation failure mode that
// motivated dropping that requirement from the prompt in the first place.
export function buildUngroupedProject(records: JudgmentRecord[], coveredIds: Set<string>): Project | null {
  const leftover = records.filter((record) => !coveredIds.has(record.changeId));
  if (leftover.length === 0) {
    return null;
  }
  return {
    name: UNGROUPED_PROJECT_NAME,
    contributingChangeIds: leftover.map((record) => record.changeId),
    uncertainty: 'No shared technological uncertainty identified; these changes did not group into a coherent SR&ED narrative with any other judged change.',
    investigation: 'Not applicable — see individual judgment records in .sreditor/judgments.jsonl for each change\'s own reasoning.',
    advancement: 'Not applicable.',
    confidence: 'high',
    eligibleForFiling: false,
  };
}

// Uses messages.create() directly rather than the SDK's messages.parse() helper:
// parse() throws before the caller can inspect stop_reason, which made truncated
// (max_tokens) output surface as an opaque "unterminated string" JSON error in
// some runs and the friendly max_tokens message in others, depending on exactly
// where generation got cut off. Checking stop_reason first makes that consistent.
export async function runRollup(records: JudgmentRecord[]): Promise<Project[]> {
  const client = createClient();
  const request = buildRollupRequest(records);

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: ROLLUP_MAX_TOKENS,
    output_config: {
      format: zodOutputFormat(RollupSchema),
      effort: 'high',
    },
    system: request.system,
    messages: request.messages,
  });

  if (response.stop_reason === 'max_tokens') {
    throw new Error(
      `Rollup output exceeded the ${ROLLUP_MAX_TOKENS}-token limit before completing (likely too many distinct SR&ED narratives to write up in one call). Try running rollup over a smaller date range or change subset.`,
    );
  }

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error(`Claude did not return any text content for the rollup (stop_reason: ${response.stop_reason ?? 'unknown'}).`);
  }

  let projects: Project[];
  try {
    projects = RollupSchema.parse(JSON.parse(textBlock.text)).projects;
  } catch (error) {
    throw new Error(`Claude did not return a parseable rollup (stop_reason: ${response.stop_reason ?? 'unknown'}): ${error instanceof Error ? error.message : String(error)}`);
  }

  const coveredIds = new Set(projects.flatMap((project) => project.contributingChangeIds));
  const ungrouped = buildUngroupedProject(records, coveredIds);
  return ungrouped ? [...projects, ungrouped] : projects;
}
