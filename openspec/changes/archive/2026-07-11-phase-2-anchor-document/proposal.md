## Why

Sreditor's drift-auditing design (from the original design conversation) depends on a developer-authored "big picture" anchor document that later work can be compared against. Nothing can compare against a goal that was never written down, and nothing in the codebase today lets a developer create or evolve that document. This change adds it: an AI-assisted interview (`init`) that drafts the anchor from the developer's own answers, and an append-only revision command (`reflect`) for when understanding genuinely shifts.

## What Changes

- Add `sreditor init` — asks three fixed interview questions (what you're building, what's genuinely uncertain, what "solved" looks like), sends the raw answers to Claude to draft CRA-shaped phrasing, shows the developer the draft, and on confirmation writes the first revision of `.sreditor/anchor.md`.
- Add `sreditor reflect` — asks what changed and why, drafts a dated revision entry the same way, and appends it to the existing anchor document. Refuses to run if no anchor exists yet.
- `init` refuses to run if an anchor already exists (points the developer at `reflect` instead), enforcing append-only by construction rather than by convention.
- Update `sreditor status` to report real anchor state (last-revised date, revision count) instead of the current hardcoded "not found" placeholder.
- Introduces the project's first real Anthropic API calls: a small `src/llm/` module (client construction, structured-output drafting calls) that Phase 3's judgment engine will build directly on top of.

## Capabilities

### New Capabilities
- `anchor-document`: append-only, versioned "big picture" document — creation via `init`, revision via `reflect`, always developer-confirmed before being written, never silently modified by the AI.
- `llm-drafting`: the reusable pattern for turning a developer's raw interview answers into a structured, schema-validated AI-drafted artifact (model choice, prompt-building as pure functions, structured-output parsing) — this phase's concrete use is anchor drafting, but the pattern is what Phase 3's judgment calls reuse.

### Modified Capabilities
- `cli-diagnostics`: `status`'s existing "at-a-glance project status" requirement gains a real anchor-state field instead of the current placeholder string.

## Impact

- New `src/anchor.ts`, `src/interview.ts`, `src/llm/client.ts`, `src/llm/anchor.ts`, `src/commands/init.ts`, `src/commands/reflect.ts`.
- Modifies `src/commands/status.ts` and `src/index.ts` (command registration).
- New dependencies: `@anthropic-ai/sdk`, `zod`.
- `ANTHROPIC_API_KEY` becomes a real runtime requirement for two commands (already checked, but previously unused, by `doctor`).

## Technical Uncertainty

Two points carried genuine uncertainty here, not just undecided plumbing:
1. Whether a single fixed three-question interview, fed through one structured-output LLM call, produces anchor drafts that actually read as CRA-shaped "genuine uncertainty" language rather than generic project-description prose — this can't be fully resolved by design alone and is validated in this change's manual verification step against real interview answers, not assumed to work from the prompt design.
2. Whether enforcing "developer-authored, AI assists only in framing" is better done as a hard technical constraint (init refuses if an anchor exists; the AI is only ever invoked through the confirm-before-write flow, never given write access on its own) versus a policy documented in prose — resolved in favor of the hard constraint, since a policy that's only documented is exactly the kind of thing that erodes under time pressure.

Everything else in this change (readline prompt loop, file append logic, command wiring) is routine engineering with no real uncertainty and is not being claimed as such.
