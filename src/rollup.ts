import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { ChangeArtifact } from './adapters/types.js';
import type { JudgmentRecord } from './commands/judge.js';
import type { Project } from './llm/rollup.js';
import { sreditorDir } from './paths.js';

export function latestJudgmentPerChange(records: JudgmentRecord[]): JudgmentRecord[] {
  const latest = new Map<string, JudgmentRecord>();
  for (const record of records) {
    latest.set(record.changeId, record);
  }
  return [...latest.values()];
}

export function findUnjudgedChangeIds(changes: ChangeArtifact[], judgedIds: Set<string>): string[] {
  return changes.filter((change) => !judgedIds.has(change.id)).map((change) => change.id);
}

export function computeDateRange(records: JudgmentRecord[]): string {
  if (records.length === 0) {
    return 'unknown';
  }

  const timestamps = records.map((record) => record.judgedAt).sort();
  const earliest = timestamps[0]?.slice(0, 10);
  const latest = timestamps.at(-1)?.slice(0, 10);

  return earliest === latest ? `${earliest}` : `${earliest} to ${latest}`;
}

export interface RollupOutput {
  generatedAt: string;
  projects: Project[];
}

export function rollupFile(cwd: string): string {
  return join(sreditorDir(cwd), 'rollup.json');
}

export function saveRollupOutput(cwd: string, output: RollupOutput): void {
  const filePath = rollupFile(cwd);
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf-8');
}

export function readRollupOutput(cwd: string): RollupOutput | null {
  const filePath = rollupFile(cwd);
  if (!existsSync(filePath)) {
    return null;
  }
  return JSON.parse(readFileSync(filePath, 'utf-8')) as RollupOutput;
}

export function isRollupStale(rollupOutput: RollupOutput, currentJudgedChangeIds: Set<string>): boolean {
  const rolledUpIds = new Set(rollupOutput.projects.flatMap((project) => project.contributingChangeIds));

  if (rolledUpIds.size !== currentJudgedChangeIds.size) {
    return true;
  }
  for (const id of rolledUpIds) {
    if (!currentJudgedChangeIds.has(id)) {
      return true;
    }
  }
  return false;
}
