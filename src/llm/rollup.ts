import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { JudgmentRecord } from '../commands/judge.js';
import { createClient, DEFAULT_MODEL } from './client.js';

const ROLLUP_SYSTEM_PROMPT = `You are grouping a set of already-judged software changes into CRA-shaped SR&ED "projects" — the level the Canada Revenue Agency actually wants a claim framed at, not individual changes in isolation.

Each change has already been judged against the CRA three-part test (eligible or not, with reasoning) and compared against the project's anchor for drift. Group related changes into projects that together tell one coherent SR&ED narrative: a shared technological uncertainty, a systematic investigation spanning multiple changes, and a resulting advancement. A change judged ineligible on its own may still belong in a project if the surrounding changes show it was one step in a longer investigation — do not discard ineligible changes, consider them for inclusion in whichever project they actually support. A change unrelated to everything else is its own project of one.

For each project, write three separate fields mirroring CRA Form T661 Part 2's line structure — do not combine them into one narrative:
- uncertainty (Line 242, target under 350 words): the shared technological uncertainty.
- investigation (Line 244, target under 700 words): the systematic investigation across the project's changes, in chronological order — hypotheses, experiments, results, conclusions.
- advancement (Line 246, target under 350 words): the technological advancement achieved.

These are target lengths, not hard requirements — write what the evidence actually supports; do not pad or compress content just to hit a count. Reason and narrate in plain language. Do not invent a numeric or categorical score for a project — these three fields are the substantive record, the same as the individual judgments and drift comparisons they're built from. Every judged change provided to you must appear in exactly one project's contributing change ids.

If the underlying judgments contain quantified metrics or benchmarks, carry those specific numbers through into the project-level fields rather than abstracting them away when combining changes — strong CRA narratives are grounded in concrete measurements, and aggregation should not lose that specificity.`;

const ProjectSchema = z.object({
  name: z.string().describe('A short, descriptive name for this project.'),
  contributingChangeIds: z
    .array(z.string())
    .describe('The change ids that make up this project. Every input change id must appear in exactly one project.'),
  uncertainty: z.string().describe('CRA Form T661 Line 242: the shared technological uncertainty for this project, target under 350 words.'),
  investigation: z
    .string()
    .describe('CRA Form T661 Line 244: the systematic investigation across this project\'s changes, chronological, target under 700 words.'),
  advancement: z.string().describe('CRA Form T661 Line 246: the technological advancement achieved, target under 350 words.'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence in this project grouping and its eligibility narrative.'),
});

const RollupSchema = z.object({
  projects: z.array(ProjectSchema),
});

export type Project = z.infer<typeof ProjectSchema>;

function formatJudgmentForRollup(record: JudgmentRecord): string {
  return [
    `Change id: ${record.changeId}`,
    `Eligible (Layer 1): ${record.eligible}`,
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

export const ROLLUP_MAX_TOKENS = 8192;

export async function runRollup(records: JudgmentRecord[]): Promise<Project[]> {
  const client = createClient();
  const request = buildRollupRequest(records);

  const response = await client.messages.parse({
    model: DEFAULT_MODEL,
    max_tokens: ROLLUP_MAX_TOKENS,
    output_config: {
      format: zodOutputFormat(RollupSchema),
      effort: 'high',
    },
    system: request.system,
    messages: request.messages,
  });

  if (!response.parsed_output) {
    throw new Error('Claude did not return a parseable rollup.');
  }
  return response.parsed_output.projects;
}
