## Context

Rollup groups judgments into projects; report has to turn that into something a developer can actually paste into CRA Form T661 Part 2. T661 Part 2 has three separately word-limited lines, so the project schema needs to produce those three fields directly rather than have report re-split a single narrative after the fact.

## Goals / Non-Goals

**Goals:**
- Reshape rollup's output to the three CRA-line-mapped fields it's already implicitly reasoning about, without adding a new LLM-calling layer just to re-split prose.
- Make rollup's cost-gated call actually mean something by persisting its output — `report` reads a snapshot, it doesn't silently trigger a re-spend.
- Never silently misrepresent word counts or truncate content — trimming stays a human decision, Sreditor's job is to surface the real count honestly.

**Non-Goals:**
- No CSV/PDF output in this phase — deferred, not dropped.
- No `config` command for customizing word limits or output paths — CRA's limits are fixed inputs, not user preferences, and a fixed output filename is fine for v1.
- No automatic re-running of `rollup` from inside `report` — staleness is surfaced, not silently resolved.

## Decisions

- **Reshape `ProjectSchema` now rather than add a third LLM call at report time.** Rollup's system prompt already reasons in CRA three-part-test terms at the project level (that's the whole point of Layer 2); asking for three separate fields instead of one narrative blob doesn't add a new reasoning task, just makes an existing one's output shape more useful downstream. A third LLM call purely to re-split prose that already reasoned in three parts would be pure overhead.
- **Persist rollup output as an overwritten JSON snapshot, not JSON-lines.** Unlike `judgments.jsonl` (an append-only event log — every judgment is a discrete, timestamped, permanent record), a rollup is a recomputed view over whatever's currently judged. Each run supersedes the last; there's no append-only story here, so it doesn't belong in the existing JSON-lines helper.
- **Staleness is a warning, not a hard block.** A stale report is still meaningful — it reflects a real (if outdated) rollup — so `report` still renders it, just flags it clearly, consistent with the project's general stance of surfacing real state rather than blocking on it.
- **Word-limit checking is deterministic code, not another model call.** Word counting is exactly the kind of thing code does reliably and a model doesn't need to be trusted for — same reasoning already applied to computing project date ranges in Phase 4.

## Risks / Trade-offs

- Reshaping `ProjectSchema` is a breaking change to Phase 4's already-archived capability. Handled the same way Phase 2 and Phase 3 modified `cli-diagnostics`' `status` requirement — a `## MODIFIED Requirements` delta against the existing `rollup` capability, not a rewrite of history.
- A markdown-only report may still need manual reformatting to fit CRA's actual electronic filing interface. Accepted for v1 — "ready to paste" prose beats a polished but over-engineered PDF renderer nobody's asked for yet.
