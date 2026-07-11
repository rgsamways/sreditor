## Context

Sreditor's whole value proposition rests on the CRA three-part-test judgment being applied skeptically and the drift-comparison half not being quietly dropped in favor of the eligibility half alone — both were explicitly locked into the original design session, and a later handoff note flagged the risk of the drift half slipping if not built alongside the judgment call from day one.

## Goals / Non-Goals

**Goals:**
- Ship both halves of the two-layer design together: CRA eligibility judgment and drift-comparison, as two distinct LLM calls, in this one change.
- Keep the judgment call skeptical by construction (explicit prompt framing, verified against a deliberately mixed fixture set), not just by wording.
- Keep `judge` usable before an anchor exists, since eligibility judgment doesn't structurally depend on one.

**Non-Goals:**
- No `rollup`/`report` (Phase 4+) — grouping judgments into CRA-shaped "projects" and rendering them is out of scope here.
- No cost-estimate/confirmation gate before running `judge` — that idea is explicitly scoped to `rollup` time in the docs, not `judge`.
- No corroborating-signal tooling (`sem`, `jscpd`, `scc`) — parked per the handoff note, not v1.
- No `--force` flag semantics beyond "explicit id always re-judges" — no bulk re-judge-all-already-judged mode in this phase.

## Decisions

- **Two separate API calls, not one combined schema.** The original design explicitly frames drift-comparison as "a second, distinct prompt" alongside Layer 1 judgment. Combining them into one call risks the eligibility judgment being subtly influenced by drift context (e.g. "this seems off-anchor, so maybe less eligible") — a real risk given both would share context in a single prompt. Kept fully separate at the cost of two round-trips per change.
- **`claude-sonnet-5` for both calls, at different effort levels** (`high` for judgment, `medium` for drift) — confirmed with Robin. Judgment is the more consequential, harder-reasoning task; drift-comparison is a lighter comparative read against existing text. Neither call defaults to Opus, keeping the free/BYOK/accessible cost floor intact.
- **`judge` does not require an anchor.** Only drift-comparison is conditional on one existing; eligibility judgment runs regardless. Confirmed with Robin as the more structurally honest option over blanket-refusing the whole command.
- **Explicit-id re-judgment is always allowed, default-run skips already-judged.** Matches the append-only ethos already established by `reflect` — history is additive, never destructive, and JSON-lines naturally supports multiple records per change id without special-casing.
- **`status`'s judged count moves from raw log-line count to distinct change-id count.** This was a latent inaccuracy from Phase 1 (harmless when nothing had ever written real judgment data) that becomes a real correctness bug now that `judge` can legitimately write more than one record for the same change.

## Risks / Trade-offs

- Two LLM calls per judged change roughly doubles token cost per change compared to a single combined call. Accepted as the direct cost of keeping the two judgments independent, consistent with the project's cost-transparency ethos (the cost is visible per-change in `judge`'s output, not hidden).
- No automated verification exists yet that the judgment prompt reliably stays skeptical across a broad range of real-world change text — this phase's verification step (mixed fixture set: one routine change, one genuinely uncertain one) is a spot-check, not a calibration suite. A larger calibration pass against real archived Farpost changes is noted in the original docs as future work, not repeated here.
