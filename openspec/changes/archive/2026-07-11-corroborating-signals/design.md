## Context

Three corroborating-signal tools were parked at Phase 3 and deferred three times, with a saved design decision already settling the policy (fully optional, runtime-detected, never install-time, never authoritative, `doctor` as the detection point). This change resolves the one thing that decision never addressed — how a judged `ChangeArtifact` (pure OpenSpec markdown) connects to any actual code to analyze — and builds the feature for real, since Robin chose to do this now rather than after `npm publish`.

## Goals / Non-Goals

**Goals:**
- Real, verified tool integration — command syntax and output shapes confirmed by actually installing and running `scc`, `jscpd`, and `sem` during this session, not guessed from the original parking notes.
- Zero degradation of existing judgment quality when the tools aren't installed — the common case for a fresh `npm install -g sreditor` user.
- A working, honest git-to-change correlation heuristic, with its real limitation documented rather than hidden.

**Non-Goals:**
- No install-time dependency on any of the three tools.
- No auto-install on the user's behalf.
- No attempt to parse `scc`'s COCOMO estimate — it's only available in `scc`'s text/tabular output, not its JSON format, and scraping formatted text for a signal that's explicitly non-authoritative isn't worth the fragility. `scc`'s JSON complexity/line/file-count stats are used instead.
- No multi-commit reconstruction of a change's full implementation history — the single-commit correlation heuristic's limitation is accepted, not solved, in this change.

## Decisions

- **Git correlation via `git log --diff-filter=A -- openspec/changes/archive/<id>`, diffed against its parent.** Verified against Sreditor's own real archived changes during planning (correctly found the exact commit that archived `phase-1-foundations`). The known limitation — only the final archiving commit, not earlier implementation commits — is accepted and documented, consistent with corroborating signals never being authoritative in the first place.
- **`sem diff --commit <SHA> --format json`**, confirmed via real `sem diff --help` output and a real test run against Sreditor's own history. The raw JSON is very verbose (full before/after content per changed entity) — `runSem` extracts only `summary` (file/added/modified/deleted counts) plus a condensed `{entityType, entityName, changeType, filePath}` list per change, never passing full file content into the judgment prompt. Keeps token cost bounded and avoids duplicating what the change's own artifact text already provides.
- **`jscpd <paths> --reporters ai`**, confirmed via a real run against Sreditor's own source (0 clones, 0.0% duplication — correctly reported). Output is already a concise, LLM-oriented summary by design; passed through close to as-is.
- **`scc --format json <paths>`**, confirmed via a real run. Per-language `Lines`/`Code`/`Complexity`/`Count` fields used; COCOMO explicitly excluded per the Non-Goals above.
- **Detection and invocation via `cross-spawn`, not raw `execFileSync`** — the one deviation from the original "no new dependencies" framing, discovered empirically during implementation: `jscpd`'s npm-installed Windows shim is a `.cmd` file, and Node's `execFileSync` cannot invoke `.cmd` files directly (`EINVAL`) without `shell: true`. Testing confirmed `shell: true` does work, but Node explicitly flags it (`DEP0190`) as unescaped argument concatenation — a real command-injection risk here specifically, since the arguments passed are file paths drawn from a judged repository's own git history, which is not fully trusted input. `cross-spawn` (the same library `npm` itself uses internally) solves exactly this problem safely and is a well-established, minimal dependency, not a speculative addition.

## Risks / Trade-offs

- The git-correlation heuristic will under-represent changes whose real implementation spanned multiple commits before archiving — it only sees the final archiving commit's diff. Explicitly documented in the README rather than presented as complete.
- Shelling out to three external processes adds real latency to `judge` when all three tools are installed. Accepted since it only affects users who've opted in by installing them.
