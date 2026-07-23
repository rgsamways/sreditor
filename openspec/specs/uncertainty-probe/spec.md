# uncertainty-probe Specification

## Purpose
TBD - created by archiving change add-probe-command. Update Purpose after archive.
## Requirements
### Requirement: Optional pre-implementation interview
The system SHALL provide a `probe <change-id>` command that runs a Socratic interview over a draft (not yet archived) OpenSpec change's `proposal.md`, before the change is implemented or archived.

#### Scenario: Probing a draft change
- **WHEN** a developer runs `sreditor probe <change-id>` for a change that exists at `openspec/changes/<change-id>/` and has not yet been archived
- **THEN** the system asks a fixed set of Socratic questions via the interview loop and, on completion, offers to save a synthesized addendum

#### Scenario: Change does not exist or is already archived
- **WHEN** a developer runs `sreditor probe <change-id>` for a change id that has no draft directory at `openspec/changes/<change-id>/`
- **THEN** the system reports that no draft change was found with that id and takes no further action

### Requirement: Reflect only, never invent technical content
The interview and its LLM synthesis step SHALL only rephrase, organize, or ask follow-up questions about uncertainty, alternatives, or approaches the developer has themselves stated. The system SHALL NOT generate, suggest, or recommend a technical approach, technology, or alternative that the developer did not already name.

#### Scenario: Developer names no alternatives
- **WHEN** a developer's interview answers describe an approach with no stated alternatives or uncertainty
- **THEN** the synthesized addendum reflects that no alternatives or uncertainty were described, rather than inventing any

#### Scenario: Developer names specific alternatives
- **WHEN** a developer's interview answers name specific alternatives they are weighing
- **THEN** the synthesized addendum organizes and sharpens those same named alternatives and does not introduce any alternative the developer did not mention

### Requirement: Honest absence of uncertainty is a valid outcome
The system SHALL treat a developer's honest statement that there is no genuine technological uncertainty as a legitimate, complete outcome, and SHALL NOT alter the normal `propose` → `apply` → `archive` workflow as a result.

#### Scenario: Developer reports routine, well-understood work
- **WHEN** a developer's interview answers state they already know their planned approach will work
- **THEN** the synthesized addendum records this honestly as routine work with no genuine uncertainty found, and the change proceeds through `apply`/`archive` exactly as it would without probing

### Requirement: Addendum is appended to the change's own proposal
The system SHALL save the synthesized interview result as a clearly labeled section appended to the draft change's own `proposal.md`, rather than a separate file or a different artifact.

#### Scenario: Saving a probe result
- **WHEN** a developer confirms saving the synthesized addendum
- **THEN** a section labeled to identify it as probe-originated content is appended to `openspec/changes/<change-id>/proposal.md`

### Requirement: Probing is optional and never gates the workflow
The system SHALL NOT require a change to be probed before it can be implemented (`apply`) or archived (`archive`), and SHALL NOT alter the behavior of any existing command as a result of adding `probe`.

#### Scenario: Archiving an unprobed change
- **WHEN** a developer archives a change that was never probed
- **THEN** archiving succeeds exactly as it does today, with no warning or requirement related to probing

### Requirement: Re-probing an already-probed change requires confirmation
The system SHALL detect an existing probe addendum in a change's `proposal.md` and ask for confirmation before appending another, rather than silently duplicating or overwriting it.

#### Scenario: Running probe twice on the same change
- **WHEN** a developer runs `sreditor probe <change-id>` for a change that already has a probe addendum in its `proposal.md`
- **THEN** the system asks for confirmation before appending a new addendum, and does not overwrite or remove the prior one if the developer declines
