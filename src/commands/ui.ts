import spawn from 'cross-spawn';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { getCoverage, getJudgmentDetailView, getJudgmentsListView, getRollupView } from '../ui/data.js';
import { INDEX_HTML } from '../ui/html.js';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload);
}

function handleRequest(cwd: string, req: IncomingMessage, res: ServerResponse): void {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  const { pathname } = url;

  try {
    if (pathname === '/api/judgments') {
      sendJson(res, 200, getJudgmentsListView(cwd));
      return;
    }

    if (pathname.startsWith('/api/judgments/')) {
      const changeId = decodeURIComponent(pathname.slice('/api/judgments/'.length));
      const record = getJudgmentDetailView(cwd, changeId);
      if (record === null) {
        sendJson(res, 404, { error: `No judgment found for change id "${changeId}".` });
        return;
      }
      sendJson(res, 200, record);
      return;
    }

    if (pathname === '/api/rollup') {
      sendJson(res, 200, getRollupView(cwd));
      return;
    }

    if (pathname === '/api/coverage') {
      sendJson(res, 200, getCoverage(cwd));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(INDEX_HTML);
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
}

function openBrowser(url: string): void {
  try {
    const platform = process.platform;
    const [command, args] =
      platform === 'win32'
        ? ['cmd', ['/c', 'start', '""', url]]
        : platform === 'darwin'
          ? ['open', [url]]
          : ['xdg-open', [url]];

    const child = spawn(command, args, { stdio: 'ignore', detached: true });
    child.on('error', () => {
      // Best-effort only: the URL is already printed to the terminal.
    });
    child.unref();
  } catch {
    // Best-effort only: the URL is already printed to the terminal.
  }
}

export async function ui(cwd: string): Promise<void> {
  const server = createServer((req, res) => handleRequest(cwd, req, res));

  return new Promise<void>((resolve, reject) => {
    server.once('error', reject);

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      const url = `http://127.0.0.1:${port}`;

      console.log(`Sreditor UI running at ${url}`);
      console.log('Local-only, read-only — stop with Ctrl+C when done.');

      openBrowser(url);
    });

    const shutdown = (): void => {
      server.close(() => resolve());
      // Idle keep-alive connections would otherwise block close()'s callback
      // indefinitely, since it only fires once every connection has ended.
      server.closeAllConnections();
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  });
}
