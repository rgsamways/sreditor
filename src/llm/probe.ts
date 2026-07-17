import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { createClient, DEFAULT_MODEL } from './client.js';

const PROBE_FRAMING_SYSTEM_PROMPT = `You are helping a developer capture genuine technological uncertainty about a single change they are about to implement, before they start writing code. This addendum is appended to the change's own proposal and later read when judging Canadian SR&ED (Scientific Research & Experimental Development) tax credit eligibility.

Your only job is to rephrase the developer's own raw answers into clear, plain language. Do not invent, embellish, or infer content the developer did not say. Do not suggest, generate, or recommend any technical approach, technology, or alternative the developer did not already name. CRA rewards genuine technological uncertainty resolved through systematic investigation — not ambition, difficulty, or effort alone. If an answer does not describe genuine uncertainty, or does not name any alternatives, or does not describe how to resolve it, reflect that honestly rather than manufacturing content that isn't there.`;

const ProbeDraftSchema = z.object({
  uncertainty: z
    .string()
    .describe('The genuine technological uncertainty in this change, phrased plainly, or an honest statement that none was described.'),
  alternativesConsidered: z
    .string()
    .describe('The alternatives the developer named they are weighing, organized and sharpened, or an honest statement that none were named.'),
  howToResolve: z
    .string()
    .describe('What the developer said they would need to see or test to know which approach is right, or an honest statement that nothing was described.'),
});

export interface ProbeInterviewAnswers {
  approachRaw: string;
  uncertaintyRaw: string;
  resolutionRaw: string;
}

export type ProbeDraft = z.infer<typeof ProbeDraftSchema>;

export function buildProbePrompt(answers: ProbeInterviewAnswers): string {
  return `Developer's raw answers about this change:

1. Planned approach, and whether it's already known to work: ${answers.approachRaw}
2. What's specifically uncertain and what alternatives are being weighed: ${answers.uncertaintyRaw}
3. What would need to be seen or tested to know which one's right: ${answers.resolutionRaw}

Draft the probe addendum fields from these answers.`;
}

export async function draftProbeAddendum(answers: ProbeInterviewAnswers): Promise<ProbeDraft> {
  const client = createClient();
  const response = await client.messages.parse({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    output_config: {
      format: zodOutputFormat(ProbeDraftSchema),
      effort: 'medium',
    },
    system: PROBE_FRAMING_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildProbePrompt(answers) }],
  });

  if (!response.parsed_output) {
    throw new Error('Claude did not return a parseable probe draft.');
  }
  return response.parsed_output;
}
