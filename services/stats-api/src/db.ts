import pg from 'pg';
import type { StatsPayload } from './schema.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

// Railway's Postgres addon injects DATABASE_URL automatically -- no manual
// wiring needed once the service and the database are in the same project.
export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set.');
    }
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function insertSubmission(payload: StatsPayload): Promise<void> {
  await getPool().query(
    `INSERT INTO stats_submissions (
      install_id, sreditor_version,
      archived_count, judged_count, unjudged_count, eligible_count,
      proximity_close_count, proximity_some_signal_count, proximity_not_close_count,
      confidence_high_count, confidence_medium_count, confidence_low_count,
      filing_ready_project_count, excluded_project_count,
      avg_contributing_changes_per_filing_project,
      avg_word_utilization_uncertainty_pct,
      avg_word_utilization_investigation_pct,
      avg_word_utilization_advancement_pct
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      payload.installId,
      payload.sreditorVersion,
      payload.archivedCount,
      payload.judgedCount,
      payload.unjudgedCount,
      payload.eligibleCount,
      payload.proximityCloseCount,
      payload.proximitySomeSignalCount,
      payload.proximityNotCloseCount,
      payload.confidenceHighCount,
      payload.confidenceMediumCount,
      payload.confidenceLowCount,
      payload.filingReadyProjectCount,
      payload.excludedProjectCount,
      payload.avgContributingChangesPerFilingReadyProject,
      payload.avgWordUtilizationUncertaintyPct,
      payload.avgWordUtilizationInvestigationPct,
      payload.avgWordUtilizationAdvancementPct,
    ],
  );
}

export interface AggregateStats {
  totalSubmissions: number;
  distinctInstalls: number;
  totalArchived: number;
  totalJudged: number;
  totalEligible: number;
  totalFilingReadyProjects: number;
  avgEligibleRatePct: number | null;
}

// Backs the public "aggregate stats" the marketing site shows -- itself just
// numbers derived from numbers, nothing that could reveal any one submitter.
//
// Each submission is a full snapshot of one install's current project state,
// not an incremental delta -- a project that runs `judge` in a loop submits
// many times, each reporting the same growing cumulative totals. Summing
// every row ever received (the original version of this query) massively
// over-counts as a result. Correct aggregation uses only the most recent
// snapshot per install_id.
export async function getAggregateStats(): Promise<AggregateStats> {
  const result = await getPool().query<{
    total_submissions: string;
    distinct_installs: string;
    total_archived: string;
    total_judged: string;
    total_eligible: string;
    total_filing_ready_projects: string;
  }>(
    `WITH latest AS (
      SELECT DISTINCT ON (install_id) *
      FROM stats_submissions
      ORDER BY install_id, submitted_at DESC
    )
    SELECT
      (SELECT COUNT(*) FROM stats_submissions)::text AS total_submissions,
      COUNT(*)::text AS distinct_installs,
      COALESCE(SUM(archived_count), 0)::text AS total_archived,
      COALESCE(SUM(judged_count), 0)::text AS total_judged,
      COALESCE(SUM(eligible_count), 0)::text AS total_eligible,
      COALESCE(SUM(filing_ready_project_count), 0)::text AS total_filing_ready_projects
    FROM latest`,
  );
  const row = result.rows[0];
  const totalJudged = Number(row?.total_judged ?? 0);
  const totalEligible = Number(row?.total_eligible ?? 0);

  return {
    totalSubmissions: Number(row?.total_submissions ?? 0),
    distinctInstalls: Number(row?.distinct_installs ?? 0),
    totalArchived: Number(row?.total_archived ?? 0),
    totalJudged,
    totalEligible,
    totalFilingReadyProjects: Number(row?.total_filing_ready_projects ?? 0),
    avgEligibleRatePct: totalJudged === 0 ? null : (totalEligible / totalJudged) * 100,
  };
}
