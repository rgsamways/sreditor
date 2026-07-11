## 1. Rollup schema reshape

- [x] 1.1 Reshape `ProjectSchema` in `src/llm/rollup.ts` (uncertainty/investigation/advancement instead of narrative)
- [x] 1.2 Update `ROLLUP_SYSTEM_PROMPT` with target word counts and the three-field split

## 2. Rollup persistence + staleness

- [x] 2.1 Add `rollupFile`, `saveRollupOutput`, `readRollupOutput` to `src/rollup.ts`
- [x] 2.2 Add `isRollupStale` to `src/rollup.ts`
- [x] 2.3 Update `src/commands/rollup.ts` to save output after a confirmed run and display the three fields

## 3. Report

- [x] 3.1 Implement `src/report.ts` (`countWords`, `WORD_LIMITS`, `checkWordLimits`, `renderReportMarkdown`)
- [x] 3.2 Implement `src/commands/report.ts` (read rollup output, staleness check, render, write file, summary)
- [x] 3.3 Register `report` in `src/index.ts`
- [x] 3.4 Add `sreditor-report-*.md` to `.gitignore`

## 4. Tests & verification

- [x] 4.1 Unit tests: `saveRollupOutput`/`readRollupOutput` round-trip, `isRollupStale`
- [x] 4.2 Unit tests: `countWords`, `checkWordLimits`, `renderReportMarkdown`
- [x] 4.3 Manual smoke test: `rollup --yes` persists + shows 3 fields, `report` renders correctly with real word counts, staleness warning fires after a new judge, missing-rollup error
- [x] 4.4 Update README command table
