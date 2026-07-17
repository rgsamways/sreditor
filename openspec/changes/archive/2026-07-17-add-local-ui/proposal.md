## Why

Right now the only way to review Sreditor's actual output is raw JSONL (`.sreditor/judgments.jsonl`), scrolling terminal text from `judge`, or a generated markdown/PDF report. There's no way to browse, filter, or click between judged changes and the rollup that groups them without either reading raw files or regenerating a static document. A small, local, interactive viewer would make the same data meaningfully easier to work with — without changing what data exists or how it's produced.

## What Changes

- New `sreditor ui` command that starts a small local HTTP server bound to `127.0.0.1` (never `0.0.0.0`, never internet-exposed) and opens a browser tab against it.
- The server only reads existing local files already on disk — `.sreditor/judgments.jsonl`, `.sreditor/rollup.json`, `.sreditor/anchor.md` — and serves them to the browser as read-only data. **No upload, no external hosting, no new remote data path of any kind.** This is a hard constraint, not just an implementation preference: it preserves the existing bring-your-own-key, nothing-to-trust-a-vendor-with trust model that the whole project is built on.
- Browser UI: a table of judged changes (filterable/sortable by eligible, confidence, proximity), a detail view per change showing the full judgment (uncertainty/investigation/advancement/reasoning/proximity/pathToEligibility/drift), and a rollup view showing filing-ready projects (with T661 line word counts vs. limits) separated from excluded/bookkeeping projects — reusing the same word-limit-checking and filing/excluded-split logic already built for `report.ts`, not reimplementing it.
- Read-only: this command does not add new LLM calls, does not change `judge`/`rollup`/`report`'s behavior, and cannot edit or re-run judgments from the browser in this first version.

## Capabilities

### New Capabilities
- `local-ui`: a `sreditor ui` command serving a localhost-only, read-only, interactive browser view over a project's existing judgment/rollup/anchor data.

### Modified Capabilities
(none — no existing capability's requirements change; `report.ts`'s existing logic is reused, not modified)

## Impact

- New command wired in `src/index.ts`.
- New `src/commands/ui.ts` (server bootstrap) and a small static frontend (plain HTML/CSS/JS, no build-time framework, consistent with this project's minimal-dependency stance so far — 4 runtime dependencies today, no existing web framework).
- New read-only JSON endpoints exposing the same data `judge`/`rollup`/`report` already read from disk — no new data, no new files written by this command.
- Reuses `checkWordLimits`, the CRA line labels, and the filing-ready/excluded split already in `src/report.ts`, factored so both the CLI `report` command and the new server can call the same logic rather than duplicating it.
- No change to any existing command's behavior or output.

## Technical Uncertainty

None. This is routine engineering: a static file server plus a few read-only JSON endpoints over data structures Sreditor already produces, using Node's built-in `http` module rather than a new dependency. No new technique, no unresolved technical question — assembling already-proven patterns (a local dev server, reusing existing report-rendering logic) in a new place is not technological uncertainty, consistent with how this project has judged its own equivalent build work throughout its history.
