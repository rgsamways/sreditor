import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { pathToFileURL } from 'node:url';
import { getTopCards } from './db.js';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    // Read-only, identity-free content -- open CORS is fine, same posture as
    // stats-api's public /v1/aggregate endpoint.
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/healthz') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/v1/explore') {
    try {
      const tag = url.searchParams.get('tag') ?? undefined;
      const limitParam = url.searchParams.get('limit');
      const limit = limitParam ? Number(limitParam) : undefined;
      const cards = await getTopCards({ tag, limit: limit && Number.isFinite(limit) ? limit : undefined });
      sendJson(res, 200, { cards });
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found.' });
}

export function createExploreServer(): Server {
  return createServer((req, res) => {
    handleRequest(req, res).catch((error: unknown) => {
      sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
    });
  });
}

// Only bind a port when run as the entrypoint (`node dist/server.js` /
// `tsx src/server.ts`) -- importing this module from tests must not have the
// side effect of listening on a port.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 8080);
  createExploreServer().listen(port, () => {
    console.log(`sreditor-explore-api listening on :${port}`);
  });
}
