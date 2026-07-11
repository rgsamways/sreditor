import { describe, expect, it } from 'vitest';
import { buildJudgmentPrompt } from '../../src/llm/judgment.js';

describe('judgment prompt building', () => {
  it('includes the change id and artifact file contents', () => {
    const prompt = buildJudgmentPrompt({
      id: 'add-offline-sync',
      path: '/tmp/whatever',
      files: {
        'proposal.md': 'We were unsure whether CRDT sync could resolve conflicts.',
        'tasks.md': '- [x] Prototype CRDT sync',
      },
    });

    expect(prompt).toContain('add-offline-sync');
    expect(prompt).toContain('We were unsure whether CRDT sync could resolve conflicts.');
    expect(prompt).toContain('Prototype CRDT sync');
  });

  it('notes when a change has no artifact files', () => {
    const prompt = buildJudgmentPrompt({ id: 'empty-change', path: '/tmp/whatever', files: {} });

    expect(prompt).toContain('empty-change');
    expect(prompt).toContain('no artifact files');
  });
});
