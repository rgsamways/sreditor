import { describe, expect, it } from 'vitest';
import { dedupeCardsById, RECENCY_WINDOW_DAYS, selectTopCards } from '../src/db.js';
import type { Card } from '../src/schema.js';

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    tag: 'llm-agents',
    title: 'Test card',
    summary: 'A test summary describing the state of the field.',
    sourceUrl: 'https://example.com/item',
    sourceType: 'arxiv',
    buzzyUnsolvedScore: 0.5,
    clusteredAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('dedupeCardsById', () => {
  it('keeps the later card when two share an id', () => {
    const first = makeCard({ id: 'dup', title: 'First' });
    const second = makeCard({ id: 'dup', title: 'Second' });
    const result = dedupeCardsById([first, second]);
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('Second');
  });

  it('leaves distinct ids untouched', () => {
    const cards = [makeCard({ id: 'a' }), makeCard({ id: 'b' })];
    expect(dedupeCardsById(cards)).toHaveLength(2);
  });

  it('is idempotent -- deduping an already-deduped list is a no-op', () => {
    const cards = [makeCard({ id: 'a' }), makeCard({ id: 'b' })];
    const once = dedupeCardsById(cards);
    const twice = dedupeCardsById(once);
    expect(twice).toEqual(once);
  });
});

describe('selectTopCards', () => {
  const now = new Date('2026-07-17T00:00:00.000Z');

  it('excludes cards older than the recency window', () => {
    const fresh = makeCard({ id: 'fresh', clusteredAt: now.toISOString() });
    const staleDate = new Date(now.getTime() - (RECENCY_WINDOW_DAYS + 1) * 24 * 60 * 60 * 1000);
    const stale = makeCard({ id: 'stale', clusteredAt: staleDate.toISOString() });

    const result = selectTopCards([fresh, stale], {}, now);
    expect(result.map((c) => c.id)).toEqual(['fresh']);
  });

  it('includes cards right at the edge of the recency window', () => {
    const edgeDate = new Date(now.getTime() - (RECENCY_WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000);
    const card = makeCard({ id: 'edge', clusteredAt: edgeDate.toISOString() });
    expect(selectTopCards([card], {}, now).map((c) => c.id)).toEqual(['edge']);
  });

  it('filters by tag when provided', () => {
    const a = makeCard({ id: 'a', tag: 'llm-agents', clusteredAt: now.toISOString() });
    const b = makeCard({ id: 'b', tag: 'vector-search', clusteredAt: now.toISOString() });
    const result = selectTopCards([a, b], { tag: 'vector-search' }, now);
    expect(result.map((c) => c.id)).toEqual(['b']);
  });

  it('returns all tags when no tag filter given', () => {
    const a = makeCard({ id: 'a', tag: 'llm-agents', clusteredAt: now.toISOString() });
    const b = makeCard({ id: 'b', tag: 'vector-search', clusteredAt: now.toISOString() });
    expect(selectTopCards([a, b], {}, now)).toHaveLength(2);
  });

  it('sorts by buzzyUnsolvedScore descending', () => {
    const low = makeCard({ id: 'low', buzzyUnsolvedScore: 0.2, clusteredAt: now.toISOString() });
    const high = makeCard({ id: 'high', buzzyUnsolvedScore: 0.9, clusteredAt: now.toISOString() });
    const result = selectTopCards([low, high], {}, now);
    expect(result.map((c) => c.id)).toEqual(['high', 'low']);
  });

  it('respects the limit', () => {
    const cards = [1, 2, 3, 4, 5].map((n) => makeCard({ id: `c${n}`, buzzyUnsolvedScore: n / 10, clusteredAt: now.toISOString() }));
    const result = selectTopCards(cards, { limit: 2 }, now);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(['c5', 'c4']);
  });

  it('returns an empty list for an empty corpus', () => {
    expect(selectTopCards([], {}, now)).toEqual([]);
  });
});
