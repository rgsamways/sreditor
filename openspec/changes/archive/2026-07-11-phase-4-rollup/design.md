## Context

Layer 1 (`judge`) produces per-change judgments; CRA wants claims framed at the project level, and a change that's ineligible alone may still belong to an eligible project. Layer 2 (`rollup`) is the second, separate LLM call — over judgments, not raw files — that performs that grouping.

## Goals / Non-Goals

**Goals:**
- Deduplicate re-judged changes before grouping, so a change judged twice isn't double-counted or double-grouped.
- Keep project-level output in prose (narrative + confidence), consistent with the drift-auditing precedent of not reducing qualitative judgment to a score.
- Make the cost of the one command that can process the whole accumulated log visible before spending, not after.

**Non-Goals:**
- No `report` (Phase 5+) — rendering rollup output to markdown/PDF/CSV pre-trimmed to CRA Form T661 Part 2 limits is out of scope here.
- No new persistence format for rollup output — it's printed, not saved, in this phase.
- No corroborating-signal tooling (`sem`, `jscpd`, `scc`) — still parked, not v1.

## Decisions

- **Date range computed in code, not asked of the LLM.** The judgment log already carries exact `judgedAt` timestamps; asking the model to compute a date range from text it's shown is an unforced error opportunity for a value code can derive exactly. The LLM's job is deciding *which* changes group together (`contributingChangeIds`), not doing date arithmetic on them.
- **Rollup input includes ineligible changes.** Per the original design's own framing, filtering to only eligible changes before rollup would defeat the point — some of the most useful project-level reframing happens precisely when an ineligible-alone change turns out to be a supporting step in a genuinely eligible investigation.
- **Cost estimate uses standard Sonnet 5 pricing ($3/$15 per MTok), not the temporary introductory rate.** The introductory rate expires 2026-08-31; hardcoding it would make the estimate quietly wrong after that date for no benefit — a stable, slightly conservative estimate is preferable to a precise one that goes stale.
- **No new persistence format yet.** Deciding a concrete rollup-output file shape before `report` exists to consume it risks locking in the wrong shape for a consumer that doesn't exist yet. Printing to stdout keeps this phase's scope to grouping-and-estimating, not inventing a serialization format speculatively.

## Risks / Trade-offs

- Printing-only output means re-viewing a past rollup requires re-running it (and re-paying for it, modulo prompt caching). Accepted as the cost of not committing to an unvalidated persistence format; revisit when `report` is actually built.
- The cost estimate's output-side number is a ceiling (`max_tokens`-based), not a prediction of actual usage — real output is very likely to use meaningfully fewer tokens than the ceiling for a judgment log this size. This is disclosed as a ceiling, not presented as a precise forecast.
