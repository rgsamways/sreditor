## Why

Sreditor needs a working, testable foundation before any LLM-backed judgment logic can be built: a CLI shell, a way to enumerate a project's structured change artifacts without hardcoding OpenSpec's file layout, and a persistence format for judgments that don't exist yet. This was built directly, before OpenSpec was adopted for this repo's own workflow — this proposal backfills that work as a real archived change, so it becomes genuine dogfood/calibration data for Sreditor's own judgment prompt later, instead of an invisible gap in its own history.

## What Changes

- Add a TypeScript + ESM CLI entry point (Commander.js), built with `tsup`, run in dev via `tsx`.
- Add a tool-agnostic `SourceAdapter` interface plus a working OpenSpec adapter, so judgment/rollup logic in later phases never touches OpenSpec's file layout directly.
- Add JSON-lines persistence helpers (`appendJsonl`/`readJsonl`) as the storage seam future judgment records will be written through.
- Add three non-LLM commands: `scan` (list archived OpenSpec changes), `status` (archived/judged/unjudged counts, anchor state), `doctor` (pre-flight check: Node version, source detected, API key presence, writable state directory).
- Add a vitest suite covering the adapter and persistence helpers against a fixture OpenSpec archive.

## Capabilities

### New Capabilities
- `source-adapter`: tool-agnostic interface for enumerating a project's structured change artifacts; OpenSpec is the first, and currently only, adapter.
- `judgment-log`: JSON-lines persistence for structured records — append-only, human-inspectable, zero migration overhead for v1.
- `cli-diagnostics`: the `scan`/`status`/`doctor` commands that report project state without making any LLM call.

### Modified Capabilities
(none — this is the first change in this project's OpenSpec history)

## Impact

- New files under `src/`, `tests/`, plus `package.json`/`tsconfig.json`/`tsup.config.ts`.
- No breaking changes — nothing existed before this change.
- Establishes the extension seam (`SourceAdapter`) and storage seam (`judgment-log`) that `init`/`judge`/`reflect`/`rollup` (later phases) build directly on top of.

## Technical Uncertainty

Two points carried genuine uncertainty, resolved through this work rather than assumed upfront:
1. Whether OpenSpec's file layout (`openspec/changes/archive/<name>/{proposal,design,tasks}.md`) could be abstracted behind a stable interface cheaply enough to justify doing it before a second adapter exists to prove the abstraction is right — resolved by building the interface first and confirming the OpenSpec adapter implementation stayed small and dependency-free against it, i.e. the abstraction cost was low enough not to be premature.
2. Whether a TypeScript + ESM + `tsup` toolchain could produce a working global npm-installable binary without hitting Node's `NodeNext` relative-import extension requirement — resolved by testing `tsup`'s single-file bundle output end-to-end via `npm link` from an unrelated directory, confirmed working.

Most of the remaining work (Commander wiring, `fs` calls, JSON-lines read/append) is routine engineering with no real uncertainty and is not being claimed as such.
