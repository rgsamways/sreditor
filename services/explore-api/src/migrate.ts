import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getPool } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const sql = readFileSync(join(__dirname, '..', 'migrations', '001_init.sql'), 'utf-8');
  await getPool().query(sql);
  console.log('Migration applied.');
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
