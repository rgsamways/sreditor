## 1. Local config

- [x] 1.1 Add `src/statsConfig.ts`: `readStatsConfig(cwd)` / `writeStatsConfig(cwd, config)` for `.sreditor/config.json` (`{ statsOptIn: boolean, installId: string | null }`), following the direct `node:fs` JSON pattern already used by `src/rollup.ts`
- [x] 1.2 `getOrCreateInstallId(cwd)`: returns the existing id if present, otherwise generates one via `node:crypto`'s `randomUUID()` and persists it
- [x] 1.3 Unit tests using real temp directories: no config file yet (defaults), opt-in persists, opt-in twice reuses the same install id, opt-out flips the flag without deleting the id

## 2. Payload schema and aggregation

- [x] 2.1 Add `src/telemetry/schema.ts`: a zod schema for the payload with only `z.number()` fields, `installId: z.string().uuid()`, and `sreditorVersion: z.string()` — structurally no field capable of holding arbitrary free text
- [x] 2.2 Add `src/telemetry/aggregate.ts`: `buildStatsPayload(cwd)` computing the allowlisted fields by calling `getCoverage` (`src/ui/data.ts`) and `partitionProjects`/`checkWordLimits` (`src/report.ts`) — do not recompute these numbers a second way
- [x] 2.3 Unit tests: payload matches the schema exactly for a real fixture project; confirm the schema itself rejects an object with an extra string field (proves the allowlist is structural, not just by construction)

## 3. Submission

- [x] 3.1 Add `src/telemetry/submit.ts`: `submitStatsIfOptedIn(cwd)` — checks `statsOptIn` first (near-zero cost when off), and if on, builds the payload and POSTs it with `AbortSignal.timeout(3000)`, catching and swallowing every possible failure (network error, timeout, non-2xx)
- [x] 3.2 Stats endpoint URL is read from an env var (e.g. `SREDITOR_STATS_URL`) with a default pointing at `https://api.sreditor.ca/v1/stats`
- [x] 3.3 Unit tests: opted-out short-circuits with no network call attempted; a simulated failing endpoint (e.g. a local server that immediately closes the connection) does not throw or reject from the caller's perspective

## 4. `stats` command

- [x] 4.1 Add `src/commands/stats.ts` with `on` / `off` / `show` actions
- [x] 4.2 `on`: sets `statsOptIn = true`, ensures an install id exists, prints a confirmation plus the payload that would now be sent
- [x] 4.3 `off`: sets `statsOptIn = false`, confirms nothing will be sent going forward
- [x] 4.4 `show`: computes and pretty-prints the current payload via the same `buildStatsPayload` function used for real submission, explicitly stating nothing was sent, regardless of current opt-in state
- [x] 4.5 Wire `stats <on|off|show>` into `src/index.ts` (Commander.js), following the existing command registration pattern

## 5. Wiring into `judge` and `rollup`

- [x] 5.1 Call `submitStatsIfOptedIn(cwd)` at the end of `judge` (`src/commands/judge.ts`), after existing output/exit-code logic — never before, never allowed to affect it
- [x] 5.2 Same for `rollup` (`src/commands/rollup.ts`)
- [x] 5.3 Confirm via test/manual run that a deliberately-broken endpoint URL does not change either command's exit code or noticeably slow it down beyond the 3s timeout ceiling

## 6. Verification

- [x] 6.1 `npm run build && npm run typecheck && npm test` all clean
- [x] 6.2 Manually run `sreditor stats show` against this repo's own real data before ever opting in — confirm it prints a real, correctly-shaped payload and sends nothing
- [x] 6.3 Manually run `sreditor stats on`, then `judge` a change, and confirm (e.g. via a local mock HTTP listener standing in for `SREDITOR_STATS_URL`) that exactly one well-formed, schema-valid POST is made
- [x] 6.4 Manually run `sreditor stats off` and confirm a subsequent `judge` run makes no submission
- [x] 6.5 Confirm `.sreditor/config.json` is git-ignored (already covered by the existing `.sreditor/*` pattern) by checking `git status` shows nothing after opting in
