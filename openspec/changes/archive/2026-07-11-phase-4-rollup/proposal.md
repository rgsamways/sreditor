## Why

Individual Layer 1 judgments are not the level CRA wants a claim framed at — a claim is filed as a coherent "project," and a change that looks routine in isolation may only make sense as part of a project once surrounding changes show it was one step in a longer investigation. This change adds Layer 2: `sreditor rollup`, a second, separate LLM call that groups the accumulated judgment log into CRA-shaped projects, gated behind a real pre-call cost estimate since it's the first command that can process the whole accumulated log in one large call.

## What Changes

- Add `sreditor rollup [-y|--yes]` — reads the deduplicated judgment log (latest record per change id, since `judge` allows re-judging), groups it into projects via a structured LLM call, and prints each project's name, computed date range, contributing change ids, combined narrative, and confidence.
- Add a pre-call cost estimate via `client.messages.countTokens()`, shown before the actual rollup call runs, with a confirm gate (skippable via `-y`/`--yes`).
- Cross-reference against the OpenSpec archive (when available) and explicitly note any archived changes that haven't been judged yet, rather than silently omitting them from consideration.
- No new persistence format — rollup output is printed, not written to a new file, since `report` (a later phase) is the point a concrete output format actually has a consumer.

## Capabilities

### New Capabilities
- `rollup`: the Layer 2 grouping call, its structured schema, the judgment-log deduplication/unjudged-detection logic, and the pre-call cost estimate.

### Modified Capabilities
(none — `judge`, `status`, `scan`, `doctor` are unaffected)

## Impact

- New `src/rollup.ts`, `src/llm/rollup.ts`, `src/commands/rollup.ts`.
- Modifies `src/index.ts` (command registration).
- No new dependencies — reuses `@anthropic-ai/sdk`, `zod`, the existing JSON-lines persistence, and the existing `confirm()` interview primitive.

## Technical Uncertainty

One point here carried genuine uncertainty, resolved through this work rather than assumed:
- Whether project-level grouping could be kept honest about aggregation (a change ineligible alone may still belong in an eligible project) without either losing that nuance or overclaiming eligibility for the whole project — resolved by having the LLM group and narrate in prose (matching the drift-auditing precedent from Phase 3: no numeric/categorical score standing in for the reasoning) and verifying the actual output against a real, hand-checkable calibration set (Sreditor's own three-phase judgment log) rather than trusting the prompt's wording alone.

Everything else (token counting, cost arithmetic, deduplication logic, command wiring) is routine engineering with no real uncertainty and is not being claimed as such.
