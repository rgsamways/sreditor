import type { RawItem } from './types.js';

const GITHUB_MAX_ITEMS = 25;
const FETCH_TIMEOUT_MS = 10_000;
const TRENDING_WINDOW_DAYS = 7;

interface GitHubSearchRepo {
  full_name: string;
  description: string | null;
  html_url: string;
  created_at: string;
}

interface GitHubSearchResponse {
  items: GitHubSearchRepo[];
}

function isoDateDaysAgo(days: number): string {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

// GitHub has no public "trending" API -- this uses the Search API (repos
// created in the last week, sorted by stars) as the documented, stable proxy
// the design.md's "Open Questions" section flags as the intended approach.
export async function fetchGithubTrendingItems(): Promise<RawItem[]> {
  const since = isoDateDaysAgo(TRENDING_WINDOW_DAYS);
  const url = `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=${GITHUB_MAX_ITEMS}`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'sreditor-explore-api',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`GitHub search API returned ${response.status}`);
  }
  const body = (await response.json()) as GitHubSearchResponse;

  return body.items.map((repo) => ({
    title: repo.full_name,
    description: repo.description ?? '',
    sourceUrl: repo.html_url,
    sourceType: 'github-trending' as const,
    publishedAt: repo.created_at,
  }));
}
