import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { JudgmentRecord } from '../../src/commands/judge.js';
import { judgmentsFile } from '../../src/paths.js';
import { appendJsonl } from '../../src/persistence/jsonl.js';
import { saveRollupOutput } from '../../src/rollup.js';
import { getCoverage, getJudgmentDetail, getJudgmentDetailView, getJudgmentsList, getJudgmentsListView, getRollupView } from '../../src/ui/data.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sreditor-ui-data-'));
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
    reasoning: 'Routine engineering; no genuine technological uncertainty described.',
    proximity: 'not_close',
    pathToEligibility: 'Would need a documented technical unknown and systematic investigation of it.',
    drift: null,
    ...overrides,
  };
}

describe('getJudgmentsList', () => {
  it('returns an empty array when no judgments file exists', () => {
    expect(getJudgmentsList(dir)).toEqual([]);
  });

  it('returns the latest record per change id', () => {
    appendJsonl(judgmentsFile(dir), record('a', { eligible: false }));
    appendJsonl(judgmentsFile(dir), record('a', { eligible: true }));
    appendJsonl(judgmentsFile(dir), record('b'));

    const records = getJudgmentsList(dir);
    expect(records).toHaveLength(2);
    expect(records.find((r) => r.changeId === 'a')?.eligible).toBe(true);
  });
});

describe('getJudgmentDetail', () => {
  it('returns null when the change id is not found', () => {
    expect(getJudgmentDetail(dir, 'nonexistent')).toBeNull();
  });

  it('returns the matching record', () => {
    appendJsonl(judgmentsFile(dir), record('a'));
    expect(getJudgmentDetail(dir, 'a')?.changeId).toBe('a');
  });
});

describe('getRollupView', () => {
  it('reports rollupExists=false with empty arrays when no rollup file exists', () => {
    expect(getRollupView(dir)).toEqual({ rollupExists: false, generatedAt: null, filingReady: [], excluded: [] });
  });

  it('splits filing-ready and excluded projects, attaching word-limit checks and date ranges', () => {
    appendJsonl(judgmentsFile(dir), record('a', { eligible: true, judgedAt: '2026-07-01T00:00:00.000Z' }));
    appendJsonl(judgmentsFile(dir), record('b', { proximity: 'close', reasoning: 'Close but incomplete.' }));

    saveRollupOutput(dir, {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [
        {
          name: 'Ready project',
          contributingChangeIds: ['a'],
          uncertainty: 'Some uncertainty.',
          investigation: 'Some investigation.',
          advancement: 'Some advancement.',
          confidence: 'high',
          eligibleForFiling: true,
        },
        {
          name: 'Excluded project',
          contributingChangeIds: ['b'],
          uncertainty: 'No shared technological uncertainty identified.',
          investigation: 'Not applicable.',
          advancement: 'Not applicable.',
          confidence: 'high',
          eligibleForFiling: false,
        },
      ],
    });

    const view = getRollupView(dir);

    expect(view.rollupExists).toBe(true);
    expect(view.filingReady).toHaveLength(1);
    expect(view.filingReady[0]?.name).toBe('Ready project');
    expect(view.filingReady[0]?.dateRange).toBe('2026-07-01');
    expect(view.filingReady[0]?.wordLimitChecks.map((c) => c.field)).toEqual(['uncertainty', 'investigation', 'advancement']);

    expect(view.excluded).toHaveLength(1);
    expect(view.excluded[0]?.name).toBe('Excluded project');
    expect(view.excluded[0]?.changes).toHaveLength(1);
    expect(view.excluded[0]?.changes[0]).toMatchObject({
      changeId: 'b',
      found: true,
      proximity: 'close',
      reasoning: 'Close but incomplete.',
    });
  });

  it('marks a contributing change as not found when no judgment record exists for it', () => {
    saveRollupOutput(dir, {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [
        {
          name: 'Excluded project',
          contributingChangeIds: ['ghost'],
          uncertainty: 'None.',
          investigation: 'None.',
          advancement: 'None.',
          confidence: 'high',
          eligibleForFiling: false,
        },
      ],
    });

    const view = getRollupView(dir);
    expect(view.excluded[0]?.changes[0]).toMatchObject({ changeId: 'ghost', found: false, reasoning: null });
  });
});

