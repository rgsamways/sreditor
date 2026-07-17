## Why

`sreditor ui` (`add-local-ui`) already shows a project's judgment/rollup history, but there's no view of a developer's own trajectory over time — what they explored, how their anchor understanding of the project evolved, how judged/filing-ready output trended. `explore` (`add-explore-command`) is about to add a new, genuinely interesting signal (what a developer engaged with) that has nowhere to live yet. Extending the existing local dashboard with a per-project trajectory view turns three currently-disconnected local data sources (explore engagement, anchor revisions, judge/rollup history) into one coherent picture, without inventing a new product surface or leaving the local-first trust model.

## What Changes

- New `.sreditor/profile.json`: a small local file, in the same direct-`node:fs` JSON pattern as `.sreditor/config.json`, recording explore-engagement history (one entry per `sreditor explore` run: timestamp, card ids/tags shown). This is the only new local write introduced by this change.
- `sreditor explore` (built in `add-explore-command`) gains one small addition: after printing cards, it appends one entry to `.sreditor/profile.json`. This is additive only — none of `explore`'s existing requirements (disclaimer, source citation, isolation from the judgment pipeline, graceful network failure) change.
- The existing local UI (`sreditor ui`) gains a new "Trajectory" view: a per-project timeline combining (a) explore engagement entries from `.sreditor/profile.json`, (b) anchor document revisions (already recorded as dated sections in `anchor.md` via the existing `reflect` command — no new anchor storage needed), and (c) judge/rollup history already shown elsewhere in the UI, presented together as one chronological view.
- Strictly per-project, no cross-project aggregation — same scope discipline as the rest of `.sreditor/`.
- Separation from the judgment pipeline enforced by file layout, same principle as `explore` and the corroborating-signals precedent (`openspec/changes/archive/2026-07-11-corroborating-signals/`): `.sreditor/profile.json` is read by the dashboard only; `probe`, `judge`, and `rollup` never open it.

## Capabilities

### New Capabilities
- `trajectory-dashboard`: the `.sreditor/profile.json` local engagement-log file, and a new "Trajectory" view in `sreditor ui` combining explore engagement, anchor revision history, and judge/rollup history into one per-project timeline.

### Modified Capabilities
- `explore`: after printing cards, `sreditor explore` additionally appends one engagement entry to `.sreditor/profile.json`. No existing `explore` requirement (disclaimer, source citation, judgment-pipeline isolation, network-failure handling) changes.

## Impact

- New `src/profileLog.ts` (or similar): `readProfileLog(cwd)` / `appendExploreEngagement(cwd, entry)`, following `src/statsConfig.ts`'s direct-`node:fs` JSON pattern.
- Small addition to `src/commands/explore.ts` (from `add-explore-command`): call `appendExploreEngagement` after successfully printing cards.
- New read path in `src/ui/data.ts`: a `getTrajectoryView(cwd)` function reading `.sreditor/profile.json`, parsing anchor.md's dated revision sections (new small helper, or reuse if `reflect`/`anchor.ts` already expose revision parsing), and combining with existing `getJudgmentsList`/`readRollupOutput`.
- New read-only endpoint (e.g. `/api/trajectory`) in `src/commands/ui.ts`, plus a new "Trajectory" tab in the static frontend (`src/ui/html.ts` or its associated static assets).
- No changes to `probe`, `judge`, `rollup`, or `report`'s behavior, prompts, or output.
- Depends on `add-explore-command` being implemented first (this change's `explore` modification and its trajectory data both assume `sreditor explore` and its card-printing behavior already exist).

## Technical Uncertainty

None. This is routine engineering: a small local JSON log file (already-established pattern in this codebase), a new read-only aggregation function combining data already produced by existing commands, and a new tab in an already-existing local HTTP server + static frontend. No new technique, no unresolved technical question — assembling already-proven patterns (local JSON state, read-only dashboard views, file-layout separation from the judgment pipeline) in a new place is not technological uncertainty, consistent with how `add-local-ui` and `add-usage-stats-opt-in` judged their own equivalent work.
