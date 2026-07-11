## MODIFIED Requirements

### Requirement: CRA three-part-test judgment
The system SHALL judge an archived change's artifact text against the CRA three-part test (technological uncertainty, systematic investigation, technological advancement) via a single structured LLM call, applying a skeptical-not-generous standard that assumes routine engineering unless the text clearly shows genuine uncertainty resolved through structured investigation. The judgment call MAY include corroborating signals (from `scc`/`jscpd`/`sem`, when available) as explicitly non-authoritative context, but these signals SHALL NOT determine the `eligible` result directly.

#### Scenario: Judging a change with genuine technical uncertainty
- **WHEN** a change's proposal describes a documented technological uncertainty, an investigation process, and a resulting advancement
- **THEN** the judgment call returns a structured result with `eligible: true`, populated `uncertaintyStatement`/`investigationSteps`/`advancement` fields, a `confidence` level, and `reasoning`

#### Scenario: Judging a routine change
- **WHEN** a change's proposal describes ordinary feature implementation with no genuine technological uncertainty
- **THEN** the judgment call returns `eligible: false` rather than inferring uncertainty from ambition or difficulty alone

#### Scenario: Judging with no corroborating signals available
- **WHEN** no corroborating-signal tools are installed on the host
- **THEN** the judgment call proceeds exactly as it did before corroborating signals existed, with no degradation in judgment quality
