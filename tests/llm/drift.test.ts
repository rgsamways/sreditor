import { describe, expect, it } from 'vitest';
import { buildDriftPrompt } from '../../src/llm/drift.js';

describe('drift prompt building', () => {
  it('includes the anchor text and the change artifact contents', () => {
    const prompt = buildDriftPrompt('# Anchor: Offline-first sync for field inspectors\n\n## Revision ...', {
      id: 'add-payment-webhook',
      path: '/tmp/whatever',
      files: { 'proposal.md': 'Adds a Stripe payment webhook handler.' },
    });

    expect(prompt).toContain('Offline-first sync for field inspectors');
    expect(prompt).toContain('add-payment-webhook');
    expect(prompt).toContain('Stripe payment webhook handler');
  });
});
