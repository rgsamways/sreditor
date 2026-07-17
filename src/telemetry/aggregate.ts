import type { JudgmentRecord } from '../commands/judge.js';
import { getCoverage, getJudgmentsList } from '../ui/data.js';
import { getOrCreateInstallId } from '../statsConfig.js';
import { checkWordLimits, partitionProjects } from '../report.js';
import { readRollupOutput } from '../rollup.js';
import { SREDITOR_VERSION, StatsPayloadSchema, type StatsPayload } from './schema.js';

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildStatsPayload(cwd: string): StatsPayload {
  const coverage = getCoverage(cwd);
  const judgments = getJudgmentsList(cwd);

  const eligibleCount = judgments.filter((record) => record.eligible).length;

  const proximityCounts = { close: 0, some_signal: 0, not_close: 0 };
  const confidenceCounts = { high: 0, medium: 0, low: 0 };
  for (const record of judgments) {
    const proximity: JudgmentRecord['proximity'] = record.proximity ?? 'not_close';
    proximityCounts[proximity] += 1;
    confidenceCounts[record.confidence] += 1;
  }

  const rollupOutput = readRollupOutput(cwd);
  const { filingReady, excluded } = rollupOutput ? partitionProjects(rollupOutput) : { filingReady: [], excluded: [] };

  const wordUtilization = { uncertainty: [] as number[], investigation: [] as number[], advancement: [] as number[] };
  for (const project of filingReady) {
    for (const check of checkWordLimits(project)) {
      wordUtilization[check.field].push((check.count / check.limit) * 100);
    }
  }

  // Parsed through the schema before it's ever returned, not just typed as one --
  // this is the actual enforcement point, not TypeScript's compile-time checking
  // alone, which wouldn't catch a field built dynamically rather than as an
  // object literal. Any future accidental addition of a free-text field throws
  // here instead of silently being included, and submit.ts's try/catch means
  // that fails safe (nothing sent) rather than sending a malformed payload.
  return StatsPayloadSchema.parse({
    installId: getOrCreateInstallId(cwd),
    sreditorVersion: SREDITOR_VERSION,
    archivedCount: coverage.archivedCount,
    judgedCount: coverage.judgedCount,
    unjudgedCount: coverage.unjudgedCount,
    eligibleCount,
    proximityCloseCount: proximityCounts.close,
    proximitySomeSignalCount: proximityCounts.some_signal,
    proximityNotCloseCount: proximityCounts.not_close,
    confidenceHighCount: confidenceCounts.high,
    confidenceMediumCount: confidenceCounts.medium,
    confidenceLowCount: confidenceCounts.low,
    filingReadyProjectCount: filingReady.length,
    excludedProjectCount: excluded.length,
    avgContributingChangesPerFilingReadyProject: average(filingReady.map((project) => project.contributingChangeIds.length)),
    avgWordUtilizationUncertaintyPct: average(wordUtilization.uncertainty),
    avgWordUtilizationInvestigationPct: average(wordUtilization.investigation),
    avgWordUtilizationAdvancementPct: average(wordUtilization.advancement),
  });
}
