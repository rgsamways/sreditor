import { z } from 'zod';

// Update alongside package.json's "version" field. Deliberately not read from
// package.json at runtime -- a hardcoded literal avoids any path-resolution
// fragility between running from src/ (dev) and the bundled dist/ output,
// which matters here specifically because this value ships in every payload.
// Also the single source of truth for the CLI's own `--version` flag (src/index.ts)
// -- don't add a second hardcoded literal there.
export const SREDITOR_VERSION = '0.0.4';

// Every field here is a number, a UUID, or a fixed-shape version string --
// structurally, there is no field capable of holding a project name, a change
// id, or any reasoning text. That is the actual enforcement mechanism, not a
// policy documented elsewhere that someone could forget to follow.
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
