## MODIFIED Requirements

### Requirement: Pre-flight readiness check
The CLI SHALL provide a `doctor` command that checks Node.js version, whether a source adapter is available, whether `ANTHROPIC_API_KEY` is set, and whether the local state directory is writable — without making any LLM call. It SHALL also report, informationally, whether each optional corroborating-signal tool (`scc`, `jscpd`, `sem`) is present, without affecting the command's overall pass/fail exit code.

#### Scenario: Reporting missing prerequisites
- **WHEN** `sreditor doctor` runs in a project with no OpenSpec archive and no `ANTHROPIC_API_KEY` set
- **THEN** it prints a failing check for each condition and exits with a non-zero exit code

#### Scenario: Reporting a fully ready project
- **WHEN** `sreditor doctor` runs in a project with an OpenSpec archive present, `ANTHROPIC_API_KEY` set, and a writable state directory
- **THEN** it prints a passing check for each condition and exits with code 0

#### Scenario: Optional corroborating-signal tools are absent
- **WHEN** `sreditor doctor` runs and none of `scc`/`jscpd`/`sem` are installed
- **THEN** it prints an informational (not failing) check for each with an install pointer, and the command's exit code is unaffected by their absence
