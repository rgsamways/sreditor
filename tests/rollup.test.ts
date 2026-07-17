import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  computeDateRange,
  findUnjudgedChangeIds,
  isRollupStale,
  latestJudgmentPerChange,
  readRollupOutput,
  saveRollupOutput,
  type RollupOutput,
} from '../src/rollup.js';
import type { JudgmentRecord } from '../src/commands/judge.js';
import type { ChangeArtifact } from '../src/adapters/types.js';
import type { Project } from '../src/llm/rollup.js';

function project(name: string, contributingChangeIds: string[]): Project {
  return {
    name,
    contributingChangeIds,
    uncertainty: 'uncertainty',
    investigation: 'investigation',
    advancement: 'advancement',
    confidence: 'high',
    eligibleForFiling: true,
  };
}

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
    proximity: 'close',
    pathToEligibility: 'Already eligible; no gap to close.',
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

describe('rollup output persistence', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'sreditor-rollup-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns null when no rollup has been saved', () => {
    expect(readRollupOutput(dir)).toBeNull();
  });

  it('round-trips a saved rollup output', () => {
    const output: RollupOutput = {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [project('Project A', ['a', 'b'])],
    };

    saveRollupOutput(dir, output);

    expect(readRollupOutput(dir)).toEqual(output);
  });

  it('overwrites a previously saved rollup output', () => {
    saveRollupOutput(dir, { generatedAt: '2026-07-11T00:00:00.000Z', projects: [project('First', ['a'])] });
    saveRollupOutput(dir, { generatedAt: '2026-07-12T00:00:00.000Z', projects: [project('Second', ['b'])] });

    const result = readRollupOutput(dir);
    expect(result?.projects).toHaveLength(1);
    expect(result?.projects[0]?.name).toBe('Second');
  });
});

describe('isRollupStale', () => {
  it('is not stale when the rolled-up ids exactly match the current judged ids', () => {
    const output: RollupOutput = { generatedAt: 'now', projects: [project('P', ['a', 'b'])] };
    expect(isRollupStale(output, new Set(['a', 'b']))).toBe(false);
  });

  it('is stale when a new change has been judged since', () => {
    const output: RollupOutput = { generatedAt: 'now', projects: [project('P', ['a', 'b'])] };
    expect(isRollupStale(output, new Set(['a', 'b', 'c']))).toBe(true);
  });

  it('is stale when a previously judged change no longer appears', () => {
    const output: RollupOutput = { generatedAt: 'now', projects: [project('P', ['a', 'b'])] };
    expect(isRollupStale(output, new Set(['a']))).toBe(true);
  });
});
