## Why

`add-trajectory-dashboard` gives a developer a local, in-browser view of their own explore-engagement and anchor-revision history, but that view is trapped in `sreditor ui` — there's no way to take it anywhere else (a personal site, a career-log repo, a Drive folder). A developer-initiated, portable export is the natural next step: Sreditor's job stops at producing an artifact the developer owns and controls, with no auto-push anywhere.

## What Changes

- New `sreditor profile export` command: reads one project's local trajectory data — explore-engagement history (`.sreditor/profile.json`) and anchor-document revision history (`.sreditor/anchor.md`, via `parseAnchorRevisions` from `add-trajectory-dashboard`) — and writes a portable artifact to disk (markdown by default, optionally JSON via a flag).
- Scope is deliberately narrower than the dashboard's own Trajectory view: **explore engagement + anchor revisions only, no judgment-log summary.** This is a settled decision, not a default — the concept doc flagged judgment-log content as more resume-compelling but the first point where that content would cross into a different-purpose document; this change keeps that line clean rather than deciding it implicitly by inclusion.
- Sreditor's involvement ends at writing the file. No upload, no network call, no auto-push to any service — the developer decides what to do with the exported file next.
- Output path is developer-specified (default: a file in the project root, e.g. `sreditor-profile.md`), never overwritten silently without confirmation if it already exists.

## Capabilities

### New Capabilities
- `profile-export`: a `sreditor profile export` command producing a portable markdown/JSON artifact from a project's local explore-engagement and anchor-revision history, with no network or auto-push behavior of any kind.

### Modified Capabilities
(none — this only reads data already produced by `explore` and `add-trajectory-dashboard`'s local log/anchor parsing; no existing capability's requirements change)

## Impact

- New `src/commands/profileExport.ts`, wired into `src/index.ts` as `profile export` (a `profile` command group, mirroring the existing `stats <on|off|show>` subcommand-group pattern).
- Reuses `readProfileLog` (`src/profileLog.ts`) and `parseAnchorRevisions`/`readAnchor` (`src/anchor.ts`), both from `add-trajectory-dashboard` — no new data-reading logic, only new rendering.
- New rendering functions: `renderProfileMarkdown(...)` and `renderProfileJson(...)`, likely in a small new `src/profileExport.ts` module (command file stays thin, following the existing `src/report.ts` / `src/commands/report.ts` split).
- No changes to `probe`, `judge`, `rollup`, `report`, `explore`, or the `ui` command's behavior — this is purely a new reader of already-existing local files.
- Depends on `add-trajectory-dashboard` being implemented first (for `.sreditor/profile.json` and `parseAnchorRevisions` to exist).

## Technical Uncertainty

None. This is routine engineering: reading two already-established local data sources and rendering them into markdown/JSON, writing to a developer-specified path with an overwrite confirmation — the same class of work as `add-local-ui`'s and `add-usage-stats-opt-in`'s own "no technical uncertainty" self-assessments. No new technique, no unresolved technical question.
