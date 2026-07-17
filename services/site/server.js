import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

const port = Number(process.env.PORT ?? 8080);

createServer((req, res) => {
  const path = req.url === '/' || !req.url ? '/index.html' : req.url;
  const filePath = join(__dirname, path.split('?')[0]);

  if (!filePath.startsWith(__dirname) || !existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  res.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream' });
  res.end(readFileSync(filePath));
}).listen(port, () => {
  console.log(`sreditor-site listening on :${port}`);
});
