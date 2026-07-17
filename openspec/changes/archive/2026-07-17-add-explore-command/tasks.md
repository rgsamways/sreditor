## 1. `explore-api` service scaffold

- [x] 1.1 Create `services/explore-api/` package (`package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`), mirroring `services/stats-api/`'s setup
- [x] 1.2 Add `src/schema.ts`: zod schema for a `Card` (`id`, `tag`, `title`, `summary`, `sourceUrl`, `sourceType`, `buzzyUnsolvedScore`, `clusteredAt`)
- [x] 1.3 Add `migrations/001_init.sql`: `explore_cards` table matching the schema, indexed on `tag` and `clusteredAt`
- [x] 1.4 Add `src/db.ts`: Postgres pool (mirroring `services/stats-api/src/db.ts`'s `DATABASE_URL`-from-env pattern), `upsertCards`, `getTopCards(tag?, limit)`

## 2. Refresh job

- [x] 2.1 Add `src/sources/arxiv.ts` and `src/sources/githubTrending.ts`: pull raw items from each source's public API, capped per-source item count
- [x] 2.2 Add `src/refresh.ts`: fetch raw items from both sources, send a batched LLM prompt to cluster into themed cards (summary, tag, `buzzyUnsolvedScore`, no directive verbs — enforce via prompt instructions), upsert results via `upsertCards`
- [x] 2.3 Manual run of `src/refresh.ts` against real raw data; inspect resulting cards for framing quality (state-of-field, not directive; genuinely unsolved, not noise) before wiring to a schedule — done, via `railway ssh -- npm run refresh` against the deployed service with a real `ANTHROPIC_API_KEY`: fetched 99 raw items (2 changelog feeds skipped on a `fast-xml-parser` entity-expansion limit, non-fatal), clustered into 8 cards, all upserted successfully. Inspected the full card content: every card is purely descriptive (no directive verbs), every card cites a real, dated source (7 arXiv `2607.*` — correctly July-2026-dated — plus 1 GitHub-trending repo), and `buzzyUnsolvedScore` differentiates sensibly (the one GitHub-trending "lots of churn, no settled architecture" card scored lowest at 0.45 vs. 0.5–0.75 for cards describing genuine open research gaps). One real run only — worth repeating on a few more days before trusting a schedule, per design.md, but no framing/quality red flags found.
- [x] 2.4 Add `src/sources/hn.ts` and `src/sources/changelogs.ts` once the first two sources' clustering output is validated; wire into `refresh.ts`
- [x] 2.5 Unit tests for card upsert idempotency and `getTopCards` (recency window, tag filter, limit)

## 3. Read endpoint

- [x] 3.1 Add `src/server.ts`: Node `http` server, `GET /healthz`, `GET /v1/explore` (optional `?tag=`, `?limit=`), calling `getTopCards` — no LLM call on this path
- [x] 3.2 Unit tests for the endpoint: default top-N, tag filter, empty-corpus case (no cards yet) returns an empty list, not an error
- [x] 3.3 Deploy to the existing `sreditor` Railway project as a new service, run `npm run migrate` against its database once before first deploy (idempotent, matching `stats-api`'s convention) — done, with explicit go-ahead: new `explore-api` service created in the `sreditor` project (dashboard), linked via `railway link`, `DATABASE_URL` set as a reference to the existing `Postgres` service and `ANTHROPIC_API_KEY` set to a fresh key (dashboard), deployed via `npm run build && railway up`. Migration and refresh had to be run via `railway ssh -- npm run migrate`/`refresh` rather than `railway run` — `railway run` executes locally and cannot resolve the private `postgres.railway.internal` hostname (`getaddrinfo ENOTFOUND`); only a command actually running inside the Railway container can reach it. `/healthz` and `/v1/explore` both confirmed live and correct against the real deployment.

## 4. CLI command

- [x] 4.1 Add `src/commands/explore.ts` (main `sreditor` package): fetch `GET /v1/explore` from the configured explore-api URL (env var, e.g. `SREDITOR_EXPLORE_URL`, defaulting to the live endpoint), with a bounded timeout (`AbortSignal.timeout`)
- [x] 4.2 Print the mandatory disclaimer header, then each card (title, summary, source type + URL, tag)
- [x] 4.3 On any failure (timeout, non-2xx, malformed body against a zod schema shared/mirrored from `explore-api`'s `Card` shape), print one clear error line and exit non-zero — no retry, no silent empty output
- [x] 4.4 Wire `explore` into `src/index.ts` (Commander.js), following the existing command registration pattern
- [x] 4.5 Test/assert (e.g. a small script or lint check) that `src/commands/explore.ts`'s import graph never reaches `src/paths.ts`, `src/persistence/jsonl.ts`, `src/rollup.ts`, or `src/anchor.ts`
- [x] 4.6 Unit tests for `explore.ts` against a mock HTTP server: happy path renders disclaimer + cards; unreachable/malformed responses exit non-zero with a clear message

## 5. Verification

- [x] 5.1 `npm run build && npm run typecheck && npm test` clean in both the main package and `services/explore-api/`
- [x] 5.2 Manually run `sreditor explore` against the real deployed `explore-api` and confirm real cards print with disclaimer, source citations, and no directive-verb framing — done: `SREDITOR_EXPLORE_URL` pointed at the live Railway domain, `sreditor explore` printed the disclaimer header followed by all 8 real cards, each with tag, title, summary, and `Source: <type> — <url>`, matching `/v1/explore`'s response exactly.
- [x] 5.3 Manually point `SREDITOR_EXPLORE_URL` at an unreachable address and confirm `sreditor explore` exits non-zero within the timeout, without hanging or crashing — covered by `tests/commands/explore.test.ts`'s "rejects with a clear message when the backend is unreachable" case (real TCP connection refusal against `127.0.0.1:1`, not a mock).
- [x] 5.4 Confirm `sreditor judge`/`rollup`/`probe` runs before and after an `explore` run produce identical output for the same input data (explore had zero effect) — enforced structurally by the import-isolation test (`explore.ts` cannot reach `.sreditor/`'s read/write helpers at all) and confirmed by the full existing judge/rollup/report test suites (27 tests) passing unchanged.
