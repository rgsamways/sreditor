## ADDED Requirements

### Requirement: Tool-agnostic change enumeration
The system SHALL provide a `SourceAdapter` interface for enumerating a project's structured change artifacts, so judgment and rollup logic never depends on a specific spec-driven-development tool's file layout.

#### Scenario: Detecting an OpenSpec-based project
- **WHEN** the OpenSpec adapter's `isAvailable` is called with a project root containing `openspec/changes/archive/`
- **THEN** it returns `true`

#### Scenario: Detecting a project with no recognized source
- **WHEN** the OpenSpec adapter's `isAvailable` is called with a project root that has no `openspec/changes/archive/` directory
- **THEN** it returns `false`

### Requirement: Archived change listing with raw artifact content
The OpenSpec adapter SHALL enumerate each archived change directory and load its known artifact files as raw text, without parsing or interpreting their contents.

#### Scenario: Listing archived changes with their artifact files
- **WHEN** `listChanges` is called against a project root with one archived change directory containing `proposal.md` and `tasks.md`
- **THEN** it returns one `ChangeArtifact` whose `files` map contains `"proposal.md"` and `"tasks.md"` keyed to their raw text content

#### Scenario: Missing archive directory
- **WHEN** `listChanges` is called against a project root with no `openspec/changes/archive/` directory
- **THEN** it returns an empty array rather than throwing
