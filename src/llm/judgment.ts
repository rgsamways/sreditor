import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { ChangeArtifact } from '../adapters/types.js';
import type { CorroboratingSignals } from '../tools/corroboration.js';
import { gatherCorroboratingSignals } from '../tools/corroboration.js';
import { createClient, DEFAULT_MODEL } from './client.js';
import { formatArtifact } from './format.js';

const JUDGMENT_SYSTEM_PROMPT = `You are judging a single software change against the Canada Revenue Agency's SR&ED (Scientific Research & Experimental Development) three-part test:

1. Technological uncertainty: could a competent professional in the field have figured out the solution in advance using standard practice? If not, uncertainty existed.
2. Systematic investigation: was there a structured process (hypothesis, experimentation, iteration, analysis) rather than trial-and-error or routine engineering?
3. Technological advancement: did the work generate new knowledge, even if the overall effort failed?

Be skeptical, not generous. Assume most software work is routine unless the text clearly shows genuine uncertainty resolved through structured investigation. Never infer uncertainty from ambition, difficulty, or effort alone — a hard or ambitious feature is not automatically SR&ED-eligible. If the text does not describe genuine technological uncertainty, judge the change ineligible and say so plainly in your reasoning.

When the source text includes quantified metrics or benchmarks — latency figures, error/throughput rates, before/after measurements, thresholds tested against — carry those specific numbers into uncertaintyStatement, investigationSteps, and advancement rather than describing them in the abstract. Strong CRA narratives are grounded in concrete measurements; do not invent numbers that aren't in the source text, and don't pad vague statements with false precision when no quantified data exists.

If a corroborating signals block is present, treat it strictly as background context, never as evidence that determines eligibility by itself — a change can have real complexity or a small diff and still be ineligible, or vice versa. Your judgment must rest on the change's own artifact text.

For an ineligible change, also set proximity and pathToEligibility. proximity is qualitative, not a numeric score — do not invent false precision. Use "not_close" when no genuine technical question is described at all (purely routine engineering, nothing to build on). Use "some_signal" when exactly one prong has real but incomplete signal — e.g. a genuine technical question is named but never systematically investigated. Use "close" when multiple prongs have real but incomplete signal — e.g. genuine uncertainty is described and something resembling investigation happened, but it wasn't systematic, or was systematic but the outcome/advancement was never clearly resolved or documented.

pathToEligibility must be forward-looking, not a rewrite of this change's history: describe what would need to be true, and what a developer would need to document at decision time, for similar future work to clear the CRA bar — not how to make this specific past change sound eligible. If proximity is "not_close", say briefly why this category of work is unlikely to ever qualify rather than inventing a stretch. Do not suggest padding, reframing, or embellishing an already-completed change's narrative; the goal is to help a developer recognize and document genuine uncertainty the next time it appears, not to retrofit this one. For an eligible change, set proximity to "close" and pathToEligibility to a short note that no gap exists.`;

const JudgmentSchema = z.object({
  eligible: z.boolean().describe('Whether this change meets all three parts of the CRA test.'),
  uncertaintyStatement: z
    .string()
    .describe('The technological uncertainty, or an honest statement that none was found.'),
  investigationSteps: z
    .string()
    .describe('The systematic investigation process described (hypothesis, experiments, iteration), or an honest statement that none was found.'),
  advancement: z
    .string()
    .describe('The technological advancement achieved, or an honest statement that none was found.'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence in this eligibility judgment.'),
  reasoning: z.string().describe('Plain-language explanation of why this judgment was reached.'),
  proximity: z
    .enum(['not_close', 'some_signal', 'close'])
    .describe(
      'Qualitative closeness to eligibility, not a numeric score. "close" for eligible changes (no gap). For ineligible changes: "not_close" if no genuine technical question is described at all; "some_signal" if exactly one CRA prong has real but incomplete signal; "close" if multiple prongs have real but incomplete signal.',
    ),
  pathToEligibility: z
    .string()
    .describe(
      'Forward-looking only: what similar future work would need to document at decision time to clear the CRA bar. Never a rewrite or reframing of this change\'s own history. For an already-eligible change, a short note that no gap exists.',
    ),
});

export type Judgment = z.infer<typeof JudgmentSchema>;

function formatCorroboratingSignals(signals: CorroboratingSignals): string | null {
  const parts: string[] = [];

  if (signals.scc) {
    const lines = signals.scc
      .map((lang) => `${lang.name}: ${lang.files} files, ${lang.code} lines of code, complexity ${lang.complexity}`)
      .join('; ');
    parts.push(`scc (size/complexity): ${lines}`);
  }
  if (signals.jscpd) {
    parts.push(`jscpd (duplication):\n${signals.jscpd}`);
  }
  if (signals.sem) {
    const changeSummary = signals.sem.changes
      .slice(0, 20)
      .map((change) => `${change.changeType} ${change.entityType} "${change.entityName}" in ${change.filePath}`)
      .join('; ');
    parts.push(
      `sem (entity-level diff): ${signals.sem.fileCount} files, ${signals.sem.added} entities added, ${signals.sem.modified} modified, ${signals.sem.deleted} deleted. Changes: ${changeSummary}`,
    );
  }

  if (parts.length === 0) {
    return null;
  }
  return `Corroborating signals (context only, do not treat as determinative):\n${parts.join('\n')}`;
}

export function buildJudgmentPrompt(artifact: ChangeArtifact, signals?: CorroboratingSignals): string {
  const signalsBlock = signals ? formatCorroboratingSignals(signals) : null;

  return `Change id: ${artifact.id}

${formatArtifact(artifact)}${signalsBlock ? `\n\n${signalsBlock}` : ''}

Judge this change against the CRA three-part test.`;
}

export async function judgeChange(artifact: ChangeArtifact, cwd: string): Promise<Judgment> {
  const signals = gatherCorroboratingSignals(cwd, artifact.id);
  const client = createClient();
  const response = await client.messages.parse({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    output_config: {
      format: zodOutputFormat(JudgmentSchema),
      effort: 'high',
    },
    system: JUDGMENT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildJudgmentPrompt(artifact, signals) }],
  });

  if (!response.parsed_output) {
    throw new Error(`Claude did not return a parseable judgment for change "${artifact.id}".`);
  }
  return response.parsed_output;
}
