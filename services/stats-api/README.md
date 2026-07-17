# sreditor-stats-api

Receives Sreditor's opt-in, aggregate-only usage statistics and stores them in Postgres. See
`../../src/telemetry/schema.ts` in the main `sreditor` package for the client-side allowlist this
mirrors — `src/schema.ts` here is the server-side half of the same allowlist, enforced
independently so a compromised or hand-crafted client can't smuggle anything past it.

No field in this service's schema, table, or API responses can hold a project name, a change id,
or any reasoning text — every column is a count, a percentage, a version string, or a random
install id. See the migration in `migrations/001_init.sql` for the exact table shape.

## Endpoints

- `GET /healthz` — liveness check.
- `POST /v1/stats` — accepts one submission matching `StatsPayloadSchema` exactly (`.strict()`,
  rejects any unrecognized field with 400). Rate-limited per IP (30 requests/minute).
- `GET /v1/aggregate` — public, CORS-open aggregate numbers (total submissions, distinct installs,
  total archived/judged/eligible, average eligible rate) for the marketing site to display.

## Running locally

```
npm install
DATABASE_URL=postgres://... npm run build && npm run migrate
DATABASE_URL=postgres://... PORT=8080 npm run dev
```

## Deploying (Railway)

Mirrors the existing `robinsamways` project pattern: one Railway project with a Postgres addon
(which injects `DATABASE_URL` automatically) plus this service deployed from its repo, given a
custom domain (`api.sreditor.ca`). Run `npm run migrate` once against the real database before
first deploy (or as a Railway pre-deploy step) — it's idempotent (`CREATE TABLE IF NOT EXISTS`),
safe to re-run.
