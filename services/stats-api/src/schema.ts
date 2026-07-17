import { z } from 'zod';

// Must stay in sync with src/telemetry/schema.ts in the main sreditor CLI
// package -- this is the server-side half of the same allowlist. Even if a
// client were compromised or hand-crafted a request, the server independently
// refuses anything outside this exact shape (defense in depth: the allowlist
// is enforced on both ends, not trusted from one side only).
export const StatsPayloadSchema = z.object({
  installId: z.string().uuid(),
  sreditorVersion: z.string(),
  archivedCount: z.number().int().nonnegative(),
  judgedCount: z.number().int().nonnegative(),
  unjudgedCount: z.number().int().nonnegative(),
  eligibleCount: z.number().int().nonnegative(),
  proximityCloseCount: z.number().int().nonnegative(),
  proximitySomeSignalCount: z.number().int().nonnegative(),
  proximityNotCloseCount: z.number().int().nonnegative(),
  confidenceHighCount: z.number().int().nonnegative(),
  confidenceMediumCount: z.number().int().nonnegative(),
  confidenceLowCount: z.number().int().nonnegative(),
  filingReadyProjectCount: z.number().int().nonnegative(),
  excludedProjectCount: z.number().int().nonnegative(),
  avgContributingChangesPerFilingReadyProject: z.number().nonnegative().nullable(),
  avgWordUtilizationUncertaintyPct: z.number().nullable(),
  avgWordUtilizationInvestigationPct: z.number().nullable(),
  avgWordUtilizationAdvancementPct: z.number().nullable(),
}).strict();

export type StatsPayload = z.infer<typeof StatsPayloadSchema>;
