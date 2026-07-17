## Context

Two existing precedents this design borrows from directly:
- `services/stats-api/` — the only existing hosted service in this repo (Node built-in `http`, `pg` against Railway Postgres, a zod schema as the request-shape gate, deployed in the same Railway project as `services/site/`). `explore-api` is structurally the same kind of service (small HTTP surface, Postgres-backed), just serving reads instead of accepting submissions.
- `src/telemetry/` — the existing pattern for a CLI-side network call that must never affect the calling command's own success: build payload/response handling so failure is swallowed, not surfaced as a crash.

Unlike those two, `explore` is not opt-in and not a submission — every invocation of `sreditor explore` makes a live network GET, and unlike `judge`/`probe`/`rollup` (BYOK, developer's own API key, cost borne by the developer), the LLM cost for turning raw sources into cards is paid centrally by Sreditor's own infra, on a schedule, independent of how many developers run `explore` on any given day.

The hard requirement carried over from the concept doc and the corroborating-signals precedent (`openspec/changes/archive/2026-07-11-corroborating-signals/`): `explore` content must be structurally incapable of reaching `judge`, `probe`, or `rollup` — not just a rule someone remembers.

## Goals / Non-Goals

**Goals:**
- A developer can run `sreditor explore` and get current, source-cited, honestly-framed field-trend cards, with zero risk of that content leaking into their judgment log.
- The backend corpus is real (LLM-clustered from real raw sources), refreshed on a schedule, not a static seed file — but kept as cheap and simple as it can be while still being real.
- Network/service failure never crashes the CLI or hangs it — it fails fast and visibly, same spirit as `judge`/`rollup`'s own error handling.

**Non-Goals:**
- Not personalized. No per-developer shown-history, no account, no local de-dup fingerprint, no stack-relevance nudge — all explicitly deferred (see proposal). Every developer hitting the endpoint at the same time sees the same current top-N per tag.
- Not a fully automated, unsupervised pipeline from day one. The refresh job can start as a manually-triggered or loosely-scheduled script; a fully autonomous cron pipeline is an optimization once corpus quality (the real technical uncertainty here) is validated.
- Not a new CLI dependency for the explore command itself — a `fetch` GET and console output, same minimal-footprint stance as the rest of the CLI package (4 runtime deps today).

## Decisions

**Separate Railway service, `services/explore-api/`, not a new route on `services/stats-api/`.** Alternative considered: add `/v1/explore` to the existing stats-api service, since it's already deployed and already has a Postgres connection. Rejected — stats-api's entire design intent is "receives an allowlisted, schema-gated submission from a BYOK CLI, aggregates it, exposes an aggregate read." Explore is a different shape (backend-authored content, high-write-volume-from-the-server-side refresh job, no per-developer identity at all) and mixing the two would blur stats-api's one clear job. A second small service in the same Railway project (own Postgres database or a separate schema in the same instance — Railway makes either easy) keeps each service's blast radius and mental model small, matching how `services/site/` is already its own thing rather than folded into stats-api.

**Card schema, minimal and source-traceable:**
```
Card {
  id: string
  tag: string            // domain/topic tag, e.g. "llm-agents", "vector-search"
  title: string
  summary: string         // state-of-the-field framing, no directive verbs
  sourceUrl: string
  sourceType: 'arxiv' | 'papers-with-code' | 'github-trending' | 'hn' | 'changelog'
  buzzyUnsolvedScore: number  // 0-1, from the LLM clustering pass
  clusteredAt: string     // ISO date, when this card was produced
}
```
Stored in Postgres (`explore_cards` table), one row per card, `tag` and `clusteredAt` indexed for the read path's "top-N per tag, most recent" query.

**Refresh job as a separate script (`src/refresh.ts` in `explore-api`), not baked into the HTTP server process.** It: (1) pulls raw items from each source via their existing public APIs/feeds (arXiv API, papers-with-code API, GitHub trending — via search API or a maintained scrape, HN Firebase API, changelog RSS feeds), (2) sends a batched LLM prompt to cluster raw items into themes, write a summary per theme, tag by domain, and score buzzy-and-unsolved, (3) upserts resulting cards into Postgres. Run via Railway's cron/scheduled-job feature (or manually via `npm run refresh` initially, promoted to scheduled once cadence is validated) — kept separate from the always-running HTTP server process so a slow/failing refresh run can never affect read-path availability.

**Read endpoint returns current top-N per tag (or overall) by `buzzyUnsolvedScore` within a recency window** (e.g. cards from the last 2 refresh cycles), not literally everything ever clustered — keeps responses small and keeps stale themes from lingering forever once the corpus rotates past them.

**CLI-side failure handling: a short timeout (`AbortSignal.timeout`, mirroring `src/telemetry/submit.ts`'s pattern) and a clear non-zero exit with a one-line message on any failure** (timeout, non-2xx, malformed JSON) — no retry, no fallback cache, no silent empty output that could be mistaken for "no cards exist." This differs from telemetry's failure handling (which swallows silently because submission is a side-effect of another command) precisely because here the network call *is* the command's entire job — silence would be a worse failure mode than a clear error.

**Structural separation enforced by module boundary, not just by omission.** `src/commands/explore.ts` imports only `node:fetch`-equivalent networking and a small local rendering helper — it has zero import of `src/paths.ts`, `src/persistence/jsonl.ts`, `src/rollup.ts`, or any judgment-pipeline module. Concretely enforceable via a lint rule or a simple test asserting `explore.ts`'s import graph never reaches those modules (same spirit as how corroborating-signals kept its signals out of the judgment write path by construction — see that change's design.md for the precedent).

**No offline/skip-network flag in v1.** Considered adding a `--offline` flag that prints a static fallback message. Rejected for v1 — added complexity for a command whose entire value is live current content; a clear network-error message already covers the offline case honestly (explore just doesn't work without a network, which is stated plainly rather than papered over with stale cached content presented as current).

## Risks / Trade-offs

- **Corpus quality is unproven** (named as real technical uncertainty in the proposal). Mitigation: ship the refresh job manually-triggered first, inspect real output against real raw sources before trusting a schedule, and keep the LLM prompt/clustering logic easy to iterate on without a schema migration (card shape is stable; the prompt producing it is expected to change).
- **Central LLM cost scales with refresh cadence/corpus size, not developer usage** — a cost surprise is possible if cadence or batch size is set too aggressively before validating actual token cost per run. Mitigation: start with the lowest plausible cadence (e.g. twice weekly) and a capped per-source item count, measure real cost for a few cycles, and tune from there rather than guessing a "safe" cadence up front.
- **A developer could mistake `explore` cards for eligibility guidance despite the disclaimer.** Mitigation: the disclaimer header is mandatory and non-suppressible in v1, card copy is reviewed against "state of the field" framing (not "you should build X") at prompt-design time, matching the concept doc's explicit no-directive-verbs rule.
- **Sole read endpoint becomes a single point of failure for every developer's `explore` command simultaneously**, unlike BYOK commands which fail independently per developer. Mitigation: this is an accepted trade-off of the centralized-corpus design (the whole point is a shared, curated corpus, not per-developer generation) — kept low-risk by the endpoint being cheap to serve (a simple indexed Postgres read, no LLM call on the request path) and by failing clearly rather than hanging.

## Open Questions

- Exact source list and API integration order for the refresh job's first version — likely arXiv + GitHub trending first (both have stable, well-documented public APIs), HN and changelogs added once the clustering prompt is validated against the first two. Not blocking proposal/spec/tasks — resolvable during implementation.
- Exact refresh cadence and per-tag top-N — starting guess is twice-weekly refresh, top-5 per tag, top-15 overall; both are tuning parameters, not architectural decisions, and can change without a spec change.
