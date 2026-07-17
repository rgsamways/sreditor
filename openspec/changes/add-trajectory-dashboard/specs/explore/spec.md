## ADDED Requirements

### Requirement: Explore appends a local engagement entry after each run
The system SHALL, after successfully printing cards for a `sreditor explore` run, append one entry (timestamp, shown card ids, shown tags) to `.sreditor/profile.json`. This SHALL NOT affect `explore`'s printed output, its disclaimer, its source-citation behavior, or its isolation from `.sreditor/judgments.jsonl`, `.sreditor/rollup.json`, or `.sreditor/anchor.md`.

#### Scenario: Successful explore run
- **WHEN** `sreditor explore` successfully fetches and prints cards
- **THEN** exactly one new entry is appended to `.sreditor/profile.json` recording that run

#### Scenario: Failed explore run
- **WHEN** `sreditor explore` fails (network error, malformed response) before printing any cards
- **THEN** no entry is appended to `.sreditor/profile.json`
