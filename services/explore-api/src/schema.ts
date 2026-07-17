import { z } from 'zod';

// Mirrored on the CLI side by the `Card` shape `src/commands/explore.ts` parses
// responses against in the main sreditor package -- keep both in sync.
export const SOURCE_TYPES = ['arxiv', 'papers-with-code', 'github-trending', 'hn', 'changelog'] as const;

export const CardSchema = z.object({
  id: z.string(),
  tag: z.string(),
  title: z.string(),
  summary: z.string(),
  sourceUrl: z.string().url(),
  sourceType: z.enum(SOURCE_TYPES),
  buzzyUnsolvedScore: z.number().min(0).max(1),
  clusteredAt: z.string(),
}).strict();

export type Card = z.infer<typeof CardSchema>;
