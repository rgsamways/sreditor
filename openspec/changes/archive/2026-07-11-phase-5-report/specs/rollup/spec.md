## MODIFIED Requirements

### Requirement: CRA-shaped project grouping
The system SHALL provide a `rollup` command that groups the deduplicated judgment log into CRA-shaped projects via a structured LLM call, where a change judged ineligible in isolation may still be included in a project if the surrounding changes show it was one step in a longer investigation. Each project's eligibility narrative SHALL be produced as three separate fields — uncertainty, investigation, advancement — mirroring CRA Form T661 Part 2's line structure, rather than a single combined narrative.

#### Scenario: Grouping a judged log into projects
- **WHEN** `sreditor rollup` runs against a judgment log with multiple judged changes
- **THEN** it prints one or more projects, each with a name, a computed date range, its contributing change ids, separate uncertainty/investigation/advancement fields, and a confidence level

#### Scenario: No judged changes yet
- **WHEN** `sreditor rollup` runs against an empty or nonexistent judgment log
- **THEN** it reports that there are no judged changes yet and directs the developer to run `sreditor judge`, without making any LLM call

#### Scenario: Archived changes exist that have not been judged
- **WHEN** `sreditor rollup` runs in a project where the OpenSpec archive contains changes not present in the judgment log
- **THEN** it prints an explicit note listing those changes as not yet judged, rather than silently omitting them

## ADDED Requirements

### Requirement: Rollup output persistence
The system SHALL persist a successful rollup's output (generation timestamp and all projects) to disk as a single overwritten snapshot, rather than printing only.

#### Scenario: Output is saved after a confirmed run
- **WHEN** `sreditor rollup` completes a confirmed run
- **THEN** the resulting projects and a generation timestamp are written to `.sreditor/rollup.json`, overwriting any previous contents

#### Scenario: Declined run does not persist anything
- **WHEN** the developer declines the cost-estimate confirmation
- **THEN** `.sreditor/rollup.json` is left unchanged
