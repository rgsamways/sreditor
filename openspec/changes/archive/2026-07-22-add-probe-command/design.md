## Context

Sreditor's only existing interview mechanism is `init` (`src/commands/init.ts`): a fixed three-question CLI interview (`src/interview.ts`, a thin `readline`-based `ask`/`confirm` loop), followed by a single LLM call (`draftAnchor` in `src/llm/anchor.ts`) that reframes the developer's raw answers into CRA-shaped fields without inventing content, then writes them to `.sreditor/anchor.md` via `createAnchor`/`appendRevision` (`src/anchor.ts`).

That mechanism operates once, at the project level, and writes to a project-level file outside any OpenSpec change. `probe` needs the same interview shape and the same "reflect, never invent" LLM constraint, but applied to a single change's own `proposal.md` — a file that lives at `openspec/changes/<id>/proposal.md` while still a draft, not yet under `openspec/changes/archive/<id>/`. The existing `openSpecAdapter` (`src/adapters/openspec.ts`) only enumerates *archived* changes (`listChanges` reads `openspec/changes/archive/`) — it has no notion of a draft, in-progress change, and by design (per its own interface comment, "Enumerate archived/completed change artifacts") it shouldn't be extended to do so, since that would blur the adapter's one clear job.

## Goals / Non-Goals

**Goals:**
- Reuse the existing interview loop and "reflect, never invent" LLM pattern exactly as proven in `init`, rather than building a new interview mechanism.
- Let a developer capture genuine technological uncertainty (or its honest absence) into a draft change's own `proposal.md`, before implementation, so it's present when `judge` reads that same file later.
- Keep it fully optional — no change to the `propose` → `apply` → `archive` loop's default behavior.

**Non-Goals:**
- Not a technical advisor. `probe` never proposes, generates, or ranks technical approaches — only asks about and reflects back what the developer already wrote or says.
- Not a gate. `probe` does not block `apply` or `archive`, and does not require a change to have been probed before archiving.
- Not a multi-turn open-ended conversation. Like `init`, this is a small, fixed set of questions plus one LLM synthesis call — not a dynamic back-and-forth.
- Not applicable to already-archived changes — `judge` already exists for those; `probe`'s value is specifically in being *before* implementation.

## Decisions

**A small new draft-change file helper, not an extension of `SourceAdapter`.** `probe` needs to read/write a single file at `openspec/changes/<id>/proposal.md` (draft, non-archived). Rather than extend `openSpecAdapter.listChanges` (archive-only by design) or the shared `SourceAdapter` interface (meant to stay tool-agnostic and read-only across future adapters), add one small, local helper — e.g. `draftProposalPath(cwd, changeId)` — used only by `probe`. Alternative considered: extend `SourceAdapter` with a `listDraftChanges`/write capability; rejected because it would force every future adapter (a hypothetical non-OpenSpec source) to define what a "draft" means and add write semantics to an interface that's read-only everywhere else for good reason.

**Fixed three-question interview, mirroring `init` exactly.** Reuse `startInterview()` unmodified. Questions:
1. "What approach are you planning to take here — do you already know it'll work, or is there something genuinely uncertain about it?"
2. "If there's something uncertain, what specifically don't you know, and what are the alternatives you're weighing?"
3. "What would you need to see or test to know which one's right?"
Alternative considered: a dynamic, adaptive interview that branches based on prior answers (e.g., only asks follow-ups if the first answer implies uncertainty). Rejected for v1: `init` already established that a fixed, small question set is enough to produce good raw material for the LLM synthesis step to work with, and a dynamic branching interview is meaningfully more complex to get right (state management, knowing when to stop) for a benefit that's unproven without seeing the fixed version used first.

**One LLM synthesis call, same shape as `draftAnchor`.** A new `src/llm/probe.ts` with a system prompt carrying the same explicit constraint already proven in `draftAnchor`'s `FRAMING_SYSTEM_PROMPT`: rephrase only, never invent, and reflect an honest "no genuine uncertainty" when that's what the answers show. Structured output via `zodOutputFormat`, same as every other LLM call in this codebase.

**Output is an appended section in the change's own `proposal.md`, not a new file.** E.g. `## Articulated Uncertainty (probe)\n\n<synthesized text>`. This keeps `judge`'s existing `formatArtifact`/prompt-building path working unmodified — the new section is just more proposal text it already reads. Alternative considered: write to a separate file (e.g. `probe.md`) alongside `proposal.md`. Rejected because it would require changing `judge`'s artifact-reading logic to also look for this new file, for no real benefit over appending to the file `judge` already reads in full.

**Re-running `probe` on an already-probed change.** If `## Articulated Uncertainty (probe)` already exists in the file, ask for confirmation before appending another revision (same pattern as `init`'s check for an existing anchor), rather than silently duplicating sections or silently overwriting the developer's prior answers.

## Risks / Trade-offs

- **Diminishing value if run late.** The whole premise is capturing uncertainty *before* implementation; if a developer runs `probe` right before `archive` (after the code already exists), the freshness benefit is mostly gone. Mitigation: a short printed reminder in the command's own output ("this is most valuable before you start implementing") — not a hard restriction, since Sreditor shouldn't police exactly when in the OpenSpec lifecycle a developer chooses to run it.
- **A developer could still describe manufactured uncertainty just to game eligibility later.** Mitigation: this is a pre-existing, general risk for any self-reported input, not specific to `probe` — the same trust model already applies to `init`'s anchor interview and to `proposal.md`/`design.md` themselves, and `judge`'s skeptical prompt is the actual backstop, unchanged by this feature.
- **Scope creep risk if the interview ever grows suggestion-generating logic later.** Mitigation: this is exactly why "never invent, only reflect" is written into the proposal and design as an explicit, load-bearing constraint now, not left as an implicit assumption to erode later.

## Open Questions

- Should `probe`'s appended section count toward `report`'s excluded/filing-ready split in any way, or is it purely upstream context for `judge`/`rollup` to read like any other proposal text? Leaning toward the latter (no special-casing) to keep this a documentation aid, not a new scoring input — worth confirming during `tasks`/implementation rather than blocking proposal on it.
