import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { JudgmentRecord } from '../../src/commands/judge.js';
import { judgmentsFile } from '../../src/paths.js';
import { appendJsonl } from '../../src/persistence/jsonl.js';
import { saveRollupOutput } from '../../src/rollup.js';
import { buildStatsPayload } from '../../src/telemetry/aggregate.js';
import { StatsPayloadSchema } from '../../src/telemetry/schema.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sreditor-telemetry-aggregate-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function record(changeId: string, overrides: Partial<JudgmentRecord> = {}): JudgmentRecord {
  return {
    changeId,
    judgedAt: '2026-07-11T00:00:00.000Z',
    eligible: false,
    uncertaintyStatement: 'None found.',
    investigationSteps: 'Routine implementation.',
    advancement: 'None.',
    confidence: 'high',
    reasoning: 'Routine engineering.',
    proximity: 'not_close',
    pathToEligibility: 'Would need a documented technical unknown.',
    drift: null,
    ...overrides,
  };
}

describe('buildStatsPayload', () => {
  it('returns an all-zero, schema-valid payload for a project with no judgments yet', () => {
    const payload = buildStatsPayload(dir);
    expect(StatsPayloadSchema.safeParse(payload).success).toBe(true);
    expect(payload.judgedCount).toBe(0);
    expect(payload.eligibleCount).toBe(0);
    expect(payload.filingReadyProjectCount).toBe(0);
  });

  it('computes real counts from judgments and a rollup, and always validates against the schema', () => {
    appendJsonl(judgmentsFile(dir), record('a', { eligible: true, proximity: 'close', confidence: 'medium' }));
    appendJsonl(judgmentsFile(dir), record('b', { proximity: 'some_signal', confidence: 'high' }));
    appendJsonl(judgmentsFile(dir), record('c', { proximity: 'not_close', confidence: 'low' }));

    saveRollupOutput(dir, {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [
        {
          name: 'Real project',
          contributingChangeIds: ['a'],
          uncertainty: 'x'.repeat(35), // 35 chars ~ short of a real 350-word field, fine for a count test
          investigation: 'y',
          advancement: 'z',
          confidence: 'medium',
          eligibleForFiling: true,
        },
        {
          name: 'Bucket',
          contributingChangeIds: ['b', 'c'],
          uncertainty: 'none',
          investigation: 'n/a',
          advancement: 'n/a',
          confidence: 'high',
          eligibleForFiling: false,
        },
      ],
    });

    const payload = buildStatsPayload(dir);
    expect(StatsPayloadSchema.safeParse(payload).success).toBe(true);
    expect(payload.judgedCount).toBe(3);
    expect(payload.eligibleCount).toBe(1);
    expect(payload.proximityCloseCount).toBe(1);
    expect(payload.proximitySomeSignalCount).toBe(1);
    expect(payload.proximityNotCloseCount).toBe(1);
    expect(payload.confidenceMediumCount).toBe(1);
    expect(payload.confidenceHighCount).toBe(1);
    expect(payload.confidenceLowCount).toBe(1);
    expect(payload.filingReadyProjectCount).toBe(1);
    expect(payload.excludedProjectCount).toBe(1);
    expect(payload.avgContributingChangesPerFilingReadyProject).toBe(1);
  });

  it('never includes a changeId, project name, or any reasoning text anywhere in the serialized payload', () => {
    appendJsonl(judgmentsFile(dir), record('super-secret-project-codename', { reasoning: 'This mentions the actual product roadmap.' }));
    saveRollupOutput(dir, {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [
        {
          name: 'Top Secret Project Name',
          contributingChangeIds: ['super-secret-project-codename'],
          uncertainty: 'x',
          investigation: 'y',
          advancement: 'z',
          confidence: 'high',
          eligibleForFiling: false,
        },
      ],
    });

    const serialized = JSON.stringify(buildStatsPayload(dir));
    expect(serialized).not.toContain('super-secret-project-codename');
    expect(serialized).not.toContain('Top Secret Project Name');
    expect(serialized).not.toContain('product roadmap');
  });
});
