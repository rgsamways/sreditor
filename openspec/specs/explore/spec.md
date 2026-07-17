# explore Specification

## Purpose
TBD - created by archiving change add-explore-command. Update Purpose after archive.
## Requirements
### Requirement: Explore output is disclaimed and never eligibility guidance
The system SHALL print a non-suppressible disclaimer ("Exploration — not eligibility guidance") before any card content when `sreditor explore` runs, and every card SHALL describe the state of the field rather than a directive suggestion to the developer, with no directive verbs (e.g. "you should build") in card copy.

#### Scenario: Running explore
- **WHEN** a developer runs `sreditor explore`
- **THEN** the disclaimer is printed before any cards, and each printed card describes a field trend, not an instruction

### Requirement: Every card cites its source
The system SHALL include, for every card printed, a source URL and source type (arXiv, papers-with-code, GitHub trending, HN, or changelog) so a developer can verify the claim independently.

#### Scenario: Viewing a card
- **WHEN** a card is printed as part of `sreditor explore` output
- **THEN** it includes a source URL and a recognizable source type

### Requirement: Explore is structurally isolated from the judgment pipeline
The system SHALL NOT write explore output to `.sreditor/judgments.jsonl`, `.sreditor/rollup.json`, or `.sreditor/anchor.md`, and SHALL NOT pass explore output as context into `probe`, `judge`, or `rollup`. The `explore` command's module SHALL NOT import any module used to read or write the judgment pipeline's persisted state.

#### Scenario: Running explore then judge
- **WHEN** a developer runs `sreditor explore` and later runs `sreditor judge`
- **THEN** `judge`'s output and judgment log are unaffected by anything shown during the `explore` run

#### Scenario: Inspecting explore's dependencies
- **WHEN** `src/commands/explore.ts`'s imports are inspected
- **THEN** none of them resolve to `src/paths.ts`, `src/persistence/jsonl.ts`, `src/rollup.ts`, or `src/anchor.ts`

### Requirement: Explore degrades clearly on network failure
The system SHALL exit with a non-zero status and a single clear error message if the explore backend is unreachable, times out, or returns a malformed response, and SHALL NOT hang indefinitely or crash with an unhandled exception.

#### Scenario: Backend unreachable
- **WHEN** a developer runs `sreditor explore` and the explore-api backend cannot be reached
- **THEN** the command exits non-zero with a clear message, within a bounded timeout

#### Scenario: Backend returns malformed data
- **WHEN** the backend responds with a body that does not match the expected card shape
- **THEN** the command exits non-zero with a clear message rather than printing garbled output

