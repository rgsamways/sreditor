# corroborating-signals Specification

## Purpose
TBD - created by archiving change corroborating-signals. Update Purpose after archive.
## Requirements
### Requirement: Change-to-commit correlation
The system SHALL correlate an archived change to a git commit by locating the commit that added its archive folder, so corroborating-signal tools have a concrete diff to analyze.

#### Scenario: A change with a real archiving commit
- **WHEN** an archived change's folder was committed to git
- **THEN** the system resolves the exact commit SHA that added `openspec/changes/archive/<id>/`

#### Scenario: A change with no discoverable archiving commit
- **WHEN** an archived change has not yet been committed, or the correlation lookup otherwise fails
- **THEN** the system returns no commit rather than erroring, and corroborating signals are skipped for that change

### Requirement: Runtime tool detection and invocation
The system SHALL detect whether `scc`, `jscpd`, and `sem` are available on the host at judgment time, and SHALL invoke only the tools that are present — never as install-time dependencies of Sreditor itself.

#### Scenario: A tool is present
- **WHEN** a corroborating-signal tool is available on the host and the change has a resolvable commit
- **THEN** the system invokes it against the change's diff and includes its output as corroborating context

#### Scenario: A tool is absent
- **WHEN** a corroborating-signal tool is not available on the host
- **THEN** the system omits that signal silently, without error, and judgment proceeds exactly as it would if the tool did not exist

#### Scenario: A tool invocation fails
- **WHEN** an available tool errors, times out, or produces unparseable output
- **THEN** the system treats that signal as unavailable for this judgment rather than failing the judgment

### Requirement: Non-authoritative context only
The system SHALL present corroborating signals to the judgment prompt as explicitly non-authoritative context, and SHALL NOT allow them to determine the `eligible` result directly.

#### Scenario: Signals are present alongside a judgment
- **WHEN** one or more corroborating signals are successfully gathered for a change
- **THEN** the judgment prompt includes them in a block explicitly labeled as context only, separate from the change's own artifact text

