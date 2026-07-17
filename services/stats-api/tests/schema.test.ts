import { describe, expect, it } from 'vitest';
import { StatsPayloadSchema } from '../src/schema.js';

function validPayload() {
  return {
    installId: '11111111-1111-4111-8111-111111111111',
    sreditorVersion: '0.0.1',
    archivedCount: 10,
    judgedCount: 8,
    unjudgedCount: 2,
    eligibleCount: 1,
    proximityCloseCount: 0,
    proximitySomeSignalCount: 1,
    proximityNotCloseCount: 7,
    confidenceHighCount: 6,
    confidenceMediumCount: 2,
    confidenceLowCount: 0,
    filingReadyProjectCount: 1,
    excludedProjectCount: 7,
    avgContributingChangesPerFilingReadyProject: 3,
    avgWordUtilizationUncertaintyPct: 39,
    avgWordUtilizationInvestigationPct: 46,
    avgWordUtilizationAdvancementPct: 40,
  };
}

describe('StatsPayloadSchema (server-side)', () => {
  it('accepts a well-formed payload', () => {
    expect(StatsPayloadSchema.safeParse(validPayload()).success).toBe(true);
  });

  it('rejects a payload with an extra free-text field, even a hand-crafted malicious one', () => {
    const withExtra = { ...validPayload(), projectName: 'Whatever a client could try to send' };
    expect(StatsPayloadSchema.safeParse(withExtra).success).toBe(false);
  });

  it('rejects a non-uuid installId', () => {
    expect(StatsPayloadSchema.safeParse({ ...validPayload(), installId: 'not-a-uuid' }).success).toBe(false);
  });

  it('rejects a negative count', () => {
    expect(StatsPayloadSchema.safeParse({ ...validPayload(), archivedCount: -1 }).success).toBe(false);
  });
});
