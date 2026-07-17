import { XMLParser } from 'fast-xml-parser';
import type { RawItem } from './types.js';

const FETCH_TIMEOUT_MS = 10_000;
const RELEASES_PER_REPO = 5;

// GitHub's per-repo Atom releases feed, not a hand-maintained scrape -- stable
// and requires no auth. A small, fixed set of widely-used frameworks likely to
// be relevant to a developer using an agentic-coding CLI; expand this list
// freely, it's a tuning parameter, not an architectural decision.
const CHANGELOG_REPOS = ['facebook/react', 'vuejs/core', 'nodejs/node', 'microsoft/TypeScript', 'vercel/next.js'];

interface AtomEntry {
  title: string;
  content?: string;
  link?: { '@_href'?: string };
  published?: string;
  updated?: string;
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

async function fetchRepoReleases(repo: string): Promise<RawItem[]> {
  const url = `https://github.com/${repo}/releases.atom`;
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Changelog feed for ${repo} returned ${response.status}`);
  }
  const xml = await response.text();
  const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml) as { feed?: { entry?: AtomEntry | AtomEntry[] } };
  const entries = toArray(parsed.feed?.entry).slice(0, RELEASES_PER_REPO);

  return entries.map((entry) => ({
    title: `${repo} ${String(entry.title)}`,
    description: String(entry.content ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    sourceUrl: entry.link?.['@_href'] ?? `https://github.com/${repo}/releases`,
    sourceType: 'changelog' as const,
    publishedAt: entry.published ?? entry.updated ?? new Date().toISOString(),
  }));
}

export async function fetchChangelogItems(): Promise<RawItem[]> {
  const results = await Promise.allSettled(CHANGELOG_REPOS.map(fetchRepoReleases));
  const items: RawItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    } else {
      console.error(`Changelog fetch failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
    }
  }
  return items;
}
