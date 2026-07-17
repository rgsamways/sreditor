import { createServer, type Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { explore } from '../../src/commands/explore.js';

let server: Server | null = null;

function listen(handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void): Promise<number> {
  server = createServer(handler);
  return new Promise((resolve) => {
    server!.listen(0, '127.0.0.1', () => {
      const address = server!.address();
      resolve(typeof address === 'object' && address !== null ? address.port : 0);
    });
  });
}

afterEach(async () => {
  delete process.env.SREDITOR_EXPLORE_URL;
  vi.restoreAllMocks();
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = null;
  }
});

describe('explore', () => {
  it('prints the disclaimer and each card on the happy path', async () => {
    const card = {
      id: 'c1',
      tag: 'llm-agents',
      title: 'Some theme',
      summary: 'Field is trending toward X.',
      sourceUrl: 'https://arxiv.org/abs/1234',
      sourceType: 'arxiv',
      buzzyUnsolvedScore: 0.8,
      clusteredAt: '2026-07-01T00:00:00.000Z',
    };
    const port = await listen((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ cards: [card] }));
    });
    process.env.SREDITOR_EXPLORE_URL = `http://127.0.0.1:${port}/v1/explore`;

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await explore();

    const output = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(output).toContain('Exploration — not eligibility guidance');
    expect(output).toContain('Some theme');
    expect(output).toContain('https://arxiv.org/abs/1234');
  });

  it('prints a no-cards message for an empty corpus, without erroring', async () => {
    const port = await listen((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ cards: [] }));
    });
    process.env.SREDITOR_EXPLORE_URL = `http://127.0.0.1:${port}/v1/explore`;

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await expect(explore()).resolves.toBeUndefined();
    expect(logSpy.mock.calls.map((call) => call.join(' ')).join('\n')).toContain('No current cards');
  });

  it('rejects with a clear message when the backend is unreachable', async () => {
    process.env.SREDITOR_EXPLORE_URL = 'http://127.0.0.1:1/v1/explore';
    await expect(explore()).rejects.toThrow(/could not reach/i);
  });

  it('rejects with a clear message on a non-2xx response', async () => {
    const port = await listen((_req, res) => {
      res.writeHead(500);
      res.end('boom');
    });
    process.env.SREDITOR_EXPLORE_URL = `http://127.0.0.1:${port}/v1/explore`;
    await expect(explore()).rejects.toThrow(/HTTP 500/);
  });

  it('rejects with a clear message on a malformed body', async () => {
    const port = await listen((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ unexpected: 'shape' }));
    });
    process.env.SREDITOR_EXPLORE_URL = `http://127.0.0.1:${port}/v1/explore`;
    await expect(explore()).rejects.toThrow(/did not match the expected card shape/);
  });

  it('rejects with a clear message on non-JSON body', async () => {
    const port = await listen((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('not json');
    });
    process.env.SREDITOR_EXPLORE_URL = `http://127.0.0.1:${port}/v1/explore`;
    await expect(explore()).rejects.toThrow(/not valid JSON/);
  });
});
