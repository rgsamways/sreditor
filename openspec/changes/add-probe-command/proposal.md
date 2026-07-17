## Why

Every existing Sreditor command (`judge`, `drift`, `rollup`) looks backward at a change that's already been implemented and archived. That means the earliest a developer is ever asked to articulate technological uncertainty is after the work is done — later than the anchor interview (`init`, once per project) but still after the fact for any individual change. The whole thesis behind Sreditor is that contemporaneous documentation beats reconstruction; right now that thesis stops at the project level and doesn't reach the per-change level until the change is already archived. A developer drafting an OpenSpec proposal, right before implementation starts, is the one earlier moment where genuine uncertainty (if it exists) is freshest and most accurately nameable — this change adds a step there.

## What Changes

- New `sreditor probe <change-id>` command: runs an optional, opt-in Socratic AI interview over a draft (not-yet-archived) OpenSpec change's `proposal.md`, in the same interview style already used by `init`.
- The interview only asks questions and reflects back what the developer already wrote or says — it never suggests, generates, or recommends a technical approach the developer hasn't already named. This mirrors `init`'s existing "AI only assists in framing, never invents content" rule, applied per-change instead of once per project.
- If the developer's answers indicate no genuine uncertainty ("this is routine, I already know how to build it"), that is recorded as a legitimate, honest outcome — nothing is forced or manufactured.
- Output is appended as a new, clearly labeled section in the change's own `proposal.md` (e.g. "Articulated Uncertainty (probe)"), so it becomes part of the same artifact `judge` already reads later — no new file format or storage path.
- `probe` never blocks or gates the normal `propose` → `apply` → `archive` loop; running it is entirely optional, same as `init` is optional today.

### Capabilities

#### New Capabilities
- `uncertainty-probe`: an optional, pre-implementation Socratic interview over a draft change's proposal, producing a developer-authored addendum capturing genuine technological uncertainty (or the honest absence of it) before implementation begins.

#### Modified Capabilities
(none — this does not change the behavior of any existing capability's requirements)

## Impact

- New command wired in `src/index.ts`, new `src/commands/probe.ts`.
- New LLM interview prompt module, likely `src/llm/probe.ts`, following the existing pattern in `src/interview.ts` / `src/commands/init.ts` (reused interview loop, not a new mechanism).
- Reads/writes: appends a new section to an OpenSpec change's `proposal.md` before it is archived (via the existing OpenSpec adapter's file access, no new adapter capability required).
- No change to `judge`, `drift`, or `rollup` behavior — the appended section is just additional proposal text those commands already read as part of `formatArtifact`.

## Technical Uncertainty

None. This is routine engineering: it reuses the already-built and already-proven `init` interview mechanism (a real AI-assisted interview constrained by prompt instructions to never invent content, already validated in production use tonight) against a new artifact (a per-change proposal instead of the project-level anchor) and a new pipeline stage (before archive instead of at project start). No new technique, no unresolved technical question — assembling an already-working pattern in a new place is not technological uncertainty, consistent with how Sreditor has judged its own equivalent build work throughout this project's history.

## Articulated Uncertainty (probe)

**Uncertainty:** The developer states there is no genuine technological uncertainty here. The approach reuses an interview mechanism already proven to work elsewhere (init/draftAnchor), just pointed at a different target file (a per-change proposal.md instead of the project anchor). Since it's the same mechanism applied to a different file, the developer already knows it works.
**Alternatives considered:** The developer mentions one judgment call: where to put draft-change file handling — either a small new helper or extending the existing OpenSpec adapter. However, they note this was a design decision already made, not an open question being weighed.
**How to resolve:** The developer states there is nothing to test to resolve an unknown, since no real uncertainty exists. They plan only the normal build/typecheck/test/manual verification already planned for the change.
