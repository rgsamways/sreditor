import { describe, expect, it } from 'vitest';
import { buildJudgmentPrompt } from '../../src/llm/judgment.js';
import type { CorroboratingSignals } from '../../src/tools/corroboration.js';

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

  it('omits the corroborating signals block when no signals were gathered', () => {
    const noSignals: CorroboratingSignals = { scc: null, jscpd: null, sem: null };
    const prompt = buildJudgmentPrompt(
      { id: 'add-offline-sync', path: '/tmp/whatever', files: { 'proposal.md': 'text' } },
      noSignals,
    );

    expect(prompt).not.toContain('Corroborating signals');
  });

  it('includes a labeled, non-authoritative corroborating signals block when signals are present', () => {
    const signals: CorroboratingSignals = {
      scc: [{ name: 'TypeScript', files: 3, lines: 120, code: 100, complexity: 12 }],
      jscpd: '0 clones · 0.0% duplication',
      sem: {
        fileCount: 2,
        added: 5,
        modified: 1,
        deleted: 0,
        changes: [{ entityType: 'function', entityName: 'foo', changeType: 'added', filePath: 'src/foo.ts' }],
      },
    };
    const prompt = buildJudgmentPrompt(
      { id: 'add-offline-sync', path: '/tmp/whatever', files: { 'proposal.md': 'text' } },
      signals,
    );

    expect(prompt).toContain('Corroborating signals (context only, do not treat as determinative)');
    expect(prompt).toContain('TypeScript');
    expect(prompt).toContain('0 clones · 0.0% duplication');
    expect(prompt).toContain('foo');
  });
});
