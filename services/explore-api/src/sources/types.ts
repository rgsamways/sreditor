import type { Card } from '../schema.js';

// What a source fetcher hands to the refresh job's LLM clustering pass --
// pre-card, pre-tag, pre-score. `sourceType` is already the final `Card`
// field since it's known at fetch time (one value per source module).
export interface RawItem {
  title: string;
  description: string;
  sourceUrl: string;
  sourceType: Card['sourceType'];
  publishedAt: string;
}
