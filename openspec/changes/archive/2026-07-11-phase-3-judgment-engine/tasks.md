## 1. Layer 1 judgment

- [x] 1.1 Implement `src/llm/judgment.ts` (`buildJudgmentPrompt`, `judgeChange`, `zod` schema)

## 2. Drift auditing

- [x] 2.1 Implement `src/llm/drift.ts` (`buildDriftPrompt`, `compareDrift`, `zod` schema)

## 3. Judge command

- [x] 3.1 Implement `selectChangesToJudge` (pure, exported) in `src/commands/judge.ts`
- [x] 3.2 Implement `judge` command orchestration (judgment + conditional drift, persistence, output)
- [x] 3.3 Register `judge` in `src/index.ts`

## 4. Status fix

- [x] 4.1 Update `src/commands/status.ts` to count distinct judged change ids

## 5. Tests & verification

- [x] 5.1 Unit tests for `buildJudgmentPrompt` / `buildDriftPrompt` (no network)
- [x] 5.2 Unit tests for `selectChangesToJudge` (skip-judged, explicit re-judge, unknown id)
- [x] 5.3 Manual smoke test: judge with no anchor, judge with anchor (real drift narrative), re-judge by id, unknown id, `status` distinct-count check
- [x] 5.4 Update README command table
