## ADDED Requirements

### Requirement: Pre-flight readiness check
The CLI SHALL provide a `doctor` command that checks Node.js version, whether a source adapter is available, whether `ANTHROPIC_API_KEY` is set, and whether the local state directory is writable — without making any LLM call.

#### Scenario: Reporting missing prerequisites
- **WHEN** `sreditor doctor` runs in a project with no OpenSpec archive and no `ANTHROPIC_API_KEY` set
- **THEN** it prints a failing check for each condition and exits with a non-zero exit code

#### Scenario: Reporting a fully ready project
- **WHEN** `sreditor doctor` runs in a project with an OpenSpec archive present, `ANTHROPIC_API_KEY` set, and a writable state directory
- **THEN** it prints a passing check for each condition and exits with code 0

### Requirement: Archived change listing
The CLI SHALL provide a `scan` command that lists a project's archived OpenSpec changes by delegating to the source-adapter layer.

#### Scenario: Listing archived changes
- **WHEN** `sreditor scan` runs in a project with archived OpenSpec changes
- **THEN** it prints the total count and the id of each archived change

#### Scenario: No recognized source
- **WHEN** `sreditor scan` runs in a project with no OpenSpec archive
- **THEN** it prints an error explaining no archive was found and exits with a non-zero exit code

### Requirement: At-a-glance project status
The CLI SHALL provide a `status` command summarizing archived-change count, judged count, unjudged count, and anchor document state, without requiring any judgments to already exist.

#### Scenario: Status before any judgments exist
- **WHEN** `sreditor status` runs in a project with archived changes but no `judgments.jsonl` file yet
- **THEN** it reports the archived-change count, a judged count of zero, and the full archived-change count as unjudged
