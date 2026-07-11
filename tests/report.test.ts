import { describe, expect, it } from 'vitest';
import { checkWordLimits, countWords, renderReportMarkdown } from '../src/report.js';
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

describe('renderReportMarkdown', () => {
  it('renders one section per project with T661 line labels and word counts', () => {
    const output: RollupOutput = {
      generatedAt: '2026-07-11T00:00:00.000Z',
      projects: [project()],
    };

    const markdown = renderReportMarkdown(output, ['2026-07-11']);

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

    const markdown = renderReportMarkdown(output, ['2026-07-11']);

    expect(markdown).toContain('over limit, trim before filing');
    expect(markdown).toContain(longText);
  });
});
