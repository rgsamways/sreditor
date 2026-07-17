# usage-stats-opt-in Specification

## Purpose
TBD - created by archiving change add-usage-stats-opt-in. Update Purpose after archive.
## Requirements
### Requirement: Opt-in is off by default and toggleable at any time
The system SHALL default to not sharing any usage statistics unless a developer explicitly runs `sreditor stats on`, and SHALL stop sharing immediately when `sreditor stats off` is run, with no delay or pending-submission window.

#### Scenario: Fresh install has never opted in
- **WHEN** a developer has never run `sreditor stats on`
- **THEN** no statistics are ever submitted, regardless of how many times `judge` or `rollup` run

#### Scenario: Opting out takes effect immediately
- **WHEN** a developer who previously ran `sreditor stats on` runs `sreditor stats off`
- **THEN** the next `judge` or `rollup` run does not submit anything

### Requirement: The exact payload is inspectable before opting in
The system SHALL provide a `sreditor stats show` command that prints the literal JSON payload that would be submitted, computed from the developer's real current local data, without submitting it or requiring opt-in first.

#### Scenario: Inspecting before deciding
- **WHEN** a developer runs `sreditor stats show` without ever having opted in
- **THEN** the command prints the real computed payload and confirms nothing was sent

### Requirement: Payload is a structurally-enforced allowlist of numeric aggregates only
The system SHALL restrict the submitted payload to numeric counts and percentages, a locally-generated random install id, and the installed version string. The system SHALL NOT include any project name, file path, change id, reasoning text, or other free-text content in the payload, and this restriction SHALL be enforced by the payload's schema itself, not only by code review or documentation.

#### Scenario: Payload contains only allowlisted fields
- **WHEN** a payload is constructed for submission or for `stats show`
- **THEN** every field in it is one of: a count, a percentage, the install id, or the version string

#### Scenario: A future change accidentally introduces a free-text field
- **WHEN** code is modified to attempt adding a string field (e.g. a project name) to the payload type
- **THEN** it fails to satisfy the payload's schema type, rather than silently being included

### Requirement: Submission never blocks or affects the outcome of the command that triggers it
The system SHALL submit statistics, when opted in, as a non-blocking side effect of `judge` or `rollup` completing their existing work, and a submission failure of any kind (network error, timeout, non-2xx response) SHALL NOT change that command's exit code, output, or noticeably affect its running time.

#### Scenario: Stats endpoint is unreachable
- **WHEN** the stats endpoint cannot be reached (DNS failure, connection refused, or timeout)
- **THEN** `judge` or `rollup` still completes normally and reports success or failure based only on its own actual work

### Requirement: Install id is stable and not derived from identifying information
The system SHALL generate a random install id the first time a developer opts in, persist it locally, and reuse the same id for all future submissions from that project, without deriving it from any project name, path, or other identifying value.

#### Scenario: Repeated opt-ins reuse the same id
- **WHEN** a developer opts in, later opts out, and later opts back in again on the same project
- **THEN** the same install id already generated the first time is reused, not regenerated

