## Why

Sreditor's credibility story today rests entirely on one project's data at a time — a developer (or an auditor) can read the transparent prompts and one project's judgment log, but has no way to see whether the tool's calibration holds up across many real, independent uses. A purely aggregate, opt-in usage-statistics feature gives two audiences something they currently can't get: developers get a benchmark to check whether their own project's eligibility rate is typical or an outlier, and SR&ED auditors/CRA get population-level evidence the tool is calibrated conservatively, not just anecdotal evidence from a single self-reported case. Robin also intends to use this to substantiate real usage on a forthcoming marketing site (sreditor.ca), which needs real numbers, not claims.

## What Changes

- New `sreditor stats` command with `on` / `off` / `show` actions: `on` opts in (off by default), `off` opts out immediately, `show` prints the exact JSON payload that would be sent — computed from real local data — without ever sending it, so a developer can inspect it before deciding.
- New local config file `.sreditor/config.json` (git-ignored, matching the existing `.sreditor/*` ignore pattern) storing the opt-in flag and a locally-generated random install id (a UUID, not derived from anything identifying).
- When opted in, `judge` and `rollup` each send one aggregate snapshot after they run, to a configurable stats endpoint (defaults to the not-yet-live `api.sreditor.ca`, overridable via an environment variable for testing) — network failures are silently non-blocking and never affect the actual command's own success or speed.
- The payload is restricted by an explicit, structurally-enforced allowlist: only numeric counts/percentages, a random install id, and the installed version string. No project name, no reasoning text, no proposal/design content, and no change id may ever be included — enforced by the schema itself (only number/uuid/version fields are representable), not just by policy.
- This change covers the CLI side only. The remote collection API, its Postgres database, and the marketing site are separate pieces of infrastructure, to be provisioned with explicit sign-off before anything goes live.

## Capabilities

### New Capabilities
- `usage-stats-opt-in`: an opt-in, toggleable-anytime, purely-aggregate usage statistics feature — local config, a `stats` command, and non-blocking submission on `judge`/`rollup` when enabled.

### Modified Capabilities
(none — `judge` and `rollup`'s existing eligibility/rollup behavior is unchanged; they only gain an additional, silent, non-blocking side effect when a developer has explicitly opted in)

## Impact

- New `src/commands/stats.ts` (the `stats on`/`off`/`show` command) and `src/statsConfig.ts` (reading/writing `.sreditor/config.json`).
- New `src/telemetry/` module: a strict schema for the allowlisted payload, aggregation logic reusing `getCoverage` (`src/ui/data.ts`) and `partitionProjects`/`checkWordLimits` (`src/report.ts`) rather than re-deriving the same numbers again, and a small non-blocking HTTP submit function.
- Small additions to `src/commands/judge.ts` and `src/commands/rollup.ts` to call the submit function when opted in, after their existing work completes.
- `.gitignore` already covers `.sreditor/*`, so no change needed there.
- No changes to `judge`'s or `rollup`'s eligibility/grouping logic, prompts, or output.

## Technical Uncertainty

None. This is routine engineering: a local config file, a CLI subcommand, an allowlisted data-aggregation step reusing already-built helpers, and a fire-and-forget HTTP POST with error handling that swallows failures. Every piece is an established pattern already used elsewhere in this codebase (config/anchor file handling, Commander.js subcommands, corroborating-signals' graceful-degradation-on-failure approach). No new technique, no unresolved technical question.
