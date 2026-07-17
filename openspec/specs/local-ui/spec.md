# local-ui Specification

## Purpose
TBD - created by archiving change add-local-ui. Update Purpose after archive.
## Requirements
### Requirement: Local-only server
The system SHALL provide a `ui` command that starts an HTTP server bound only to `127.0.0.1`, never to `0.0.0.0` or any network-reachable interface, and SHALL NOT provide any way to upload files to a remote server as part of this feature.

#### Scenario: Starting the UI server
- **WHEN** a developer runs `sreditor ui` in a project with existing `.sreditor` data
- **THEN** the system starts a server bound to `127.0.0.1` on an available port and prints the local URL to the terminal

#### Scenario: No project data exists yet
- **WHEN** a developer runs `sreditor ui` in a project with no `.sreditor/judgments.jsonl`
- **THEN** the system still starts the server and the browser view shows an empty/no-data state rather than erroring

### Requirement: Read-only view of existing local data
The system SHALL serve only data already present in `.sreditor/judgments.jsonl`, `.sreditor/rollup.json`, and `.sreditor/anchor.md`, and SHALL NOT write, modify, or re-generate any of these files, and SHALL NOT trigger new LLM calls (`judge`, `drift`, `rollup`) as a result of any browser interaction in this version.

#### Scenario: Viewing judgment data
- **WHEN** a developer's browser requests the judgments view
- **THEN** the server returns the judgments currently on disk without modifying them

#### Scenario: Browser attempts an unsupported write action
- **WHEN** the browser UI does not offer any control that would re-run judgment or edit judgment text
- **THEN** no such control exists in this version, by design

### Requirement: Browsable, filterable judgment list
The system SHALL present judged changes in a list or table that can be filtered or sorted by eligibility, confidence, and proximity, and SHALL allow viewing a single change's full judgment detail (uncertaintyStatement, investigationSteps, advancement, reasoning, proximity, pathToEligibility, drift).

#### Scenario: Filtering by proximity
- **WHEN** a developer filters the judgment list by proximity value
- **THEN** only changes matching that proximity value are shown

#### Scenario: Viewing a single change's detail
- **WHEN** a developer selects a change from the list
- **THEN** the full judgment detail for that change is displayed

### Requirement: Rollup view reuses existing filing-ready/excluded logic
The system SHALL present the current rollup's filing-ready projects (with CRA line labels and word-limit checks) separated from excluded/bookkeeping projects, using the same word-limit-checking and filing/excluded-split logic already implemented for the `report` command rather than a separate reimplementation.

#### Scenario: Viewing the rollup
- **WHEN** a developer opens the rollup view and a rollup exists on disk
- **THEN** filing-ready projects are shown with their word counts against CRA line limits, and excluded projects are shown separately and clearly marked as not for filing

#### Scenario: No rollup exists yet
- **WHEN** a developer opens the rollup view and no `.sreditor/rollup.json` exists
- **THEN** the view shows a message indicating no rollup has been generated yet, rather than an error

