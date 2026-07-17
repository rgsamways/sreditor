## 1. Rendering

- [ ] 1.1 Add `src/profileExport.ts`: `buildProfileExportData(cwd)` combining `readProfileLog` (`src/profileLog.ts`) and `parseAnchorRevisions(readAnchor(cwd) ?? '')` (`src/anchor.ts`) into `{ exploreEngagement, anchorRevisions }`
- [ ] 1.2 Add `renderProfileMarkdown(data)`: two sections ("Explore Engagement", "Anchor Revisions"), each a chronological list, each rendering an explicit "none yet" line when empty; includes a header stating the export's scope (explore + anchor only, no judgment-log content)
- [ ] 1.3 Add `renderProfileJson(data)`: `{ exploreEngagement: [...], anchorRevisions: [...] }` from the same `data` object
- [ ] 1.4 Unit tests: markdown and JSON renderers against a fixture with entries in both sections, and against an empty-history fixture (both sections show "none yet")

## 2. Command

- [ ] 2.1 Add `src/commands/profileExport.ts`: calls `buildProfileExportData`, renders via markdown or JSON (based on a `--json` flag), writes to a resolved output path (default `sreditor-profile.md`/`.json` in `cwd`, overridable via `--out`)
- [ ] 2.2 Confirmation prompt before overwriting an existing file at the output path, skippable via `-y`/`--yes` (mirroring `rollup`'s existing confirmation pattern)
- [ ] 2.3 Wire `profile export` into `src/index.ts` as a `profile` command group (mirroring the existing `stats <on|off|show>` subcommand-group registration)
- [ ] 2.4 Unit tests: default markdown export, `--json` export, overwrite confirmation declined (file untouched) vs. accepted vs. skipped via `-y`

## 3. Verification

- [ ] 3.1 `npm run build && npm run typecheck && npm test` all clean
- [ ] 3.2 Manually run `sreditor profile export` in a real project with real explore-engagement and anchor-revision history; confirm the markdown file's content matches what's shown in the dashboard's Trajectory view and contains no judgment/eligibility content
- [ ] 3.3 Manually run `sreditor profile export --json` and confirm the JSON matches the markdown's data
- [ ] 3.4 Manually confirm no network request occurs during export (e.g. run with network disabled)
- [ ] 3.5 Manually confirm overwrite confirmation behavior (declining leaves the existing file untouched; `-y` overwrites without prompting)
