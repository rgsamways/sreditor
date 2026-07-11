# llm-drafting Specification

## Purpose
TBD - created by archiving change phase-2-anchor-document. Update Purpose after archive.
## Requirements
### Requirement: Structured, schema-validated LLM drafting calls
The system SHALL turn a developer's raw interview answers into a structured, schema-validated draft via a single LLM call per drafting operation, with prompt construction kept as pure functions separate from the network call.

#### Scenario: Drafting an anchor from interview answers
- **WHEN** `draftAnchor` is called with the three interview answers
- **THEN** it returns a parsed object matching the anchor draft schema (goal, uncertainty, success criteria), not freeform text

#### Scenario: Drafting a revision from reflect answers
- **WHEN** `draftReflection` is called with the existing anchor text and the two reflect answers
- **THEN** it returns a parsed object matching the reflection draft schema (what changed, why), not freeform text

#### Scenario: Prompt construction is independently testable
- **WHEN** `buildAnchorPrompt` or `buildReflectionPrompt` is called directly
- **THEN** it returns the prompt text/messages without making any network call

