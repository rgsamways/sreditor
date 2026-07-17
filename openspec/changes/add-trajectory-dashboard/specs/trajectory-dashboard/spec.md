## ADDED Requirements

### Requirement: Local trajectory log is per-project and structurally separate from the judgment pipeline
The system SHALL persist explore-engagement history in `.sreditor/profile.json`, a file that `probe`, `judge`, and `rollup` SHALL NOT read or write, and the system SHALL NOT aggregate this data across projects.

#### Scenario: Judgment commands are unaffected
- **WHEN** `.sreditor/profile.json` exists with explore-engagement entries
- **THEN** `sreditor judge` and `sreditor rollup` produce identical output to a run where that file does not exist

#### Scenario: No cross-project aggregation
- **WHEN** a developer has multiple projects each with their own `.sreditor/profile.json`
- **THEN** the trajectory view for one project shows only that project's own data

### Requirement: Trajectory view combines explore engagement, anchor revisions, and judge/rollup history
The system SHALL provide a "Trajectory" view in `sreditor ui` presenting, in chronological order, explore-engagement entries from `.sreditor/profile.json`, anchor document revisions from `.sreditor/anchor.md`, and judged-change/rollup events already shown elsewhere in the UI.

#### Scenario: Viewing the trajectory
- **WHEN** a developer opens the Trajectory view and has explore-engagement history, anchor revisions, and judged changes
- **THEN** all three are shown together in one chronological timeline

#### Scenario: No data yet
- **WHEN** a developer opens the Trajectory view for a project with no `.sreditor/profile.json` and no anchor revisions
- **THEN** the view shows an empty/no-data state rather than an error, and still shows judge/rollup history if any exists

### Requirement: Anchor sections without a parseable date are shown without a timeline position
The system SHALL treat an anchor section whose heading does not match a dated-revision pattern as undated, and SHALL display it distinctly rather than assigning it an inferred or incorrect date.

#### Scenario: Initial anchor section
- **WHEN** the anchor document's initial (non-"Revision") section is included in the trajectory view
- **THEN** it is shown without a specific timeline date, rather than being sorted into the chronological sequence with a guessed date
