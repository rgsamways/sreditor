## Why

`judge`'s biggest emotional low point — a developer checks eligibility on work they've done and finds nothing qualifies — is currently a dead end. There's no built-in, honest way for Sreditor to point a developer toward genuinely open problems in their field without crossing into "the tool told me to build this for the credit," which would invert the CRA three-part test (uncertainty has to be genuine and pre-existing, not tax-motivated). `explore` resolves that: passive, source-cited, disclaimed field-trend content, structurally kept out of the evidentiary chain (`probe` → `judge` → `rollup` → `report`), so it can inspire real curiosity without ever being usable as manufactured eligibility.

## What Changes

- New `sreditor explore` command: prints a disclaimed ("Exploration — not eligibility guidance"), source-cited list of current field-trend cards (arXiv, papers-with-code, GitHub trending, HN front page, framework changelogs), pulled from a new hosted backend. Cards describe the state of the field, never the developer's opportunity — no directive verbs.
- New hosted service `services/explore-api/`, modeled on the existing `services/stats-api/` (Node + `pg`, Postgres on Railway, same `sreditor` Railway project): a periodic refresh job that pulls raw items from the sources above, an LLM clustering/summarization/tagging pass that turns raw items into themed cards, and a read endpoint (`GET /v1/explore`) the CLI calls for current top-N cards.
- `explore` is read-only and disconnected from local project state: it does not read or write `.sreditor/judgments.jsonl`, `rollup.json`, or `anchor.md`, and its output is never passed as context into `probe`, `judge`, or `rollup`. This is enforced structurally — `explore`'s command module has no import path into the judgment pipeline's read/write helpers, not just a documented rule.
- Network failure (backend unreachable, timeout, malformed response) degrades gracefully: the command prints a clear message and exits non-zero, but never crashes or hangs indefinitely.
- Out of scope for v1 (explicitly deferred, per the source concept doc): the optional local de-dup fingerprint (hash of anchor-doc content to skip repeat cards) and the optional stack-relevance nudge (package.json/language-based tag biasing). Both ship later, if wanted, once the base command is validated.

## Capabilities

### New Capabilities
- `explore`: a CLI command surfacing curated, source-cited, disclaimed field-trend content, structurally isolated from the judgment pipeline (`probe`/`judge`/`rollup`/`report`) — the CLI-side half of this change.
- `explore-api`: a hosted service (corpus refresh job + LLM clustering pass + read endpoint) that produces the curated card corpus `explore` reads from — the backend-side half of this change.

### Modified Capabilities
(none — no existing command's behavior, requirements, or output changes)

## Impact

- New `src/commands/explore.ts`, wired into `src/index.ts` (Commander.js, following the existing registration pattern for `ui`/`stats`).
- New `services/explore-api/` package: `src/server.ts` (HTTP server, `GET /v1/explore`, `GET /healthz`), `src/db.ts` (Postgres access), `src/schema.ts` (card/tag shape), `src/refresh.ts` (the periodic ingest + LLM clustering job), `migrations/001_init.sql`.
- No changes to `src/commands/judge.ts`, `src/commands/rollup.ts`, `src/commands/probe.ts`, `src/report.ts`, or any file under `.sreditor/` — this is additive and isolated by construction.
- New operational surface: a scheduled refresh job (Railway cron or equivalent) and its own LLM API cost, separate from the BYOK model used for `judge`/`probe`/`rollup` (those use the developer's own key; the refresh job is Sreditor's own infra cost, paid centrally, same posture as the existing `services/stats-api/` and `services/site/`).

## Technical Uncertainty

Some, unlike the last several additions to this codebase (which were routine engineering assembling already-proven patterns). Two genuinely open questions here, resolvable only through building and observing, not through more up-front design:

1. **Corpus quality at the clustering step.** Whether an LLM pass over raw arXiv/GitHub-trending/HN items reliably produces cards that are actually "state of the field, unsolved" rather than either noise (trending-but-solved, or trending for non-technical reasons) or hallucinated framing. This can't be fully resolved on paper — it requires running the refresh job against real raw data and evaluating real output.
2. **Cost control on a recurring LLM-driven job.** Unlike `judge`/`probe`/`rollup`, which run once per developer action on BYOK, the refresh job runs on a schedule regardless of developer usage, so its LLM cost is borne centrally and scales with corpus size/refresh frequency, not with usage. The right batch size, model tier, and refresh cadence to keep this sustainable is not knowable in advance and needs real cost data from a running job.

This uncertainty lives in `services/explore-api/`'s refresh job, not in the CLI-side `explore` command itself (which is routine: an HTTP GET and a print, matching `add-local-ui`/`add-usage-stats-opt-in`'s existing patterns).
