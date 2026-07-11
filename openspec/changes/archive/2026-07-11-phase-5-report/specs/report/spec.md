## ADDED Requirements

### Requirement: T661-structured report rendering
The system SHALL provide a `report` command that reads the persisted rollup output and renders one markdown section per project, structured around CRA Form T661 Part 2's line numbers (242 uncertainty, 244 investigation, 246 advancement), ready to copy directly into the form.

#### Scenario: Rendering a report from a saved rollup
- **WHEN** `sreditor report` runs after a successful `sreditor rollup`
- **THEN** it writes a markdown file containing one section per project with its Line 242/244/246 content, and prints the file path to the console

#### Scenario: No rollup output exists yet
- **WHEN** `sreditor report` runs with no `.sreditor/rollup.json` present
- **THEN** it reports a clear error directing the developer to run `sreditor rollup` first, and writes no file

### Requirement: Word-limit checking
The system SHALL compute an authoritative word count for each project's uncertainty, investigation, and advancement fields and compare it against CRA's stated limits (350/700/350), never relying on the model's own stated count and never silently truncating content that exceeds a limit.

#### Scenario: A field within its limit
- **WHEN** a project's field word count is at or under its CRA limit
- **THEN** the rendered report shows the field's real word count against its limit without a warning

#### Scenario: A field over its limit
- **WHEN** a project's field word count exceeds its CRA limit
- **THEN** the rendered report shows the field's full, untruncated content along with an explicit over-limit warning

### Requirement: Staleness detection
The system SHALL detect when the persisted rollup output no longer reflects the current judgment log and warn the developer rather than silently rendering an out-of-date report.

#### Scenario: Judgment log has changed since the last rollup
- **WHEN** `sreditor report` runs after changes have been judged or re-judged since `.sreditor/rollup.json` was last generated
- **THEN** it prints a staleness warning directing the developer to re-run `sreditor rollup`, and still renders the report from the existing (stale) data

#### Scenario: Judgment log matches the persisted rollup
- **WHEN** `sreditor report` runs and the current judgment log's change ids match exactly what the persisted rollup covered
- **THEN** no staleness warning is printed
