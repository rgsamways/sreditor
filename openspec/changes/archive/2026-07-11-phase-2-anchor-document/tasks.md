## 1. Dependencies

- [x] 1.1 Add `@anthropic-ai/sdk` and `zod` dependencies

## 2. Anchor file logic (pure, no LLM)

- [x] 2.1 Implement `src/anchor.ts` (`anchorPath`, `readAnchor`, `appendRevision`)

## 3. Interview helper

- [x] 3.1 Implement `src/interview.ts` (`ask`, `confirm` via `node:readline/promises`)

## 4. LLM drafting

- [x] 4.1 Implement `src/llm/client.ts` (Anthropic client, `DEFAULT_MODEL`)
- [x] 4.2 Implement `src/llm/anchor.ts` (`buildAnchorPrompt`, `draftAnchor`, `buildReflectionPrompt`, `draftReflection`) with `zod` schemas

## 5. Commands

- [x] 5.1 Implement `sreditor init`
- [x] 5.2 Implement `sreditor reflect`
- [x] 5.3 Update `sreditor status` to report real anchor state
- [x] 5.4 Register both commands in `src/index.ts`

## 6. Tests & verification

- [x] 6.1 Unit tests for `src/anchor.ts` against a temp dir
- [x] 6.2 Unit tests for prompt-building functions (no network)
- [x] 6.3 Manual smoke test: `init` → `reflect` → `init` again (refused) → `reflect` with no anchor (refused) → `status`
- [x] 6.4 Update README command table
