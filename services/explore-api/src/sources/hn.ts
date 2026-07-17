import type { RawItem } from './types.js';

const HN_MAX_ITEMS = 30;
const FETCH_TIMEOUT_MS = 10_000;
const HN_BASE = 'https://hacker-news.firebaseio.com/v0';

interface HnItem {
  id: number;
  title?: string;
  url?: string;
  text?: string;
  time: number;
  type: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Hacker News API returned ${response.status} for ${url}`);
  }
  return (await response.json()) as T;
}

export async function fetchHnItems(): Promise<RawItem[]> {
  const ids = await fetchJson<number[]>(`${HN_BASE}/topstories.json`);
  const items = await Promise.all(
    ids.slice(0, HN_MAX_ITEMS).map((id) => fetchJson<HnItem>(`${HN_BASE}/item/${id}.json`)),
  );

  return items
    .filter((item) => item.type === 'story' && item.title)
    .map((item) => ({
      title: item.title ?? '',
      description: item.text ?? '',
      sourceUrl: item.url ?? `https://news.ycombinator.com/item?id=${item.id}`,
      sourceType: 'hn' as const,
      publishedAt: new Date(item.time * 1000).toISOString(),
    }));
}
