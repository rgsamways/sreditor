## 1. Git correlation

- [x] 1.1 Implement `src/tools/gitDiff.ts` (`findArchivingCommit`, `getChangedFiles`)

## 2. Tool detection and invocation

- [x] 2.1 Implement `src/tools/detect.ts` (`isToolAvailable`)
- [x] 2.2 Implement `src/tools/corroboration.ts` (`runScc`, `runJscpd`, `runSem`, `gatherCorroboratingSignals`)

## 3. Judgment integration

- [x] 3.1 Update `buildJudgmentPrompt`/`judgeChange` in `src/llm/judgment.ts` to accept and include corroborating signals
- [x] 3.2 Update `src/commands/judge.ts` to pass `cwd` through

## 4. Doctor + README

- [x] 4.1 Add three informational, non-blocking checks to `src/commands/doctor.ts`
- [x] 4.2 Replace the README's "not implemented" Known Limitations entry with a real "Optional corroborating signals" section

## 5. Tests & verification

- [x] 5.1 Unit tests: `src/tools/detect.ts`, `src/tools/gitDiff.ts` (real temp git repos, not mocked)
- [x] 5.2 Unit tests: `buildJudgmentPrompt` with and without signals present
- [x] 5.3 Manual smoke test: `doctor` shows all three tools detected; judged a real change (`phase-4-rollup`) with all three installed and confirmed the prompt includes their real output; confirmed graceful degradation with `scc`/`sem` absent from PATH
- [x] 5.4 Re-verified `git log --diff-filter=A` correlation against 3 more of Sreditor's own real archived changes — all correct

## 6. Issues found and fixed during real verification (not anticipated in the original plan)

- [x] 6.1 `jscpd`'s Windows npm shim is a `.cmd` file; `execFileSync` cannot invoke it without `shell: true`, which Node flags (DEP0190) as a real command-injection risk given the arguments include file paths from a judged repo's own git history. Fixed by switching to `cross-spawn` (new dependency) instead of hand-rolling unsafe shell invocation.
- [x] 6.2 `jscpd`'s `ai` reporter emits ANSI color codes by default; fixed via its real `--no-colors` flag rather than a fragile strip-ANSI regex.
- [x] 6.3 `sem diff --format json` output for a large commit (40 files, 2059 changed entities) exceeded Node's default 1MB `spawnSync` buffer (`ENOBUFS`), silently degrading to "signal absent" for large changes. Fixed by raising `maxBuffer` to 20MB.
- [x] 6.4 Compared judgment outcomes for the same real change with/without corroborating signals present (4 total runs) to check the signals weren't improperly biasing eligibility — result was 3-of-4 ineligible regardless of signal presence, consistent with ordinary LLM run-to-run variance on a borderline case rather than a systematic bias. Not conclusive with this sample size, but no red flag found.
