import { join } from 'node:path';

export function sreditorDir(cwd: string): string {
  return join(cwd, '.sreditor');
}

export function judgmentsFile(cwd: string): string {
  return join(sreditorDir(cwd), 'judgments.jsonl');
}
