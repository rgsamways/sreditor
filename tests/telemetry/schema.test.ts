import { describe, expect, it } from 'vitest';
import { StatsPayloadSchema } from '../../src/telemetry/schema.js';

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

describe('StatsPayloadSchema', () => {
  it('accepts a well-formed, fully numeric/uuid/version payload', () => {
    expect(StatsPayloadSchema.safeParse(validPayload()).success).toBe(true);
  });

  it('rejects a payload with an extra free-text field (proves the allowlist is structural)', () => {
    const withProjectName = { ...validPayload(), projectName: 'Farpost' };
    expect(StatsPayloadSchema.safeParse(withProjectName).success).toBe(false);
  });

  it('rejects a payload missing a required numeric field', () => {
    const { archivedCount: _archivedCount, ...withoutArchivedCount } = validPayload();
    expect(StatsPayloadSchema.safeParse(withoutArchivedCount).success).toBe(false);
  });

  it('rejects a non-uuid installId', () => {
    const invalid = { ...validPayload(), installId: 'not-a-uuid' };
    expect(StatsPayloadSchema.safeParse(invalid).success).toBe(false);
  });
});
