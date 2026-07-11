## 1. CLI & tooling foundation

- [x] 1.1 Set up `package.json` (ESM, bin entry), `tsconfig.json`, `tsup.config.ts`
- [x] 1.2 Wire the Commander.js entry point (`src/index.ts`)

## 2. Source adapter layer

- [x] 2.1 Define `SourceAdapter` / `ChangeArtifact` interfaces (`src/adapters/types.ts`)
- [x] 2.2 Implement the OpenSpec adapter (`src/adapters/openspec.ts`)

## 3. Persistence

- [x] 3.1 Implement `appendJsonl` / `readJsonl` helpers (`src/persistence/jsonl.ts`)
- [x] 3.2 Define `.sreditor/` and `judgments.jsonl` path constants (`src/paths.ts`)

## 4. Diagnostic commands

- [x] 4.1 Implement `scan`
- [x] 4.2 Implement `status`
- [x] 4.3 Implement `doctor`

## 5. Tests & verification

- [x] 5.1 Fixture OpenSpec archive + adapter tests
- [x] 5.2 Persistence round-trip tests
- [x] 5.3 Manual smoke test via `npm link` (global bin works end-to-end)
