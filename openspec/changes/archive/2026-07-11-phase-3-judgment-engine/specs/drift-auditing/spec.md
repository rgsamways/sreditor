## ADDED Requirements

### Requirement: Drift comparison against the anchor
The system SHALL run a second, distinct LLM call alongside every judgment that compares the change against the current anchor document and produces a plain-language narrative describing whether the change still serves the anchor's stated goal, rather than a numeric or categorical alignment score.

#### Scenario: Judging a change that stays on scope
- **WHEN** a change is judged in a project with an existing anchor document, and the change clearly serves the anchor's stated goal
- **THEN** the judgment record's drift field contains a narrative stating the change is consistent with the anchor

#### Scenario: Judging a change that has drifted
- **WHEN** a change is judged in a project with an existing anchor document, and the change is unrelated to the anchor's stated goal
- **THEN** the judgment record's drift field contains a narrative describing what the original goal was and how this change diverges from it, in plain language rather than a score

#### Scenario: Judging without an anchor document
- **WHEN** a change is judged in a project with no anchor document yet
- **THEN** the judgment still completes (eligibility is judged normally), and the drift field records that drift comparison was not available, rather than blocking the judgment
