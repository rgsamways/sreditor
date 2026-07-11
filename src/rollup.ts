import type { ChangeArtifact } from './adapters/types.js';
import type { JudgmentRecord } from './commands/judge.js';

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
