## 1. Draft-change file access

- [x] 1.1 Add a small helper (e.g. `src/openspecDraft.ts`) with `findDraftChange(cwd, changeId)` returning the draft's `proposal.md` path if `openspec/changes/<changeId>/` exists (and is not under `archive/`), or `null` otherwise
- [x] 1.2 Add `readDraftProposal(cwd, changeId)` and `appendProbeSection(cwd, changeId, text)` (append a `## Articulated Uncertainty (probe)` section to that file)
- [x] 1.3 Add `hasExistingProbeSection(proposalText)` to detect a prior probe addendum for the re-run confirmation case
- [x] 1.4 Unit tests for all of the above using real temp directories (no mocked fs), covering: draft exists, draft missing, change already archived, proposal already has a probe section

## 2. LLM synthesis call

- [x] 2.1 Create `src/llm/probe.ts` mirroring `src/llm/anchor.ts`'s shape: a system prompt with the same "rephrase only, never invent, honest absence is valid" constraint as `draftAnchor`'s `FRAMING_SYSTEM_PROMPT`, adapted to per-change uncertainty framing
- [x] 2.2 Define a Zod schema for the synthesized result (e.g. `uncertainty`, `alternativesConsidered`, `howToResolve` — or an honest "none found" per field, matching the existing schema style in `src/llm/judgment.ts`/`src/llm/anchor.ts`)
- [x] 2.3 Implement `buildProbePrompt(answers)` and `draftProbeAddendum(answers)` following the exact pattern of `buildAnchorPrompt`/`draftAnchor`
- [x] 2.4 Unit tests for prompt building (pure function, no API calls), matching the style of `tests/llm/anchor.test.ts`

## 3. `probe` command

- [x] 3.1 Create `src/commands/probe.ts`: look up the draft change via 1.1; if not found, print a clear message and exit non-zero (no crash)
- [x] 3.2 If a prior probe section exists (1.3), use `interview.confirm` to ask before continuing; respect a decline by exiting without changes
- [x] 3.3 Run the fixed three-question interview via `startInterview()` (reusing `src/interview.ts` unmodified), per the questions in `design.md`
- [x] 3.4 Call `draftProbeAddendum`, print the synthesized result, and use `interview.confirm` before saving (mirroring `init`'s confirm-before-save pattern)
- [x] 3.5 On confirmation, call `appendProbeSection`; on decline, print "Not saved." and exit cleanly
- [x] 3.6 Print a short reminder that probing is most valuable before implementation starts (non-blocking, informational only)
- [x] 3.7 Wire the command into `src/index.ts` (`probe <change-id>`, following the existing Commander.js command registration pattern)

## 4. Verification

- [x] 4.1 `npm run build && npm run typecheck && npm test` all clean
- [ ] 4.2 Manually run `sreditor probe` against a real draft change in this repo (dry run, decline save) to confirm the interview flow and printed output read correctly
- [ ] 4.3 Manually run it again through to a real save, confirm the appended section appears correctly in the draft `proposal.md` and that `sreditor judge` (once the change is later archived) reads it as part of the normal artifact text with no special-casing required
- [x] 4.4 Confirm archiving a never-probed change still works unchanged (no gating introduced)
