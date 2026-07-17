## 1. Extract reusable report logic

- [x] 1.1 Pull the filing-ready/excluded partitioning currently inline in `renderReportMarkdown` (`src/report.ts`) into its own exported function (e.g. `partitionProjects(rollupOutput)` returning `{ filingReady, excluded }`) usable independently of markdown rendering
- [x] 1.2 Confirm `renderReportMarkdown` still produces identical output using the extracted function (existing `tests/report.test.ts` cases should pass unchanged)
- [x] 1.3 Add unit tests for the extracted function directly if not already fully covered by 1.2

## 2. Local HTTP server

- [x] 2.1 Create `src/commands/ui.ts`: use Node's built-in `http` module, bind to `127.0.0.1`, `listen(0)` for an ephemeral port
- [x] 2.2 Add read-only JSON endpoints: judgments list (from `judgmentsFile`/`readJsonl`/`latestJudgmentPerChange`), single-change detail, rollup (from `readRollupOutput`), each handling the "no data yet" case with an empty/appropriate response rather than an error
- [x] 2.3 Serve the static frontend files (2.x below) for all other GET requests
- [x] 2.4 Print the server's local URL to the terminal on startup; attempt to auto-open the default browser (cross-platform, reusing the existing `cross-spawn` pattern already used elsewhere in this codebase) but do not fail startup if auto-open fails
- [x] 2.5 Handle Ctrl+C / process exit to shut the server down cleanly
- [x] 2.6 Wire `ui` into `src/index.ts` (Commander.js command registration, following the existing pattern)
- [x] 2.7 Unit tests for the endpoint handlers (given fixture files in a temp dir, correct JSON shape returned; no data on disk → graceful empty response)

## 3. Frontend

- [x] 3.1 Plain HTML/CSS/JS static assets (no bundler) implementing: a filterable/sortable judgment table (by eligible, confidence, proximity), a single-change detail pane, and a rollup view (filing-ready vs. excluded, word counts vs. CRA limits)
- [x] 3.2 Rollup view visually distinguishes filing-ready from excluded sections (matching the existing "do not copy into a CRA submission" spirit already established for the markdown/PDF report)
- [x] 3.3 Empty-state handling in the UI itself for "no judgments yet" / "no rollup yet"

## 4. Verification

- [x] 4.1 `npm run build && npm run typecheck && npm test` all clean
- [x] 4.2 Manually run `sreditor ui` in this repo (which has its own real `.sreditor` data) and confirm: server binds to `127.0.0.1` only (not reachable via LAN IP), browser opens or URL is printed, judgment list/filtering/detail view and rollup view all render correctly against real data
- [x] 4.3 Confirm the server exits cleanly on Ctrl+C
- [x] 4.4 Confirm running `sreditor ui` in a project with no `.sreditor` directory at all still starts the server and shows an empty state rather than crashing

## 5. Frontend polish (added after initial verification)

- [x] 5.1 Paginate the judgments table at 10 rows per page, with Prev/Next controls and a page indicator; reset to page 1 when filters change
- [x] 5.2 Collapse each item in "Other judged, ungrouped work" (Rollup tab) by default, toggleable via clicking its header
- [x] 5.3 Collapse each filing-ready project (Rollup tab) by default the same way, toggleable via clicking its header
- [x] 5.4 Verified via real Chrome DevTools Protocol interaction against Farpost's actual data (48 judgments/5 pages, 1 filing-ready + 45 excluded projects) — not just code review
- [x] 5.5 Add a per-project timeline in the Rollup tab: contributing changes as a date-ordered chain of cards (date parsed from the change id's own YYYY-MM-DD prefix, not `judgedAt`), each clickable to fetch and show that specific change's own reasoning
- [x] 5.6 Add a light/dark theme toggle (cycles Auto → Light → Dark → Auto), persisted in `localStorage`

## 6. Charts and tables (added after theme toggle)

- [x] 6.1 Proximity distribution chips (eligible/close/some_signal/not_close counts) above the Judgments tab filters
- [x] 6.2 New "History" tab: every judged change as a chronological, color-coded row, click-to-expand showing reasoning + drift (if present) — not a fake taxonomy, just the real prose
- [x] 6.3 Word-count bars (visual, not just text) for filing-ready projects' T661 lines, red when over limit
- [x] 6.4 Coverage indicator in the header (archived/judged/unjudged/rolled-up counts + a progress bar), backed by a new `/api/coverage` endpoint and `getCoverage()` in `src/ui/data.ts`
- [x] 6.5 All verified via real Chrome DevTools Protocol interaction against Farpost's live data (now 60 archived changes, 48 judged, 12 unjudged — coverage indicator caught this drift in real time)
- [x] 5.7 Bug found and fixed during verification: the timeline's date-parsing regex used a single backslash (`\d`) in TS source, which the outer template-literal string silently swallowed, making every date show "undated" — fixed by double-escaping (`\\d`), matching the pattern already used elsewhere in this file (`\\25BE`, `\\u26A0`). Confirmed via real CDP interaction, not just code review, that dates now render correctly and in the right chronological order.
