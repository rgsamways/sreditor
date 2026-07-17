import { describe, expect, it } from 'vitest';
import { buildProbePrompt } from '../../src/llm/probe.js';

describe('probe prompt building', () => {
  it('builds a probe prompt containing all three raw answers', () => {
    const prompt = buildProbePrompt({
      approachRaw: 'Adding a REST endpoint that wraps the existing service call, already know this will work',
      uncertaintyRaw: 'Whether the existing rate limiter will hold up under the new call pattern, weighing a token bucket vs a fixed window',
      resolutionRaw: 'Load test both approaches against a staging clone and compare p99 latency under burst traffic',
    });

    expect(prompt).toContain('Adding a REST endpoint that wraps the existing service call');
    expect(prompt).toContain('token bucket vs a fixed window');
    expect(prompt).toContain('p99 latency under burst traffic');
  });

  it('builds a prompt reflecting an honest absence of uncertainty', () => {
    const prompt = buildProbePrompt({
      approachRaw: 'Routine CRUD endpoint, already know exactly how to build it',
      uncertaintyRaw: 'Nothing uncertain, no alternatives being weighed',
      resolutionRaw: 'Nothing to test beyond the normal test suite',
    });

    expect(prompt).toContain('Routine CRUD endpoint');
    expect(prompt).toContain('Nothing uncertain');
    expect(prompt).toContain('Nothing to test beyond the normal test suite');
  });
});
