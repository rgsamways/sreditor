## 1. Local profile log

- [ ] 1.1 Add `src/profileLog.ts`: `readProfileLog(cwd)` / `appendExploreEngagement(cwd, entry)` for `.sreditor/profile.json` (`{ exploreEngagement: { ranAt, cardIds, tags }[] }`), following `src/statsConfig.ts`'s direct-`node:fs` JSON pattern
- [ ] 1.2 Unit tests: no file yet (empty log), append creates the file, append twice accumulates both entries in order

## 2. Explore engagement hook

- [ ] 2.1 In `src/commands/explore.ts` (from `add-explore-command`), call `appendExploreEngagement(cwd, ...)` after cards are successfully printed — not before, and not on any failure path
- [ ] 2.2 Unit test: a mocked successful explore run appends exactly one entry; a mocked failed run appends none
- [ ] 2.3 Confirm existing `add-explore-command` tests (disclaimer, source citation, isolation, failure handling) still pass unchanged

## 3. Anchor revision parsing

- [ ] 3.1 Add `parseAnchorRevisions(anchorText)` to `src/anchor.ts`: split on `^## ` sections, extract `date` from a `Revision YYYY-MM-DD` heading pattern (`null` if unparseable), return `{ heading, date, body }[]` in document order
- [ ] 3.2 Unit tests: anchor with initial section + multiple dated revisions parses correctly; a heading that doesn't match the dated pattern yields `date: null` without throwing

## 4. Trajectory aggregation and endpoint

- [ ] 4.1 Add `getTrajectoryView(cwd)` to `src/ui/data.ts`: merge `readProfileLog`, `parseAnchorRevisions(readAnchor(cwd) ?? '')`, and existing `getJudgmentsList`/`getRollupView` data into one chronologically sorted, typed entry list
- [ ] 4.2 Unit tests: entries from all three sources interleave correctly by date; undated anchor sections appear separately, not interleaved with a guessed date
- [ ] 4.3 Add `/api/trajectory` endpoint in `src/commands/ui.ts`, following the existing endpoint pattern (empty/no-data case returns an empty structure, not an error)
- [ ] 4.4 Unit tests for the endpoint using fixture files in a temp dir

## 5. Frontend

- [ ] 5.1 New "Trajectory" tab in the static frontend, rendering the combined chronological timeline (distinguishing explore/anchor-revision/judgment/rollup entry types visually, matching the existing color-coded row pattern used in the History tab)
- [ ] 5.2 Empty-state handling: no `profile.json`, no anchor revisions, or neither — each renders a clear empty message rather than an error
- [ ] 5.3 Undated anchor section(s) shown in a distinct "not dated" area rather than mixed into the timeline

## 6. Verification

- [ ] 6.1 `npm run build && npm run typecheck && npm test` all clean
- [ ] 6.2 Manually run `sreditor explore` a few times in a real project, then `sreditor ui`, and confirm the Trajectory tab shows the real engagement entries alongside real anchor revisions and judge/rollup history
- [ ] 6.3 Confirm `sreditor judge`/`rollup` output is byte-identical whether or not `.sreditor/profile.json` exists
- [ ] 6.4 Confirm `.sreditor/profile.json` is git-ignored (already covered by the existing `.sreditor/*` pattern)
