## ADDED Requirements

### Requirement: Export scope is explore engagement and anchor revisions only
The system SHALL include only explore-engagement history and anchor-document revision history in the exported artifact, and SHALL NOT include any judgment-log content (eligibility status, reasoning, uncertainty statements, or any other `judgments.jsonl`/`rollup.json` content).

#### Scenario: Exporting a project's profile
- **WHEN** a developer runs `sreditor profile export`
- **THEN** the resulting artifact contains only explore-engagement and anchor-revision data, with no eligibility or judgment content present anywhere in the file

### Requirement: No network call or auto-push
The system SHALL write the exported artifact only to local disk and SHALL NOT make any network request or push the artifact to any remote service as part of this command.

#### Scenario: Running the export command
- **WHEN** a developer runs `sreditor profile export`
- **THEN** the command writes a local file and performs no network activity

### Requirement: Both markdown and JSON output are supported
The system SHALL write a markdown artifact by default and SHALL write a JSON artifact instead when a `--json` flag is passed, both derived from the same underlying data.

#### Scenario: Default export
- **WHEN** a developer runs `sreditor profile export` with no flags
- **THEN** a markdown file is written

#### Scenario: JSON export
- **WHEN** a developer runs `sreditor profile export --json`
- **THEN** a JSON file is written containing the same explore-engagement and anchor-revision data as the markdown form would

### Requirement: Existing output file is not overwritten without confirmation
The system SHALL prompt for confirmation before overwriting a file already present at the target output path, unless a skip-confirmation flag is passed.

#### Scenario: Output path already exists
- **WHEN** a developer runs `sreditor profile export` and the target output file already exists
- **THEN** the system asks for confirmation before overwriting, and does not overwrite if declined

#### Scenario: Skipping confirmation
- **WHEN** a developer runs `sreditor profile export -y` (or equivalent) and the target output file already exists
- **THEN** the system overwrites it without prompting

### Requirement: Empty history renders explicitly, not silently
The system SHALL render an explicit "none yet" indication for either section (explore engagement, anchor revisions) when that data is absent, rather than omitting the section or producing an empty file.

#### Scenario: No explore engagement yet
- **WHEN** a developer exports a project with no `.sreditor/profile.json` or no explore-engagement entries
- **THEN** the artifact's explore-engagement section explicitly states none exist yet, rather than being blank or missing
