import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { getAggregateStats, insertSubmission } from './db.js';
import { isRateLimited } from './rateLimit.js';
import { StatsPayloadSchema } from './schema.js';

const MAX_BODY_BYTES = 16 * 1024;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    // Public marketing site (a different origin from this API) needs to read
    // /v1/aggregate; the submission endpoint doesn't need browser CORS at all
    // since the CLI, not a browser, is the only real submitter.
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytes = 0;
    req.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        reject(new Error('Payload too large.'));
        req.destroy();
        return;
      }
      body += chunk.toString('utf-8');
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return req.socket.remoteAddress ?? 'unknown';
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/healthz') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/v1/aggregate') {
    try {
      sendJson(res, 200, await getAggregateStats());
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/v1/stats') {
    if (isRateLimited(clientIp(req))) {
      sendJson(res, 429, { error: 'Too many requests.' });
      return;
    }

    try {
      const body = await readBody(req);
      const parsed = StatsPayloadSchema.safeParse(JSON.parse(body));
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Payload did not match the expected allowlisted shape.' });
        return;
      }
      await insertSubmission(parsed.data);
      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found.' });
}

const port = Number(process.env.PORT ?? 8080);
createServer((req, res) => {
  handleRequest(req, res).catch((error: unknown) => {
    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
  });
}).listen(port, () => {
  console.log(`sreditor-stats-api listening on :${port}`);
});
