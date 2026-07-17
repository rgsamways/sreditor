import { clusterIntoCards } from './cluster.js';
import { upsertCards } from './db.js';
import { fetchArxivItems } from './sources/arxiv.js';
import { fetchChangelogItems } from './sources/changelogs.js';
import { fetchGithubTrendingItems } from './sources/githubTrending.js';
import { fetchHnItems } from './sources/hn.js';
import type { RawItem } from './sources/types.js';

// One source failing (a flaky feed, a rate limit) shouldn't sink the whole
// refresh -- log and continue with whatever sources did return items.
async function fetchAllSources(): Promise<RawItem[]> {
  const fetchers = [fetchArxivItems, fetchGithubTrendingItems, fetchHnItems, fetchChangelogItems];
  const results = await Promise.allSettled(fetchers.map((fetcher) => fetcher()));

  const items: RawItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    } else {
      console.error(`Source fetch failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
    }
  }
  return items;
}

async function main(): Promise<void> {
  const items = await fetchAllSources();
  console.log(`Fetched ${items.length} raw items.`);
  if (items.length === 0) {
    console.log('No raw items fetched from any source; nothing to cluster.');
    return;
  }

  const cards = await clusterIntoCards(items);
  console.log(`Clustered into ${cards.length} cards.`);
  if (cards.length === 0) {
    console.log('No cards produced; nothing to upsert.');
    return;
  }

  await upsertCards(cards);
  console.log(`Upserted ${cards.length} cards.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
