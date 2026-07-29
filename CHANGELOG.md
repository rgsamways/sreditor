# Changelog

## 0.0.5 — 2026-07-29

- Fixed the `scc`/`jscpd`/`sem` corroborating signals to analyze a change's full implementation window instead of only its final archiving commit. Previously, workflows with several commits between implementing and archiving a change would only ever see whatever the archiving commit itself touched — often just a folder move with no code in it. Verified against a real project's archive history: 8 of 15 changes now correctly widen (one from 14 files to 47).

## 0.0.4 — 2026-07-28

- Added `sreditor scaffold`: bootstraps a new project by running OpenSpec's own `init` if one isn't set up yet, then appends a usage note to `CLAUDE.md` pointing at `init`/`probe`/`reflect`/`judge`/`rollup`/`report`.
- `judge` now shows a single live progress bar with a running percentage across all changes being judged, instead of a spinner per change.
- `status` now reports judged-change completion as a percentage.

## 0.0.3 — 2026-07-23

- Fixed `sreditor --version` reporting a stale, hardcoded `0.0.1` instead of the actual installed version (confirmed present in the published `0.0.2` tarball).

## 0.0.2 — 2026-07-23

- Live progress spinners for `judge` and `rollup` while they wait on Claude API calls, instead of silent multi-second gaps.
- Colored output across `judge`, `rollup`, `doctor`, `status`, `scan`, `report`, and `stats`.
- `init`, `probe`, and `reflect` now use `@clack/prompts` for interactive prompts (with clean Ctrl+C cancellation), replacing raw `readline`.
- Archived the `add-probe-command` OpenSpec change and promoted `uncertainty-probe` to a tracked spec.
- Fixed placeholder GitHub links on the marketing site and added an npm package link.

## 0.0.1 — 2026-07-21

- Initial public release.
- Core workflow: `init`/`reflect` (anchor document), `probe` (pre-implementation uncertainty capture), `judge` (per-change SR&ED eligibility judgment), `rollup` (project-level narrative grouping), `report` (T661 Part 2-formatted output).
- `doctor`, `status`, and `scan` for diagnostics and OpenSpec archive inspection.
- Opt-in, fully aggregate usage stats (`stats on`/`off`/`show`).
- Local UI dashboard and `explore` command.
