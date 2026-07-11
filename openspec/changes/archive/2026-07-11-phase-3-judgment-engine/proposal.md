## Why

Everything Sreditor exists to do — surface SR&ED-eligible work in near real-time, keep drift visible — has been scaffolding until now. This change adds the actual judgment engine: `sreditor judge`, which runs Sreditor's core CRA three-part-test prompt against archived changes, paired with the drift-auditing prompt already locked into the original design (compare each change against the anchor, in plain language, alongside every judgment) so that half of the design doesn't quietly slip in favor of the eligibility half alone.

## What Changes

- Add `sreditor judge [change-id]` — judges all currently-unjudged archived changes, or one specific change by id (re-judging it even if already judged, since the log is append-only).
- Add the Layer 1 CRA eligibility judgment call: structured output (`eligible`, `uncertaintyStatement`, `investigationSteps`, `advancement`, `confidence`, `reasoning`), skeptical-not-generous framing, `claude-sonnet-5` at `effort: "high"`.
- Add the drift-comparison call as a second, distinct prompt: compares the change against the current anchor and produces a plain-language narrative (not a score), `claude-sonnet-5` at `effort: "medium"`. Only runs when an anchor exists; recorded as unavailable otherwise. `judge` itself does not require an anchor to run — only the drift half is conditional.
- Persist combined judgment+drift records to `judgments.jsonl` via the existing JSON-lines helper.
- Fix `sreditor status`'s judged count to count distinct judged change ids rather than raw log line count, since `judge` can now legitimately write more than one record for the same change.

## Capabilities

### New Capabilities
- `judgment-engine`: the CRA three-part-test judgment call, its structured schema, and the selection logic for which archived changes still need judging.
- `drift-auditing`: the second, distinct LLM call that compares a change against the anchor document and produces a plain-language drift narrative.

### Modified Capabilities
- `cli-diagnostics`: `status`'s judged-count requirement changes from "count of judgment log lines" to "count of distinct judged change ids."

## Impact

- New `src/llm/judgment.ts`, `src/llm/drift.ts`, `src/commands/judge.ts`.
- Modifies `src/commands/status.ts`, `src/index.ts`.
- No new dependencies — reuses `@anthropic-ai/sdk`, `zod`, and the existing JSON-lines persistence from Phase 1.
- First real writes to `judgments.jsonl`.

## Technical Uncertainty

Two points here carried genuine uncertainty, resolved through this work rather than assumed:
1. Whether the CRA three-part test could be encoded as a single structured-output schema that reliably stays skeptical (routine engineering judged ineligible) rather than generous (ambition or difficulty alone read as uncertainty) — resolved through manual verification against a deliberately-mixed fixture set (one routine change, one genuinely uncertain change) before trusting the prompt, not assumed correct from the wording alone.
2. Whether drift-comparison could be kept genuinely separate from the eligibility judgment — a distinct prompt, distinct call, distinct output shape — without either call leaking bias into the other (e.g. a judgment call also nudging toward "this seems off-anchor, therefore less eligible") — resolved by keeping them as two independent API calls with no shared context beyond the same input artifact, matching the original design's explicit "second, distinct prompt" framing rather than merging them for efficiency.

Everything else (JSON-lines writing, command wiring, the distinct-id counting fix) is routine engineering with no real uncertainty and is not being claimed as such.
