# sreditor-explore-api

Backend for `sreditor explore`: a periodic refresh job that pulls raw items from arXiv, GitHub
trending, Hacker News, and framework changelogs, clusters them into themed cards via an LLM pass,
and a read-only endpoint the CLI polls for the current top-N cards.

Unlike `judge`/`probe`/`rollup` in the main `sreditor` package (BYOK, cost borne by the
developer), the refresh job's LLM cost is paid centrally against this service's own
`ANTHROPIC_API_KEY`, on a schedule independent of how many developers run `explore`.

No field here can hold a project name, a developer identity, or judgment-log content -- every
requester sees the same corpus. See `../../openspec/changes/add-explore-command/design.md` for
the full design.

## Endpoints

- `GET /healthz` — liveness check.
- `GET /v1/explore?tag=<tag>&limit=<n>` — current top-N cards (by `buzzyUnsolvedScore`, within a
  10-day recency window), optionally filtered by tag. No LLM call on this path.

## Refresh job

`npm run refresh` fetches raw items from all four sources, sends a single batched LLM prompt to
cluster them into cards (state-of-the-field framing, no directive verbs -- enforced via prompt
instructions), and upserts the results. Run manually or on a schedule (Railway cron); kept
separate from the always-running HTTP server so a slow/failing refresh can never affect read-path
availability.

## Running locally

```
npm install
DATABASE_URL=postgres://... npm run build && npm run migrate
DATABASE_URL=postgres://... PORT=8080 npm run dev
DATABASE_URL=postgres://... ANTHROPIC_API_KEY=sk-ant-... npm run refresh
```

## Deploying (Railway)

Mirrors `services/stats-api/`'s pattern: a second small service in the same `sreditor` Railway
project (own Postgres database or a separate schema in the same instance), given its own
`ANTHROPIC_API_KEY`. Run `npm run migrate` once against the real database before first deploy
(idempotent, `CREATE TABLE IF NOT EXISTS`, safe to re-run). Trigger `npm run refresh` manually
first and inspect real output before wiring it to Railway's scheduled-job feature.
