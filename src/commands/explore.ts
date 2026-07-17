import { z } from 'zod';

// Mirrors services/explore-api/src/schema.ts's CardSchema -- kept in sync by
// hand since these are two separate packages. Validated independently here so
// a malformed or unexpected response can never reach console.log as garbled
// output.
const CardSchema = z.object({
  id: z.string(),
  tag: z.string(),
  title: z.string(),
  summary: z.string(),
  sourceUrl: z.string(),
  sourceType: z.enum(['arxiv', 'papers-with-code', 'github-trending', 'hn', 'changelog']),
  buzzyUnsolvedScore: z.number(),
  clusteredAt: z.string(),
});

const ExploreResponseSchema = z.object({
  cards: z.array(CardSchema),
});

const DEFAULT_EXPLORE_URL = 'https://explore-api.sreditor.ca/v1/explore';
const REQUEST_TIMEOUT_MS = 5000;

function exploreUrl(): string {
  return process.env.SREDITOR_EXPLORE_URL ?? DEFAULT_EXPLORE_URL;
}

function printCard(card: z.infer<typeof CardSchema>): void {
  console.log(`\n[${card.tag}] ${card.title}`);
  console.log(card.summary);
  console.log(`Source: ${card.sourceType} — ${card.sourceUrl}`);
}

// Read-only and disconnected from local project state by construction: this
// module never imports anything under `.sreditor/`'s read/write helpers
// (paths.ts, persistence/jsonl.ts, rollup.ts, anchor.ts) -- explore output can
// never leak into the judgment pipeline because there is no code path here
// that touches it.
export async function explore(): Promise<void> {
  let response: Response;
  try {
    response = await fetch(exploreUrl(), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    throw new Error(`Could not reach the explore backend: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!response.ok) {
    throw new Error(`Explore backend returned an error (HTTP ${response.status}).`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error('Explore backend returned a response that was not valid JSON.');
  }

  const parsed = ExploreResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error('Explore backend returned a response that did not match the expected card shape.');
  }

  console.log('Exploration — not eligibility guidance. These are field trends, not suggestions for what you should build.');

  if (parsed.data.cards.length === 0) {
    console.log('\nNo current cards.');
    return;
  }

  for (const card of parsed.data.cards) {
    printCard(card);
  }
}
