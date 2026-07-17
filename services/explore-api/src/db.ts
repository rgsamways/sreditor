import pg from 'pg';
import type { Card } from './schema.js';

const { Pool } = pg;

// Cards from the last 2 refresh cycles at the starting twice-weekly cadence
// (~7 days), plus a safety margin so a slightly late refresh run doesn't
// prematurely drop cards that are still current -- see design.md's "Open
// Questions" for why the exact cadence is a tuning parameter, not fixed here.
export const RECENCY_WINDOW_DAYS = 10;
export const DEFAULT_LIMIT = 15;
export const MAX_LIMIT = 50;

let pool: pg.Pool | null = null;

// Railway's Postgres addon injects DATABASE_URL automatically -- no manual
// wiring needed once the service and the database are in the same project.
export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set.');
    }
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

interface CardRow {
  id: string;
  tag: string;
  title: string;
  summary: string;
  source_url: string;
  source_type: Card['sourceType'];
  buzzy_unsolved_score: number;
  clustered_at: string;
}

function rowToCard(row: CardRow): Card {
  return {
    id: row.id,
    tag: row.tag,
    title: row.title,
    summary: row.summary,
    sourceUrl: row.source_url,
    sourceType: row.source_type,
    buzzyUnsolvedScore: row.buzzy_unsolved_score,
    clusteredAt: row.clustered_at,
  };
}

// If the LLM clustering pass ever emits the same card id twice within one
// refresh batch, the later one wins -- keeps `upsertCards` well-defined
// without relying on Postgres's own conflict-resolution order.
export function dedupeCardsById(cards: Card[]): Card[] {
  const byId = new Map<string, Card>();
  for (const card of cards) {
    byId.set(card.id, card);
  }
  return [...byId.values()];
}

export async function upsertCards(cards: Card[]): Promise<void> {
  const deduped = dedupeCardsById(cards);
  const pool = getPool();
  for (const card of deduped) {
    await pool.query(
      `INSERT INTO explore_cards (
        id, tag, title, summary, source_url, source_type, buzzy_unsolved_score, clustered_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (id) DO UPDATE SET
        tag = EXCLUDED.tag,
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        source_url = EXCLUDED.source_url,
        source_type = EXCLUDED.source_type,
        buzzy_unsolved_score = EXCLUDED.buzzy_unsolved_score,
        clustered_at = EXCLUDED.clustered_at`,
      [
        card.id,
        card.tag,
        card.title,
        card.summary,
        card.sourceUrl,
        card.sourceType,
        card.buzzyUnsolvedScore,
        card.clusteredAt,
      ],
    );
  }
}

export interface GetTopCardsOptions {
  tag?: string;
  limit?: number;
}

// Filtering/sorting/limiting happens in JS, not SQL: the read path fetches
// every card within the recency window (a few hundred rows at most, given
// top-15-per-tag corpus sizes) and applies the same logic this file's tests
// exercise directly via `selectTopCards`, rather than duplicating the rules
// in a WHERE/ORDER BY clause that tests can't reach without a live database.
export function selectTopCards(cards: Card[], options: GetTopCardsOptions, now: Date): Card[] {
  const cutoff = now.getTime() - RECENCY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const limit = Math.max(0, Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT));

  return cards
    .filter((card) => new Date(card.clusteredAt).getTime() > cutoff)
    .filter((card) => !options.tag || card.tag === options.tag)
    .sort((a, b) => b.buzzyUnsolvedScore - a.buzzyUnsolvedScore)
    .slice(0, limit);
}

export async function getTopCards(options: GetTopCardsOptions = {}): Promise<Card[]> {
  const result = await getPool().query<CardRow>('SELECT * FROM explore_cards');
  return selectTopCards(result.rows.map(rowToCard), options, new Date());
}
