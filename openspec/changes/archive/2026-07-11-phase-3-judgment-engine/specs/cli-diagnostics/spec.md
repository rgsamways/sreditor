## MODIFIED Requirements

### Requirement: At-a-glance project status
The CLI SHALL provide a `status` command summarizing archived-change count, judged count (counted as distinct judged change ids, not raw judgment log entries), unjudged count, and anchor document state, without requiring any judgments to already exist.

#### Scenario: Status before any judgments exist
- **WHEN** `sreditor status` runs in a project with archived changes but no `judgments.jsonl` file yet
- **THEN** it reports the archived-change count, a judged count of zero, and the full archived-change count as unjudged

#### Scenario: Status after a change has been re-judged
- **WHEN** `sreditor status` runs in a project where one change has been judged twice (two records in `judgments.jsonl` sharing the same change id)
- **THEN** it reports a judged count of one distinct change, not two records

#### Scenario: Status with no anchor document yet
- **WHEN** `sreditor status` runs in a project where `sreditor init` has not been run
- **THEN** it reports the anchor document as not found

#### Scenario: Status with an existing anchor document
- **WHEN** `sreditor status` runs in a project with a `.sreditor/anchor.md` containing one or more revisions
- **THEN** it reports the most recent revision date and the total revision count
