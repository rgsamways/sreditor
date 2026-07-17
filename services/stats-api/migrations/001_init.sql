-- Sreditor usage-stats submissions. Every field is a count, a percentage, a
-- version string, or a random install id -- there is no column here capable
-- of holding a project name, a change id, or any reasoning text, matching the
-- allowlist enforced client-side in src/telemetry/schema.ts of the main
-- sreditor CLI package. Keep this file and that schema in sync.

CREATE TABLE IF NOT EXISTS stats_submissions (
  id                                          BIGSERIAL PRIMARY KEY,
  submitted_at                                TIMESTAMPTZ NOT NULL DEFAULT now(),
  install_id                                  UUID NOT NULL,
  sreditor_version                            TEXT NOT NULL,
  archived_count                              INTEGER NOT NULL,
  judged_count                                INTEGER NOT NULL,
  unjudged_count                              INTEGER NOT NULL,
  eligible_count                              INTEGER NOT NULL,
  proximity_close_count                       INTEGER NOT NULL,
  proximity_some_signal_count                 INTEGER NOT NULL,
  proximity_not_close_count                   INTEGER NOT NULL,
  confidence_high_count                       INTEGER NOT NULL,
  confidence_medium_count                     INTEGER NOT NULL,
  confidence_low_count                        INTEGER NOT NULL,
  filing_ready_project_count                  INTEGER NOT NULL,
  excluded_project_count                      INTEGER NOT NULL,
  avg_contributing_changes_per_filing_project  REAL,
  avg_word_utilization_uncertainty_pct        REAL,
  avg_word_utilization_investigation_pct      REAL,
  avg_word_utilization_advancement_pct        REAL
);

CREATE INDEX IF NOT EXISTS idx_stats_submissions_install_id ON stats_submissions (install_id);
CREATE INDEX IF NOT EXISTS idx_stats_submissions_submitted_at ON stats_submissions (submitted_at);
