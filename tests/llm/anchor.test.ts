import { describe, expect, it } from 'vitest';
import { buildAnchorPrompt, buildReflectionPrompt } from '../../src/llm/anchor.js';

describe('anchor prompt building', () => {
  it('builds an anchor prompt containing all three raw answers', () => {
    const prompt = buildAnchorPrompt({
      goalRaw: 'A CLI that syncs field inspection data offline-first',
      uncertaintyRaw: "Didn't know if CRDT sync could resolve conflicts under real inspector usage patterns",
      successCriteriaRaw: 'Two inspectors editing the same record offline both see a consistent result on reconnect',
    });

    expect(prompt).toContain('A CLI that syncs field inspection data offline-first');
    expect(prompt).toContain('CRDT sync could resolve conflicts');
    expect(prompt).toContain('consistent result on reconnect');
  });

  it('builds a reflection prompt containing the prior anchor text and both raw answers', () => {
    const prompt = buildReflectionPrompt('# Anchor: Offline-first sync\n\n## Revision 2026-07-11 (original)\n...', {
      whatChangedRaw: 'Turned out CRDTs were overkill; last-write-wins was sufficient',
      whyRaw: 'Real usage showed conflicts were rare enough that LWW never lost meaningful data',
    });

    expect(prompt).toContain('# Anchor: Offline-first sync');
    expect(prompt).toContain('CRDTs were overkill');
    expect(prompt).toContain('conflicts were rare enough');
  });
});
