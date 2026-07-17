import { describe, expect, it } from 'vitest';
import { checkWordLimits, countWords, partitionProjects, renderReportMarkdown } from '../src/report.js';
import type { JudgmentRecord } from '../src/commands/judge.js';
import type { Project } from '../src/llm/rollup.js';
import type { RollupOutput } from '../src/rollup.js';

function project(overrides: Partial<Project> = {}): Project {
  return {
    name: 'Offline Sync Investigation',
    contributingChangeIds: ['a', 'b'],
    uncertainty: 'Whether CRDT sync could resolve conflicts without a full rewrite.',
    investigation: 'Prototyped two approaches and tested both against simulated conflicts.',
    advancement: 'Quantified which approach performs better under real conflict rates.',
    confidence: 'high',
    eligibleForFiling: true,
    ...overrides,
  };
}

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

describe('countWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords('one two three')).toBe(3);
  });

  it('returns 0 for empty or whitespace-only text', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });

  it('collapses multiple spaces/newlines between words', () => {
    expect(countWords('one\n\n  two   three')).toBe(3);
  });
});

describe('checkWordLimits', () => {
  it('flags no fields as over limit when all are short', () => {
    const checks = checkWordLimits(project());
    expect(checks.every((check) => !check.overLimit)).toBe(true);
    expect(checks.map((check) => check.field)).toEqual(['uncertainty', 'investigation', 'advancement']);
  });

  it('flags a field that exceeds its CRA limit', () => {
    const longText = Array.from({ length: 400 }, () => 'word').join(' ');
    const checks = checkWordLimits(project({ uncertainty: longText }));
    const uncertaintyCheck = checks.find((check) => check.field === 'uncertainty');

    expect(uncertaintyCheck?.overLimit).toBe(true);
    expect(uncertaintyCheck?.count).toBe(400);
    expect(uncertaintyCheck?.limit).toBe(350);
  });
});

describe('partitionProjects', () => {
  it('splits filing-ready and excluded projects, preserving order within each group', () => {
    const output: RollupOutput = {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [
        project({ name: 'Ready A' }),
        project({ name: 'Excluded A', eligibleForFiling: false }),
        project({ name: 'Ready B' }),
        project({ name: 'Excluded B', eligibleForFiling: false }),
      ],
    };

    const { filingReady, excluded } = partitionProjects(output);

    expect(filingReady.map((p) => p.name)).toEqual(['Ready A', 'Ready B']);
    expect(excluded.map((p) => p.name)).toEqual(['Excluded A', 'Excluded B']);
  });

  it('returns empty arrays when there are no projects', () => {
    const output: RollupOutput = { generatedAt: '2026-07-11T00:00:00.000Z', projects: [] };

    expect(partitionProjects(output)).toEqual({ filingReady: [], excluded: [] });
  });
});

describe('renderReportMarkdown', () => {
  it('renders one section per project with T661 line labels and word counts', () => {
    const output: RollupOutput = {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [project()],
    };

    const markdown = renderReportMarkdown(output, ['2026-07-11'], new Map());

    expect(markdown).toContain('Offline Sync Investigation');
    expect(markdown).toContain('Line 242 — Technological Uncertainty');
    expect(markdown).toContain('Line 244 — Work Performed');
    expect(markdown).toContain('Line 246 — Technological Advancement');
    expect(markdown).toContain('2026-07-11');
    expect(markdown).not.toContain('over limit');
  });

  it('flags an over-limit field inline without truncating its content', () => {
    const longText = Array.from({ length: 400 }, () => 'word').join(' ');
    const output: RollupOutput = {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [project({ uncertainty: longText })],
    };

    const markdown = renderReportMarkdown(output, ['2026-07-11'], new Map());

    expect(markdown).toContain('over limit, trim before filing');
    expect(markdown).toContain(longText);
  });

  it('keeps eligibleForFiling=false projects out of the T661-formatted body, in a separate marked section', () => {
    const output: RollupOutput = {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [
        project(),
        project({
          name: 'Other ineligible, unrelated work',
          eligibleForFiling: false,
          contributingChangeIds: ['c'],
          uncertainty: 'No technological uncertainty found across these changes.',
        }),
      ],
    };
    const recordsById = new Map([['c', record('c', { reasoning: 'Routine Stripe integration; no uncertainty described.' })]]);

    const markdown = renderReportMarkdown(output, ['2026-07-11', '2026-07-11'], recordsById);

    expect(markdown).toContain('## Excluded — not for filing');
    expect(markdown).toContain('### Other ineligible, unrelated work');
    expect(markdown).not.toContain('\n## Other ineligible, unrelated work\n');
    expect(markdown).not.toContain('Line 242 — Technological Uncertainty\n\nNo technological uncertainty found');
  });

  it('shows each excluded change\'s own judgment reasoning, not just the bucket summary', () => {
    const output: RollupOutput = {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [
        project({
          name: 'Other judged, ungrouped work',
          eligibleForFiling: false,
          contributingChangeIds: ['f22', 'f09'],
        }),
      ],
    };
    const recordsById = new Map([
      ['f22', record('f22', { reasoning: 'Routine Stripe integration; no uncertainty described.' })],
      ['f09', record('f09', { reasoning: 'A straightforward collection rename with no technical unknowns.' })],
    ]);

    const markdown = renderReportMarkdown(output, ['2026-07-11'], recordsById);

    expect(markdown).toContain('**f22**');
    expect(markdown).toContain('Routine Stripe integration; no uncertainty described.');
    expect(markdown).toContain('**f09**');
    expect(markdown).toContain('A straightforward collection rename with no technical unknowns.');
  });

  it('orders excluded changes closest-to-eligible first and includes forward-looking guidance', () => {
    const output: RollupOutput = {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [
        project({
          name: 'Other judged, ungrouped work',
          eligibleForFiling: false,
          contributingChangeIds: ['far', 'closest', 'middle'],
        }),
      ],
    };
    const recordsById = new Map([
      ['far', record('far', { proximity: 'not_close', pathToEligibility: 'Would need any genuine technical question at all.' })],
      ['closest', record('closest', { proximity: 'close', pathToEligibility: 'Would need the investigation documented as systematic.' })],
      ['middle', record('middle', { proximity: 'some_signal', pathToEligibility: 'Would need investigation, not just the uncertainty statement.' })],
    ]);

    const markdown = renderReportMarkdown(output, ['2026-07-11'], recordsById);

    const closestIdx = markdown.indexOf('**closest**');
    const middleIdx = markdown.indexOf('**middle**');
    const farIdx = markdown.indexOf('**far**');

    expect(closestIdx).toBeGreaterThan(-1);
    expect(closestIdx).toBeLessThan(middleIdx);
    expect(middleIdx).toBeLessThan(farIdx);
    expect(markdown).toContain('**Path to eligibility (forward-looking):** Would need the investigation documented as systematic.');
  });
});
