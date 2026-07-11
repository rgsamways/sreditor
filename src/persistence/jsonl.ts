import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function appendJsonl<T>(filePath: string, record: T): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  appendFileSync(filePath, `${JSON.stringify(record)}\n`, 'utf-8');
}

export function readJsonl<T>(filePath: string): T[] {
  if (!existsSync(filePath)) {
    return [];
  }

  return readFileSync(filePath, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as T);
}
