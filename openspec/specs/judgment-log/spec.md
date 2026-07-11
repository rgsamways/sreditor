# judgment-log Specification

## Purpose
TBD - created by archiving change phase-1-foundations. Update Purpose after archive.
## Requirements
### Requirement: Append-only JSON-lines persistence
The system SHALL persist structured records as newline-delimited JSON (JSON-lines) so judgment history can be appended incrementally and inspected with plain text tools, without a database.

#### Scenario: Appending a record creates missing parent directories
- **WHEN** `appendJsonl` is called with a path whose parent directory does not exist
- **THEN** the directory is created and the record is written as one JSON line

#### Scenario: Reading a missing file
- **WHEN** `readJsonl` is called with a path that does not exist
- **THEN** it returns an empty array rather than throwing

#### Scenario: Round-tripping multiple records
- **WHEN** multiple records are appended to the same file
- **THEN** `readJsonl` returns them as an array in append order

