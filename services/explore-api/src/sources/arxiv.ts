import { XMLParser } from 'fast-xml-parser';
import type { RawItem } from './types.js';

const ARXIV_MAX_ITEMS = 30;
const FETCH_TIMEOUT_MS = 10_000;

// cs.AI/cs.LG/cs.CL/cs.SE cover the areas most relevant to a developer using
// an agentic-coding CLI; sorted by submission date so the corpus reflects
// current activity, not all-time citation counts.
const ARXIV_QUERY_URL =
  'https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.SE' +
  `&sortBy=submittedDate&sortOrder=descending&max_results=${ARXIV_MAX_ITEMS}`;

interface ArxivEntry {
  title: string;
  summary: string;
  id: string;
  published: string;
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export async function fetchArxivItems(): Promise<RawItem[]> {
  const response = await fetch(ARXIV_QUERY_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`arXiv API returned ${response.status}`);
  }
  const xml = await response.text();
  const parsed = new XMLParser().parse(xml) as { feed?: { entry?: ArxivEntry | ArxivEntry[] } };
  const entries = toArray(parsed.feed?.entry);

  return entries.map((entry) => ({
    title: String(entry.title).replace(/\s+/g, ' ').trim(),
    description: String(entry.summary).replace(/\s+/g, ' ').trim(),
    sourceUrl: entry.id,
    sourceType: 'arxiv' as const,
    publishedAt: entry.published,
  }));
}