function makeArchivedChange(dir: string, changeId: string): void {
  const changeDir = join(dir, 'openspec', 'changes', 'archive', changeId);
  mkdirSync(changeDir, { recursive: true });
  writeFileSync(join(changeDir, 'proposal.md'), '# proposal', 'utf-8');
}

describe('getCoverage', () => {
  it('reports zero counts and no rollup when nothing exists yet', () => {
    expect(getCoverage(dir)).toEqual({
      archivedCount: 0,
      judgedCount: 0,
      unjudgedCount: 0,
      rolledUpCount: 0,
      rollupExists: false,
    });
  });

  it('counts archived, judged, unjudged, and rolled-up changes correctly', () => {
    makeArchivedChange(dir, 'a');
    makeArchivedChange(dir, 'b');
    makeArchivedChange(dir, 'c');
    appendJsonl(judgmentsFile(dir), record('a'));
    appendJsonl(judgmentsFile(dir), record('b'));

    saveRollupOutput(dir, {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [
        {
          name: 'Project',
          contributingChangeIds: ['a'],
          uncertainty: 'x',
          investigation: 'x',
          advancement: 'x',
          confidence: 'high',
          eligibleForFiling: true,
        },
      ],
    });

    expect(getCoverage(dir)).toEqual({
      archivedCount: 3,
      judgedCount: 2,
      unjudgedCount: 1,
      rolledUpCount: 1,
      rollupExists: true,
    });
  });
});

describe('getJudgmentsListView / getJudgmentDetailView', () => {
  it('sets filingReadyProjectName to null when no rollup exists', () => {
    appendJsonl(judgmentsFile(dir), record('a'));
    const [view] = getJudgmentsListView(dir);
    expect(view?.filingReadyProjectName).toBeNull();
  });

  it('cross-references an individually-ineligible change that contributes to a filing-ready project', () => {
    appendJsonl(judgmentsFile(dir), record('a', { eligible: false }));
    appendJsonl(judgmentsFile(dir), record('b', { eligible: false }));

    saveRollupOutput(dir, {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [
        {
          name: 'Generic Dispatch/Ranking Protocol Generalization',
          contributingChangeIds: ['a', 'b'],
          uncertainty: 'x',
          investigation: 'x',
          advancement: 'x',
          confidence: 'medium',
          eligibleForFiling: true,
        },
      ],
    });

    const view = getJudgmentsListView(dir);
    expect(view.find((r) => r.changeId === 'a')?.filingReadyProjectName).toBe('Generic Dispatch/Ranking Protocol Generalization');
    expect(view.find((r) => r.changeId === 'b')?.filingReadyProjectName).toBe('Generic Dispatch/Ranking Protocol Generalization');

    expect(getJudgmentDetailView(dir, 'a')?.filingReadyProjectName).toBe('Generic Dispatch/Ranking Protocol Generalization');
  });

  it('does not cross-reference a change that only sits in the excluded (non-filing-ready) bucket', () => {
    appendJsonl(judgmentsFile(dir), record('c'));

    saveRollupOutput(dir, {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [
        {
          name: 'Other judged, ungrouped work',
          contributingChangeIds: ['c'],
          uncertainty: 'none',
          investigation: 'n/a',
          advancement: 'n/a',
          confidence: 'high',
          eligibleForFiling: false,
        },
      ],
    });

    expect(getJudgmentsListView(dir).find((r) => r.changeId === 'c')?.filingReadyProjectName).toBeNull();
  });

  it('returns null from getJudgmentDetailView for an unknown change id', () => {
    expect(getJudgmentDetailView(dir, 'nonexistent')).toBeNull();
  });
});
