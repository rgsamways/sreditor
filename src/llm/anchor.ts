import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { createClient, DEFAULT_MODEL } from './client.js';

const FRAMING_SYSTEM_PROMPT = `You are helping a developer draft the "anchor" document for a software project. This document is later used to judge Canadian SR&ED (Scientific Research & Experimental Development) tax credit eligibility and to detect scope drift over the life of the project.

Your only job is to rephrase the developer's own raw answers into clear, CRA-shaped language. Do not invent, embellish, or infer content the developer did not say. CRA rewards genuine technological uncertainty resolved through systematic investigation — not ambition, difficulty, or effort alone. If an answer does not describe genuine uncertainty, reflect that honestly in your phrasing rather than manufacturing uncertainty that isn't there.`;

const AnchorDraftSchema = z.object({
  goal: z.string().describe('One or two sentences describing what is being built.'),
  uncertainty: z
    .string()
    .describe('The genuine technological uncertainty, phrased in CRA-shaped language, or an honest statement that none was described.'),
  successCriteria: z.string().describe('What "solved" would look like, in concrete terms.'),
});

export interface InterviewAnswers {
  goalRaw: string;
  uncertaintyRaw: string;
  successCriteriaRaw: string;
}

export type AnchorDraft = z.infer<typeof AnchorDraftSchema>;

export function buildAnchorPrompt(answers: InterviewAnswers): string {
  return `Developer's raw answers:

1. What they're building: ${answers.goalRaw}
2. What's genuinely uncertain: ${answers.uncertaintyRaw}
3. What "solved" would look like: ${answers.successCriteriaRaw}

Draft the anchor document fields from these answers.`;
}

export async function draftAnchor(answers: InterviewAnswers): Promise<AnchorDraft> {
  const client = createClient();
  const response = await client.messages.parse({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    output_config: {
      format: zodOutputFormat(AnchorDraftSchema),
      effort: 'medium',
    },
    system: FRAMING_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildAnchorPrompt(answers) }],
  });

  if (!response.parsed_output) {
    throw new Error('Claude did not return a parseable anchor draft.');
  }
  return response.parsed_output;
}

const ReflectionDraftSchema = z.object({
  whatChanged: z.string().describe('What changed in the developer\'s understanding, phrased plainly.'),
  why: z
    .string()
    .describe('Why it changed — what investigation or implementation revealed, in the "original hypothesis was X, revised to Y because Z" shape.'),
});

export interface ReflectionAnswers {
  whatChangedRaw: string;
  whyRaw: string;
}

export type ReflectionDraft = z.infer<typeof ReflectionDraftSchema>;

export function buildReflectionPrompt(previousAnchorText: string, answers: ReflectionAnswers): string {
  return `Current anchor document:

${previousAnchorText}

---

Developer's raw answers for this revision:

1. What changed: ${answers.whatChangedRaw}
2. Why: ${answers.whyRaw}

Draft the revision entry fields from these answers.`;
}

export async function draftReflection(
  previousAnchorText: string,
  answers: ReflectionAnswers,
): Promise<ReflectionDraft> {
  const client = createClient();
  const response = await client.messages.parse({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    output_config: {
      format: zodOutputFormat(ReflectionDraftSchema),
      effort: 'medium',
    },
    system: FRAMING_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildReflectionPrompt(previousAnchorText, answers) }],
  });

  if (!response.parsed_output) {
    throw new Error('Claude did not return a parseable reflection draft.');
  }
  return response.parsed_output;
}
