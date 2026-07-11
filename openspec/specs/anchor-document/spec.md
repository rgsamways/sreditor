# anchor-document Specification

## Purpose
TBD - created by archiving change phase-2-anchor-document. Update Purpose after archive.
## Requirements
### Requirement: AI-assisted anchor creation
The CLI SHALL provide an `init` command that interviews the developer with three fixed questions (what is being built, what is genuinely uncertain, what "solved" looks like), drafts a CRA-shaped anchor document from the raw answers via an LLM call, shows the draft to the developer, and writes it only on explicit confirmation.

#### Scenario: Creating the first anchor
- **WHEN** `sreditor init` runs in a project with no existing anchor document, the developer answers all three questions, and confirms the drafted anchor
- **THEN** `.sreditor/anchor.md` is created containing an `# Anchor:` header and one `## Revision <date> (original)` section

#### Scenario: Declining the draft
- **WHEN** `sreditor init` runs and the developer declines the drafted anchor at the confirmation step
- **THEN** no file is written

#### Scenario: Refusing to overwrite an existing anchor
- **WHEN** `sreditor init` runs in a project that already has `.sreditor/anchor.md`
- **THEN** it refuses to proceed and tells the developer to use `sreditor reflect` instead

### Requirement: Append-only revision
The CLI SHALL provide a `reflect` command that interviews the developer about what changed and why, drafts a dated revision entry via an LLM call, shows it for confirmation, and appends it to the existing anchor document without modifying any prior content.

#### Scenario: Appending a revision
- **WHEN** `sreditor reflect` runs in a project with an existing anchor document, the developer answers both questions, and confirms the drafted revision
- **THEN** a new dated `## Revision <date>` section is appended to `.sreditor/anchor.md` and all previously existing content in the file is byte-for-byte unchanged

#### Scenario: Refusing to run without an anchor
- **WHEN** `sreditor reflect` runs in a project with no `.sreditor/anchor.md`
- **THEN** it refuses to proceed and tells the developer to run `sreditor init` first

