import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card } from '../src/schema.js';

const getTopCards = vi.fn<(options: { tag?: string; limit?: number }) => Promise<Card[]>>();

vi.mock('../src/db.js', () => ({
  getTopCards: (...args: [{ tag?: string; limit?: number }]) => getTopCards(...args),
}));

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    tag: 'llm-agents',
    title: 'Test card',
    summary: 'A test summary.',
    sourceUrl: 'https://example.com/item',
    sourceType: 'arxiv',
    buzzyUnsolvedScore: 0.5,
    clusteredAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('explore-api server', () => {
  let baseUrl: string;
  let close: () => Promise<void>;

  beforeEach(async () => {
    getTopCards.mockReset();
    const { createExploreServer } = await import('../src/server.js');
    const server = createExploreServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
    close = () => new Promise<void>((resolve) => server.close(() => resolve()));
  });

  afterEach(async () => {
    await close();
  });

  it('reports healthy on /healthz', async () => {
    const response = await fetch(`${baseUrl}/healthz`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('returns the default top-N cards', async () => {
    const cards = [makeCard()];
    getTopCards.mockResolvedValue(cards);

    const response = await fetch(`${baseUrl}/v1/explore`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ cards });
    expect(getTopCards).toHaveBeenCalledWith({ tag: undefined, limit: undefined });
  });

  it('passes the tag filter through as a query param', async () => {
    getTopCards.mockResolvedValue([]);
    await fetch(`${baseUrl}/v1/explore?tag=vector-search`);
    expect(getTopCards).toHaveBeenCalledWith({ tag: 'vector-search', limit: undefined });
  });

  it('passes the limit through as a query param', async () => {
    getTopCards.mockResolvedValue([]);
    await fetch(`${baseUrl}/v1/explore?limit=5`);
    expect(getTopCards).toHaveBeenCalledWith({ tag: undefined, limit: 5 });
  });

  it('returns an empty list, not an error, for an empty corpus', async () => {
    getTopCards.mockResolvedValue([]);
    const response = await fetch(`${baseUrl}/v1/explore`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ cards: [] });
  });

  it('returns 404 for unknown routes', async () => {
    const response = await fetch(`${baseUrl}/nope`);
    expect(response.status).toBe(404);
  });
});
