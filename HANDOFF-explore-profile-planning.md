# Handoff: Plan `explore` / local dashboard / `profile export`

Paste this file's path into a new session and ask it to start planning. This doc is deliberately just orientation — no implementation decisions have been pre-made; that's what the planning session is for.

## What to read first

`sreditor-explore-profile-jobplatform-concept.md` (repo root) — the source concept doc, captured 2026-07-16. It covers four ideas at very different levels of readiness. **Only the first three are in scope for this planning pass:**

1. `sreditor explore` — a new command surfacing curated field-trend content (arXiv/papers-with-code/GitHub trending/HN/changelogs), explicitly disclaimed as inspiration, never written to the judgment log.
2. Local "trajectory" dashboard — an extension of the existing local UI, reading per-project `.sreditor/` data (explore engagement, anchor revisions, judge/rollup history over time).
3. `sreditor profile export` — dev-initiated export of that local data to a portable markdown/JSON artifact, no auto-push anywhere.

**Explicitly out of scope right now:** idea 4, the "uncertainty-verified" job/resume platform. The doc itself recommends not building it before Sreditor has real 1.0 usage — treat it as background motivation only, not something to design against.

## Current codebase state relevant to this

- Sreditor is at `0.0.1` in `package.json`, functioning, **not yet published to npm**.
- Commands live in `src/commands/*.ts`, one file per verb, registered in `src/index.ts` (Commander.js). Existing verbs: `probe`, `judge`, `rollup`, `report`, `reflect`, `scan`, `status`, `doctor`, `init`, `stats`, `ui`.
- `.sreditor/` is the per-project local state directory (`src/paths.ts`). Currently holds `anchor.md`, `judgments.jsonl`, `rollup.json`, `config.json` (stats opt-in + install id). Any new local dashboard/profile state should follow this same direct-`node:fs`, no-abstraction pattern — see `src/statsConfig.ts` for the most recent example of that convention.
- The local UI (`src/commands/ui.ts`, `src/ui/data.ts`, `src/ui/html.ts`) already exists and is live-tested: a localhost-only, read-only HTTP server exposing `/api/judgments`, `/api/judgments/:id`, `/api/rollup`, `/api/coverage`, serving a single static HTML page. This is almost certainly what the "trajectory dashboard" extends rather than replaces.
- `src/telemetry/` (`schema.ts`, `aggregate.ts`, `submit.ts`) is the existing opt-in-only, aggregate-only, non-blocking pattern for anything that talks to a remote service. If `explore`'s curated-content backend needs its own hosted service (it will — someone has to refresh the corpus from arXiv/GitHub/HN), `services/stats-api/` (Node + Postgres, deployed on Railway, `api.sreditor.ca`) is the direct precedent for structure, and the already-live Railway project (`sreditor`) is the natural place to add another service rather than standing up new infra from scratch.
- Established repo-wide principle (see the corroborating-signals feature, `openspec/changes/archive/2026-07-11-corroborating-signals/`): anything that isn't hard evidence for eligibility must be structurally prevented from touching the judgment path, not just documented as a rule. `explore`'s "never written to the judgment log" requirement and the dashboard's "own file, `probe`/`judge` never open it" requirement are the same principle applied again — worth pointing the planning session at that precedent for how it was enforced last time (file-layout separation + a corroborating-signals design memory), not just re-deriving it.

## Process convention for this repo

Changes are planned via OpenSpec, not ad-hoc: `proposal.md` / `design.md` / `specs/*/spec.md` / `tasks.md` under `openspec/changes/<name>/`, archived to `openspec/changes/archive/` on completion. Use the `openspec-propose` skill to start. Closest recent precedents to model structure on:
- `openspec/changes/add-local-ui/` — for extending the dashboard
- `openspec/changes/add-usage-stats-opt-in/` — for the explore-backend-as-a-service shape (opt-in, non-blocking, allowlisted payload)

## Open decisions the concept doc left unresolved — surface these during planning, don't default past them

- `profile export` scope: explore-engagement + anchor-revision history only, or also a light judgment-log summary? The doc flags the latter as more resume-compelling but the first point where judgment-log content crosses into a different-purpose document.
- Where the curated `explore` corpus actually gets built/hosted, and what refreshes it (needs an LLM clustering/summarization pass per the doc — that's real infra + cost, not just a static file).
- The optional local de-dup fingerprint (hash of anchor-doc content → skip repeat cards) and the optional stack-relevance nudge (package.json/language detection) — both marked "optional" in the doc; decide whether either is in v1 scope or deferred.

## Suggested sequencing

`explore` first (self-contained, clearest separation rule, no dependency on the dashboard) → dashboard extension (depends on `explore`'s local cache/engagement data existing) → `profile export` (depends on both). This mirrors the doc's own ordering.
