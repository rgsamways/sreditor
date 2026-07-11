import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { ChangeArtifact } from '../adapters/types.js';
import { createClient, DEFAULT_MODEL } from './client.js';
import { formatArtifact } from './format.js';

const DRIFT_SYSTEM_PROMPT = `You are comparing a single software change against a project's anchor document — the developer's own stated goal, genuine uncertainty, and success criteria, written before this change was made.

State in plain language whether this change still serves the anchor's stated goal. If it has drifted, describe how: what the original goal was, and what this change actually does that diverges from it. Do not output a score or a numeric rating — a legible narrative sentence is the whole point. If the change clearly still serves the anchor, say so plainly rather than manufacturing a concern.`;

const DriftSchema = z.object({
  narrative: z
    .string()
    .describe('Plain-language narrative describing whether/how this change aligns with or drifts from the anchor. Not a score.'),
});

export type Drift = z.infer<typeof DriftSchema>;

export function buildDriftPrompt(anchorText: string, artifact: ChangeArtifact): string {
  return `Anchor document:

${anchorText}

---

Change id: ${artifact.id}

${formatArtifact(artifact)}

Does this change still serve the anchor's stated goal? Describe alignment or drift in plain language.`;
}

export async function compareDrift(anchorText: string, artifact: ChangeArtifact): Promise<Drift> {
  const client = createClient();
  const response = await client.messages.parse({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    output_config: {
      format: zodOutputFormat(DriftSchema),
      effort: 'medium',
    },
    system: DRIFT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildDriftPrompt(anchorText, artifact) }],
  });

  if (!response.parsed_output) {
    throw new Error(`Claude did not return a parseable drift comparison for change "${artifact.id}".`);
  }
  return response.parsed_output;
}
