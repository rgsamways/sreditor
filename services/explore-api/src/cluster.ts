import { createHash } from 'node:crypto';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { Card } from './schema.js';
import type { RawItem } from './sources/types.js';
import { createClient, DEFAULT_MODEL } from './llm.js';

const CLUSTER_SYSTEM_PROMPT = `You are surfacing genuinely open, unsolved problems and field trends for a software developer, from a batch of raw items pulled from arXiv, GitHub trending, Hacker News, and framework changelogs.

Cluster the raw items into a small number of coherent themes. For each theme, write:
- tag: a short domain/topic slug (e.g. "llm-agents", "vector-search")
- title: a short, specific theme title
- summary: 1-3 sentences describing the CURRENT STATE OF THE FIELD -- what is trending or actively unsolved. This must read as an observation about the field, never as an instruction, suggestion, or directive to the reader. Do NOT use directive verbs or phrasing such as "you should build", "consider building", "try implementing", "a good project would be" -- any such phrasing is a rejection of this entire response.
- buzzyUnsolvedScore: 0-1, how genuinely buzzy AND unsolved this theme is right now. Score low (below 0.3) for anything that is trending but already well-solved, trending for non-technical reasons (funding news, drama, marketing), or where you are not confident the "unsolved" framing is honest.
- primarySourceIndex: the index (from the numbered list below) of the single raw item that best represents this theme. Pick a real index from the list; do not invent one.

Only cluster items that genuinely share a theme. It is fine to leave weak or isolated items out entirely rather than forcing them into a theme -- return fewer, higher-quality themes over more, weaker ones.`;

const ClusteredCardSchema = z.object({
  tag: z.string(),
  title: z.string(),
  summary: z.string(),
  buzzyUnsolvedScore: z.number().min(0).max(1),
  primarySourceIndex: z.number().int().nonnegative(),
});

const ClusterResultSchema = z.object({
  cards: z.array(ClusteredCardSchema),
});

export const CLUSTER_MAX_TOKENS = 8192;

function formatItemForPrompt(item: RawItem, index: number): string {
  return `[${index}] (${item.sourceType}) ${item.title}\n${item.description}`;
}

export function buildClusterPrompt(items: RawItem[]): string {
  const body = items.map((item, index) => formatItemForPrompt(item, index)).join('\n\n');
  return `Raw items:\n\n${body}\n\nCluster these into themed cards.`;
}

function cardId(tag: string, title: string): string {
  return createHash('sha1').update(`${tag}::${title}`).digest('hex').slice(0, 16);
}

export async function clusterIntoCards(items: RawItem[]): Promise<Card[]> {
  if (items.length === 0) {
    return [];
  }

  const client = createClient();
  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: CLUSTER_MAX_TOKENS,
    output_config: {
      format: zodOutputFormat(ClusterResultSchema),
      effort: 'medium',
    },
    system: CLUSTER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildClusterPrompt(items) }],
  });

  if (response.stop_reason === 'max_tokens') {
    throw new Error(`Clustering output exceeded the ${CLUSTER_MAX_TOKENS}-token limit before completing.`);
  }

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error(`Claude did not return any text content for clustering (stop_reason: ${response.stop_reason ?? 'unknown'}).`);
  }

  let clustered: z.infer<typeof ClusteredCardSchema>[];
  try {
    clustered = ClusterResultSchema.parse(JSON.parse(textBlock.text)).cards;
  } catch (error) {
    throw new Error(`Claude did not return parseable clustered cards (stop_reason: ${response.stop_reason ?? 'unknown'}): ${error instanceof Error ? error.message : String(error)}`);
  }

  const clusteredAt = new Date().toISOString();
  const cards: Card[] = [];
  for (const cluster of clustered) {
    const source = items[cluster.primarySourceIndex];
    if (!source) {
      // Claude referenced an index outside the item list -- drop this card
      // rather than fabricate a source, since every card must cite a real one.
      continue;
    }
    cards.push({
      id: cardId(cluster.tag, cluster.title),
      tag: cluster.tag,
      title: cluster.title,
      summary: cluster.summary,
      sourceUrl: source.sourceUrl,
      sourceType: source.sourceType,
      buzzyUnsolvedScore: cluster.buzzyUnsolvedScore,
      clusteredAt,
    });
  }
  return cards;
}
