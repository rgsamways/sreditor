import { describe, expect, it } from 'vitest';
import { computeDateRange, findUnjudgedChangeIds, latestJudgmentPerChange } from '../src/rollup.js';
import type { JudgmentRecord } from '../src/commands/judge.js';
import type { ChangeArtifact } from '../src/adapters/types.js';

function record(changeId: string, judgedAt: string, overrides: Partial<JudgmentRecord> = {}): JudgmentRecord {
  return {
    changeId,
    judgedAt,
    eligible: true,
    uncertaintyStatement: 'uncertainty',
    investigationSteps: 'steps',
    advancement: 'advancement',
    confidence: 'high',
    reasoning: 'reasoning',
    drift: null,
    ...overrides,
  };
}

describe('latestJudgmentPerChange', () => {
  it('keeps only the most recent record per change id', () => {
    const records = [
      record('a', '2026-07-01T00:00:00.000Z', { eligible: false }),
      record('b', '2026-07-02T00:00:00.000Z'),
      record('a', '2026-07-03T00:00:00.000Z', { eligible: true }),
    ];

    const result = latestJudgmentPerChange(records);

    expect(result).toHaveLength(2);
    const a = result.find((r) => r.changeId === 'a');
    expect(a?.eligible).toBe(true);
    expect(a?.judgedAt).toBe('2026-07-03T00:00:00.000Z');
  });
});

describe('findUnjudgedChangeIds', () => {
  it('returns change ids not present in the judged set', () => {
    const changes: ChangeArtifact[] = [
      { id: 'a', path: '/tmp/a', files: {} },
      { id: 'b', path: '/tmp/b', files: {} },
      { id: 'c', path: '/tmp/c', files: {} },
    ];

    const result = findUnjudgedChangeIds(changes, new Set(['a', 'c']));

    expect(result).toEqual(['b']);
  });
});

describe('computeDateRange', () => {
  it('returns a single date when all records share the same day', () => {
    const records = [record('a', '2026-07-11T01:00:00.000Z'), record('b', '2026-07-11T23:00:00.000Z')];
    expect(computeDateRange(records)).toBe('2026-07-11');
  });

  it('returns a range spanning the earliest and latest dates', () => {
    const records = [record('a', '2026-07-11T00:00:00.000Z'), record('b', '2026-07-15T00:00:00.000Z')];
    expect(computeDateRange(records)).toBe('2026-07-11 to 2026-07-15');
  });

  it('returns "unknown" for an empty list', () => {
    expect(computeDateRange([])).toBe('unknown');
  });
});
