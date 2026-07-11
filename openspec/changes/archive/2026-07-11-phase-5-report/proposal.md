## Why

Rollup groups judgments into CRA-shaped projects, but nothing yet renders that into the concrete format a developer would actually file: CRA Form T661 Part 2's three word-limited narrative lines (uncertainty ≤350 words, work performed ≤700, advancement ≤350). This change adds `sreditor report`, closes the persistence question Phase 4 deliberately deferred (rollup output was print-only), and reshapes rollup's project schema so it produces T661-line-mapped fields directly instead of one blob of prose that would need re-splitting later.

## What Changes

- `rollup`'s `ProjectSchema` changes from `{ name, contributingChangeIds, narrative, confidence }` to `{ name, contributingChangeIds, uncertainty, investigation, advancement, confidence }` — the same three-part shape Layer 1 judgments already use, made explicit at the project level.
- `rollup` now persists its output to `.sreditor/rollup.json` (a plain, overwritten JSON snapshot, not an append-only log) after a confirmed run, instead of printing only.
- Add `sreditor report` — reads the persisted rollup output, checks it for staleness against the current judgment log, computes real word counts per field against CRA's limits (never trusting the model's own count, never silently truncating an over-limit field), and writes a markdown file with one section per project structured around CRA's own line numbers (242/244/246), ready to copy directly into the form.
- Markdown only in this phase; CSV/PDF explicitly deferred, not silently dropped.

## Capabilities

### New Capabilities
- `report`: word-limit checking, staleness detection, and T661-line-structured markdown rendering.

### Modified Capabilities
- `rollup`: project schema reshaped to three CRA-line-mapped fields instead of one narrative; output is now persisted to disk, not print-only.

## Impact

- New `src/report.ts`, `src/commands/report.ts`.
- Modifies `src/llm/rollup.ts` (schema + system prompt), `src/rollup.ts` (persistence + staleness helpers), `src/commands/rollup.ts` (save + updated display), `src/index.ts`, `.gitignore`.
- No new dependencies.

## Technical Uncertainty

None claimed for this change, consistent with the honest self-judgment pattern established across every prior phase of this project's own archive. Reshaping an output schema to make already-present reasoning explicit, computing word counts, detecting staleness by set comparison, and rendering markdown are all routine engineering with well-established solutions — none of it involved technological uncertainty a competent developer couldn't resolve through standard practice. The one genuinely open question — whether the model reliably stays close enough to the stated word targets to be practically useful without heavy manual editing — is a prompt-tuning/UX concern to be verified empirically in this change's manual verification step, not a claim of SR&ED-caliber uncertainty.
