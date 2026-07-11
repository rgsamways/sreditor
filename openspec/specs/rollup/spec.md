# rollup Specification

## Purpose
TBD - created by archiving change phase-4-rollup. Update Purpose after archive.
## Requirements
### Requirement: Judgment deduplication before grouping
The system SHALL deduplicate the judgment log to the latest record per change id before grouping, since a change may have been judged more than once.

#### Scenario: A re-judged change is counted once
- **WHEN** the judgment log contains two records sharing the same change id
- **THEN** rollup's grouping input contains only the most recent of the two records for that change id

### Requirement: CRA-shaped project grouping
The system SHALL provide a `rollup` command that groups the deduplicated judgment log into CRA-shaped projects via a structured LLM call, where a change judged ineligible in isolation may still be included in a project if the surrounding changes show it was one step in a longer investigation.

#### Scenario: Grouping a judged log into projects
- **WHEN** `sreditor rollup` runs against a judgment log with multiple judged changes
- **THEN** it prints one or more projects, each with a name, a computed date range, its contributing change ids, a combined narrative, and a confidence level

#### Scenario: No judged changes yet
- **WHEN** `sreditor rollup` runs against an empty or nonexistent judgment log
- **THEN** it reports that there are no judged changes yet and directs the developer to run `sreditor judge`, without making any LLM call

#### Scenario: Archived changes exist that have not been judged
- **WHEN** `sreditor rollup` runs in a project where the OpenSpec archive contains changes not present in the judgment log
- **THEN** it prints an explicit note listing those changes as not yet judged, rather than silently omitting them

### Requirement: Computed project date range
The system SHALL compute each project's date range from the actual `judgedAt` timestamps of its contributing change records, not ask the LLM to state it.

#### Scenario: Date range reflects real judgment timestamps
- **WHEN** a project's contributing changes were judged on different dates
- **THEN** the printed date range spans the earliest and latest `judgedAt` timestamps among exactly those contributing changes

### Requirement: Pre-call cost estimate
The system SHALL estimate token cost via the Anthropic token-counting endpoint before making the rollup call, and SHALL require developer confirmation before proceeding unless explicitly skipped.

#### Scenario: Estimate shown before the call
- **WHEN** `sreditor rollup` runs without `--yes`
- **THEN** it prints an input-cost estimate and an output-cost ceiling before prompting the developer to confirm, and makes no LLM call until confirmed

#### Scenario: Declining the estimate
- **WHEN** the developer declines the cost-estimate confirmation
- **THEN** no rollup LLM call is made and no output is produced

#### Scenario: Skipping confirmation
- **WHEN** `sreditor rollup --yes` runs
- **THEN** it proceeds directly to the rollup call without prompting for confirmation

