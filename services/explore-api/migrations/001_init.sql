-- Explore card corpus. Every column describes a field-trend theme and its
-- source -- there is no column here capable of holding a project name, a
-- change id, a developer identity, or any judgment-log content, matching the
-- structural-isolation requirement carried over from the concept doc.

CREATE TABLE IF NOT EXISTS explore_cards (
  id                    TEXT PRIMARY KEY,
  tag                   TEXT NOT NULL,
  title                 TEXT NOT NULL,
  summary               TEXT NOT NULL,
  source_url            TEXT NOT NULL,
  source_type           TEXT NOT NULL,
  buzzy_unsolved_score  REAL NOT NULL,
  clustered_at          TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_explore_cards_tag ON explore_cards (tag);
CREATE INDEX IF NOT EXISTS idx_explore_cards_clustered_at ON explore_cards (clustered_at);
