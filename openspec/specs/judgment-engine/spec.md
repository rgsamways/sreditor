# judgment-engine Specification

## Purpose
TBD - created by archiving change phase-3-judgment-engine. Update Purpose after archive.
## Requirements
### Requirement: CRA three-part-test judgment
The system SHALL judge an archived change's artifact text against the CRA three-part test (technological uncertainty, systematic investigation, technological advancement) via a single structured LLM call, applying a skeptical-not-generous standard that assumes routine engineering unless the text clearly shows genuine uncertainty resolved through structured investigation.

#### Scenario: Judging a change with genuine technical uncertainty
- **WHEN** a change's proposal describes a documented technological uncertainty, an investigation process, and a resulting advancement
- **THEN** the judgment call returns a structured result with `eligible: true`, populated `uncertaintyStatement`/`investigationSteps`/`advancement` fields, a `confidence` level, and `reasoning`

#### Scenario: Judging a routine change
- **WHEN** a change's proposal describes ordinary feature implementation with no genuine technological uncertainty
- **THEN** the judgment call returns `eligible: false` rather than inferring uncertainty from ambition or difficulty alone

### Requirement: Judge command with selective re-judgment
The CLI SHALL provide a `judge` command that judges all currently-unjudged archived changes by default, or one specific change by id (re-judging it even if already judged).

#### Scenario: Judging all unjudged changes
- **WHEN** `sreditor judge` runs with no arguments in a project with some judged and some unjudged archived changes
- **THEN** it judges only the changes not already present in the judgment log, appending one record per change

#### Scenario: Re-judging a specific change by id
- **WHEN** `sreditor judge <change-id>` runs for a change that has already been judged
- **THEN** it judges that change again and appends a new record, without erroring or skipping

#### Scenario: Judging an unknown change id
- **WHEN** `sreditor judge <change-id>` runs with an id that does not match any archived change
- **THEN** it reports a clear error and exits with a non-zero exit code

#### Scenario: Running without an OpenSpec archive
- **WHEN** `sreditor judge` runs in a project with no OpenSpec archive
- **THEN** it reports a clear error and exits with a non-zero exit code, the same as `scan`

### Requirement: Judgment persistence
The system SHALL append each judgment (eligibility fields plus drift result) as one record to the existing JSON-lines judgment log.

#### Scenario: Appending a judgment record
- **WHEN** a change is judged
- **THEN** a record containing the change id, judgment timestamp, all eligibility fields, and the drift result (narrative or null) is appended to `judgments.jsonl`

