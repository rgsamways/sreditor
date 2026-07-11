## Why

Phases 1–5 built the full v1 pipeline (foundations, anchor, judgment engine + drift-auditing, rollup, report). Nothing yet presents that to an outside reader in a way that earns the "transparency as trust moat" positioning from the original design conversation, and a few small mechanical items (package metadata, CI) are still outstanding before `npm publish`. This is a doc/infra-only change — no runtime capability changes, no specs.

## What Changes

- Rewrite `README.md`: what Sreditor does, one-to-two-line differentiation from Sredio/Boast/Chrono, bring-your-own-key setup, and a "Judgment Prompts" section linking directly to `src/llm/judgment.ts`/`drift.ts`/`rollup.ts` (each with a short representative excerpt, not a full embedded copy — see design.md) so a skeptical reader can verify the CRA three-part test is actually being applied, not just take the README's word for it.
- Add a "Known Limitations" section to the README naming the currently-open, deliberately-deferred items plainly: the parked corroborating-signal CLIs (`sem`/`jscpd`/`scc`), the quantification gap noted in the Phase 5 T661 register check (prompts don't yet push for quantified metrics when available), the intermittent Vitest worker-pool flake (mitigated, not eliminated), and that the T661 register comparison has only been checked against a deliberately-ineligible calibration set, not real eligible work.
- `package.json`: add a `funding` field (npm's own donation-support convention), confirm MIT license metadata is accurate, confirm the `bin` entry is correct for a real `npm install -g`.
- Add a GitHub Actions workflow running typecheck, build, and the test suite on every push.
- `npm publish` and tagging `v0.1.0` are explicitly **not** part of this change — that's a live, external, hard-to-reverse action taken separately with direct confirmation at the time, not something to bundle into a documentation change.

## Capabilities

(none — doc/infra-only change, no runtime capability additions or modifications)

## Impact

- `README.md`, `package.json`, `.github/workflows/ci.yml` (new).
- No source code changes, no new dependencies.

## Technical Uncertainty

None. This is documentation and CI configuration — routine, well-understood work with no genuine technological uncertainty, consistent with how every prior phase of this project's own archive has honestly judged itself.
