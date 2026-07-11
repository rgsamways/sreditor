## 1. Pure data shaping

- [x] 1.1 Implement `src/rollup.ts` (`latestJudgmentPerChange`, `findUnjudgedChangeIds`, `computeDateRange`)

## 2. Rollup LLM call

- [x] 2.1 Implement `src/llm/rollup.ts` (`ProjectSchema`, `RollupSchema`, `buildRollupPrompt`, `runRollup`)

## 3. Command

- [x] 3.1 Implement cost estimate (`client.messages.countTokens()` + arithmetic) in `src/commands/rollup.ts`
- [x] 3.2 Implement confirm gate (reusing `startInterview().confirm`) with `-y`/`--yes` bypass
- [x] 3.3 Implement full command orchestration and output formatting
- [x] 3.4 Register `rollup` with `-y, --yes` option in `src/index.ts`

## 4. Tests & verification

- [x] 4.1 Unit tests for `latestJudgmentPerChange` / `findUnjudgedChangeIds` / `computeDateRange`
- [x] 4.2 Unit tests for `buildRollupPrompt` (no network)
- [x] 4.3 Manual smoke test against Sreditor's own real judgment log: estimate + decline, estimate + `--yes`, re-judge-then-rollup dedup check, no-judgments-yet message
- [x] 4.4 Update README command table
