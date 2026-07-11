## Why

Three corroborating-signal tools were parked during Phase 3 as optional context for the judgment prompt and deliberately deferred past v1 three times, with the policy questions (fully optional, runtime-detected, never install-time dependencies, never determine eligibility directly) already settled in a saved design decision. This change builds them for real, resolving the one thing that decision never addressed: `ChangeArtifact` only carries OpenSpec markdown, with no existing link to the actual git diff a change represents.

## What Changes

- Add git-commit correlation: find the commit that added `openspec/changes/archive/<id>/`, treat that commit's diff (against its parent) as the change's code diff. Verified against Sreditor's own real history during planning.
- Add runtime detection (`isToolAvailable`) and invocation wrappers for `scc`, `jscpd`, and `sem`, each degrading to `null` on any failure (tool absent, execution error, parse error) — never throwing, never blocking a judgment.
- `judgeChange()` gains a `cwd` parameter, gathers whatever corroborating signals succeed, and includes them in the prompt as a clearly-labeled, explicitly non-authoritative context block. Signals that fail or are unavailable are simply omitted, not flagged as missing — keeps the prompt unchanged from today's behavior when nothing is installed.
- `doctor` gains three new informational, non-blocking presence checks (does not affect exit code) with install pointers for each tool.
- README's "not implemented" Known Limitations entry becomes a real "Optional corroborating signals" section.

## Capabilities

### New Capabilities
- `corroborating-signals`: git-commit correlation, tool detection/invocation, and their integration into the judgment prompt as non-authoritative context.

### Modified Capabilities
- `judgment-engine`: `judgeChange`'s signature and prompt-building gain an optional corroborating-signals input; the CRA three-part-test judgment logic itself is unchanged.
- `cli-diagnostics`: `doctor` gains three new informational checks that do not affect its pass/fail exit code.

## Impact

- New `src/tools/detect.ts`, `src/tools/gitDiff.ts`, `src/tools/corroboration.ts`.
- Modifies `src/llm/judgment.ts`, `src/commands/judge.ts`, `src/commands/doctor.ts`, `README.md`.
- `scc`/`jscpd`/`sem` themselves are external CLIs, never installed by Sreditor. One new dependency was added while implementing this — `cross-spawn` — see Technical Uncertainty below; it was not anticipated when this proposal was first drafted.

## Technical Uncertainty

One point here carried genuine uncertainty, resolved through this work rather than assumed: whether an archived OpenSpec change could be reliably correlated to a real git diff without an existing formal link between the two, given `ChangeArtifact` was designed (Phase 1) purely around OpenSpec's markdown output and never anticipated needing git-level provenance. This was not obvious in advance — it required investigating whether a workable heuristic existed at all (git-log-diff-filter on the archive folder's own path) and verifying it against real history before treating it as viable, rather than assuming any correlation approach would work. The chosen heuristic has a known, documented limitation (only captures the final archiving commit), which was itself part of resolving the uncertainty honestly rather than presenting an imperfect solution as complete.

Everything else (tool detection, subprocess invocation, JSON parsing, doctor/README wiring) is routine engineering with well-established solutions and is not being claimed as SR&ED-caliber uncertainty.
