import { describe, expect, it } from 'vitest';
import { buildRollupPrompt } from '../../src/llm/rollup.js';
import type { JudgmentRecord } from '../../src/commands/judge.js';

function record(changeId: string, overrides: Partial<JudgmentRecord> = {}): JudgmentRecord {
  return {
    changeId,
    judgedAt: '2026-07-11T00:00:00.000Z',
    eligible: true,
    uncertaintyStatement: 'Whether CRDT sync could resolve conflicts.',
    investigationSteps: 'Prototyped two approaches and tested both.',
    advancement: 'Quantified which approach performs better.',
    confidence: 'high',
    reasoning: 'Clear uncertainty, investigation, and advancement.',
    drift: 'Consistent with the anchor.',
    ...overrides,
  };
}

describe('rollup prompt building', () => {
  it('includes every provided change id and its judgment fields', () => {
    const prompt = buildRollupPrompt([
      record('genuine-crdt-uncertainty'),
      record('routine-ui-tweak', { eligible: false, drift: null }),
    ]);

    expect(prompt).toContain('genuine-crdt-uncertainty');
    expect(prompt).toContain('routine-ui-tweak');
    expect(prompt).toContain('Whether CRDT sync could resolve conflicts.');
    expect(prompt).toContain('Eligible (Layer 1): true');
    expect(prompt).toContain('Eligible (Layer 1): false');
    expect(prompt).toContain('Drift: not available');
  });
});
